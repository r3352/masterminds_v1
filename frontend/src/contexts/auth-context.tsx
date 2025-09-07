"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyQuery, useMutation } from '@apollo/client';
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY, REFRESH_TOKEN_MUTATION } from '@/lib/graphql/auth';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  reputation_score: number;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  two_factor_enabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ success: boolean; requires2FA?: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [registerMutation] = useMutation(REGISTER_MUTATION);
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN_MUTATION);
  const [getMe, { data: meData }] = useLazyQuery(ME_QUERY, {
    errorPolicy: 'ignore',
  });

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          await getMe();
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [getMe]);

  // Update user when meData changes
  useEffect(() => {
    if (meData?.me) {
      setUser(meData.me);
    }
  }, [meData]);

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      const { data } = await loginMutation({
        variables: { 
          input: { 
            identifier: email, 
            password: password,
            ...(twoFactorCode && { totp_code: twoFactorCode })
          } 
        },
      });

      if (data?.login?.user) {
        // Login success
        localStorage.setItem('accessToken', data.login.access_token);
        localStorage.setItem('refreshToken', data.login.refresh_token);
        setUser(data.login.user);
        return { success: true };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Check if 2FA is required
      if (error.message?.includes('2FA code required')) {
        return { success: false, requires2FA: true };
      }
      
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Generate username from email if not provided
      const username = email.split('@')[0];
      
      const { data } = await registerMutation({
        variables: { 
          input: { 
            username: username,
            email: email, 
            password: password,
            full_name: name
          } 
        },
      });

      if (data?.register?.user) {
        localStorage.setItem('accessToken', data.register.access_token);
        localStorage.setItem('refreshToken', data.register.refresh_token);
        setUser(data.register.user);
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/');
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) return false;

      const { data } = await refreshTokenMutation({
        variables: { 
          input: { 
            refresh_token: refreshTokenValue 
          } 
        },
      });

      if (data?.refreshToken?.access_token) {
        localStorage.setItem('accessToken', data.refreshToken.access_token);
        localStorage.setItem('refreshToken', data.refreshToken.refresh_token);
        // Update user data from refresh response
        if (data.refreshToken.user) {
          setUser(data.refreshToken.user);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};