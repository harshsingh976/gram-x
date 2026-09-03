/**
 * GRAM-X Authentication Service
 * Decouples API authentication endpoints from UI components.
 */

import { apiRequest } from './api';
import type { UserRole } from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterUserData {
  username: string;
  name: string;
  password: string;
  email?: string;
  role?: 'citizen' | 'worker';
  village_id?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  role: string;
  username: string;
  name: string;
}

export interface UserProfile {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  village_id?: number;
  is_active?: boolean;
}

export interface ResetOtpResponse {
  message: string;
  status: string;
}

export interface VerifyOtpResponse {
  message: string;
  reset_ticket: string;
}

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: credentials.username.trim(),
      password: credentials.password,
    }),
  });
};

export const registerUser = async (userData: RegisterUserData): Promise<UserProfile> => {
  return await apiRequest<UserProfile>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      username: userData.username.trim(),
      name: userData.name.trim(),
      password: userData.password,
      email: userData.email?.trim() || undefined,
      role: userData.role || 'citizen',
      village_id: userData.village_id || 1,
    }),
  });
};

export const forgotPassword = async (usernameOrEmail: string): Promise<ResetOtpResponse> => {
  return await apiRequest<ResetOtpResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({
      username_or_email: usernameOrEmail.trim(),
    }),
  });
};

export const verifyResetOtp = async (
  usernameOrEmail: string,
  otpCode: string
): Promise<VerifyOtpResponse> => {
  return await apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      username_or_email: usernameOrEmail.trim(),
      otp_code: otpCode.trim(),
    }),
  });
};

export const resetPasswordWithToken = async (data: {
  username_or_email: string;
  reset_ticket: string;
  new_password: string;
}): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getMe = async (): Promise<UserProfile> => {
  return await apiRequest<UserProfile>('/auth/me', {
    method: 'GET',
  });
};

export const logoutUser = async (): Promise<void> => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('[GRAM-X] Logout endpoint notice:', err);
  } finally {
    clearAuthSession();
  }
};

export const saveAuthSession = (authData: AuthResponse, me?: UserProfile): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('token', authData.access_token);
    if (authData.refresh_token) {
      localStorage.setItem('refreshToken', authData.refresh_token);
    }
    const finalRole = me?.role || authData.role || 'citizen';
    const finalUsername = me?.username || authData.username || '';
    const finalName = me?.name || authData.name || '';
    
    localStorage.setItem('role', finalRole);
    localStorage.setItem('username', finalUsername);
    localStorage.setItem('fullName', finalName);
  }
};

export const clearAuthSession = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
  }
};
