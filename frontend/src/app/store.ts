import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import complaintsReducer from '../features/complaints/complaintsSlice';
import tasksReducer from '../features/tasks/tasksSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import esgReducer from '../features/esg/esgSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    complaints: complaintsReducer,
    tasks: tasksReducer,
    notifications: notificationsReducer,
    esg: esgReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
