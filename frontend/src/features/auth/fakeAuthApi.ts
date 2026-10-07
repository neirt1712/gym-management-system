import type { AuthApi } from './authApi';
import type { AuthSession, SessionUser } from './types';

/** Mật khẩu chung của mọi tài khoản mẫu. Chỉ dùng ở chế độ fake. */
export const DEMO_PASSWORD = 'Demo@123';

type DemoAccount = SessionUser & { locked?: boolean };

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'u-member',
    fullName: 'Nguyễn Văn An',
    role: 'MEMBER',
    phone: '0900000001',
    email: 'hoivien@gym.local',
  },
  { id: 'u-trainer', fullName: 'Trần Thị Bình', role: 'TRAINER', phone: '0900000002', email: 'pt@gym.local' },
  { id: 'u-staff', fullName: 'Lê Văn Cường', role: 'STAFF', phone: '0900000003', email: 'quay@gym.local' },
  { id: 'u-admin', fullName: 'Phạm Thị Dung', role: 'ADMIN', phone: '0900000004', email: 'admin@gym.local' },
  {
    id: 'u-locked',
    fullName: 'Tài khoản bị khóa',
    role: 'MEMBER',
    phone: '0900000009',
    email: 'khoa@gym.local',
    locked: true,
  },
];

/** Giả lập refresh cookie HttpOnly để tải lại trang vẫn giữ phiên. Không chứa token. */
export const FAKE_SESSION_KEY = 'gym-fake-session';

const apiError = (code: string, message: string) => ({
  error: { code, message, details: null, requestId: `fake-${Date.now()}` },
});

const toSession = ({ id, fullName, role, phone, email }: DemoAccount): AuthSession => ({
  accessToken: `fake-token-${id}`,
  user: { id, fullName, role, phone, email },
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

  return {
    async login({ identifier, password }) {
      await wait();
      const key = identifier.trim().toLowerCase();
      const account = DEMO_ACCOUNTS.find((a) => a.phone === key || a.email === key);
      if (!account || password !== DEMO_PASSWORD) {
        throw apiError('INVALID_CREDENTIALS', 'Invalid credentials');
      }
      if (account.locked) throw apiError('ACCOUNT_LOCKED', 'Account locked');
      writeSession(account.id);
      return toSession(account);
    },

    async refresh() {
      await wait();
      const id = readSession();
      const account = DEMO_ACCOUNTS.find((a) => a.id === id && !a.locked);
      return account ? toSession(account) : null;
    },

    async logout() {
      await wait();
      writeSession(null);
    },
  };
};

export const fakeAuthApi = createFakeAuthApi();
