import type { AuthSession, ChangePasswordInput, LoginInput, RegisterInput } from './types';

/**
 * Hợp đồng giữa AuthProvider và nơi xác thực.
 * - fakeAuthApi: dùng trước khi có openapi v0.1 (08/10).
 * - httpAuthApi: gọi POST /auth/login, /register, /refresh, /logout, /change-password.
 * Đổi bản cài đặt không phải sửa component.
 */
export interface AuthApi {
  login(input: LoginInput): Promise<AuthSession>;
  /** Đăng ký xong là vào luôn: BE trả phiên mới. */
  register(input: RegisterInput): Promise<AuthSession>;
  /** Đổi mật khẩu: BE thu hồi phiên ở thiết bị khác, trả phiên mới cho thiết bị này. */
  changePassword(input: ChangePasswordInput): Promise<AuthSession>;
  /** Lấy access token mới từ refresh cookie. Không có phiên thì trả null. */
  refresh(): Promise<AuthSession | null>;
  logout(): Promise<void>;
}
