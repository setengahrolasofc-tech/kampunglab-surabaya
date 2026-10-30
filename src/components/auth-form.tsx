"use client";

import { useActionState, useState } from "react";
import { login, signup, requestPasswordReset, updatePassword, updateProfile } from "@/app/auth/actions";
import type { AuthActionState, AuthMode } from "@/lib/auth/types";

const actions = { login, signup, reset: requestPasswordReset, password: updatePassword, profile: updateProfile };
const buttons = { login: "Masuk", signup: "Buat akun warga", reset: "Kirim petunjuk pemulihan", password: "Simpan kata sandi", profile: "Simpan nama tampilan" };
const fieldLabels: Record<string, string> = { display_name: "Nama tampilan", email: "Email", password: "Kata sandi", confirmation: "Ulangi kata sandi" };

export function AuthForm({ mode, initialName = "" }: { mode: AuthMode; initialName?: string }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(actions[mode], {});
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const fields = mode === "profile" ? ["display_name"] : mode === "reset" ? ["email"] : mode === "login" ? ["email", "password"] : mode === "password" ? ["password", "confirmation"] : ["display_name", "email", "password", "confirmation"];

  return (
    <form action={action} noValidate className="space-y-5">
      {state.error || Object.keys(state.errors ?? {}).length > 0 ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{state.error || "Periksa kembali isian yang ditandai di bawah."}</p>
      ) : null}
      {state.message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">{state.message}</p> : null}
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">{buttons[mode]}</legend>
        {fields.map((field) => {
          const id = `${mode}-${field}`;
          const error = state.errors?.[field];
          const passwordField = field === "password" || field === "confirmation";
          return (
            <div key={field}>
              <label htmlFor={id} className="mb-2 block text-sm font-semibold">{fieldLabels[field]}</label>
              <input
                id={id} name={field} required
                type={passwordField ? "password" : field === "email" ? "email" : "text"}
                autoComplete={passwordField ? mode === "login" ? "current-password" : "new-password" : field === "email" ? "email" : "nickname"}
                maxLength={field === "display_name" ? 80 : field === "email" ? 254 : 72}
                value={field === "display_name" ? name : field === "email" ? email : undefined}
                onChange={field === "display_name" ? (event) => setName(event.target.value) : field === "email" ? (event) => setEmail(event.target.value) : undefined}
                aria-invalid={Boolean(error)}
                aria-describedby={[error ? `${id}-error` : "", field === "password" && mode !== "login" ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 aria-invalid:border-red-600"
              />
              {field === "password" && mode !== "login" ? <p id={`${id}-hint`} className="mt-2 text-sm text-slate-600">Gunakan minimal 8 karakter dan kata sandi yang tidak dipakai di akun lain.</p> : null}
              {error ? <p id={`${id}-error`} className="mt-2 text-sm text-red-800">{error}</p> : null}
            </div>
          );
        })}
        <button type="submit" className="min-h-12 w-full rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait">{pending ? "Memproses…" : buttons[mode]}</button>
      </fieldset>
    </form>
  );
}
