import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { User } from '../types';
import { getSocket, disconnectSocket } from '../lib/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('midflow_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('midflow_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            const socket = getSocket();
            socket.emit('join:user', res.data.user.id);
          }
        } catch (error) {
          console.error('Failed to authenticate session:', error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('midflow_token', newToken);
    localStorage.setItem('midflow_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    const socket = getSocket();
    socket.emit('join:user', userData.id);
  };

  const logout = () => {
    localStorage.removeItem('midflow_token');
    localStorage.removeItem('midflow_user');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...userData };
      setUser(updated);
      localStorage.setItem('midflow_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
