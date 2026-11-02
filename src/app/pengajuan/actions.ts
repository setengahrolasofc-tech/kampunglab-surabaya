"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/admin/validation.mjs";
import { validateDraftDocument, draftChecklist } from "@/lib/drafts/schema.mjs";
import type { DraftFormState } from "@/lib/drafts/types";
import type { Json } from "@/lib/supabase/database.types";

const failure = (message: string) => ({ error: message });
const databaseError = (message: string) => ({ error: ({
  SESSION_REQUIRED: "Sesi tidak lagi berlaku. Masuk kembali sebelum menyimpan.",
  BUDGET_DETAILS_REQUIRED: "Rincian RAB lama masih tersimpan. Salin perubahanmu, lalu buka ulang editor terbaru; rincian tidak boleh hilang saat menyimpan.",
  DRAFT_LIMIT: "Satu akun maksimal memiliki 3 pengajuan. Selesaikan atau gunakan salah satu pengajuan yang sudah ada.",
  DOMICILE_REQUIRED: "Lengkapi wilayah domisilimu terlebih dahulu.",
  INVALID_TERRITORY: "Pilih RT yang tersedia di bawah RW dan kelurahan yang sesuai.",
  INVALID_THEME: "Pengaturan tema program belum sesuai. Hubungi pengelola.",
  DRAFT_CONFLICT: "Draf sudah berubah sejak halaman ini dibuka. Isianmu di sini tetap ada. Simpan salinan perubahanmu, lalu muat ulang draf sebelum menyimpan kembali.",
  DRAFT_UNAVAILABLE: "Draf tidak ditemukan atau tidak dapat diakses oleh akunmu.",
} as Record<string,string>)[message] ?? "Penyimpanan belum dapat dikonfirmasi. Isianmu tetap ada. Periksa draf tersimpan di tab baru sebelum mencoba lagi." });

export async function saveDomicile(_state: DraftFormState, form: FormData): Promise<DraftFormState> {
  const { supabase } = await requireUser();
  const rt = form.get("rt_id");
  if (!isUuid(rt)) return { errors: { rt_id: "Pilih kelurahan, RW, dan RT yang sesuai." } };
  const { error } = await supabase.rpc("write_innovation_draft", { operation: "domicile", payload: { rt_id: String(rt) } }).abortSignal(AbortSignal.timeout(45000));
  if (error) return databaseError(error.message);
  revalidatePath("/profil/wilayah"); revalidatePath("/dashboard"); revalidatePath("/pengajuan");
  return { saved: true };
}
export async function createDraft(_state: DraftFormState, form: FormData): Promise<DraftFormState> {
  const { supabase } = await requireUser();
  const requestId = form.get("request_id");
  if (!isUuid(requestId)) return failure("Muat ulang halaman sebelum membuat draf.");
  const { data, error } = await supabase.rpc("write_innovation_draft", { operation: "create", payload: { request_id: String(requestId) } }).abortSignal(AbortSignal.timeout(45000));
  if (error) return databaseError(error.message);
  const id = data && typeof data === "object" && !Array.isArray(data) ? data.id : null;
  if (!isUuid(id)) return failure("Draf belum dapat dibuka. Periksa daftar pengajuanmu sebelum mencoba lagi.");
  revalidatePath("/pengajuan");
  redirect(`/pengajuan/${id}`);
}
export async function saveDraft(_state: DraftFormState, form: FormData): Promise<DraftFormState> {
  const { supabase } = await requireUser();
  const id = form.get("id"), raw = form.get("document"), revision = String(form.get("revision") ?? ""), step = String(form.get("step") ?? "");
  if (!isUuid(id) || !/^(0|[1-9]\d{0,8})$/.test(revision) || !/^[1-4]$/.test(step)) return failure("Data penyimpanan tidak valid. Isianmu tetap ada; muat ulang setelah menyimpan salinan perubahan.");
  if (typeof raw !== "string" || new TextEncoder().encode(raw).length > 131072) return failure("Data draf terlalu besar atau tidak valid.");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return failure("Data draf tidak valid."); }
  const validated = validateDraftDocument(parsed);
  if (Object.keys(validated.errors).length) return { errors: validated.errors };
  // Warga tidak memilih tema. Database tetap mewajibkan tema aktif untuk lampiran dan simulasi,
  // jadi tema yang sudah ada dipertahankan bila masih aktif, selain itu dipakai tema bawaan aktif pertama.
  const themes = await supabase.from("innovation_themes").select("id,is_demo").eq("active", true).order("code");
  if (themes.error) return failure("Pengaturan program belum dapat dimuat. Isianmu tetap ada; coba simpan lagi.");
  const current = validated.data.innovation.theme_id;
  const activeThemes = themes.data ?? [];
  if (!activeThemes.some(theme => theme.id === current)) {
    const fallback = activeThemes.find(theme => theme.is_demo);
    if (!fallback) return failure("Tema bawaan program belum tersedia, jadi draf belum dapat disimpan. Hubungi pengelola.");
    validated.data.innovation.theme_id = fallback.id;
  }
  const { data, error } = await supabase.rpc("write_innovation_draft", { operation: "save", payload: {
    id: String(id), revision: Number(revision), step: form.get("intent")==="continue" && (Number(step)>1 || draftChecklist(validated.data)[0]) ? Math.min(4,Number(step)+1) : Number(step), document: validated.data as unknown as Json,
  } }).abortSignal(AbortSignal.timeout(45000));
  if (error) return databaseError(error.message);
  const result = data as { revision: number; updated_at: string };
  revalidatePath("/pengajuan");
  revalidatePath(`/pengajuan/${id}`);
  return { saved: true, version: result.revision, updatedAt: result.updated_at, document: validated.data };
}
