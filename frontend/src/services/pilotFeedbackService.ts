/**
 * GRAM-X Pilot Feedback & Usability Issue Tracking Service (Phase 8)
 * Enables pilot users (Citizens, Workers, Panchayat Admins, Collectors) to report
 * bugs, UI confusion, translation issues, and usability suggestions in staging/pilot mode.
 */

import { supabase, isSupabaseConfigured } from './supabase';

export type PilotFeedbackCategory =
  | 'Bug'
  | 'Confusion'
  | 'Suggestion'
  | 'Translation'
  | 'Performance'
  | 'Accessibility';

export interface PilotFeedbackEntry {
  id?: string;
  category: PilotFeedbackCategory;
  page_url: string;
  user_role: string;
  language: string;
  description: string;
  device_info?: {
    screenWidth: number;
    screenHeight: number;
    userAgent: string;
    isTouchDevice: boolean;
  };
  created_at?: string;
}

// In-memory cache for offline/demo pilot reviews
const localPilotFeedbackStore: PilotFeedbackEntry[] = [];

/**
 * Submit pilot usability feedback
 */
export const submitPilotFeedback = async (
  feedback: Omit<PilotFeedbackEntry, 'id' | 'created_at'>
): Promise<{ success: boolean; id: string }> => {
  const entry: PilotFeedbackEntry = {
    ...feedback,
    id: `FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
    device_info: typeof window !== 'undefined'
      ? {
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          userAgent: navigator.userAgent,
          isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        }
      : undefined,
  };

  localPilotFeedbackStore.push(entry);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('audit_logs').insert({
        action: 'PILOT_FEEDBACK_SUBMITTED',
        entity_type: 'PILOT_FEEDBACK',
        entity_id: entry.id,
        metadata: {
          category: entry.category,
          page_url: entry.page_url,
          user_role: entry.user_role,
          language: entry.language,
          description: entry.description,
          device_info: entry.device_info,
        },
      });
    } catch (err) {
      console.warn('[PilotFeedback] Stored locally, Supabase sync skipped:', err);
    }
  }

  return { success: true, id: entry.id! };
};

/**
 * Get all submitted pilot feedback entries for review
 */
export const getPilotFeedbackList = (): PilotFeedbackEntry[] => {
  return [...localPilotFeedbackStore];
};

export default {
  submitPilotFeedback,
  getPilotFeedbackList,
};
