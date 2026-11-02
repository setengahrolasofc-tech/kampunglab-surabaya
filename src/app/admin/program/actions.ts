"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProgramAdmin } from "@/lib/admin/access";
import { isUuid } from "@/lib/admin/validation.mjs";
import { validateProgramForm } from "@/lib/programs/validation";
import type { ProgramFormState } from "@/lib/programs/types";
async function mutate(operation: "create" | "revise", form: FormData): Promise<ProgramFormState> {
  const { supabase } = await requireProgramAdmin();
  const input = validateProgramForm(form, operation);
  if (Object.keys(input.errors).length) return { errors: input.errors };
  const result = await supabase.rpc("program_draft_workflow", { operation, payload: input.payload })
    .abortSignal(AbortSignal.timeout(30000)).then(value => value, () => null);
  if (!result || result.error) {
    const messages: Record<string, string> = {
      SESSION_REQUIRED: "Sesi berakhir. Masuk kembali sebelum menyimpan.", ADMIN_REQUIRED: "Diperlukan admin program yang masih berlaku.",
      PROGRAM_DRAFT_UNAVAILABLE: "Draf tidak tersedia. Periksa daftar terbaru.", PROGRAM_CODE_EXISTS: "Kode sudah dipakai. Buka draf yang ada atau pilih kode lain.",
      PROGRAM_CODE_IMMUTABLE: "Kode draf tetap sejak dibuat. Gunakan kode yang tertera pada halaman terbaru.",
      PROGRAM_VERSION_CONFLICT: "Ada versi lebih baru dari tab atau admin lain. Periksa versi terbaru di tab baru sebelum menyusun ulang perubahan.",
      PROGRAM_REQUEST_CONFLICT: "Kode permintaan ini sudah tercatat dengan isi berbeda. Periksa riwayat sebelum memulai permintaan baru.",
      NO_PROGRAM_CHANGE: "Belum ada perubahan data draf. Versi baru dibuat ketika ada isian yang berubah.",
      INVALID_PROGRAM_PROPOSAL: "Periksa tanggal, panjang isian dan pilihan usulan. Draf belum disimpan.",
    };
    return { error: messages[result?.error?.message ?? ""] ?? "Hasil penyimpanan belum dapat dipastikan. Input tetap ada; periksa riwayat di tab baru. Aman mengulang permintaan yang sama tanpa mengubah isinya." };
  }
  const saved = result.data as { id?: string; version?: number } | null;
  if (!saved || !isUuid(saved.id) || !Number.isInteger(saved.version) || Number(saved.version) < 1) return { error: "Hasil belum dapat dipastikan. Periksa daftar dan riwayat draf." };
  revalidatePath("/admin/program"); revalidatePath("/admin/program/[id]", "page");
  redirect(`/admin/program/${saved.id}?status=disimpan&version=${saved.version}`);
}
export async function createProgramDraft(_state: ProgramFormState, form: FormData) { return mutate("create", form); }
export async function reviseProgramDraft(_state: ProgramFormState, form: FormData) { return mutate("revise", form); }
