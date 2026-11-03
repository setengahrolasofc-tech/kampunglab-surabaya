"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { dbMessage } from "@/lib/errors";
import { back } from "@/lib/flash";
import { int, isUuid, optStr, str } from "@/lib/form";

const TIPE = ["PROGRAM", "PRODUK", "PROTOTIPE", "TEKNOLOGI"];
const JENJANG = ["SMA_SMK", "MAHASISWA_DIPLOMA_S1", "PASCASARJANA", "WARGA_UMUM", "SMP_KE_BAWAH"];
const base = (id: string) => `/dashboard/pengajuan/${id}`;

export async function createDraftAction(form: FormData) {
  const { supabase, userId, profile } = await requireRole("INNOVATOR");
  const problemId = str(form, "problem_board_id");
  let kelurahanId = "";
  let problem: string | null = null;
  if (isUuid(problemId)) {
    const { data } = await supabase.from("problem_boards").select("id, kelurahan_id, status").eq("id", problemId).maybeSingle();
    if (data && data.status === "OPEN") { kelurahanId = data.kelurahan_id; problem = data.id; }
  }
  if (!kelurahanId) {
    const { data } = await supabase.from("master_kelurahan").select("id").eq("kecamatan", str(form, "kecamatan")).eq("kelurahan", str(form, "kelurahan")).maybeSingle();
    kelurahanId = data?.id ?? "";
  }
  if (!kelurahanId) back("/dashboard/pengajuan/baru", "err", "Pilih kelurahan lokasi uji (atau pilih masalah dari Papan Masalah).");
  const jenjang = JENJANG.includes(str(form, "jenjang")) ? str(form, "jenjang") : "WARGA_UMUM";
  if (jenjang === "SMP_KE_BAWAH") back("/dashboard/pengajuan/baru", "err", "Pelajar SMP/SD ke bawah tidak dapat menjadi ketua tim (minimal SMA/SMK).");
  const tipe = TIPE.includes(str(form, "tipe_inovasi")) ? str(form, "tipe_inovasi") : "PROGRAM";
  const { data: created, error } = await supabase.from("innovations")
    .insert({ leader_user_id: userId, kelurahan_target_id: kelurahanId, problem_board_id: problem, tipe_inovasi: tipe, judul: str(form, "judul").slice(0, 160) })
    .select("id").single();
  if (error || !created) back("/dashboard/pengajuan/baru", "err", dbMessage(error, "Draft belum dapat dibuat."));
  const m = await supabase.from("innovation_members").insert({
    innovation_id: created.id, nama_anggota: profile.name || "Ketua Tim", peran_dalam_tim: "Ketua tim", institusi_asal: profile.institusi ?? "",
    kota_domisili: profile.kota_domisili ?? "", jenjang_pendidikan: jenjang, is_ketua: true, urutan: 1,
  });
  if (m.error) back(base(created.id), "err", dbMessage(m.error, "Draft dibuat, tetapi data ketua belum tersimpan. Tambahkan lewat bagian Tim."));
  back(base(created.id), "ok", "Draft dibuat. Lengkapi data, tim, dan dokumen, lalu kirim ke Kelurahan.");
}

export async function saveDraftAction(form: FormData) {
  const { supabase } = await requireRole("INNOVATOR");
  const id = str(form, "id");
  if (!isUuid(id)) back("/dashboard", "err", "Pengajuan tidak ditemukan.");
  const tipe = TIPE.includes(str(form, "tipe_inovasi")) ? str(form, "tipe_inovasi") : "PROGRAM";
  const nz = (k: string) => { const n = int(form, k); return Number.isFinite(n) && n >= 0 ? n : 0; };
  const perawatan = int(form, "rencana_perawatan_bulan");
  const { data, error } = await supabase.from("innovations").update({
    judul: str(form, "judul"), tipe_inovasi: tipe, ringkasan: str(form, "ringkasan"), masalah: str(form, "masalah"), tujuan: str(form, "tujuan"),
    target_pengguna: str(form, "target_pengguna"), target_rt_rw: str(form, "target_rt_rw"),
    total_rab: nz("total_rab"), rab_tak_terduga: nz("rab_tak_terduga"), rab_honor: nz("rab_honor"),
    rencana_perawatan_bulan: Number.isFinite(perawatan) && perawatan > 0 ? perawatan : null,
    prd_url: optStr(form, "prd_url"), rab_url: optStr(form, "rab_url"), surat_keaslian_url: optStr(form, "surat_keaslian_url"), surat_kesepakatan_url: optStr(form, "surat_kesepakatan_url"),
  }).eq("id", id).select("id");
  if (error) back(base(id), "err", dbMessage(error, "Perubahan belum dapat disimpan. Periksa panjang isian dan nominal."));
  if (!data?.length) back(base(id), "err", "Pengajuan tidak dapat diubah pada status ini.");
  revalidatePath(base(id));
  back(base(id), "ok", "Perubahan disimpan.");
}

export async function addMemberAction(form: FormData) {
  const { supabase } = await requireRole("INNOVATOR");
  const id = str(form, "id");
  if (!isUuid(id)) back("/dashboard", "err", "Pengajuan tidak ditemukan.");
  const jenjang = str(form, "jenjang_pendidikan");
  if (jenjang === "SMP_KE_BAWAH") back(base(id), "err", "Pelajar SMP/SD ke bawah tidak dapat menjadi anggota tim (minimal SMA/SMK).");
  const { count } = await supabase.from("innovation_members").select("id", { count: "exact", head: true }).eq("innovation_id", id);
  const { error } = await supabase.from("innovation_members").insert({
    innovation_id: id, nama_anggota: str(form, "nama_anggota"), peran_dalam_tim: str(form, "peran_dalam_tim"), institusi_asal: str(form, "institusi_asal"),
    kota_domisili: str(form, "kota_domisili"), jenjang_pendidikan: JENJANG.includes(jenjang) ? jenjang : "WARGA_UMUM", is_ketua: false, urutan: (count ?? 0) + 1,
  });
  if (error) back(base(id), "err", dbMessage(error, "Anggota belum dapat ditambahkan. Nama minimal 2 karakter."));
  back(base(id), "ok", "Anggota ditambahkan.");
}

export async function removeMemberAction(form: FormData) {
  const { supabase } = await requireRole("INNOVATOR");
  const id = str(form, "id"), member = str(form, "member");
  if (!isUuid(id) || !isUuid(member)) back("/dashboard", "err", "Data tidak ditemukan.");
  const { error } = await supabase.from("innovation_members").delete().eq("id", member).eq("is_ketua", false);
  if (error) back(base(id), "err", dbMessage(error));
  back(base(id), "ok", "Anggota dihapus.");
}

export async function deleteDraftAction(form: FormData) {
  const { supabase } = await requireRole("INNOVATOR");
  const id = str(form, "id");
  if (!isUuid(id)) back("/dashboard", "err", "Pengajuan tidak ditemukan.");
  const { error } = await supabase.from("innovations").delete().eq("id", id);
  if (error) back(base(id), "err", dbMessage(error, "Hanya draft yang dapat dihapus."));
  back("/dashboard", "ok", "Draft dihapus.");
}

async function rpc(form: FormData, fn: string, args: (id: string) => Record<string, unknown>, okMsg: string, dest?: (id: string) => string) {
  const { supabase } = await requireRole("INNOVATOR");
  const id = str(form, "id");
  if (!isUuid(id)) back("/dashboard", "err", "Pengajuan tidak ditemukan.");
  const to = dest ? dest(id) : base(id);
  const { error } = await supabase.rpc(fn, args(id));
  if (error) back(to, "err", dbMessage(error));
  revalidatePath(base(id));
  back(to, "ok", okMsg);
}

export async function submitAction(form: FormData) {
  return rpc(form, "submit_innovation", (id) => ({ p_id: id }), "Pengajuan dikirim. Anda akan diberi notifikasi saat ada keputusan.");
}
export async function readyForTestAction(form: FormData) {
  return rpc(form, "ready_for_test", (id) => ({ p_id: id }), "Uji warga dimulai. Unduh Poster QR dan pasang di lokasi uji.", (id) => `${base(id)}/uji`);
}
export async function startRetestAction(form: FormData) {
  return rpc(form, "start_retest", (id) => ({ p_id: id }), "Uji ulang dimulai (14 hari).", (id) => `${base(id)}/uji`);
}
export async function extendAction(form: FormData) {
  return rpc(form, "extend_test", (id) => ({ p_id: id }), "Masa uji diperpanjang 7 hari (satu kali).", (id) => `${base(id)}/uji`);
}
export async function handoverAction(form: FormData) {
  return rpc(form, "submit_handover", (id) => ({ p_id: id, p_bast: str(form, "bast"), p_panduan: str(form, "panduan"), p_lpj: str(form, "lpj") }), "Berkas serah terima dikirim ke Kelurahan untuk divalidasi.", (id) => `${base(id)}/serah-terima`);
}
export async function appealAction(form: FormData) {
  return rpc(form, "innovator_appeal", (id) => ({ p_id: id, p_alasan: str(form, "alasan"), p_lampiran: optStr(form, "lampiran") }), "Banding dikirim ke Admin BRIDA.", (id) => `${base(id)}/bantuan`);
}
export async function disputeAction(form: FormData) {
  return rpc(form, "report_dispute", (id) => ({ p_id: id, p_alasan: str(form, "alasan") }), "Lapor Kendala dikirim ke Admin BRIDA.", (id) => `${base(id)}/bantuan`);
}

export async function addLogbookAction(form: FormData) {
  const { supabase } = await requireRole("INNOVATOR");
  const id = str(form, "id");
  if (!isUuid(id)) back("/dashboard", "err", "Pengajuan tidak ditemukan.");
  const nominal = int(form, "nominal");
  const { error } = await supabase.rpc("add_logbook_entry", {
    p_id: id, p_deskripsi: str(form, "deskripsi"), p_tanggal: optStr(form, "tanggal"), p_nominal: Number.isFinite(nominal) ? nominal : 0,
    p_nota_path: optStr(form, "nota"), p_foto_path: optStr(form, "foto"),
  });
  if (error) back(`${base(id)}/logbook`, "err", dbMessage(error));
  revalidatePath(`${base(id)}/logbook`);
  back(`${base(id)}/logbook`, "ok", "Entri Logbook ditambahkan.");
}
