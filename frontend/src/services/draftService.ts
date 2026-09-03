/**
 * GRAM-X Offline Grievance Draft Service
 * Safely persists citizen complaints locally to prevent data loss during signal drops.
 * Security rule: Never stores passwords or authentication credentials.
 */

import type { GrievanceCategory, GrievancePriority } from './grievanceService';

export interface GrievanceDraft {
  title: string;
  description: string;
  category: GrievanceCategory;
  priority: GrievancePriority;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  saved_at: string;
}

const DRAFT_STORAGE_KEY = 'gramx_offline_grievance_draft';

export const saveDraft = (draft: Omit<GrievanceDraft, 'saved_at'>): void => {
  if (typeof window === 'undefined') return;
  const payload: GrievanceDraft = {
    ...draft,
    saved_at: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
};

export const getDraft = (): GrievanceDraft | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GrievanceDraft;
  } catch {
    return null;
  }
};

export const clearDraft = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_STORAGE_KEY);
};

export const hasDraft = (): boolean => {
  return getDraft() !== null;
};

export default {
  saveDraft,
  getDraft,
  clearDraft,
  hasDraft,
};
