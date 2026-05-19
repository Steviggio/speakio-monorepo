'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
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

// Manages JWT-based auth state: auto-loads profile on mount, exposes login/logout.
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

  // Stores the JWT in a cookie, sets the Authorization header, and updates user state.
  const login = useCallback((token: string, userData: User) => {

    Cookies.set('access_token', token, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  }, []);

  // Clears the JWT cookie, removes the Authorization header, and resets user state.
  const logout = useCallback(() => {
    Cookies.remove('access_token', { path: '/' });
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
