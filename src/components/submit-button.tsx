"use client";
import { useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ConfirmDialog } from "./confirm-dialog";
import { btnDanger, btnPrimary, cx } from "./ui";

export function SubmitButton({ children, pending, className, confirm, confirmTitle, confirmLabel }: {
  children: ReactNode; pending?: ReactNode; className?: string; confirm?: string; confirmTitle?: string; confirmLabel?: string;
}) {
  const { pending: isPending } = useFormStatus();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const danger = className === btnDanger;
  return (
    <>
      <button
        ref={ref}
        type="submit"
        disabled={isPending}
        className={cx(className ?? btnPrimary)}
        onClick={confirm ? (e) => { e.preventDefault(); setOpen(true); } : undefined}
      >
        {isPending ? (pending ?? "Memproses…") : children}
      </button>
      {confirm && (
        <ConfirmDialog open={open} message={confirm} tone={danger ? "bahaya" : "normal"}
          title={confirmTitle ?? (danger ? "Konfirmasi tindakan" : "Lanjutkan?")} confirmLabel={confirmLabel ?? (danger ? "Ya, lakukan" : "Ya, lanjutkan")}
          onCancel={() => setOpen(false)}
          onConfirm={() => { setOpen(false); ref.current?.form?.requestSubmit(); }} />
      )}
    </>
  );
}
