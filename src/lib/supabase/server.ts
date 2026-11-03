import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config.mjs";

/** Klien Supabase berbasis cookie sesi pengguna. Semua query tunduk pada RLS. */
export async function createServerSupabaseClient() {
  const { url, publishableKey } = getSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component bersifat read-only; proxy menyegarkan cookie, action/route handler boleh menulis.
        }
      },
    },
  });
}

export type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;
