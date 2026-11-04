import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, type ServerSupabase } from "@/lib/supabase/server";
import type { AppRole, AppUserRow, MandateRow } from "@/lib/types";
import { needsProfileCompletion } from "@/lib/auth/profile.mjs";

export interface SessionContext {
  supabase: ServerSupabase;
  userId: string;
  profile: AppUserRow;
  /** Mandat aktif (hanya akun Kelurahan). */
  mandate: MandateRow | null;
}

/** Sesi opsional (untuk header dan halaman publik). Tidak pernah melempar bila konfigurasi/jaringan bermasalah. */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: auth, error } = await supabase.auth.getUser();
    if (error || !auth.user) return null;
    const { data: profile } = await supabase
      .from("users").select("*, kelurahan:master_kelurahan(kecamatan, kelurahan)").eq("id", auth.user.id).maybeSingle();
    if (!profile) return null;
    let mandate: MandateRow | null = null;
    if (profile.role === "KELURAHAN") {
      const { data } = await supabase.from("kelurahan_mandates").select("*").eq("user_id", auth.user.id).is("dicabut_pada", null).maybeSingle();
      mandate = (data as MandateRow | null) ?? null;
    }
    return { supabase, userId: auth.user.id, profile: profile as AppUserRow, mandate };
  } catch {
    return null;
  }
});

/** Halaman beranda sesuai peran. */
export const homeFor = (role: AppRole) => (role === "BRIDA_ADMIN" ? "/admin" : role === "KELURAHAN" ? "/kelurahan" : "/dashboard");

/**
 * Wajib masuk dengan peran tertentu. Akun Kelurahan tanpa mandat aktif (atau berstatus bukan AKTIF)
 * hanya boleh melihat /menunggu-verifikasi; semua fitur dashboard terkunci (Bab 3.2).
 * UI hanyalah lapisan kedua: RLS database menolak akses yang sama.
 */
export async function requireRole(role: AppRole): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/masuk?status=perlu-masuk");
  const { profile, mandate } = session;
  if (profile.status === "DIBLOKIR") redirect("/masuk?status=diblokir");
  if (profile.role !== role) redirect(homeFor(profile.role));
  if (role === "KELURAHAN" && (profile.status !== "AKTIF" || !mandate)) redirect("/menunggu-verifikasi");
  if (role !== "KELURAHAN" && profile.status !== "AKTIF") redirect("/masuk?status=diblokir");
  // Akun Inovator baru (mis. dari Google) wajib melengkapi data diri dulu.
  if (role === "INNOVATOR" && needsProfileCompletion(profile)) redirect("/lengkapi-profil");
  return session;
}

export async function requireAnyUser(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/masuk?status=perlu-masuk");
  return session;
}
