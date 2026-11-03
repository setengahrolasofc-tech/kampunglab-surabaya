"use client";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { btnPrimary, cx } from "./ui";

export function SubmitButton({ children, pending, className, confirm }: { children: ReactNode; pending?: ReactNode; className?: string; confirm?: string }) {
  const { pending: isPending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={isPending}
      className={cx(className ?? btnPrimary)}
      onClick={confirm ? (e) => { if (!window.confirm(confirm)) e.preventDefault(); } : undefined}
    >
      {isPending ? (pending ?? "Memproses…") : children}
    </button>
  );
}
