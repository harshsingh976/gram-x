import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Incident } from '../../types';
import * as api from '../../api';

export interface ComplaintsState {
  items: Incident[];
  selectedIncident: Incident | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  filterCategory: string;
  filterStatus: string;
  searchQuery: string;
}

const initialState: ComplaintsState = {
  items: [],
  selectedIncident: null,
  status: 'idle',
  error: null,
  filterCategory: 'all',
  filterStatus: 'all',
  searchQuery: '',
};

export const fetchComplaintsAsync = createAsyncThunk(
  'complaints/fetchComplaints',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.fetchIncidents();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch complaints');
    }
  }
);

export const complaintsSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    setComplaints: (state, action: PayloadAction<Incident[]>) => {
      state.items = action.payload;
    },
    setSelectedIncident: (state, action: PayloadAction<Incident | null>) => {
      state.selectedIncident = action.payload;
    },
    setFilterCategory: (state, action: PayloadAction<string>) => {
      state.filterCategory = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<string>) => {
      state.filterStatus = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComplaintsAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchComplaintsAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchComplaintsAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load complaints';
      });
  },
});

export const {
  setComplaints,
  setSelectedIncident,
  setFilterCategory,
  setFilterStatus,
  setSearchQuery,
} = complaintsSlice.actions;

export default complaintsSlice.reducer;
