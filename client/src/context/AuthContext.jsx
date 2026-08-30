import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('cleantrack_token');
    const savedUser = localStorage.getItem('cleantrack_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));

      // Validate token with backend
      authAPI.me()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('cleantrack_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          // Token invalid — clear session
          localStorage.removeItem('cleantrack_token');
          localStorage.removeItem('cleantrack_user');
          setUser(null);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('cleantrack_token', newToken);
    localStorage.setItem('cleantrack_user', JSON.stringify(newUser));
    return newUser;
  };

  const signup = async (data) => {
    const res = await authAPI.signup(data);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('cleantrack_token', newToken);
    localStorage.setItem('cleantrack_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cleantrack_token');
    localStorage.removeItem('cleantrack_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
