import { describe, expect, it } from 'vitest';
import { createFakeAuthApi, DEMO_PASSWORD } from './fakeAuthApi';

const api = createFakeAuthApi({ delayMs: 0 });

describe('fakeAuthApi', () => {
  it('đăng nhập bằng số điện thoại', async () => {
    const session = await api.login({ identifier: '0900000001', password: DEMO_PASSWORD });
    expect(session.user.role).toBe('MEMBER');
    expect(session.accessToken).toBeTruthy();
  });

  it('đăng nhập bằng email, không phân biệt hoa thường', async () => {
    const session = await api.login({ identifier: ' Admin@Gym.Local ', password: DEMO_PASSWORD });
    expect(session.user.role).toBe('ADMIN');
  });

  it('sai mật khẩu trả INVALID_CREDENTIALS', async () => {
    await expect(api.login({ identifier: '0900000001', password: 'sai' })).rejects.toMatchObject({
      error: { code: 'INVALID_CREDENTIALS' },
    });
  });

  it('tài khoản bị khóa trả ACCOUNT_LOCKED', async () => {
    await expect(api.login({ identifier: '0900000009', password: DEMO_PASSWORD })).rejects.toMatchObject({
      error: { code: 'ACCOUNT_LOCKED' },
    });
  });

  it('refresh giữ phiên sau đăng nhập, mất phiên sau đăng xuất', async () => {
    await api.login({ identifier: '0900000003', password: DEMO_PASSWORD });
    expect((await api.refresh())?.user.role).toBe('STAFF');
    await api.logout();
    expect(await api.refresh()).toBeNull();
  });
});
