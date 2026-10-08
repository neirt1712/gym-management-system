import type { Role } from '../../app/roles';

/**
 * Người dùng đang đăng nhập, dùng nội bộ FE.
 * Khi có openapi v0.1, httpAuthApi chuyển kiểu từ schema.d.ts sang kiểu này;
 * component không phụ thuộc trực tiếp vào hình dạng response của BE.
 */
export type SessionUser = {
  id: string;
  fullName: string;
  role: Role;
  phone: string;
  email: string | null;
};

export type LoginInput = {
  /** Số điện thoại hoặc email */
  identifier: string;
  password: string;
};

export type AuthSession = {
  accessToken: string;
  user: SessionUser;
};
