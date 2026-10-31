"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, signup, requestPasswordReset, updatePassword, updateProfile } from "@/app/auth/actions";
import { OtpForm } from "@/components/otp-form";
import { PasswordInput, PasswordRules } from "@/components/password-field";
import { DomicileFields, emptyDomicile, type Domicile } from "@/components/signup-domicile";
import type { AuthActionState, AuthMode } from "@/lib/auth/types";

const initial: AuthActionState = {};
const inputClass = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 aria-invalid:border-red-600";
const buttonClass = "min-h-12 w-full rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait";
/** Konfirmasi password: langsung memberi tahu saat berbeda, dan mengabaikan error server yang sudah usang. */
function confirmationError(password: string, confirmation: string, serverError?: string) {
  if (!confirmation) return serverError;
  return confirmation === password ? undefined : "Konfirmasi password belum sama dengan password.";
}
const confirmationOk = (password: string, confirmation: string) => (confirmation && confirmation === password ? "Password cocok." : undefined);
const passwordHint = "Gunakan password khusus untuk KampungLab. Demi keamanan, jangan gunakan password yang sama dengan password emailmu.";

function Banner({ state }: { state: AuthActionState }) {
  const hasErrors = Object.keys(state.errors ?? {}).length > 0;
  return (
    <>
      {state.error || hasErrors ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{state.error || "Periksa kembali isian yang ditandai di bawah."}</p>
      ) : null}
      {state.message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">{state.message}</p> : null}
    </>
  );
}

function TextField({ id, name, label, type = "text", autoComplete, value, onChange, error, maxLength }: {
  id: string; name: string; label: string; type?: "text" | "email"; autoComplete: string;
  value: string; onChange: (value: string) => void; error?: string; maxLength: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        id={id} name={name} required type={type} autoComplete={autoComplete} maxLength={maxLength}
        value={value} onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass}
      />
      {error ? <p id={`${id}-error`} className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}

function LoginForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(login, initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form action={action} noValidate className="space-y-5">
      <Banner state={state} />
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">Masuk</legend>
        <TextField id="login-email" name="email" label="Email akun" type="email" autoComplete="email" maxLength={254} value={email} onChange={setEmail} error={state.errors?.email} />
        <PasswordInput
          id="login-password" name="password" label="Password" autoComplete="current-password"
          value={password} onChange={setPassword} error={state.errors?.password}
          aside={<Link href="/lupa-kata-sandi" className="rounded-sm text-sm font-semibold text-emerald-900 hover:underline">Lupa password?</Link>}
        />
        <button type="submit" className={buttonClass}>{pending ? "Memproses…" : "Masuk"}</button>
      </fieldset>
    </form>
  );
}

function SignupForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(signup, initial);
  const [backedFrom, setBackedFrom] = useState<AuthActionState | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [domicile, setDomicile] = useState<Domicile>(emptyDomicile);

  if (state.step === "otp" && state.email && backedFrom !== state) {
    return <OtpForm kind="signup" email={state.email} onBack={() => setBackedFrom(state)} />;
  }
  return (
    <form action={action} noValidate className="space-y-5">
      <Banner state={state} />
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">Buat akun warga</legend>
        <TextField id="signup-display_name" name="display_name" label="Nama lengkap" autoComplete="name" maxLength={80} value={name} onChange={setName} error={state.errors?.display_name} />
        <TextField id="signup-email" name="email" label="Email" type="email" autoComplete="email" maxLength={254} value={email} onChange={setEmail} error={state.errors?.email} />
        <div>
          <PasswordInput
            id="signup-password" name="password" label="Password" autoComplete="new-password"
            value={password} onChange={setPassword} error={state.errors?.password} describedBy="signup-password-hint signup-password-rules"
          />
          <p id="signup-password-hint" className="mt-2 text-sm leading-6 text-slate-600">{passwordHint}</p>
          <PasswordRules id="signup-password-rules" value={password} />
        </div>
        <PasswordInput id="signup-confirmation" name="confirmation" label="Konfirmasi password" autoComplete="new-password" value={confirmation} onChange={setConfirmation} error={confirmationError(password, confirmation, state.errors?.confirmation)} success={confirmationOk(password, confirmation)} />
        <DomicileFields prefix="signup" value={domicile} onChange={setDomicile} errors={state.errors} />
        <button type="submit" className={buttonClass}>{pending ? "Mengirim kode…" : "Kirim kode OTP"}</button>
      </fieldset>
    </form>
  );
}

function ResetForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(requestPasswordReset, initial);
  const [backedFrom, setBackedFrom] = useState<AuthActionState | null>(null);
  const [email, setEmail] = useState("");
  if (state.step === "otp" && state.email && backedFrom !== state) {
    return <OtpForm kind="recovery" email={state.email} onBack={() => setBackedFrom(state)} />;
  }
  return (
    <form action={action} noValidate className="space-y-5">
      <Banner state={state} />
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">Pulihkan password</legend>
        <TextField id="reset-email" name="email" label="Email akun" type="email" autoComplete="email" maxLength={254} value={email} onChange={setEmail} error={state.errors?.email} />
        <button type="submit" className={buttonClass}>{pending ? "Mengirim kode…" : "Kirim kode OTP"}</button>
      </fieldset>
    </form>
  );
}

function SimpleForm({ mode, initialName }: { mode: "password" | "profile"; initialName: string }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(mode === "password" ? updatePassword : updateProfile, initial);
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  return (
    <form action={action} noValidate className="space-y-5">
      <Banner state={state} />
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">{mode === "password" ? "Simpan password" : "Simpan nama tampilan"}</legend>
        {mode === "profile" ? (
          <TextField id="profile-display_name" name="display_name" label="Nama tampilan" autoComplete="nickname" maxLength={80} value={name} onChange={setName} error={state.errors?.display_name} />
        ) : (
          <>
            <div>
              <PasswordInput
                id="password-password" name="password" label="Password baru" autoComplete="new-password"
                value={password} onChange={setPassword} error={state.errors?.password} describedBy="password-password-hint password-password-rules"
              />
              <p id="password-password-hint" className="mt-2 text-sm leading-6 text-slate-600">{passwordHint}</p>
              <PasswordRules id="password-password-rules" value={password} />
            </div>
            <PasswordInput id="password-confirmation" name="confirmation" label="Konfirmasi password" autoComplete="new-password" value={confirmation} onChange={setConfirmation} error={confirmationError(password, confirmation, state.errors?.confirmation)} success={confirmationOk(password, confirmation)} />
          </>
        )}
        <button type="submit" className={buttonClass}>{pending ? "Memproses…" : mode === "password" ? "Simpan password" : "Simpan nama tampilan"}</button>
      </fieldset>
    </form>
  );
}

export function AuthForm({ mode, initialName = "" }: { mode: AuthMode; initialName?: string }) {
  if (mode === "login") return <LoginForm />;
  if (mode === "signup") return <SignupForm />;
  if (mode === "reset") return <ResetForm />;
  return <SimpleForm mode={mode} initialName={initialName} />;
}
