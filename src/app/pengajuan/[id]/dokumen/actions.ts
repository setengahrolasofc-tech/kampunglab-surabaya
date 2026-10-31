"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/admin/validation.mjs";
import { documentSlots } from "@/lib/drafts/schema.mjs";
import { edgeFileError, fileErrorMessage } from "@/lib/attachments/errors";
import { checkTemplateDocument, type CheckContext } from "@/lib/ai/document-check";
import type { DocumentSlotKey, DocumentUploadState } from "@/lib/drafts/types";

const MAX_FILE = 3 * 1024 * 1024;
const mimeByExtension: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const short = (value: unknown, max: number) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

function parseContext(raw: FormDataEntryValue | null): CheckContext {
  let data: Record<string, unknown> = {};
  try { if (typeof raw === "string" && raw.length < 8000) data = JSON.parse(raw); } catch { /* konteks opsional */ }
  const team = Array.isArray(data.team) ? data.team.slice(0, 20).map(item => short(item, 160)).filter(Boolean) : [];
  return { title: short(data.title, 160), form: short(data.form, 24), maturity: short(data.maturity, 24), team, area: short(data.area, 300) };
}

/**
 * Mengunggah dokumen bertemplate sebagai lampiran pendukung privat (jalur yang sama dengan halaman lampiran),
 * memeriksanya dengan AI, lalu mengembalikan penunjuk + hasil. Penunjuk baru tersimpan ke draf saat pengaju menekan Simpan.
 */
export async function uploadTemplateDocument(_state: DocumentUploadState, form: FormData): Promise<DocumentUploadState> {
  const { supabase } = await requireUser();
  const draftId = form.get("draft_id"), requestId = form.get("request_id"), file = form.get("file"), previousId = form.get("previous_id");
  const slotKey = String(form.get("slot") ?? "") as DocumentSlotKey;
  const slot = documentSlots.find(item => item.key === slotKey);
  if (!slot || !isUuid(draftId) || !isUuid(requestId) || !(file instanceof File) || file.size === 0) return { error: "Pilih berkas dan muat ulang halaman bila isian tidak tersedia." };
  if (file.size > MAX_FILE) return { error: fileErrorMessage("FILE_TOO_LARGE") };
  const context = parseContext(form.get("context"));
  if (!context.title) return { error: "Isi nama inovasi pada langkah 1 dan simpan draf sebelum mengunggah dokumen, supaya dokumen dapat dicocokkan dengan judulnya." };
  const extension = file.name.toLowerCase().split(".").at(-1) ?? "";
  const mime = mimeByExtension[extension];
  if (!mime) return { error: fileErrorMessage("INVALID_FILE") };
  // Label di nama berkas membantu petugas membedakan dokumen pada daftar lampiran pendukung.
  const prefix = `[${slot.tag}] `;
  const stem = file.name.normalize("NFC").replace(/[\u0000-\u001f\u007f/\\]/g, "_").replace(/\.[^.]*$/, "").trim().slice(0, 160 - prefix.length - extension.length - 1) || "dokumen";
  const renamed = new File([file], `${prefix}${stem}.${extension}`, { type: file.type });
  const body = new FormData();
  body.set("purpose", "supporting"); body.set("operation", "upload"); body.set("draft_id", String(draftId)); body.set("request_id", String(requestId)); body.set("file", renamed);
  const uploaded = await supabase.functions.invoke<{ id: string }>("private-attachments", { body, timeout: 60000 });
  if (uploaded.error) return { error: fileErrorMessage(await edgeFileError(uploaded.error)) };
  const id = uploaded.data?.id;
  if (!isUuid(id)) return { error: fileErrorMessage("UNKNOWN") };
  const check = await checkTemplateDocument(slotKey, { bytes: new Uint8Array(await file.arrayBuffer()), mime }, context);
  // Berkas pengganti: lepas berkas lama dari draf agar tidak ikut terkirim sebagai lampiran pendukung.
  if (isUuid(previousId) && previousId !== id) {
    await supabase.rpc("attachment_workflow", { operation: "archive", payload: { id: String(previousId), draft_id: String(draftId) } }).abortSignal(AbortSignal.timeout(20000));
  }
  revalidatePath(`/pengajuan/${draftId}`); revalidatePath(`/pengajuan/${draftId}/lampiran`);
  return { slot: { attachment_id: String(id).toLowerCase(), file_name: renamed.name, check }, nextRequestId: randomUUID() };
}
