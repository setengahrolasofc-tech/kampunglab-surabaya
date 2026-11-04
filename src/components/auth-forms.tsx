"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { KECAMATAN_KELURAHAN } from "@/lib/auth/surabaya-areas.mjs";
import { OTP_LENGTH, PASSWORD_RULES } from "@/lib/auth/validation.mjs";
import type { AuthActionState } from "@/lib/auth/types";
import {
  googleAction, loginAction, requestPasswordChangeCodeAction, requestResetAction, resendOtpAction, resetPasswordWithCodeAction,
  signupAction, verifyOtpAction,
} from "@/app/auth/actions";
import { completeProfileAction } from "@/app/lengkapi-profil/actions";
import { requestKelurahanAccessAction } from "@/app/minta-akses/actions";
import { PasswordInput } from "./password-input";
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

/** Pemisah "atau" lalu tombol Google (form terpisah, tanpa JavaScript). */
export function GoogleSection({ sebagai, label = "Lanjutkan dengan Google" }: { sebagai: "inovator" | "kelurahan"; label?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-indigo-space/55" role="separator" aria-label="atau">
        <span className="h-px flex-1 bg-celadon" /><span>atau</span><span className="h-px flex-1 bg-celadon" />
      </div>
      <form action={googleAction}>
        <input type="hidden" name="sebagai" value={sebagai} />
        <SubmitButton className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-indigo-space/25 bg-white px-4 py-2 text-sm font-semibold text-indigo-space hover:bg-celadon/30" pending="Mengalihkan ke Google…">
          <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
            <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
          </svg>
          {label}
        </SubmitButton>
      </form>
    </div>
  );
}

export function LoginForm({ info, sebagai = "inovator" }: { info?: string; sebagai?: "inovator" | "kelurahan" }) {
  const [state, action] = useActionState(loginAction, init);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="sebagai" value={sebagai} />
        {info && <Alert tone="perhatian">{info}</Alert>}
        <Field label="Email" htmlFor="email" error={state.errors?.email}><input id="email" name="email" type="email" autoComplete="email" className={inputCls} /></Field>
        <Field label="Password" htmlFor="password" error={state.errors?.password}><PasswordInput id="password" name="password" autoComplete="current-password" /></Field>
        <Msg state={state} />
        <SubmitButton className="w-full inline-flex justify-center rounded-lg bg-teal-deep px-4 py-2 text-sm font-semibold text-white">Masuk</SubmitButton>
      </form>
      <GoogleSection sebagai={sebagai} />
      <p className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/lupa-kata-sandi" className={linkCls}>Lupa password?</Link>
        <Link href={`/daftar?sebagai=${sebagai}`} className={linkCls}>{sebagai === "kelurahan" ? "Minta akses Kelurahan" : "Daftar akun"}</Link>
      </p>
    </div>
  );
}

const ROLE_INFO = [
  { v: "INNOVATOR", t: "Inovator / Warga", d: "Tim atau warga yang mengajukan inovasi. Langsung bisa membuat draft." },
  { v: "KELURAHAN", t: "Minta akses Kelurahan", d: "Lurah/staf bertugas. Akses baru terbuka setelah Admin BRIDA menyetujui SK Anda." },
];

export function SignupForm({ initialRole = "INNOVATOR" }: { initialRole?: "INNOVATOR" | "KELURAHAN" }) {
  const [state, action] = useActionState(signupAction, init);
  const [role, setRole] = useState<string>(initialRole);
  const [kec, setKec] = useState("");
  const [pw, setPw] = useState("");
  if (state.step === "otp" && state.email) return <OtpForm email={state.email} purpose={state.purpose ?? "signup"} state={state} />;
  const e = state.errors ?? {};
  return (
    <div className="space-y-5">
    <form action={action} className="space-y-4" noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Daftar sebagai</legend>
        <div className="grid gap-2 sm:grid-cols-2">
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
        <Field label="Nomor WhatsApp" htmlFor="phone_wa" error={e.phone_wa} hint="Contoh: 081234567890"><input id="phone_wa" name="phone_wa" inputMode="tel" autoComplete="tel" className={inputCls} /></Field>
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
        <Field label="Password" htmlFor="password" error={e.password}><PasswordInput id="password" name="password" autoComplete="new-password" value={pw} onChange={(ev) => setPw(ev.target.value)} /></Field>
        <Field label="Ulangi password" htmlFor="confirmation" error={e.confirmation}><PasswordInput id="confirmation" name="confirmation" autoComplete="new-password" /></Field>
      </div>
      <PasswordRules value={pw} />
      {role === "KELURAHAN" && <Alert tone="perhatian">Setelah mengirim, akun Anda berstatus <strong>menunggu mandat</strong>. Semua fitur dashboard Kelurahan terkunci sampai Admin BRIDA memeriksa SK dan memberi izin.</Alert>}
      <Msg state={state} />
      <SubmitButton className="inline-flex justify-center rounded-lg bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white">{role === "KELURAHAN" ? "Kirim permintaan akses" : "Daftar"}</SubmitButton>
    </form>
    <GoogleSection sebagai={role === "KELURAHAN" ? "kelurahan" : "inovator"} label={role === "KELURAHAN" ? "Lanjutkan dengan Google (lalu minta akses)" : "Daftar dengan Google"} />
    <p className="text-sm">Sudah punya akun? <Link href={`/masuk?sebagai=${role === "KELURAHAN" ? "kelurahan" : "inovator"}`} className={linkCls}>Masuk</Link></p>
    </div>
  );
}

/** Langkah 2 pemulihan/ganti password: kode OTP + password baru dikirim sekaligus dan diverifikasi di server. */
export function RecoveryCodeForm({ email, mode, notice }: { email: string; mode: "lupa" | "ubah"; notice?: string }) {
  const [state, action] = useActionState(resetPasswordWithCodeAction, { ...init, step: "otp" as const, email, mode });
  const [rs, resend] = useActionState(resendOtpAction, init);
  const [pw, setPw] = useState("");
  const e = state.errors ?? {};
  return (
    <div className="space-y-4">
      <Alert tone="info">{notice ?? "Kami mengirim kode"} {OTP_LENGTH} digit ke <strong>{email}</strong>. Masukkan kode itu dan password baru.</Alert>
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="email" value={email} /><input type="hidden" name="mode" value={mode} />
        <Field label="Kode OTP" htmlFor="token" error={e.token}>
          <input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" maxLength={OTP_LENGTH + 2} className={cx(inputCls, "text-center text-lg tracking-[0.5em]")} />
        </Field>
        <Field label="Password baru" htmlFor="password" error={e.password}><PasswordInput id="password" name="password" autoComplete="new-password" value={pw} onChange={(ev) => setPw(ev.target.value)} /></Field>
        <PasswordRules value={pw} />
        <Field label="Ulangi password baru" htmlFor="confirmation" error={e.confirmation}><PasswordInput id="confirmation" name="confirmation" autoComplete="new-password" /></Field>
        <Msg state={{ error: state.error }} />
        <SubmitButton className="w-full inline-flex justify-center rounded-lg bg-teal-deep px-4 py-2 text-sm font-semibold text-white">Simpan password baru</SubmitButton>
      </form>
      <form action={resend} className="text-center text-sm">
        <input type="hidden" name="email" value={email} /><input type="hidden" name="purpose" value="recovery" />
        <SubmitButton className={linkCls} pending="Mengirim…">Kirim ulang kode</SubmitButton>
        {rs.message && <p className="mt-1 text-xs text-indigo-space/70">{rs.message}</p>}
        {rs.error && <p className="mt-1 text-xs text-red-700">{rs.error}</p>}
      </form>
    </div>
  );
}

/** Lupa password (belum masuk): email dulu, lalu kode OTP + password baru. */
export function ResetForm() {
  const [state, action] = useActionState(requestResetAction, init);
  if (state.step === "otp" && state.email) return <RecoveryCodeForm email={state.email} mode="lupa" notice="Jika email terdaftar, kami mengirim kode" />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Email akun" htmlFor="email" error={state.errors?.email}><input id="email" name="email" type="email" autoComplete="email" className={inputCls} /></Field>
      <Msg state={state} />
      <SubmitButton className="w-full inline-flex justify-center rounded-lg bg-teal-deep px-4 py-2 text-sm font-semibold text-white">Kirim kode pemulihan</SubmitButton>
    </form>
  );
}

/** Ganti password (sudah masuk): wajib kode OTP yang dikirim ke email akun ini. */
export function ChangePasswordForm({ email }: { email: string }) {
  const [state, action] = useActionState(requestPasswordChangeCodeAction, init);
  if (state.step === "otp" && state.email) return <RecoveryCodeForm email={state.email} mode="ubah" notice="Kami mengirim kode" />;
  return (
    <form action={action} className="space-y-4">
      <p className="rounded-lg bg-celadon/40 px-3 py-2 text-sm">Kode akan dikirim ke <strong>{email}</strong>.</p>
      <Msg state={state} />
      <SubmitButton className="w-full inline-flex justify-center rounded-lg bg-teal-deep px-4 py-2 text-sm font-semibold text-white" pending="Mengirim kode…">Kirim kode OTP</SubmitButton>
    </form>
  );
}

/**
 * Melengkapi data diri setelah masuk dengan Google untuk pertama kali. Isiannya sama dengan pendaftaran, tanpa email dan password
 * (email dari Google, tidak ada password). SK Kelurahan diunggah di halaman "Menunggu verifikasi" setelah ini.
 */
export function CompleteProfileForm({ defaultName, email, defaultPhone, initialRole = "INNOVATOR" }: {
  defaultName: string; email: string; defaultPhone?: string | null; initialRole?: "INNOVATOR" | "KELURAHAN";
}) {
  const [state, action] = useActionState(completeProfileAction, init);
  const [role, setRole] = useState<string>(initialRole);
  const [kec, setKec] = useState("");
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Daftar sebagai</legend>
        <div className="grid gap-2 sm:grid-cols-2">
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
        <Field label="Nama lengkap" htmlFor="display_name" error={e.display_name} hint="Diambil dari Google; ubah bila perlu.">
          <input id="display_name" name="display_name" autoComplete="name" defaultValue={defaultName} className={inputCls} />
        </Field>
        <Field label="Email (dari Google)" htmlFor="email_tampil"><input id="email_tampil" value={email} readOnly className={cx(inputCls, "bg-celadon/20")} /></Field>
        <Field label="Nomor WhatsApp" htmlFor="phone_wa" error={e.phone_wa} hint="Contoh: 081234567890"><input id="phone_wa" name="phone_wa" inputMode="tel" autoComplete="tel" defaultValue={defaultPhone ?? ""} className={inputCls} /></Field>
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
        </>}
      </div>
      {role === "KELURAHAN" && <Alert tone="perhatian">Setelah mengirim, akun Anda berstatus <strong>menunggu mandat</strong>. Unggah SK/surat tugas di halaman berikutnya; semua fitur Kelurahan terkunci sampai Admin BRIDA memberi izin.</Alert>}
      <Msg state={{ error: state.error }} />
      <SubmitButton className="inline-flex justify-center rounded-lg bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white">{role === "KELURAHAN" ? "Kirim permintaan akses" : "Selesaikan pendaftaran"}</SubmitButton>
    </form>
  );
}

/** Akun yang sudah masuk (email atau Google) meminta akses Kelurahan. Tidak membuka wewenang sebelum Admin BRIDA memberi mandat. */
export function KelurahanAccessForm({ defaultPhone }: { defaultPhone?: string | null }) {
  const [kec, setKec] = useState("");
  return (
    <form action={requestKelurahanAccessAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kecamatan" htmlFor="kecamatan">
          <select id="kecamatan" name="kecamatan" required value={kec} onChange={(ev) => setKec(ev.target.value)} className={inputCls}>
            <option value="">Pilih kecamatan</option>{Object.keys(KECAMATAN_KELURAHAN).map((k) => <option key={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Kelurahan" htmlFor="kelurahan">
          <select id="kelurahan" name="kelurahan" required className={inputCls} disabled={!kec}>
            <option value="">Pilih kelurahan</option>{(KECAMATAN_KELURAHAN[kec as keyof typeof KECAMATAN_KELURAHAN] ?? []).map((k: string) => <option key={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="NIP" htmlFor="nip" hint="Hanya angka."><input id="nip" name="nip" inputMode="numeric" required className={inputCls} /></Field>
        <Field label="Jabatan" htmlFor="jabatan"><input id="jabatan" name="jabatan" required className={inputCls} placeholder="Lurah / Sekretaris / Staf" /></Field>
        <div className="sm:col-span-2"><Field label="Nomor WhatsApp resmi" htmlFor="phone_wa" hint="Contoh: 081234567890"><input id="phone_wa" name="phone_wa" inputMode="tel" required defaultValue={defaultPhone ?? ""} className={inputCls} /></Field></div>
      </div>
      <SubmitButton className="inline-flex justify-center rounded-lg bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white">Kirim permintaan akses</SubmitButton>
    </form>
  );
}
