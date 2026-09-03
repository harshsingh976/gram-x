/**
 * GRAM-X Dynamic Feature Flag Service
 */

import { supabase, isSupabaseConfigured } from './supabase';

export type FeatureFlagKey =
  | 'AI_ENABLED'
  | 'VOICE_ENABLED'
  | 'PUBLIC_TRANSPARENCY_ENABLED'
  | 'EMERGENCY_MODE';

const DEFAULT_FLAGS: Record<FeatureFlagKey, boolean> = {
  AI_ENABLED: true,
  VOICE_ENABLED: true,
  PUBLIC_TRANSPARENCY_ENABLED: true,
  EMERGENCY_MODE: false,
};

export const isFeatureEnabled = async (flagKey: FeatureFlagKey): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('flag_key', flagKey)
        .single();
      if (data) return Boolean(data.is_enabled);
    } catch {}
  }
  return DEFAULT_FLAGS[flagKey] ?? true;
};

export const getAllFeatureFlags = async (): Promise<Record<FeatureFlagKey, boolean>> => {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('feature_flags').select('flag_key, is_enabled');
      if (data && data.length > 0) {
        const result = { ...DEFAULT_FLAGS };
        data.forEach((row: any) => {
          result[row.flag_key as FeatureFlagKey] = Boolean(row.is_enabled);
        });
        return result;
      }
    } catch {}
  }
  return { ...DEFAULT_FLAGS };
};

export default {
  isFeatureEnabled,
  getAllFeatureFlags,
};
