import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { domicileFromMetadata } from "./domicile-match.mjs";

type Client = SupabaseClient<Database>;
type Claim = { kecamatan: string; kelurahan: string; rw: string; rt: string };
export type DomicileLink = "linked" | "none" | "error";

/**
 * Tautkan profil ke wilayah program (kelurahan -> RW -> RT). RW/RT yang belum ada dibuat di database
 * dari klaim warga; bila kelurahan tidak dikenal, RT lama dikosongkan agar draf tidak memakai wilayah usang.
 */
export async function linkDomicile(supabase: Client, claim: Claim): Promise<DomicileLink> {
  try {
    const { data, error } = await supabase.rpc("link_domicile", {
      p_kecamatan: claim.kecamatan, p_kelurahan: claim.kelurahan, p_rw: Number(claim.rw), p_rt: Number(claim.rt),
    });
    if (error || !data || typeof data !== "object" || Array.isArray(data)) return "error";
    return data.linked === true ? "linked" : "none";
  } catch { return "error"; }
}

/** Dipakai setelah verifikasi OTP daftar: klaim ada di metadata Auth. */
export async function linkDomicileFromSession(supabase: Client): Promise<DomicileLink> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return "error";
    return linkDomicile(supabase, domicileFromMetadata(data.user.user_metadata));
  } catch { return "error"; }
}

export const linkMessages: Record<DomicileLink, string> = {
  linked: "Domisili tersimpan dan terhubung ke wilayah program.",
  none: "Domisili tersimpan, tetapi kelurahan ini belum dikenal di data wilayah program. Hubungi pengelola.",
  error: "Domisili tersimpan, tetapi penautan ke wilayah program belum berhasil. Coba “Cocokkan ulang” beberapa saat lagi.",
};
