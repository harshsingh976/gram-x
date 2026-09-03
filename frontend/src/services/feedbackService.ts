/**
 * GRAM-X Citizen Feedback Service
 * Handles post-resolution ratings (1-5 stars) and qualitative feedback.
 */

import { supabase, isSupabaseConfigured } from './supabase';

export interface GrievanceFeedback {
  id: string;
  grievance_id: string | number;
  citizen_id?: string;
  rating: number; // 1 - 5
  is_satisfied: boolean;
  feedback_text?: string;
  created_at: string;
}

const DEMO_FEEDBACK: Record<string, GrievanceFeedback> = {};

export const submitFeedback = async (input: {
  grievance_id: string | number;
  rating: number;
  is_satisfied: boolean;
  feedback_text?: string;
}): Promise<GrievanceFeedback> => {
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('grievance_feedback')
      .insert({
        grievance_id: input.grievance_id,
        citizen_id: user?.id,
        rating: input.rating,
        is_satisfied: input.is_satisfied,
        feedback_text: input.feedback_text?.trim() || null,
      })
      .select('*')
      .single();

    if (!error && data) return data as GrievanceFeedback;
  }

  const newFeedback: GrievanceFeedback = {
    id: `fb_${Date.now()}`,
    grievance_id: input.grievance_id,
    rating: input.rating,
    is_satisfied: input.is_satisfied,
    feedback_text: input.feedback_text,
    created_at: new Date().toISOString(),
  };

  DEMO_FEEDBACK[String(input.grievance_id)] = newFeedback;
  return newFeedback;
};

export const getFeedbackForGrievance = async (
  grievanceId: string | number
): Promise<GrievanceFeedback | null> => {
  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('grievance_feedback')
      .select('*')
      .eq('grievance_id', grievanceId)
      .single();
    if (data) return data as GrievanceFeedback;
  }
  return DEMO_FEEDBACK[String(grievanceId)] || null;
};

export default {
  submitFeedback,
  getFeedbackForGrievance,
};
