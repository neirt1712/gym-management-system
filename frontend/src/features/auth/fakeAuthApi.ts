import type { AuthApi } from './authApi';
import type { AuthSession, SessionUser } from './types';

/** Mật khẩu chung của mọi tài khoản mẫu, khớp ví dụ `POST /auth/login` trong openapi. Chỉ dùng ở chế độ fake. */
export const DEMO_PASSWORD = 'matkhau123';

type DemoAccount = SessionUser & { locked?: boolean };

/**
 * Tài khoản mẫu, khớp ví dụ `POST /auth/login` trong docs/api/openapi.yaml (Q8): cùng id, SĐT, vai trò, mật khẩu,
 * để bản giả, mock Prism và dữ liệu seed của BE dùng chung một bộ.
 * Thêm tài khoản bị khóa để thử lỗi ACCOUNT_LOCKED.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    fullName: 'Phạm Quản Trị',
    role: 'ADMIN',
    phone: '0900000001',
    email: 'admin@example.com',
    avatarUrl: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    fullName: 'Hoàng Thu Quầy',
    role: 'STAFF',
    phone: '0900000002',
    email: null,
    avatarUrl: null,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    fullName: 'Lê Minh Cường',
    role: 'TRAINER',
    phone: '0900000003',
    email: 'cuong.pt@example.com',
    avatarUrl: null,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    fullName: 'Nguyễn Văn An',
    role: 'MEMBER',
    phone: '0901234567',
    email: 'an.nguyen@example.com',
    avatarUrl: null,
  },
  {
    id: '99999999-9999-4999-8999-999999999999',
    fullName: 'Tài khoản bị khóa',
    role: 'MEMBER',
    phone: '0900000009',
    email: null,
    avatarUrl: null,
    locked: true,
  },
];

/** Khóa tạm sau 5 lần sai, theo mô tả `POST /auth/login` trong openapi. Bản thử khóa 60 giây cho dễ thử. */
const MAX_FAILED_LOGINS = 5;
const TEMP_LOCK_SECONDS = 60;

/** SĐT có hồ sơ tạo tại quầy nhưng chưa kích hoạt, để thử lỗi ACTIVATION_REQUIRED khi đăng ký. */
export const DESK_PROFILE_PHONE = '0907777777';

/** Giả lập refresh cookie HttpOnly để tải lại trang vẫn giữ phiên. Không chứa token. */
export const FAKE_SESSION_KEY = 'gym-fake-session';

const apiError = (code: string, message: string, details: unknown = null) => ({
  error: { code, message, details, requestId: `fake-${Date.now()}` },
});

const toSession = ({ id, fullName, role, phone, email, avatarUrl }: DemoAccount): AuthSession => ({
  accessToken: `fake-token-${id}`,
  user: { id, fullName, role, phone, email, avatarUrl },
});

const readSession = (): string | null => {
  try {
    return sessionStorage.getItem(FAKE_SESSION_KEY);
  } catch {
    return null;
  }
};

const writeSession = (userId: string | null) => {
  try {
    if (userId) sessionStorage.setItem(FAKE_SESSION_KEY, userId);
    else sessionStorage.removeItem(FAKE_SESSION_KEY);
  } catch {
    // Trình duyệt chặn storage: phiên chỉ sống tới khi tải lại trang.
  }
};

export const createFakeAuthApi = ({ delayMs = 300 }: { delayMs?: number } = {}): AuthApi => {
  const wait = () => new Promise((resolve) => setTimeout(resolve, delayMs));
  // Tài khoản đăng ký thêm chỉ sống trong phiên chạy này.
  const accounts: DemoAccount[] = [...DEMO_ACCOUNTS];
  const failsByPhone = new Map<string, number>();
  const lockedUntilByPhone = new Map<string, number>();

  return {
    async login({ phone, password }) {
      await wait();
      const account = accounts.find((a) => a.phone === phone.trim());
      // Giống BE: sai 5 lần liên tiếp thì khóa tạm, trả retryAfterSeconds.
      const lockedUntil = lockedUntilByPhone.get(phone) ?? 0;
      if (lockedUntil > Date.now()) {
        throw apiError('ACCOUNT_TEMPORARILY_LOCKED', 'Temporarily locked', {
          retryAfterSeconds: Math.ceil((lockedUntil - Date.now()) / 1000),
        });
      }
      if (!account || password !== DEMO_PASSWORD) {
        const fails = (failsByPhone.get(phone) ?? 0) + 1;
        failsByPhone.set(phone, fails);
        if (fails >= MAX_FAILED_LOGINS) {
          failsByPhone.delete(phone);
          lockedUntilByPhone.set(phone, Date.now() + TEMP_LOCK_SECONDS * 1000);
          throw apiError('ACCOUNT_TEMPORARILY_LOCKED', 'Temporarily locked', {
            retryAfterSeconds: TEMP_LOCK_SECONDS,
          });
        }
        throw apiError('INVALID_CREDENTIALS', 'Invalid credentials');
      }
      failsByPhone.delete(phone);
      if (account.locked) throw apiError('ACCOUNT_LOCKED', 'Account locked');
      writeSession(account.id);
      return toSession(account);
    },

    async register({ fullName, phone, email }) {
      await wait();
      // Giữ chỗ cho luồng Q15: SĐT trùng hồ sơ tạo tại quầy thì phải kích hoạt.
      if (phone === DESK_PROFILE_PHONE) throw apiError('ACTIVATION_REQUIRED', 'Activation required');
      if (accounts.some((a) => a.phone === phone)) throw apiError('PHONE_DUPLICATED', 'Phone duplicated');
      const account: DemoAccount = {
        id: crypto.randomUUID(),
        fullName,
        role: 'MEMBER',
        phone,
        email: email ?? null,
        avatarUrl: null,
      };
      accounts.push(account);
      writeSession(account.id);
      return toSession(account);
    },

    async changePassword({ currentPassword }) {
      await wait();
      const account = accounts.find((a) => a.id === readSession());
      if (!account) throw apiError('UNAUTHENTICATED', 'Unauthenticated');
      if (currentPassword !== DEMO_PASSWORD) {
        throw apiError('VALIDATION_ERROR', 'Wrong current password', [
          { field: 'currentPassword', messages: ['Mật khẩu hiện tại không đúng'] },
        ]);
      }
      // Bản thử không lưu mật khẩu mới: tài khoản mẫu vẫn đăng nhập bằng DEMO_PASSWORD.
      return toSession(account);
    },

    async refresh() {
      await wait();
      const id = readSession();
      const account = accounts.find((a) => a.id === id && !a.locked);
      return account ? toSession(account) : null;
    },

    async logout() {
      await wait();
      writeSession(null);
    },
  };
};

export const fakeAuthApi = createFakeAuthApi();
