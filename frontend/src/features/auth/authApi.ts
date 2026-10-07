import type { AuthSession, LoginInput } from './types';

/**
 * Hợp đồng giữa AuthProvider và nơi xác thực.
 * - fakeAuthApi: dùng trước khi có openapi v0.1 (08/10).
 * - httpAuthApi: gọi POST /auth/login, /auth/refresh, /auth/logout (sẽ thêm khi có openapi).
 * Đổi bản cài đặt không phải sửa component.
 */
export interface AuthApi {
  login(input: LoginInput): Promise<AuthSession>;
  /** Lấy access token mới từ refresh cookie. Không có phiên thì trả null. */
  refresh(): Promise<AuthSession | null>;
  logout(): Promise<void>;
}
