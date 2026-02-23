import { createClient } from '@supabase/supabase-js';

// These come from environment variables set in Vercel
// For local development, they fall back to empty strings (localStorage mode)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type SupabaseUser = {
  id: string;
  email: string;
};
