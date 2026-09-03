/**
 * GRAM-X Centralized Supabase Client
 * Single source of truth for Supabase Auth, PostgreSQL database queries, and Realtime subscriptions.
 *
 * Security Note:
 * Only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are exposed to browser code.
 * NEVER import or expose SUPABASE_SERVICE_ROLE_KEY in frontend client code.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
  );
};

// Provide a valid dummy fallback URL/key if not configured to prevent client instantiation crash
const effectiveUrl = isSupabaseConfigured()
  ? supabaseUrl
  : 'https://placeholder-gramx.supabase.co';

const effectiveKey = isSupabaseConfigured()
  ? supabaseAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient = createClient(effectiveUrl, effectiveKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
  },
});

if (!isSupabaseConfigured() && typeof window !== 'undefined') {
  console.info(
    '[GRAM-X Supabase] Supabase credentials not set in environment (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Demo mode active.'
  );
}

export default supabase;
