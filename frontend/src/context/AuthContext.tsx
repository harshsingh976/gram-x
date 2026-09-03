/**
 * GRAM-X Centralized Authentication Context
 * Subscribes to Supabase Auth state changes and provides role-based session management.
 */

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import * as authService from '../services/authService';
import type { UserRole } from '../types';

export type AuthStatus = 'AUTH_LOADING' | 'AUTHENTICATED' | 'AUTH_UNAUTHENTICATED';

export interface AuthContextType {
  user: authService.UserProfile | null;
  token: string | null;
  role: UserRole;
  authStatus: AuthStatus;
  signIn: (credentials: authService.LoginCredentials) => Promise<void>;
  login: (credentials: authService.LoginCredentials) => Promise<void>;
  signUp: (userData: authService.RegisterUserData) => Promise<void>;
  signup: (userData: authService.RegisterUserData) => Promise<void>;
  register: (userData: authService.RegisterUserData) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (emailOrUsername: string) => Promise<{ message: string }>;
  quickLogin: (demoRole: 'citizen' | 'worker' | 'admin' | 'district') => Promise<void>;
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

  // 1. Initial Session & Supabase onAuthStateChange Listener
  useEffect(() => {
    if (isSupabaseConfigured()) {
      // Get current active session from Supabase Auth
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setToken(session.access_token);
          authService.getMe().then((profile) => {
            setUser(profile);
            setRole(profile.role);
            setAuthStatus('AUTHENTICATED');
          }).catch(() => {
            setAuthStatus('AUTH_UNAUTHENTICATED');
          });
        } else {
          setAuthStatus('AUTH_UNAUTHENTICATED');
        }
      });

      // Listen to Supabase Auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session) {
            setToken(session.access_token);
            try {
              const profile = await authService.getMe();
              setUser(profile);
              setRole(profile.role);
              setAuthStatus('AUTHENTICATED');
            } catch {
              setAuthStatus('AUTHENTICATED');
            }
          } else {
            setToken(null);
            setUser(null);
            setAuthStatus('AUTH_UNAUTHENTICATED');
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Demo / Local storage validation fallback
      if (token) {
        authService.getMe().then((profile) => {
          setUser(profile);
          setRole(profile.role);
          setAuthStatus('AUTHENTICATED');
        }).catch(() => {
          setAuthStatus('AUTH_UNAUTHENTICATED');
        });
      } else {
        setAuthStatus('AUTH_UNAUTHENTICATED');
      }
    }
  }, [token]);

  const signIn = async (credentials: authService.LoginCredentials): Promise<void> => {
    const res = await authService.loginUser(credentials);
    setToken(res.access_token);
    setUser(res.user);
    setRole(res.user.role);
    setAuthStatus('AUTHENTICATED');
  };

  const signUp = async (userData: authService.RegisterUserData): Promise<void> => {
    const profile = await authService.registerUser(userData);
    setUser(profile);
    setRole(profile.role);
    setAuthStatus('AUTHENTICATED');
  };

  const signOut = async (): Promise<void> => {
    await authService.logoutUser();
    setToken(null);
    setUser(null);
    setAuthStatus('AUTH_UNAUTHENTICATED');
  };

  const resetPassword = async (emailOrUsername: string): Promise<{ message: string }> => {
    return await authService.forgotPassword(emailOrUsername);
  };

  const quickLogin = async (demoRole: 'citizen' | 'worker' | 'admin' | 'district'): Promise<void> => {
    const credentialsMap: Record<string, authService.LoginCredentials> = {
      citizen: { username: 'citizen', password: 'password123' },
      worker: { username: 'worker', password: 'password123' },
      admin: { username: 'admin', password: 'admin123' },
      district: { username: 'district', password: 'district123' },
    };
    const target = credentialsMap[demoRole] || credentialsMap.citizen;
    await signIn(target);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        authStatus,
        signIn,
        login: signIn,
        signUp,
        signup: signUp,
        register: signUp,
        signOut,
        logout: signOut,
        resetPassword,
        quickLogin,
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

export default AuthContext;
