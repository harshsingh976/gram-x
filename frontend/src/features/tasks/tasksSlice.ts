import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Task } from '../../types';
import * as api from '../../api';

export interface TasksState {
  myTasks: Task[];
  allTasks: Task[];
  selectedTask: Task | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TasksState = {
  myTasks: [],
  allTasks: [],
  selectedTask: null,
  status: 'idle',
  error: null,
};

export const fetchMyTasksAsync = createAsyncThunk(
  'tasks/fetchMyTasks',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.fetchMyTasks();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load technician assignments');
    }
  }
);

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setMyTasks: (state, action: PayloadAction<Task[]>) => {
      state.myTasks = action.payload;
    },
    setAllTasks: (state, action: PayloadAction<Task[]>) => {
      state.allTasks = action.payload;
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTasksAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyTasksAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myTasks = action.payload;
        state.error = null;
      })
      .addCase(fetchMyTasksAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load tasks';
      });
  },
});

export const { setMyTasks, setAllTasks, setSelectedTask } = tasksSlice.actions;
export default tasksSlice.reducer;
