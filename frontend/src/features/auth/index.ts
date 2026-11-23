import type { AuthApi } from './authApi';
import { fakeAuthApi } from './fakeAuthApi';
import { httpAuthApi } from './httpAuthApi';

/**
 * Chọn bản cài đặt AuthApi theo VITE_AUTH_MODE (Q8); không đặt thì theo chế độ chạy (fe-plan tuần 4: bỏ mock):
 * - `npm run dev` → `http`: gọi backend thật qua api/client.ts;
 * - `npm run dev:mock` (mode `mock`) → `fake`: tài khoản mẫu trong fakeAuthApi, không cần backend.
 */
const defaultMode = import.meta.env.MODE === 'mock' ? 'fake' : 'http';
export const isFakeAuth = (import.meta.env.VITE_AUTH_MODE ?? defaultMode) !== 'http';

export const authApi: AuthApi = isFakeAuth ? fakeAuthApi : httpAuthApi;

export { useAuth } from './AuthContext';
export type { AuthApi } from './authApi';
export type { SessionUser, LoginInput, RegisterInput, ChangePasswordInput } from './types';
