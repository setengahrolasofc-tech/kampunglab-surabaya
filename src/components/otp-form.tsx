"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { resendOtp, verifyRecoveryOtp, verifySignupOtp } from "@/app/auth/actions";
import { OTP_LENGTH } from "@/lib/auth/validation.mjs";
import type { AuthActionState } from "@/lib/auth/types";

const COOLDOWN_SECONDS = 60;

export function OtpForm({ kind, email, onBack }: { kind: "signup" | "recovery"; email: string; onBack: () => void }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(kind === "signup" ? verifySignupOtp : verifyRecoveryOtp, {});
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ""));
  const [left, setLeft] = useState(COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [note, setNote] = useState<AuthActionState>({});
  const boxes = useRef<Array<HTMLInputElement | null>>([]);
  const tokenError = state.errors?.token;

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  function type(index: number, raw: string) {
    const chars = raw.replace(/\D/g, "").slice(0, OTP_LENGTH - index).split("");
    const next = [...digits];
    if (chars.length === 0) next[index] = "";
    chars.forEach((char, offset) => { next[index + offset] = char; });
    setDigits(next);
    if (chars.length) boxes.current[Math.min(index + chars.length, OTP_LENGTH - 1)]?.focus();
  }

  async function resend() {
    setResending(true);
    setNote(await resendOtp(kind, email));
    setResending(false);
    setLeft(COOLDOWN_SECONDS);
  }

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="rounded-sm text-sm font-semibold text-emerald-900 hover:underline">← Ubah email</button>
      <div>
        <h2 className="text-xl font-bold">Masukkan kode OTP</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Kode {OTP_LENGTH} digit dikirim ke <strong className="break-all text-slate-900">{email}</strong>. Periksa juga folder spam.
        </p>
      </div>
      {state.error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{state.error}</p> : null}
      <form action={action} noValidate className="space-y-5">
        <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
          <legend className="mb-2 block text-sm font-semibold">Kode OTP</legend>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${OTP_LENGTH}, minmax(0, 1fr))` }}>
            {digits.map((digit, index) => (
              <input
                key={index} ref={(element) => { boxes.current[index] = element; }}
                inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} value={digit}
                aria-label={`Digit ${index + 1} dari ${OTP_LENGTH}`} aria-invalid={Boolean(tokenError)}
                aria-describedby={tokenError ? "otp-error" : undefined}
                onChange={(event) => type(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digit && index > 0) {
                    event.preventDefault();
                    setDigits((current) => current.map((value, position) => (position === index - 1 ? "" : value)));
                    boxes.current[index - 1]?.focus();
                  }
                }}
                onFocus={(event) => event.target.select()}
                className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-0 py-3 text-center text-xl font-bold text-slate-900 aria-invalid:border-red-600"
              />
            ))}
          </div>
          <input type="hidden" name="token" value={digits.join("")} />
          <input type="hidden" name="email" value={email} />
          {tokenError ? <p id="otp-error" className="text-sm text-red-800">{tokenError}</p> : null}
          <button type="submit" className="min-h-12 w-full rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait">
            {pending ? "Memeriksa…" : kind === "signup" ? "Verifikasi dan buat akun" : "Verifikasi kode"}
          </button>
        </fieldset>
      </form>
      <div className="text-sm leading-6 text-slate-600">
        {left > 0 ? (
          <p>Kirim ulang kode dalam {left} detik.</p>
        ) : (
          <button type="button" onClick={resend} disabled={resending} className="rounded-sm font-semibold text-emerald-900 hover:underline disabled:cursor-wait">
            {resending ? "Mengirim…" : "Kirim ulang kode"}
          </button>
        )}
        {note.error ? <p role="alert" className="mt-2 text-red-800">{note.error}</p> : null}
        {note.message ? <p role="status" className="mt-2 text-emerald-900">{note.message}</p> : null}
      </div>
    </div>
  );
}
