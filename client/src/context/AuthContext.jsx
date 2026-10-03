import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setUser(data.data.user)).catch(() => setUser(null)).finally(() => setLoading(false));
    const clearSession = () => setUser(null);
    window.addEventListener('shortly:unauthorized', clearSession);
    return () => window.removeEventListener('shortly:unauthorized', clearSession);
  }, []);
  const value = useMemo(() => ({ user, loading, async login(credentials) { const { data } = await api.post('/auth/login', credentials); setUser(data.data.user); }, async register(details) { const { data } = await api.post('/auth/register', details); setUser(data.data.user); }, async logout() { try { await api.post('/auth/logout'); } finally { setUser(null); } } }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
