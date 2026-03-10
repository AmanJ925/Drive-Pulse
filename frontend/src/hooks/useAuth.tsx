import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser, LoginResponse, Driver } from '../types';
import { apiFetch } from '../utils/api';

interface AuthCtxValue {
  user: AuthUser | null;
  driver: Driver | null;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthCtxValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('dp_token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[0])) as AuthUser;
      setUser(payload);
      if (payload.role === 'driver') {
        apiFetch<Driver>(`/drivers/${payload.sub}`).then(setDriver).catch(() => {});
      }
    } catch (_) {}
  }, []);

  const login = useCallback((data: LoginResponse) => {
    const payload = JSON.parse(atob(data.token.split('.')[0])) as AuthUser;
    setUser(payload);
    if (data.driver) setDriver(data.driver);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dp_token');
    setUser(null);
    setDriver(null);
  }, []);

  return <AuthCtx.Provider value={{ user, driver, login, logout }}>{children}</AuthCtx.Provider>;
}
