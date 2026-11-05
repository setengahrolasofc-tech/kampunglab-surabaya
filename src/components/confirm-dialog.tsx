"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./ui";

/** Dialog konfirmasi bergaya KampungLab (pengganti window.confirm). Tutup dengan Esc, klik latar, atau Batal. */
export function ConfirmDialog({ open, title = "Konfirmasi", message, confirmLabel = "Ya, lanjutkan", cancelLabel = "Batal", tone = "normal", onConfirm, onCancel }: {
  open: boolean; title?: string; message: ReactNode; confirmLabel?: string; cancelLabel?: string; tone?: "normal" | "bahaya";
  onConfirm: () => void; onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onCancel]);
  // Dialog hanya terbuka setelah klik pengguna, jadi selalu berjalan di browser (aman untuk portal).
  if (!open) return null;
  const danger = tone === "bahaya";
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-indigo-space/60 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="kl-dialog-title" aria-describedby="kl-dialog-desc"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-indigo-space/10">
        <div className={cx("h-1.5 w-full", danger ? "bg-red-600" : "bg-gradient-to-r from-teal-deep via-[#439A86] to-gold")} />
        <div className="flex gap-4 p-6">
          <span aria-hidden className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-bold", danger ? "bg-red-100 text-red-700" : "bg-gold/40 text-indigo-space")}>{danger ? "!" : "?"}</span>
          <div className="min-w-0">
            <h2 id="kl-dialog-title" className="text-lg font-bold text-indigo-space">{title}</h2>
            <p id="kl-dialog-desc" className="mt-1 text-sm leading-relaxed text-indigo-space/80">{message}</p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 bg-celadon/25 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded-lg border border-indigo-space/25 bg-white px-4 py-2 text-sm font-semibold text-indigo-space hover:bg-celadon/40">{cancelLabel}</button>
          <button ref={confirmRef} type="button" onClick={onConfirm}
            className={cx("rounded-lg px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2", danger ? "bg-red-700 hover:bg-red-800 focus:ring-red-600" : "bg-teal-deep hover:bg-teal-deep/90 focus:ring-teal-deep")}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
