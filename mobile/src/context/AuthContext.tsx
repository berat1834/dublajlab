import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { getStoredToken, removeStoredToken, setStoredToken } from '@/lib/token-storage';
import type { User } from '@/types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const activeToken = token ?? (await getStoredToken());
    if (!activeToken) return;
    const nextUser = await api.me(activeToken);
    setToken(activeToken);
    setUser(nextUser);
  }, [token]);

  const logout = useCallback(async () => {
    await removeStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email.trim().toLowerCase(), password);
    await setStoredToken(result.access_token);
    const nextUser = await api.me(result.access_token);
    setToken(result.access_token);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    // Restore the native session exactly when the memoized auth callbacks change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser()
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout, refreshUser]);

  // useMemo keeps the context object stable unless auth state really changes.
  const value = useMemo(
    () => ({ user, token, loading, login, logout, refreshUser }),
    [user, token, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  return value;
}
