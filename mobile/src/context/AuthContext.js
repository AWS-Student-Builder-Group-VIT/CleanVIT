import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for existing session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('cleantrack_token');
        const savedUser = await AsyncStorage.getItem('cleantrack_user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          // Validate token with server
          try {
            const res = await authAPI.me();
            setUser(res.data.user);
            await AsyncStorage.setItem('cleantrack_user', JSON.stringify(res.data.user));
          } catch (err) {
            // Token expired or invalid
            await logout();
          }
        }
      } catch (err) {
        console.error('Session restore error:', err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    const { token: newToken, user: newUser } = res.data;

    await AsyncStorage.setItem('cleantrack_token', newToken);
    await AsyncStorage.setItem('cleantrack_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const signup = async (data) => {
    const res = await authAPI.signup(data);
    const { token: newToken, user: newUser } = res.data;

    await AsyncStorage.setItem('cleantrack_token', newToken);
    await AsyncStorage.setItem('cleantrack_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['cleantrack_token', 'cleantrack_user']);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
