import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { configureApiAuth } from '../../api/client';
import type { AuthApi } from './authApi';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';
import type { AuthSession, ChangePasswordInput, LoginInput, RegisterInput, SessionUser } from './types';

type Props = { api: AuthApi; children: ReactNode };

export const AuthProvider = ({ api, children }: Props) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  // Access token chỉ nằm trong bộ nhớ (fe-architecture.md), không lưu localStorage.
  const tokenRef = useRef<string | null>(null);

  const applySession = useCallback((session: AuthSession | null) => {
    tokenRef.current = session?.accessToken ?? null;
    setUser(session?.user ?? null);
    setStatus(session ? 'authenticated' : 'anonymous');
  }, []);

  // Tải lại trang: lấy phiên mới từ cookie refresh.
  useEffect(() => {
    let active = true;
    api
      .refresh()
      .catch(() => null)
      .then((session) => {
        if (active) applySession(session);
      });
    return () => {
      active = false;
    };
  }, [api, applySession]);

  // api/client.ts lấy token ở đây, gọi refresh khi gặp 401, và báo hết phiên để route guard đưa về /login.
  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => tokenRef.current,
      refresh: async () => {
        const session = await api.refresh().catch(() => null);
        applySession(session);
        return session?.accessToken ?? null;
      },
      onSessionExpired: () => applySession(null),
    });
    return () => configureApiAuth(null);
  }, [api, applySession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await api.login(input);
      applySession(session);
      return session.user;
    },
    [api, applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const session = await api.register(input);
      applySession(session);
      return session.user;
    },
    [api, applySession],
  );

  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      applySession(await api.changePassword(input));
    },
    [api, applySession],
  );

  const updateUser = useCallback((patch: Partial<Pick<SessionUser, 'fullName' | 'email' | 'avatarUrl'>>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      applySession(null);
    }
  }, [api, applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      getAccessToken: () => tokenRef.current,
      login,
      register,
      changePassword,
      updateUser,
      logout,
    }),
    [status, user, login, register, changePassword, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
