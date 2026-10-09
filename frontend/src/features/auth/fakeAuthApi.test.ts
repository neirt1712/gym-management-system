import { describe, expect, it } from 'vitest';
import { createFakeAuthApi, DEMO_PASSWORD } from './fakeAuthApi';

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
});
