"use client";
import { btnPrimary } from "./ui";

export function PrintButton({ label = "Cetak / simpan PDF" }: { label?: string }) {
  return <button type="button" onClick={() => window.print()} className={btnPrimary}>{label}</button>;
}
