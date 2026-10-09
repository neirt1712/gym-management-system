import type { Role } from '../../app/roles';

/**
 * Người dùng đang đăng nhập, dùng nội bộ FE.
 * httpAuthApi chuyển `components['schemas']['SessionUser']` (schema.d.ts) sang kiểu này;
 * component không phụ thuộc trực tiếp vào hình dạng response của BE.
 */
export type SessionUser = {
  id: string;
  fullName: string;
  role: Role;
  phone: string;
  /** Không bắt buộc (Q15). */
  email: string | null;
  avatarUrl: string | null;
};

/** Đăng nhập chỉ bằng số điện thoại (Q12), khớp `LoginRequest` trong openapi. */
export type LoginInput = {
  phone: string;
  password: string;
};

export type AuthSession = {
  accessToken: string;
  user: SessionUser;
};
