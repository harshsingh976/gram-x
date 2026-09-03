/**
 * GRAM-X Authentication Context
 * Manages global authentication lifecycle, session persistence, and role resolution.
 */

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as authService from '../services/authService';
import type { UserRole } from '../types';

export type AuthStatus = 'AUTH_LOADING' | 'AUTHENTICATED' | 'AUTH_UNAUTHENTICATED';

export interface AuthContextType {
  user: authService.UserProfile | null;
  token: string | null;
  role: UserRole;
  authStatus: AuthStatus;
  login: (credentials: authService.LoginCredentials) => Promise<void>;
  quickLogin: (demoRole: 'citizen' | 'worker' | 'admin' | 'district') => Promise<void>;
  register: (userData: authService.RegisterUserData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  });
  const [role, setRole] = useState<UserRole>(() => {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('role') as UserRole : null) || 'citizen';
  });
  const [user, setUser] = useState<authService.UserProfile | null>(() => {
    if (typeof localStorage !== 'undefined') {
      const u = localStorage.getItem('username');
      const n = localStorage.getItem('fullName');
      const r = localStorage.getItem('role') as UserRole;
      if (u) return { id: 1, username: u, name: n || u, role: r || 'citizen' };
    }
    return null;
  });
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
    return token ? 'AUTH_LOADING' : 'AUTH_UNAUTHENTICATED';
  });

  // Verify token and fetch latest user profile on initial mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (!token) {
        setAuthStatus('AUTH_UNAUTHENTICATED');
        return;
      }
      try {
        const me = await authService.getMe();
        setUser(me);
        setRole(me.role);
        setAuthStatus('AUTHENTICATED');
      } catch (err) {
        console.warn('[GRAM-X Auth] Session validation expired or invalid:', err);
        authService.clearAuthSession();
        setToken(null);
        setUser(null);
        setAuthStatus('AUTH_UNAUTHENTICATED');
      }
    };

    initializeAuth();
  }, [token]);

  const login = async (credentials: authService.LoginCredentials): Promise<void> => {
    const data = await authService.loginUser(credentials);
    setToken(data.access_token);
    
    // Fetch profile
    let me: authService.UserProfile;
    try {
      me = await authService.getMe();
    } catch {
      me = {
        id: 1,
        username: data.username,
        name: data.name || data.username,
        role: data.role as UserRole,
      };
    }

    authService.saveAuthSession(data, me);
    setUser(me);
    setRole(me.role);
    setAuthStatus('AUTHENTICATED');
  };

  const quickLogin = async (demoRole: 'citizen' | 'worker' | 'admin' | 'district'): Promise<void> => {
    const credentialsMap: Record<string, authService.LoginCredentials> = {
      citizen: { username: 'citizen', password: 'password123' },
      worker: { username: 'worker', password: 'password123' },
      admin: { username: 'admin', password: 'admin123' },
      district: { username: 'district', password: 'district123' },
    };

    const target = credentialsMap[demoRole] || credentialsMap.citizen;
    await login(target);
  };

  const register = async (userData: authService.RegisterUserData): Promise<void> => {
    await authService.registerUser(userData);
    // Automatically log user in after successful registration
    await login({
      username: userData.username,
      password: userData.password,
    });
  };

  const logout = async (): Promise<void> => {
    await authService.logoutUser();
    setToken(null);
    setUser(null);
    setAuthStatus('AUTH_UNAUTHENTICATED');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        authStatus,
        login,
        quickLogin,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
