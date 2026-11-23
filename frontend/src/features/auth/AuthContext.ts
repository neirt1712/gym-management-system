import { createContext, useContext } from 'react';
import type { ChangePasswordInput, LoginInput, RegisterInput, SessionUser } from './types';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export type AuthContextValue = {
  status: AuthStatus;
  user: SessionUser | null;
  /** Access token chỉ nằm trong bộ nhớ. Lớp api/client.ts sẽ đọc qua hàm này. */
  getAccessToken: () => string | null;
  login: (input: LoginInput) => Promise<SessionUser>;
  register: (input: RegisterInput) => Promise<SessionUser>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  /** Sau khi sửa hồ sơ (PATCH /me): cập nhật tên, ảnh trên thanh trên mà không phải đăng nhập lại. */
  updateUser: (patch: Partial<Pick<SessionUser, 'fullName' | 'email' | 'avatarUrl'>>) => void;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
};
