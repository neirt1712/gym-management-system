import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AuthApi } from './authApi';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';
import type { LoginInput, SessionUser } from './types';

type Props = { api: AuthApi; children: ReactNode };

export const AuthProvider = ({ api, children }: Props) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .refresh()
      .catch(() => null)
      .then((session) => {
        if (!active) return;
        tokenRef.current = session?.accessToken ?? null;
        setUser(session?.user ?? null);
        setStatus(session ? 'authenticated' : 'anonymous');
      });
    return () => {
      active = false;
    };
  }, [api]);

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await api.login(input);
      tokenRef.current = session.accessToken;
      setUser(session.user);
      setStatus('authenticated');
      return session.user;
    },
    [api],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      tokenRef.current = null;
      setUser(null);
      setStatus('anonymous');
    }
  }, [api]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, getAccessToken: () => tokenRef.current, login, logout }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
