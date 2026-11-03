"use server";

import { revalidatePath } from "next/cache";
import { requireAnyUser, requireRole } from "@/lib/auth/session";
import { dbMessage } from "@/lib/errors";
import { back } from "@/lib/flash";
import { int, isUuid, optStr, str } from "@/lib/form";
import { cleanPhone } from "@/lib/domain/format.mjs";

const THEMES = ["LINGKUNGAN", "KESEHATAN", "EKONOMI", "PENDIDIKAN", "INFRASTRUKTUR", "KEAMANAN", "SOSIAL", "TEKNOLOGI", "LAINNYA"];

export async function resubmitRegistrationAction(form: FormData) {
  const { supabase } = await requireAnyUser();
  const { error } = await supabase.rpc("kelurahan_resubmit_registration", {
    p_sk_path: optStr(form, "sk_path"), p_phone: null, p_nip: optStr(form, "nip"), p_jabatan: optStr(form, "jabatan"),
  });
  if (error) back("/menunggu-verifikasi", "err", dbMessage(error));
  back("/menunggu-verifikasi", "ok", "Data dikirim ulang ke BRIDA.");
}

function problemPayload(form: FormData) {
  const theme = str(form, "kategori_tema");
  return {
    judul_masalah: str(form, "judul_masalah"), kategori_tema: THEMES.includes(theme) ? theme : "LAINNYA",
    deskripsi: str(form, "deskripsi"), deskripsi_lokasi_rt_rw: str(form, "deskripsi_lokasi_rt_rw"),
    kontak_wa_narahubung: cleanPhone(str(form, "kontak_wa_narahubung")),
  };
}

export async function createProblemAction(form: FormData) {
  const { supabase, userId, mandate } = await requireRole("KELURAHAN");
  const { error } = await supabase.from("problem_boards").insert({ ...problemPayload(form), kelurahan_id: mandate!.kelurahan_id, dibuat_oleh: userId });
  if (error) back("/kelurahan/masalah", "err", dbMessage(error, "Masalah belum dapat disimpan. Periksa judul (5+ karakter), lokasi RT/RW, dan nomor WA."));
  revalidatePath("/papan-masalah");
  back("/kelurahan/masalah", "ok", "Masalah ditambahkan ke Papan Masalah.");
}

export async function updateProblemAction(form: FormData) {
  const { supabase } = await requireRole("KELURAHAN");
  const id = str(form, "id");
  if (!isUuid(id)) back("/kelurahan/masalah", "err", "Masalah tidak ditemukan.");
  const { error } = await supabase.from("problem_boards").update(problemPayload(form)).eq("id", id);
  if (error) back("/kelurahan/masalah", "err", dbMessage(error, "Perubahan belum dapat disimpan."));
  revalidatePath("/papan-masalah");
  back("/kelurahan/masalah", "ok", "Masalah diperbarui.");
}

export async function deleteProblemAction(form: FormData) {
  const { supabase } = await requireRole("KELURAHAN");
  const id = str(form, "id");
  if (!isUuid(id)) back("/kelurahan/masalah", "err", "Masalah tidak ditemukan.");
  const { error } = await supabase.from("problem_boards").delete().eq("id", id);
  if (error) back("/kelurahan/masalah", "err", dbMessage(error, "Masalah ini sudah dipakai pengajuan dan tidak dapat dihapus."));
  revalidatePath("/papan-masalah");
  back("/kelurahan/masalah", "ok", "Masalah dihapus.");
}

async function run(form: FormData, fn: string, args: (id: string) => Record<string, unknown>, okMsg: string) {
  const { supabase } = await requireRole("KELURAHAN");
  const id = str(form, "id");
  const path = `/kelurahan/pengajuan/${id}`;
  if (!isUuid(id)) back("/kelurahan", "err", "Pengajuan tidak ditemukan.");
  const { error } = await supabase.rpc(fn, args(id));
  if (error) back(path, "err", dbMessage(error));
  revalidatePath(path);
  back(path, "ok", okMsg);
}

export async function reviewAction(form: FormData) {
  return run(form, "kelurahan_review", (id) => ({ p_id: id, p_decision: str(form, "decision"), p_catatan: optStr(form, "catatan"), p_rka: optStr(form, "rka") }), "Keputusan pemeriksaan tercatat dan inovator telah diberi tahu.");
}

export async function transferAction(form: FormData) {
  return run(form, "record_transfer", (id) => ({ p_id: id, p_tahap: str(form, "tahap"), p_nominal: int(form, "nominal"), p_bukti_path: str(form, "bukti"), p_catatan: optStr(form, "catatan") }), "Bukti transfer tercatat. Uang tidak melalui aplikasi; website hanya menyimpan bukti.");
}

export async function decideTestAction(form: FormData) {
  return run(form, "lurah_decide_test", (id) => ({ p_id: id, p_decision: str(form, "decision"), p_catatan: optStr(form, "catatan") }), "Keputusan pasca uji tercatat.");
}

export async function validateHandoverAction(form: FormData) {
  return run(form, "validate_handover", (id) => ({ p_id: id, p_valid: str(form, "valid") === "ya", p_catatan: optStr(form, "catatan") }), "Validasi serah terima tercatat.");
}

export async function cancelAction(form: FormData) {
  return run(form, "kelurahan_cancel", (id) => ({ p_id: id, p_alasan: str(form, "alasan") }), "Proyek dibatalkan. Alasan audit tercatat.");
}

export async function extendAction(form: FormData) {
  return run(form, "extend_test", (id) => ({ p_id: id }), "Masa uji diperpanjang 7 hari (satu kali).");
}

export async function disputeAction(form: FormData) {
  return run(form, "report_dispute", (id) => ({ p_id: id, p_alasan: str(form, "alasan") }), "Lapor Kendala dikirim ke Admin BRIDA.");
}
