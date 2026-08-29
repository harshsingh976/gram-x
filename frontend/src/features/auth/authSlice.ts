import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '../../types';
import * as api from '../../api';

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  role: UserRole;
  username: string;
  fullName: string;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'failed';
  error: string | null;
}

const initialToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
const initialRole = typeof localStorage !== 'undefined' ? (localStorage.getItem('role') as UserRole) || 'admin' : 'admin';
const initialUsername = typeof localStorage !== 'undefined' ? localStorage.getItem('username') || '' : '';
const initialFullName = typeof localStorage !== 'undefined' ? localStorage.getItem('fullName') || '' : '';

const initialState: AuthState = {
  token: initialToken,
  refreshToken: typeof localStorage !== 'undefined' ? localStorage.getItem('refreshToken') : null,
  role: initialRole,
  username: initialUsername,
  fullName: initialFullName,
  status: initialToken ? 'authenticated' : 'unauthenticated',
  error: null,
};

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await api.login(username, password);
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);

      const me = await api.getMe();
      localStorage.setItem('role', me.role);
      localStorage.setItem('username', me.username);
      localStorage.setItem('fullName', me.name);

      return {
        token: data.access_token,
        refreshToken: data.refresh_token || null,
        role: me.role as UserRole,
        username: me.username,
        fullName: me.name,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Invalid username or password');
    }
  }
);

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('fullName');
    }
    return true;
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthSession: (
      state,
      action: PayloadAction<{
        token: string;
        role: UserRole;
        username: string;
        fullName: string;
        refreshToken?: string | null;
      }>
    ) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.username = action.payload.username;
      state.fullName = action.payload.fullName;
      state.refreshToken = action.payload.refreshToken || null;
      state.status = 'authenticated';
      state.error = null;
    },
    clearAuthSession: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.role = 'admin';
      state.username = '';
      state.fullName = '';
      state.status = 'unauthenticated';
      state.error = null;
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'failed';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.role = action.payload.role;
        state.username = action.payload.username;
        state.fullName = action.payload.fullName;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Authentication failed';
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.token = null;
        state.refreshToken = null;
        state.role = 'admin';
        state.username = '';
        state.fullName = '';
        state.status = 'unauthenticated';
        state.error = null;
      });
  },
});

export const { setAuthSession, clearAuthSession, setAuthError } = authSlice.actions;
export default authSlice.reducer;
