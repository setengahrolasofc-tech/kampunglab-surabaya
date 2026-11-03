import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config.mjs";

/** Klien tanpa sesi untuk data publik (Papan Masalah, Etalase, Rapor, info survei). Dibatasi RLS/RPC untuk peran anon. */
export function createPublicSupabaseClient() {
  const { url, publishableKey } = getSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
