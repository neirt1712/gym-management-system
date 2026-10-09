import { api, unwrap } from '../../api/client';
import type { components } from '../../api/schema';
import type { AuthApi } from './authApi';
import type { AuthSession } from './types';

type ApiSession = components['schemas']['AuthSession'];

const toSession = ({ accessToken, user }: ApiSession): AuthSession => ({
  accessToken,
  user: {
    id: user.id,
    fullName: user.fullName,
    role: user.role,
    phone: user.phone,
    email: user.email ?? null,
    avatarUrl: user.avatarUrl ?? null,
  },
});

/**
 * Xác thực qua API thật (hoặc mock Prism), theo openapi v0.1:
 * POST /auth/login, /auth/refresh (cookie HttpOnly), /auth/logout.
 */
export const createHttpAuthApi = (client = api): AuthApi => ({
  async login(input) {
    return toSession(unwrap(await client.POST('/auth/login', { body: input })));
  },

  async refresh() {
    const result = await client.POST('/auth/refresh');
    // Không có cookie hoặc phiên đã bị thu hồi: chưa đăng nhập, không phải lỗi.
    if (result.response.status === 401) return null;
    return toSession(unwrap(result));
  },

  async logout() {
    // Lỗi đăng xuất (mất mạng, phiên đã hết) không chặn việc xóa phiên ở FE.
    await client.POST('/auth/logout').catch(() => undefined);
  },
});

export const httpAuthApi = createHttpAuthApi();
