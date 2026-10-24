import { describe, expect, it } from 'vitest';
import { createFakeAuthApi, DEMO_PASSWORD, DESK_PROFILE_PHONE } from './fakeAuthApi';

const api = createFakeAuthApi({ delayMs: 0 });

describe('fakeAuthApi', () => {
  it('đăng nhập bằng số điện thoại (Q12)', async () => {
    const session = await api.login({ phone: '0901234567', password: DEMO_PASSWORD });
    expect(session.user.role).toBe('MEMBER');
    expect(session.accessToken).toBeTruthy();
  });

  it('tài khoản mẫu khớp ví dụ trong openapi: 0900000001 là Admin', async () => {
    const session = await api.login({ phone: ' 0900000001 ', password: DEMO_PASSWORD });
    expect(session.user.role).toBe('ADMIN');
  });

  it('không đăng nhập bằng email', async () => {
    await expect(api.login({ phone: 'admin@example.com', password: DEMO_PASSWORD })).rejects.toMatchObject({
      error: { code: 'INVALID_CREDENTIALS' },
    });
  });

  it('sai mật khẩu trả INVALID_CREDENTIALS', async () => {
    await expect(api.login({ phone: '0901234567', password: 'sai' })).rejects.toMatchObject({
      error: { code: 'INVALID_CREDENTIALS' },
    });
  });

  it('tài khoản bị khóa trả ACCOUNT_LOCKED', async () => {
    await expect(api.login({ phone: '0900000009', password: DEMO_PASSWORD })).rejects.toMatchObject({
      error: { code: 'ACCOUNT_LOCKED' },
    });
  });

  it('refresh giữ phiên sau đăng nhập, mất phiên sau đăng xuất', async () => {
    await api.login({ phone: '0900000002', password: DEMO_PASSWORD });
    expect((await api.refresh())?.user.role).toBe('STAFF');
    await api.logout();
    expect(await api.refresh()).toBeNull();
  });
  it('sai 5 lần liên tiếp thì khóa tạm, trả retryAfterSeconds', async () => {
    const fresh = createFakeAuthApi({ delayMs: 0 });
    for (let i = 0; i < 4; i += 1) {
      await expect(fresh.login({ phone: '0901234567', password: 'sai' })).rejects.toMatchObject({
        error: { code: 'INVALID_CREDENTIALS' },
      });
    }
    await expect(fresh.login({ phone: '0901234567', password: 'sai' })).rejects.toMatchObject({
      error: { code: 'ACCOUNT_TEMPORARILY_LOCKED', details: { retryAfterSeconds: 60 } },
    });
    // Đang khóa tạm thì đúng mật khẩu cũng chưa vào được.
    await expect(fresh.login({ phone: '0901234567', password: DEMO_PASSWORD })).rejects.toMatchObject({
      error: { code: 'ACCOUNT_TEMPORARILY_LOCKED' },
    });
  });

  it('đăng ký xong là có phiên, đăng nhập lại được bằng SĐT mới', async () => {
    const fresh = createFakeAuthApi({ delayMs: 0 });
    const session = await fresh.register({
      fullName: 'Trần Văn Bảo',
      phone: '0912345678',
      password: 'matkhau123',
    });
    expect(session.user).toMatchObject({ role: 'MEMBER', phone: '0912345678', email: null });
    expect((await fresh.refresh())?.user.phone).toBe('0912345678');
  });

  it('đăng ký trùng SĐT trả PHONE_DUPLICATED; SĐT có hồ sơ tại quầy trả ACTIVATION_REQUIRED', async () => {
    const fresh = createFakeAuthApi({ delayMs: 0 });
    await expect(
      fresh.register({ fullName: 'A', phone: '0901234567', password: 'matkhau123' }),
    ).rejects.toMatchObject({ error: { code: 'PHONE_DUPLICATED' } });
    await expect(
      fresh.register({ fullName: 'A', phone: DESK_PROFILE_PHONE, password: 'matkhau123' }),
    ).rejects.toMatchObject({ error: { code: 'ACTIVATION_REQUIRED' } });
  });

  it('đổi mật khẩu: sai mật khẩu hiện tại thì lỗi gắn vào ô currentPassword', async () => {
    const fresh = createFakeAuthApi({ delayMs: 0 });
    await fresh.login({ phone: '0901234567', password: DEMO_PASSWORD });
    await expect(
      fresh.changePassword({ currentPassword: 'sai', newPassword: 'matkhaumoi456' }),
    ).rejects.toMatchObject({ error: { code: 'VALIDATION_ERROR', details: [{ field: 'currentPassword' }] } });
    const session = await fresh.changePassword({
      currentPassword: DEMO_PASSWORD,
      newPassword: 'matkhaumoi456',
    });
    expect(session.user.phone).toBe('0901234567');
  });
});
