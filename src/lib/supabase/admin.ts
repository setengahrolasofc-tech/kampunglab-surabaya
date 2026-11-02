import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Klien service role: MELEWATI RLS. Hanya untuk kode server tepercaya (pendaftaran BRIDA, unggah foto survei, seed). */
export function createServiceRoleClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
