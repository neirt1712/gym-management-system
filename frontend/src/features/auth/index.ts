import type { AuthApi } from './authApi';
import { fakeAuthApi } from './fakeAuthApi';
import { httpAuthApi } from './httpAuthApi';

/**
 * Chọn bản cài đặt AuthApi theo VITE_AUTH_MODE (Q8):
 * - `fake` (mặc định): tài khoản mẫu trong fakeAuthApi, không cần backend;
 * - `http`: gọi API thật hoặc mock Prism qua api/client.ts.
 */
export const isFakeAuth = (import.meta.env.VITE_AUTH_MODE ?? 'fake') !== 'http';

export const authApi: AuthApi = isFakeAuth ? fakeAuthApi : httpAuthApi;

export { useAuth } from './AuthContext';
export type { AuthApi } from './authApi';
export type { SessionUser, LoginInput } from './types';
