import { createContext, useContext } from 'react';
import type { LoginInput, SessionUser } from './types';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export type AuthContextValue = {
  status: AuthStatus;
  user: SessionUser | null;
  /** Access token chỉ nằm trong bộ nhớ. Lớp api/client.ts sẽ đọc qua hàm này. */
  getAccessToken: () => string | null;
  login: (input: LoginInput) => Promise<SessionUser>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
};
