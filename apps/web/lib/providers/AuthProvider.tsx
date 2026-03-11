'use client';

import React, { createContext, useState, useEffect } from 'react';
import type { User } from '@repo/types';
import Cookies from 'js-cookie';
import { apiGetProfile } from '../api/auth';
import { apiClient } from '../api/client';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    const token = Cookies.get('access_token');

    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      apiGetProfile()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {

          Cookies.remove('access_token');
          delete apiClient.defaults.headers.common['Authorization'];
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, userData: User) => {

    Cookies.set('access_token', token, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('access_token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
