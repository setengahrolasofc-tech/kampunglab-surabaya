"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { KECAMATAN_KELURAHAN } from "@/lib/auth/surabaya-areas.mjs";
import { OTP_LENGTH, PASSWORD_RULES } from "@/lib/auth/validation.mjs";
import type { AuthActionState } from "@/lib/auth/types";
import {
  loginAction, requestResetAction, resendOtpAction, signupAction, updatePasswordAction, verifyOtpAction,
} from "@/app/auth/actions";
import { SubmitButton } from "./submit-button";
import { Alert, Field, cx, inputCls, linkCls } from "./ui";

const init: AuthActionState = {};

function Msg({ state }: { state: AuthActionState }) {
  return <>{state.error && <Alert tone="bahaya">{state.error}</Alert>}{state.message && <Alert tone="info">{state.message}</Alert>}</>;
}

function PasswordRules({ value }: { value: string }) {
  return (
    <ul className="grid gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2" aria-label="Aturan password">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return <li key={r.id} className={ok ? "font-semibold text-[#2c6b5b]" : "text-indigo-space/60"}>{ok ? "✓" : "○"} {r.label}</li>;
      })}
    </ul>
  );
}

export function OtpForm({ email, purpose, state: parent }: { email: string; purpose: "signup" | "recovery"; state?: AuthActionState }) {
  const [state, action] = useActionState(verifyOtpAction, { ...init, step: "otp", email, purpose });
  const [rs, resend] = useActionState(resendOtpAction, init);
  const shown = state.error || state.errors ? state : parent ?? state;
  return (
    <div className="space-y-4">
      <Alert tone="info">Kami mengirim kode {OTP_LENGTH} digit ke <strong>{email}</strong>. Masukkan kode untuk melanjutkan.</Alert>
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="email" value={email} /><input type="hidden" name="purpose" value={purpose} />
        <Field label="Kode OTP" htmlFor="token" error={state.errors?.token}>
          <input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" maxLength={OTP_LENGTH + 2} className={cx(inputCls, "text-center text-lg tracking-[0.5em]")} />
        </Field>
        <Msg state={shown.error ? shown : {}} />
        <SubmitButton className="w-full inline-flex justify-center rounded-lg bg-teal-deep px-4 py-2 text-sm font-semibold text-white">Verifikasi</SubmitButton>
      </form>
      <form action={resend} className="text-center text-sm">
        <input type="hidden" name="email" value={email} /><input type="hidden" name="purpose" value={purpose} />
        <SubmitButton className={linkCls} pending="Mengirim…">Kirim ulang kode</SubmitButton>
        {rs.message && <p className="mt-1 text-xs text-indigo-space/70">{rs.message}</p>}
      </form>
    </div>
  );
}

export function LoginForm({ info }: { info?: string }) {
  const [state, action] = useActionState(loginAction, init);
  return (
    <form action={action} className="space-y-4" noValidate>
      {info && <Alert tone="perhatian">{info}</Alert>}
      <Field label="Email" htmlFor="email" error={state.errors?.email}><input id="email" name="email" type="email" autoComplete="email" className={inputCls} /></Field>
      <Field label="Password" htmlFor="password" error={state.errors?.password}><input id="password" name="password" type="password" autoComplete="current-password" className={inputCls} /></Field>
      <Msg state={state} />
      <SubmitButton className="w-full inline-flex justify-center rounded-lg bg-teal-deep px-4 py-2 text-sm font-semibold text-white">Masuk</SubmitButton>
      <p className="flex justify-between text-sm"><Link href="/lupa-kata-sandi" className={linkCls}>Lupa password?</Link><Link href="/daftar" className={linkCls}>Daftar akun</Link></p>
    </form>
  );
}

const ROLE_INFO = [
  { v: "INNOVATOR", t: "Inovator", d: "Tim/warga yang mengajukan inovasi. Langsung bisa membuat draft." },
  { v: "KELURAHAN", t: "Kelurahan", d: "Lurah/staf bertugas. Perlu SK dan mandat dari BRIDA sebelum akses dibuka." },
  { v: "BRIDA_ADMIN", t: "Staf BRIDA", d: "Hanya dengan kode undangan staf BRIDA." },
];

export function SignupForm() {
  const [state, action] = useActionState(signupAction, init);
  const [role, setRole] = useState("INNOVATOR");
  const [kec, setKec] = useState("");
  const [pw, setPw] = useState("");
  if (state.step === "otp" && state.email) return <OtpForm email={state.email} purpose={state.purpose ?? "signup"} state={state} />;
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Daftar sebagai</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ROLE_INFO.map((r) => (
            <label key={r.v} className={cx("cursor-pointer rounded-xl border p-3 text-sm", role === r.v ? "border-teal-deep bg-teal-deep/5 ring-2 ring-teal-deep/30" : "border-celadon bg-white")}>
              <input type="radio" name="role" value={r.v} checked={role === r.v} onChange={() => setRole(r.v)} className="sr-only" />
              <span className="block font-bold">{r.t}</span><span className="text-xs text-indigo-space/70">{r.d}</span>
            </label>
          ))}
        </div>
        {e.role && <p className="mt-1 text-xs text-red-700">{e.role}</p>}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap" htmlFor="display_name" error={e.display_name}><input id="display_name" name="display_name" autoComplete="name" className={inputCls} /></Field>
        <Field label="Email" htmlFor="email" error={e.email}><input id="email" name="email" type="email" autoComplete="email" className={inputCls} /></Field>
        {role !== "BRIDA_ADMIN" && <Field label="Nomor WhatsApp" htmlFor="phone_wa" error={e.phone_wa} hint="Contoh: 081234567890"><input id="phone_wa" name="phone_wa" inputMode="tel" autoComplete="tel" className={inputCls} /></Field>}
        {role === "INNOVATOR" && <>
          <Field label="Institusi / komunitas" htmlFor="institusi" error={e.institusi}><input id="institusi" name="institusi" className={inputCls} placeholder="Universitas / sekolah / komunitas" /></Field>
          <Field label="Kota domisili" htmlFor="kota_domisili" error={e.kota_domisili} hint="Boleh dari luar Surabaya."><input id="kota_domisili" name="kota_domisili" className={inputCls} /></Field>
        </>}
        {role === "KELURAHAN" && <>
          <Field label="NIP" htmlFor="nip" error={e.nip}><input id="nip" name="nip" inputMode="numeric" className={inputCls} /></Field>
          <Field label="Jabatan" htmlFor="jabatan" error={e.jabatan}><input id="jabatan" name="jabatan" className={inputCls} placeholder="Lurah / Sekretaris / Staf" /></Field>
          <Field label="Kecamatan" htmlFor="kecamatan" error={e.kecamatan}>
            <select id="kecamatan" name="kecamatan" value={kec} onChange={(ev) => setKec(ev.target.value)} className={inputCls}>
              <option value="">Pilih kecamatan</option>{Object.keys(KECAMATAN_KELURAHAN).map((k) => <option key={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="Kelurahan" htmlFor="kelurahan" error={e.kelurahan}>
            <select id="kelurahan" name="kelurahan" className={inputCls} disabled={!kec}>
              <option value="">Pilih kelurahan</option>{(KECAMATAN_KELURAHAN[kec as keyof typeof KECAMATAN_KELURAHAN] ?? []).map((k: string) => <option key={k}>{k}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="SK / surat tugas (PDF, JPG, PNG; maks. 4 MB)" htmlFor="sk" error={e.sk}>
            <input id="sk" name="sk" type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-celadon file:px-3 file:py-1.5 file:text-xs file:font-semibold" />
          </Field></div>
        </>}
        {role === "BRIDA_ADMIN" && <div className="sm:col-span-2"><Field label="Kode undangan staf BRIDA" htmlFor="kode_undangan" error={e.kode_undangan}><input id="kode_undangan" name="kode_undangan" type="password" autoComplete="off" className={inputCls} /></Field></div>}
        <Field label="Password" htmlFor="password" error={e.password}><input id="password" name="password" type="password" autoComplete="new-password" value={pw} onChange={(ev) => setPw(ev.target.value)} className={inputCls} /></Field>
        <Field label="Ulangi password" htmlFor="confirmation" error={e.confirmation}><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" className={inputCls} /></Field>
      </div>
      <PasswordRules value={pw} />
      {role === "KELURAHAN" && <Alert tone="perhatian">Setelah mendaftar, akun Anda berstatus <strong>menunggu mandat</strong>. Semua fitur dashboard Kelurahan terkunci sampai Admin BRIDA memverifikasi SK dan memberi mandat.</Alert>}
      <Msg state={state} />
      <SubmitButton className="inline-flex justify-center rounded-lg bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white">Daftar</SubmitButton>
      <p className="text-sm">Sudah punya akun? <Link href="/masuk" className={linkCls}>Masuk</Link></p>
    </form>
  );
}

export function ResetForm() {
  const [state, action] = useActionState(requestResetAction, init);
  if (state.step === "otp" && state.email) return <OtpForm email={state.email} purpose="recovery" state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Email akun" htmlFor="email" error={state.errors?.email}><input id="email" name="email" type="email" autoComplete="email" className={inputCls} /></Field>
      <Msg state={state} />
      <SubmitButton className="w-full inline-flex justify-center rounded-lg bg-teal-deep px-4 py-2 text-sm font-semibold text-white">Kirim kode pemulihan</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, init);
  const [pw, setPw] = useState("");
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Password baru" htmlFor="password" error={state.errors?.password}><input id="password" name="password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} /></Field>
      <PasswordRules value={pw} />
      <Field label="Ulangi password baru" htmlFor="confirmation" error={state.errors?.confirmation}><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" className={inputCls} /></Field>
      <Msg state={state} />
      <SubmitButton className="w-full inline-flex justify-center rounded-lg bg-teal-deep px-4 py-2 text-sm font-semibold text-white">Simpan password</SubmitButton>
    </form>
  );
}
