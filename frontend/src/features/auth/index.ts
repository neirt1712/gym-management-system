import type { AuthApi } from './authApi';
import { fakeAuthApi } from './fakeAuthApi';

/**
 * Chọn bản cài đặt AuthApi theo VITE_AUTH_MODE.
 * Có openapi v0.1 thì thêm httpAuthApi và trả về khi mode = 'http'.
 */
export const authApi: AuthApi = fakeAuthApi;

export const isFakeAuth = (import.meta.env.VITE_AUTH_MODE ?? 'fake') === 'fake';

export { useAuth } from './AuthContext';
export type { AuthApi } from './authApi';
export type { SessionUser, LoginInput } from './types';
