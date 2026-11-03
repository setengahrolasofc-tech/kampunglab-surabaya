import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config.mjs";

/**
 * Klien service_role. HANYA server. Dipakai untuk tiga hal sempit:
 *  1. finalisasi pendaftaran Admin BRIDA (kode undangan terverifikasi di server),
 *  2. survei warga publik (unggah foto + RPC submit_survey_response + Tandai Minat Pilot),
 *  3. unggah SK saat pendaftaran Kelurahan dan penghapusan foto setelah anonimisasi.
 * SUPABASE_SERVICE_ROLE_KEY tidak boleh berawalan NEXT_PUBLIC_ dan tidak boleh masuk repositori.
 */
export function createAdminSupabaseClient() {
  const { url } = getSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi (hanya di server).");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const hasServiceRole = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
