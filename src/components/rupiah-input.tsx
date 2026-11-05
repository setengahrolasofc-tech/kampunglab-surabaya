"use client";
import { useState } from "react";
import { digitsOnly, formatRibuan } from "@/lib/domain/format.mjs";
import { cx, inputCls } from "./ui";

/**
 * Isian uang: tampil "Rp 1.500.000" (titik tiap tiga angka), nol di depan dibuang otomatis, nol awal tidak mengganggu ketikan.
 * Yang dikirim ke server hanya angka murni lewat input tersembunyi `name`.
 */
export function RupiahInput({ id, name, defaultValue, className, "aria-label": ariaLabel }: {
  id: string; name: string; defaultValue?: number | string | null; className?: string; "aria-label"?: string;
}) {
  const [raw, setRaw] = useState(digitsOnly(defaultValue));
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-indigo-space/60">Rp</span>
      <input type="hidden" name={name} value={raw} />
      <input
        id={id} inputMode="numeric" autoComplete="off" placeholder="0" aria-label={ariaLabel}
        value={formatRibuan(raw)}
        onChange={(e) => setRaw(digitsOnly(e.target.value))}
        onFocus={(e) => e.currentTarget.select()}
        className={cx(inputCls, "pl-9 text-right tabular-nums", className)}
      />
    </div>
  );
}
