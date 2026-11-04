"use client";
import { useState, type ChangeEvent } from "react";
import { cx, inputCls } from "./ui";

/**
 * Isian password dengan tombol mata untuk menampilkan atau menyembunyikan isinya.
 * Mata terbuka = password sedang tersembunyi (klik untuk menampilkan); mata tercoret = sedang terlihat (klik untuk menutup).
 */
export function PasswordInput({ id, name, autoComplete, value, onChange, className }: {
  id: string; name: string; autoComplete: "current-password" | "new-password";
  value?: string; onChange?: (e: ChangeEvent<HTMLInputElement>) => void; className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id} name={name} type={show ? "text" : "password"} autoComplete={autoComplete}
        value={value} onChange={onChange} className={cx(inputCls, "pr-11", className)}
        autoCapitalize="none" autoCorrect="off" spellCheck={false}
      />
      <button
        type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"} title={show ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-indigo-space/60 hover:text-teal-deep focus-visible:text-teal-deep"
      >
        {show ? (
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><path d="m1 1 22 22" />
          </svg>
        ) : (
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
