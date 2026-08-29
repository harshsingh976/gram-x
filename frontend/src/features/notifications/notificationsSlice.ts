import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  roleScope?: string;
}

export interface NotificationsState {
  items: AppNotification[];
  toast: {
    message: string;
    type: 'info' | 'success' | 'error';
  } | null;
  drawerOpen: boolean;
}

const initialState: NotificationsState = {
  items: [],
  toast: null,
  drawerOpen: false,
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<AppNotification, 'id' | 'timestamp' | 'read'>>) => {
      const newNotif: AppNotification = {
        ...action.payload,
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toISOString(),
        read: false,
      };
      state.items.unshift(newNotif);
      if (state.items.length > 50) {
        state.items.pop();
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const target = state.items.find((n) => n.id === action.payload);
      if (target) {
        target.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.items.forEach((n) => {
        n.read = true;
      });
    },
    clearAllNotifications: (state) => {
      state.items = [];
    },
    showToastNotification: (
      state,
      action: PayloadAction<{ message: string; type?: 'info' | 'success' | 'error' }>
    ) => {
      state.toast = {
        message: action.payload.message,
        type: action.payload.type || 'info',
      };
    },
    dismissToastNotification: (state) => {
      state.toast = null;
    },
    setDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.drawerOpen = action.payload;
    },
  },
});

export const {
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  showToastNotification,
  dismissToastNotification,
  setDrawerOpen,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
