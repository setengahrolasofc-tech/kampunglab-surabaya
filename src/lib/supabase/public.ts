import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config.mjs";

/**
 * Stateless, unauthenticated client for future public-data reads only.
 * Not a login/session client. SSR Auth needs separate cookie-aware helpers.
 * No query runs and no client is instantiated until this function is called.
 */
export function createPublicSupabaseClient() {
  const { url, publishableKey } = getSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
