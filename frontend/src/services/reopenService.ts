/**
 * GRAM-X Reopen & Appeal Service
 * Enables citizens to appeal an incorrectly closed grievance and officials to review the appeal.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { updateGrievanceStatus } from './grievanceService';
import { createNotification } from './notificationService';

export interface ReopenRequest {
  id: string;
  grievance_id: string | number;
  requested_by: string;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

const DEMO_REOPEN_REQUESTS: Record<string, ReopenRequest> = {};

export const requestGrievanceReopen = async (
  grievanceId: string | number,
  reason: string
): Promise<ReopenRequest> => {
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('grievance_reopen_requests')
      .insert({
        grievance_id: grievanceId,
        requested_by: user?.id,
        reason: reason.trim(),
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (!error && data) {
      // Notify Admin
      createNotification({
        recipient_id: 'admin',
        grievance_id: grievanceId,
        type: 'GRIEVANCE_ESCALATED',
        title: 'Reopening Requested',
        message: `Citizen requested reopening for grievance #${grievanceId}: "${reason}"`,
      }).catch(() => {});

      return data as ReopenRequest;
    }
  }

  const req: ReopenRequest = {
    id: `reopen_${Date.now()}`,
    grievance_id: grievanceId,
    requested_by: 'current_user',
    reason,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  };

  DEMO_REOPEN_REQUESTS[String(grievanceId)] = req;
  return req;
};

export const reviewReopenRequest = async (
  requestId: string,
  grievanceId: string | number,
  decision: 'ACCEPTED' | 'REJECTED',
  reviewNotes: string
): Promise<void> => {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('grievance_reopen_requests')
      .update({
        status: decision,
        reviewed_by: user?.id,
        review_notes: reviewNotes,
        reviewed_at: now,
      })
      .eq('id', requestId);

    if (decision === 'ACCEPTED') {
      await updateGrievanceStatus(
        grievanceId,
        'IN_PROGRESS',
        `Reopened upon citizen appeal. Review note: ${reviewNotes}`
      );
    }
  }

  if (DEMO_REOPEN_REQUESTS[String(grievanceId)]) {
    DEMO_REOPEN_REQUESTS[String(grievanceId)].status = decision;
    DEMO_REOPEN_REQUESTS[String(grievanceId)].review_notes = reviewNotes;
    DEMO_REOPEN_REQUESTS[String(grievanceId)].reviewed_at = now;
  }
};

export default {
  requestGrievanceReopen,
  reviewReopenRequest,
};
