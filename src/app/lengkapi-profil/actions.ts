"use server";

import { redirect } from "next/navigation";
import { homeFor, requireAnyUser } from "@/lib/auth/session";
import { validateCompleteProfile } from "@/lib/auth/validation.mjs";
import type { AuthActionState } from "@/lib/auth/types";
import { dbMessage } from "@/lib/errors";

/**
 * Melengkapi data diri akun yang baru dibuat (mis. lewat Google): nama, WA, institusi, kota (Inovator),
 * atau NIP, jabatan, kelurahan (permintaan akses Kelurahan). Tanpa password. Peran Kelurahan tetap harus menunggu mandat BRIDA.
 */
export async function completeProfileAction(_: AuthActionState, form: FormData): Promise<AuthActionState> {
  const { supabase, userId, profile } = await requireAnyUser();
  if (profile.status === "DIBLOKIR") redirect("/masuk?status=diblokir");
  if (profile.role !== "INNOVATOR") redirect(homeFor(profile.role));
  const v = validateCompleteProfile(form);
  if (Object.keys(v.errors).length) return { errors: v.errors };

  // 1) Simpan data dasar selagi akun masih Inovator (kolom ini memang boleh diubah pemiliknya).
  const base = v.role === "INNOVATOR"
    ? { name: v.name, phone_wa: v.phone, institusi: v.institusi, kota_domisili: v.kota }
    : { name: v.name, phone_wa: v.phone };
  const saved = await supabase.from("users").update(base).eq("id", userId).select("id");
  if (saved.error || !saved.data?.length) return { error: dbMessage(saved.error, "Data belum dapat disimpan. Coba lagi.") };

  // 2) Permintaan akses Kelurahan lewat fungsi database yang sudah ada (status MENUNGGU_MANDAT, tanpa wewenang).
  if (v.role === "KELURAHAN") {
    const { data: kel } = await supabase.from("master_kelurahan").select("id").eq("kecamatan", v.kecamatan).eq("kelurahan", v.kelurahan).maybeSingle();
    if (!kel?.id) return { errors: { kelurahan: "Kelurahan tidak ditemukan di master data." } };
    const { error } = await supabase.rpc("request_kelurahan_access", { p_kelurahan: kel.id, p_nip: v.nip, p_jabatan: v.jabatan, p_phone: v.phone });
    if (error) return { error: dbMessage(error, "Permintaan akses belum dapat dikirim. Coba lagi.") };
    redirect("/menunggu-verifikasi?ok=" + encodeURIComponent("Data tersimpan. Unggah SK/surat tugas di bawah agar Admin BRIDA dapat memeriksa permintaan akses Anda."));
  }
  redirect("/dashboard");
}
