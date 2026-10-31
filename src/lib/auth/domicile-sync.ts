import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { domicileFromMetadata, filterByNumber, filterKelurahan } from "./domicile-match.mjs";

type Client = SupabaseClient<Database>;
type Claim = { kelurahan: string; rw: string; rt: string };
export type DomicileLink = "linked" | "none" | "ambiguous" | "error";

/** Cocokkan klaim ke wilayah program: kelurahan (nama) -> RW (angka) -> RT (angka). */
async function findRtIds(supabase: Client, claim: Claim): Promise<string[] | null> {
  const kelurahan = await supabase.from("territories").select("id,name,code").eq("kind", "kelurahan").limit(1000);
  if (kelurahan.error) return null;
  const found: string[] = [];
  for (const kel of filterKelurahan(kelurahan.data ?? [], claim.kelurahan)) {
    const rws = await supabase.from("territories").select("id,name,code").eq("kind", "rw").eq("parent_id", kel.id).limit(1000);
    if (rws.error) return null;
    for (const rw of filterByNumber(rws.data ?? [], claim.rw)) {
      const rts = await supabase.from("territories").select("id,name,code").eq("kind", "rt").eq("parent_id", rw.id).limit(1000);
      if (rts.error) return null;
      found.push(...filterByNumber(rts.data ?? [], claim.rt).map((rt) => rt.id));
    }
  }
  return found;
}

/**
 * Samakan profiles.domicile_rt_id dengan klaim domisili. Bila tidak ada kecocokan tunggal,
 * RT lama dikosongkan agar draf baru tidak memakai wilayah yang sudah tidak berlaku.
 */
export async function linkDomicile(supabase: Client, claim: Claim): Promise<DomicileLink> {
  try {
    const ids = await findRtIds(supabase, claim);
    if (!ids) return "error";
    const rt = ids.length === 1 ? ids[0] : null;
    const { error } = await supabase.rpc("set_profile_domicile", { rt });
    if (error) return "error";
    return ids.length === 1 ? "linked" : ids.length === 0 ? "none" : "ambiguous";
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
  linked: "Domisili tersimpan dan cocok dengan wilayah program.",
  none: "Domisili tersimpan, tetapi kelurahan/RW/RT ini belum ada di data wilayah program. Draf pengajuan baru belum bisa dibuat sampai wilayahmu terdaftar oleh pengelola.",
  ambiguous: "Domisili tersimpan, tetapi cocok dengan lebih dari satu wilayah program. Hubungi pengelola agar data wilayahmu dirapikan.",
  error: "Domisili tersimpan, tetapi pencocokan ke wilayah program belum berhasil. Coba “Cocokkan ulang” beberapa saat lagi.",
};
