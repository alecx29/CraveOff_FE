import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

let cached: SupabaseClient | null = null;

function getExtra(): any {
  return (
    ((Constants as any)?.expoConfig?.extra as any) ||
    ((Updates as any)?.manifest?.extra as any) ||
    {}
  );
}

export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const extra = getExtra();
  const url: string | undefined = extra?.supabaseUrl;
  const anon: string | undefined = extra?.supabaseAnonKey;
  if (!url || !anon) return null;
  cached = createClient(url, anon, {
    realtime: { params: { eventsPerSecond: 5 } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return cached;
}


