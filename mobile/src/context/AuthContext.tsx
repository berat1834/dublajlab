import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';

import { api, MOBILE_OAUTH_CALLBACK } from '@/lib/api';
import { getStoredToken, removeStoredToken, setStoredToken } from '@/lib/token-storage';
import type { User } from '@/types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'discord') => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
};

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const activeToken = token ?? (await getStoredToken());
    if (!activeToken) return null;
    const nextUser = await api.me(activeToken);
    setToken(activeToken);
    setUser(nextUser);
    return nextUser;
  }, [token]);

  const logout = useCallback(async () => {
    await removeStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const finishLogin = useCallback(async (activeToken: string) => {
    await setStoredToken(activeToken);
    const nextUser = await api.me(activeToken);
    setToken(activeToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email.trim().toLowerCase(), password);
    await finishLogin(result.access_token);
  }, [finishLogin]);

  const loginWithProvider = useCallback(async (provider: 'google' | 'discord') => {
    const result = await WebBrowser.openAuthSessionAsync(
      api.oauthLoginUrl(provider),
      MOBILE_OAUTH_CALLBACK,
    );
    if (result.type !== 'success') return false;
    const fragment = result.url.split('#', 2)[1] ?? '';
    const activeToken = new URLSearchParams(fragment).get('token');
    if (!activeToken) throw new Error('Sosyal giriş tamamlanamadı. Lütfen tekrar deneyin.');
    await finishLogin(activeToken);
    return true;
  }, [finishLogin]);

  useEffect(() => {
    // Restore the native session exactly when the memoized auth callbacks change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser()
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout, refreshUser]);

  // useMemo keeps the context object stable unless auth state really changes.
  const value = useMemo(
    () => ({ user, token, loading, login, loginWithProvider, logout, refreshUser }),
    [user, token, loading, login, loginWithProvider, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  return value;
}
