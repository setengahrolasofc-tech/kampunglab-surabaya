"use client";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadTemplateDocument } from "@/app/pengajuan/[id]/dokumen/actions";
import { documentSlots } from "@/lib/drafts/schema.mjs";
import type { DocumentSlotKey, DocumentUploadState, DraftDocumentSlot } from "@/lib/drafts/types";

const statusView: Record<string, { label: string; tone: string }> = {
  lulus: { label: "Lolos pemeriksaan otomatis", tone: "bg-emerald-100 text-emerald-950" },
  perlu_dicek: { label: "Perlu kamu cek", tone: "bg-amber-100 text-amber-950" },
  perlu_perbaikan: { label: "Perlu diperbaiki sebelum dikirim", tone: "bg-red-100 text-red-900" },
  tidak_diperiksa: { label: "Tersimpan, belum diperiksa AI", tone: "bg-slate-100 text-slate-800" },
};
const signatureLabel: Record<string, string> = { ada: "Tanda tangan terdeteksi", tidak_ada: "Tanda tangan tidak ditemukan", tidak_jelas: "Tanda tangan tidak jelas", tidak_perlu: "" };

/** Unggah satu dokumen bertemplate, lalu tampilkan hasil pemeriksaan. Penunjuk baru tersimpan ke draf lewat tombol Simpan draf. */
export function DocumentSlot({ draftId, slotKey, value, title, context, blockedReason, readyFileIds, onChange }: {
  draftId: string; slotKey: DocumentSlotKey; value: DraftDocumentSlot | undefined; title: string; context: Record<string, unknown>;
  blockedReason: string | null; readyFileIds: string[]; onChange: (slot: DraftDocumentSlot) => void;
}) {
  const slot = documentSlots.find(item => item.key === slotKey)!;
  const router = useRouter();
  const [initialRequestId] = useState(() => crypto.randomUUID());
  const fileInput = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState("");
  const [state, action, pending] = useActionState<DocumentUploadState, FormData>(uploadTemplateDocument, {});
  useEffect(() => {
    if (state.slot) { onChange(state.slot); router.refresh(); }
    // onChange berubah tiap render induk; efek hanya perlu jalan untuk hasil unggahan baru.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.slot]);
  const check = value?.check;
  const view = check ? statusView[check.status] ?? statusView.tidak_diperiksa : null;
  const known = !value || readyFileIds.includes(value.attachment_id) || value.attachment_id === state.slot?.attachment_id;
  const titleChanged = Boolean(check && check.checked_title !== title.trim());
  const id = `slot-${slotKey}`;
  // Bukan <form>: komponen ini berada di dalam formulir draf, dan form bersarang tidak valid.
  const submit = () => {
    const file = fileInput.current?.files?.[0];
    if (!file) { setClientError("Pilih berkas terlebih dahulu."); return; }
    setClientError("");
    const body = new FormData();
    body.set("draft_id", draftId); body.set("slot", slotKey); body.set("request_id", state.nextRequestId ?? initialRequestId);
    if (value) body.set("previous_id", value.attachment_id);
    body.set("context", JSON.stringify({ ...context, title })); body.set("file", file);
    startTransition(() => action(body));
  };
  return <div className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">Dokumen {slot.label}</h3><a href={`/templates/${slot.template}`} download className="text-sm font-semibold text-emerald-900 underline">Unduh template {slot.tag} (.docx)</a></div>
    <p className="text-sm leading-6 text-slate-600">Unduh template, isi di Word, {slot.signature ? "cetak lalu tanda tangani (atau bubuhkan tanda tangan digital), " : ""}ubah menjadi PDF atau foto/pindaian, lalu unggah di sini. Format PDF, JPEG, PNG, atau WebP, maksimal 3 MiB.</p>
    {value && check && view ? <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm leading-6">
      <p className="break-words font-semibold">{value.file_name}</p>
      <p><span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${view.tone}`}>{view.label}</span>{check.ai && signatureLabel[check.signature] ? <span className="ml-3 text-slate-700">{signatureLabel[check.signature]}</span> : null}</p>
      {check.summary ? <p className="text-slate-700">{check.summary}</p> : null}
      {check.issues.length ? <ul className="list-inside list-disc text-slate-800">{check.issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : null}
      {titleChanged ? <p role="alert" className="font-semibold text-red-800">Judul inovasi berubah sejak dokumen diperiksa (“{check.checked_title}”). Perbarui dokumen lalu unggah ulang.</p> : null}
      {!known ? <p role="alert" className="font-semibold text-red-800">Berkas ini sudah dilepas dari draf. Unggah ulang dokumen.</p> : null}
    </div> : <p className="rounded-xl border border-dashed p-4 text-sm text-slate-600">Belum ada dokumen {slot.label} yang diunggah.</p>}
    {clientError ? <p role="alert" className="text-sm text-red-800">{clientError}</p> : null}
    {state.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-900">{state.error}</p> : null}
    {blockedReason ? <p className="text-sm font-semibold text-amber-900">{blockedReason}</p> : null}
    <div className="space-y-3">
      <div className="space-y-3">
        <label htmlFor={id} className="block text-sm font-semibold">{value ? "Ganti dengan berkas baru" : "Pilih berkas"}</label>
        <input id={id} ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={pending || Boolean(blockedReason)} className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-900" />
        <button type="button" onClick={submit} disabled={pending || Boolean(blockedReason)} className="min-h-11 rounded-xl border border-emerald-900 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-50">{pending ? "Mengunggah dan memeriksa…" : value ? "Unggah ulang dan periksa" : "Unggah dan periksa"}</button>
      </div>
    </div>
    <p className="text-xs leading-5 text-slate-600">Saat diunggah, isi berkas dikirim ke layanan AI (Anthropic) untuk memeriksa jenis dokumen, kecocokan nama inovasi, tanda tangan, dan kelengkapan. Hasilnya hanya bantuan: bukan persetujuan, dan petugas tetap memeriksa dokumenmu. Jangan unggah data nyata selama prototipe DEMO.</p>
  </div>;
}
