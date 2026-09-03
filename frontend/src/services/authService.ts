/**
 * GRAM-X Authentication Service (Supabase Auth Target Architecture)
 * Direct integration with Supabase Auth & PostgreSQL Profiles table.
 *
 * Replaces obsolete custom Python API auth with standard Supabase Auth SDK.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { UserRole } from '../types';

export interface LoginCredentials {
  username: string; // Accepts username or email
  password: string;
}

export interface RegisterUserData {
  name: string;
  username: string;
  password: string;
  email?: string;
  role?: 'citizen' | 'worker';
  village_id?: number;
}

export interface UserProfile {
  id: string | number;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  village_id?: number;
  is_active?: boolean;
}

export interface AuthSessionResult {
  user: UserProfile;
  access_token: string;
}

/**
 * Sign In with Supabase Auth
 */
export const loginUser = async (credentials: LoginCredentials): Promise<AuthSessionResult> => {
  const identifier = credentials.username.trim();
  const password = credentials.password;

  // 1. If Supabase is configured in environment, use Supabase Auth
  if (isSupabaseConfigured()) {
    const email = identifier.includes('@') ? identifier : `${identifier.toLowerCase()}@gramx.gov.in`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid User ID/Email or password. Please verify your credentials.');
      }
      throw new Error(error.message || 'Authentication failed. Please try again.');
    }

    if (!data.user || !data.session) {
      throw new Error('No user session returned from Supabase Auth.');
    }

    // Retrieve full profile from PostgreSQL profiles table
    let profile: UserProfile;
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileData && !profileErr) {
        profile = {
          id: profileData.id,
          username: profileData.username || identifier,
          name: profileData.name || data.user.user_metadata?.name || identifier,
          email: data.user.email,
          role: (profileData.role as UserRole) || (data.user.user_metadata?.role as UserRole) || 'citizen',
          village_id: profileData.village_id || 1,
          is_active: profileData.is_active ?? true,
        };
      } else {
        // Fallback to user_metadata
        profile = {
          id: data.user.id,
          username: data.user.user_metadata?.username || identifier,
          name: data.user.user_metadata?.name || identifier,
          email: data.user.email,
          role: (data.user.user_metadata?.role as UserRole) || 'citizen',
          village_id: data.user.user_metadata?.village_id || 1,
          is_active: true,
        };
      }
    } catch {
      profile = {
        id: data.user.id,
        username: identifier,
        name: data.user.user_metadata?.name || identifier,
        email: data.user.email,
        role: (data.user.user_metadata?.role as UserRole) || 'citizen',
        village_id: 1,
        is_active: true,
      };
    }

    saveAuthSession(data.session.access_token, profile);
    return {
      user: profile,
      access_token: data.session.access_token,
    };
  }

  // 2. Demo fallback for local development before Supabase project keys are set
  return executeDemoLogin(identifier, password);
};

/**
 * Register User with Supabase Auth
 */
export const registerUser = async (userData: RegisterUserData): Promise<UserProfile> => {
  const username = userData.username.trim().toLowerCase();
  const name = userData.name.trim();
  const email = userData.email?.trim() || `${username}@gramx.gov.in`;
  const role = userData.role || 'citizen';
  const village_id = userData.village_id || 1;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: userData.password,
      options: {
        data: {
          name,
          username,
          role,
          village_id,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        throw new Error('An account with this username or email is already registered.');
      }
      throw new Error(error.message || 'Registration failed. Please check your information.');
    }

    if (!data.user) {
      throw new Error('Registration failed to create user record.');
    }

    const profile: UserProfile = {
      id: data.user.id,
      username,
      name,
      email,
      role: role as UserRole,
      village_id,
      is_active: true,
    };

    if (data.session) {
      saveAuthSession(data.session.access_token, profile);
    }

    return profile;
  }

  // Demo registration fallback
  const demoProfile: UserProfile = {
    id: `demo_${Date.now()}`,
    username,
    name,
    email,
    role: role as UserRole,
    village_id,
    is_active: true,
  };
  saveAuthSession('demo_supabase_jwt_token', demoProfile);
  return demoProfile;
};

/**
 * Reset Password with Supabase Auth
 */
export const forgotPassword = async (usernameOrEmail: string): Promise<{ message: string }> => {
  const target = usernameOrEmail.trim();
  const email = target.includes('@') ? target : `${target.toLowerCase()}@gramx.gov.in`;

  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-key` : undefined,
    });

    if (error) {
      throw new Error(error.message || 'Unable to send password reset request.');
    }
  }

  return {
    message: 'If an account exists with this identifier, password recovery instructions have been dispatched.',
  };
};

/**
 * Verify OTP code for password recovery
 */
export const verifyResetOtp = async (
  usernameOrEmail: string,
  otpCode: string
): Promise<{ reset_ticket: string; message: string }> => {
  const target = usernameOrEmail.trim();
  const email = target.includes('@') ? target : `${target.toLowerCase()}@gramx.gov.in`;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'recovery',
    });

    if (error) {
      throw new Error(error.message || 'Invalid or expired OTP verification code.');
    }

    return {
      reset_ticket: data.session?.access_token || `rst_${Date.now()}`,
      message: 'OTP verification successful.',
    };
  }

  // Demo fallback
  return {
    reset_ticket: `demo_ticket_${Date.now()}`,
    message: 'OTP verified in demo mode.',
  };
};

/**
 * Complete Password Reset with New Password
 */
export const resetPasswordWithToken = async (params: {
  username_or_email: string;
  reset_ticket: string;
  new_password: string;
}): Promise<{ message: string }> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.updateUser({
      password: params.new_password,
    });

    if (error) {
      throw new Error(error.message || 'Failed to update password with new credentials.');
    }
  }

  return {
    message: 'Password reset successfully.',
  };
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (): Promise<UserProfile> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Error('Not authenticated');
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      id: data.user.id,
      username: profileData?.username || data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'citizen',
      name: profileData?.name || data.user.user_metadata?.name || 'Citizen User',
      email: data.user.email,
      role: (profileData?.role as UserRole) || (data.user.user_metadata?.role as UserRole) || 'citizen',
      village_id: profileData?.village_id || 1,
      is_active: profileData?.is_active ?? true,
    };
  }

  // Read from localStorage in demo mode
  if (typeof localStorage !== 'undefined') {
    const u = localStorage.getItem('username');
    const n = localStorage.getItem('fullName');
    const r = (localStorage.getItem('role') as UserRole) || 'citizen';
    if (u) {
      return { id: 1, username: u, name: n || u, role: r, village_id: 1, is_active: true };
    }
  }
  throw new Error('Not authenticated');
};

/**
 * Sign Out
 */
export const logoutUser = async (): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[GRAM-X Supabase] Sign out warning:', err);
    }
  }
  clearAuthSession();
};

export const saveAuthSession = (token: string, profile: UserProfile): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('role', profile.role);
    localStorage.setItem('username', profile.username);
    localStorage.setItem('fullName', profile.name);
  }
};

export const clearAuthSession = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
  }
};

/**
 * Deterministic demo evaluator helper for testing & rapid review
 */
function executeDemoLogin(identifier: string, _password: string): AuthSessionResult {
  const norm = identifier.toLowerCase();
  let role: UserRole = 'citizen';
  let name = 'Sunita Devi (Citizen)';

  if (norm.includes('admin') || norm.includes('secretary')) {
    role = 'admin';
    name = 'Rajesh Kumar (Panchayat Sec.)';
  } else if (norm.includes('worker') || norm.includes('tech')) {
    role = 'worker';
    name = 'Suresh Kumar (Field Tech)';
  } else if (norm.includes('district') || norm.includes('collector') || norm.includes('dm')) {
    role = 'district';
    name = 'District Collector Raisen';
  }

  const profile: UserProfile = {
    id: `demo_${role}_001`,
    username: identifier,
    name,
    email: `${identifier}@gramx.gov.in`,
    role,
    village_id: 1,
    is_active: true,
  };

  saveAuthSession('demo_supabase_access_token', profile);
  return {
    user: profile,
    access_token: 'demo_supabase_access_token',
  };
}
