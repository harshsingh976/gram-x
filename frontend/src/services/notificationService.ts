/**
 * GRAM-X Central Notification Service
 * Manages in-app notifications, unread counters, user preferences, and transactional email triggers via Resend.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { sendGrievanceStatusEmail } from './email';

export type NotificationType =
  | 'GRIEVANCE_SUBMITTED'
  | 'GRIEVANCE_VERIFIED'
  | 'GRIEVANCE_ASSIGNED'
  | 'GRIEVANCE_STATUS_CHANGED'
  | 'GRIEVANCE_ESCALATED'
  | 'GRIEVANCE_RESOLVED'
  | 'GRIEVANCE_CLOSED'
  | 'GRIEVANCE_COMMENTED'
  | 'DEADLINE_APPROACHING'
  | 'DEADLINE_MISSED';

export interface NotificationItem {
  id: string;
  recipient_id: string;
  grievance_id?: string | number;
  type: NotificationType;
  title: string;
  message: string;
  read_at?: string | null;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  status_updates: boolean;
  assignments: boolean;
  escalation_updates: boolean;
}

export interface CreateNotificationInput {
  recipient_id: string;
  recipient_email?: string;
  grievance_id?: string | number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

// ─── LOCAL IN-MEMORY NOTIFICATION STORE FOR OFFLINE/DEMO ─────────────────
let DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_001',
    recipient_id: 'current_user',
    grievance_id: 1,
    type: 'GRIEVANCE_STATUS_CHANGED',
    title: 'Grievance In Progress',
    message: 'Technician Suresh Kumar has begun site remediation on GX-2026-000001.',
    read_at: null,
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    metadata: { reference_no: 'GX-2026-000001' },
  },
  {
    id: 'notif_002',
    recipient_id: 'current_user',
    grievance_id: 2,
    type: 'GRIEVANCE_VERIFIED',
    title: 'Grievance Verified',
    message: 'Streetlight Inverter Malfunction (GX-2026-000002) verified by Panchayat Secretary.',
    read_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    metadata: { reference_no: 'GX-2026-000002' },
  },
];

let DEMO_PREFERENCES: NotificationPreferences = {
  user_id: 'current_user',
  email_enabled: true,
  in_app_enabled: true,
  status_updates: true,
  assignments: true,
  escalation_updates: true,
};

// ─── SERVICE METHODS ──────────────────────────────────────────────────────

/**
 * Dispatch a new Notification
 */
export const createNotification = async (input: CreateNotificationInput): Promise<NotificationItem> => {
  // 1. Trigger transactional email via Resend boundary if email is provided
  if (input.recipient_email) {
    sendGrievanceStatusEmail({
      to: input.recipient_email,
      citizenName: 'Citizen',
      grievanceRef: input.metadata?.reference_no || `GX-${input.grievance_id || '2026'}`,
      status: input.title,
      summary: input.message,
    }).catch((err) => console.warn('[GRAM-X Email] Safe non-blocking email warning:', err));
  }

  // 2. Store in Supabase
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: input.recipient_id,
        grievance_id: input.grievance_id,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata || {},
      })
      .select('*')
      .single();

    if (!error && data) return data as NotificationItem;
  }

  // Demo Fallback
  const newNotif: NotificationItem = {
    id: `notif_${Date.now()}`,
    recipient_id: input.recipient_id || 'current_user',
    grievance_id: input.grievance_id,
    type: input.type,
    title: input.title,
    message: input.message,
    read_at: null,
    created_at: new Date().toISOString(),
    metadata: input.metadata || {},
  };
  DEMO_NOTIFICATIONS.unshift(newNotif);
  return newNotif;
};

/**
 * Get Notifications for the Current Authenticated User
 */
export const getUserNotifications = async (): Promise<NotificationItem[]> => {
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) return data as NotificationItem[];
    }
  }

  return [...DEMO_NOTIFICATIONS];
};

/**
 * Get Total Unread Notification Count
 */
export const getUnreadCount = async (): Promise<number> => {
  const notifs = await getUserNotifications();
  return notifs.filter((n) => !n.read_at).length;
};

/**
 * Mark a Notification as Read
 */
export const markNotificationAsRead = async (id: string): Promise<void> => {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('id', id);
  }

  const found = DEMO_NOTIFICATIONS.find((n) => n.id === id);
  if (found) found.read_at = now;
};

/**
 * Mark All Notifications as Read
 */
export const markAllAsRead = async (): Promise<void> => {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('recipient_id', user.id)
        .is('read_at', null);
    }
  }

  DEMO_NOTIFICATIONS.forEach((n) => {
    if (!n.read_at) n.read_at = now;
  });
};

/**
 * Get Notification Preferences
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) return data as NotificationPreferences;
    }
  }
  return { ...DEMO_PREFERENCES };
};

/**
 * Update Notification Preferences
 */
export const updateNotificationPreferences = async (
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() })
        .select('*')
        .single();
      if (data) return data as NotificationPreferences;
    }
  }

  DEMO_PREFERENCES = { ...DEMO_PREFERENCES, ...prefs };
  return DEMO_PREFERENCES;
};

export default {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
};
