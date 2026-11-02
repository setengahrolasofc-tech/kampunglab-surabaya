import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Klien Supabase dengan sesi pengguna (RLS berlaku). Dipakai di Server Component, Server Action, dan Route Handler. */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(items) {
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Component: read-only */ }
      },
    },
  });
}
