import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./config.mjs";

/** Dipakai hanya untuk unggah berkas langsung ke Storage (sesi pengguna + kebijakan storage). */
export function createBrowserSupabaseClient() {
  const { url, publishableKey } = getSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  return createBrowserClient(url, publishableKey);
}
