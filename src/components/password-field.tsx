"use client";

import { useState, type ReactNode } from "react";
import { PASSWORD_RULES } from "@/lib/auth/validation.mjs";

export function PasswordInput({ id, name, label, autoComplete, value, onChange, error, success, describedBy, aside }: {
  id: string; name: string; label: string; autoComplete: "current-password" | "new-password";
  value: string; onChange: (value: string) => void; error?: string; success?: string; describedBy?: string; aside?: ReactNode;
}) {
  const [shown, setShown] = useState(false);
  const described = [error ? `${id}-error` : "", describedBy ?? ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-semibold">{label}</label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id} name={name} required maxLength={72} autoComplete={autoComplete}
          type={shown ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)} aria-describedby={described}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-24 text-base text-slate-900 aria-invalid:border-red-600"
        />
        <button
          type="button" onClick={() => setShown((current) => !current)} aria-pressed={shown}
          aria-label={shown ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-900 hover:underline"
        >
          {shown ? "Sembunyikan" : "Lihat"}
        </button>
      </div>
      <div aria-live="polite">
        {error ? <p id={`${id}-error`} className="mt-2 text-sm text-red-800">{error}</p> : null}
        {!error && success ? <p className="mt-2 text-sm text-emerald-800"><span aria-hidden="true">✓ </span>{success}</p> : null}
      </div>
    </div>
  );
}

/** Daftar aturan password; status ditulis dengan kata, bukan hanya warna. */
export function PasswordRules({ id, value }: { id: string; value: string }) {
  return (
    <ul id={id} aria-live="polite" className="mt-3 space-y-1 text-sm leading-6">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li key={rule.id} className={met ? "text-emerald-800" : "text-slate-600"}>
            <span aria-hidden="true">{met ? "✓" : "○"} </span>
            {met ? "Terpenuhi" : "Belum terpenuhi"}: {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
