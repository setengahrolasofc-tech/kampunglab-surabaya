"use server";

import { requireAnyUser } from "@/lib/auth/session";
import { validateKelurahanAccess } from "@/lib/auth/validation.mjs";
import { dbMessage } from "@/lib/errors";
import { back } from "@/lib/flash";

/** Akun Inovator (email atau Google) meminta akses Kelurahan. Hasilnya MENUNGGU_MANDAT; wewenang baru ada setelah BRIDA memberi mandat. */
export async function requestKelurahanAccessAction(form: FormData) {
  const { supabase } = await requireAnyUser();
  const v = validateKelurahanAccess(form);
  const first = Object.values(v.errors)[0];
  if (first) back("/minta-akses", "err", first);

  const { data: kel } = await supabase.from("master_kelurahan").select("id").eq("kecamatan", v.kecamatan).eq("kelurahan", v.kelurahan).maybeSingle();
  if (!kel?.id) back("/minta-akses", "err", "Kelurahan tidak ditemukan di master data.");

  const { error } = await supabase.rpc("request_kelurahan_access", {
    p_kelurahan: kel!.id, p_nip: v.nip, p_jabatan: v.jabatan, p_phone: v.phone,
  });
  if (error) back("/minta-akses", "err", dbMessage(error, "Permintaan belum dapat dikirim. Coba lagi."));
  back("/menunggu-verifikasi", "ok", "Permintaan akses terkirim ke Admin BRIDA. Unggah SK/surat tugas di bawah agar dapat diperiksa.");
}
