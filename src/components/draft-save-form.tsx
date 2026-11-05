"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { saveAndSubmitAction, saveDraftStateAction, type DraftResult } from "@/app/dashboard/actions";
import { ConfirmDialog } from "./confirm-dialog";
import { Alert, btnOutline, btnPrimary } from "./ui";

/**
 * Formulir draft yang tidak menghapus isian: dikirim lewat fetch (bukan form action yang mereset kolom),
 * jadi bila ada kesalahan semua teks dan berkas yang sudah diunggah tetap di layar. Pesan tampil di bawah tombol.
 */
export function DraftSaveForm({ id, children }: { id: string; children: ReactNode }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<DraftResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState<"save" | "send" | null>(null);

  function run(kind: "save" | "send") {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    setBusy(kind); setResult(null);
    start(async () => {
      let r: DraftResult;
      try { r = await (kind === "send" ? saveAndSubmitAction(data) : saveDraftStateAction(data)); }
      catch { r = { ok: false, message: "Terjadi kendala jaringan. Isian Anda masih ada di layar; coba lagi." }; }
      setResult(r); setBusy(null);
      if (r.ok && r.redirectTo) router.push(r.redirectTo);
      else if (r.ok) router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={(e) => { e.preventDefault(); run("save"); }} className="space-y-6 lg:col-span-2">
      <input type="hidden" name="id" value={id} />
      {children}
      {result && <div role="status" aria-live="polite"><Alert tone={result.ok ? "sukses" : "bahaya"}>{result.message}</Alert></div>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>{pending && busy === "save" ? "Menyimpan…" : "Simpan draft"}</button>
        <button type="button" disabled={pending} onClick={() => setConfirmOpen(true)} className={btnOutline}>{pending && busy === "send" ? "Mengirim…" : "Simpan & kirim ke Kelurahan"}</button>
      </div>
      <ConfirmDialog open={confirmOpen} title="Kirim pengajuan ke Kelurahan?"
        message="Isian akan disimpan lebih dulu. Setelah dikirim, data tidak dapat diubah sampai ada keputusan dari Kelurahan."
        confirmLabel="Ya, kirim" onCancel={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); run("send"); }} />
    </form>
  );
}
