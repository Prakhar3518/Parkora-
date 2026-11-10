import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const readUser = () => {
  try { return JSON.parse(localStorage.getItem('parkora_user')); } catch { return null; }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const persist = (token, u) => {
    localStorage.setItem('parkora_token', token);
    localStorage.setItem('parkora_user', JSON.stringify(u));
    setUser(u);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const { data } = await api.post('/auth/signup', payload);
    persist(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('parkora_token');
    localStorage.removeItem('parkora_user');
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('parkora:logout', logout);
    return () => window.removeEventListener('parkora:logout', logout);
  }, [logout]);

  const value = useMemo(() => ({ user, login, signup, logout }), [user, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const homePathFor = (role) => (role === 'ADMIN' ? '/admin' : role === 'OWNER' ? '/owner' : '/dashboard');
