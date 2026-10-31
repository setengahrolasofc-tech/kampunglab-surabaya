"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
import { PasswordInput, PasswordRules } from "@/components/password-field";
import { DomicileFields, type Domicile } from "@/components/signup-domicile";
import { changePassword, deleteAccount, relinkDomicile, requestPasswordCode, updateDomicile, updateName } from "@/app/profil/actions";
import { OTP_LENGTH } from "@/lib/auth/validation.mjs";
import type { AuthActionState } from "@/lib/auth/types";

const initial: AuthActionState = {};
const inputClass = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 aria-invalid:border-red-600";
const buttonClass = "min-h-12 w-full rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait";
const linkButton = "rounded-sm text-sm font-semibold text-emerald-900 hover:underline disabled:cursor-wait";

function Banner({ state }: { state: AuthActionState }) {
  const hasErrors = Object.keys(state.errors ?? {}).length > 0;
  return (
    <>
      {state.error || hasErrors ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{state.error || "Periksa kembali isian yang ditandai di bawah."}</p> : null}
      {state.message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">{state.message}</p> : null}
    </>
  );
}

function Field({ id, name, label, type = "text", autoComplete, value, onChange, error, maxLength, inputMode, placeholder }: {
  id: string; name: string; label: string; type?: "text" | "email"; autoComplete: string; value: string; onChange: (value: string) => void;
  error?: string; maxLength: number; inputMode?: "numeric"; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      <input id={id} name={name} required type={type} autoComplete={autoComplete} maxLength={maxLength} inputMode={inputMode} placeholder={placeholder}
        value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass} />
      {error ? <p id={`${id}-error`} className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-judul`} className="scroll-mt-6 rounded-2xl border border-emerald-950/10 bg-white p-6 sm:p-8">
      <h2 id={`${id}-judul`} className="mb-6 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function NameForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(updateName, initial);
  const [name, setName] = useState(initialName);
  return (
    <form action={action} noValidate className="space-y-5">
      <Banner state={state} />
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">Ubah nama</legend>
        <Field id="profil-nama" name="display_name" label="Nama lengkap" autoComplete="name" maxLength={80} value={name} onChange={setName} error={state.errors?.display_name} />
        <button type="submit" className={buttonClass}>{pending ? "Menyimpan…" : "Simpan nama"}</button>
      </fieldset>
    </form>
  );
}

export function DomicileForm({ initialDomicile, linked }: { initialDomicile: Domicile; linked: boolean }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(updateDomicile, initial);
  const [domicile, setDomicile] = useState<Domicile>(initialDomicile);
  const [relinkState, setRelinkState] = useState<AuthActionState>({});
  const [relinking, startRelink] = useTransition();
  return (
    <div className="space-y-5">
      <p className={`rounded-xl p-4 text-sm leading-6 ${linked ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`}>
        {linked ? "Domisilimu cocok dengan wilayah program." : "Domisilimu belum cocok dengan wilayah program, jadi draf pengajuan baru belum bisa dibuat."}
      </p>
      <form action={action} noValidate className="space-y-5">
        <Banner state={state} />
        <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
          <legend className="sr-only">Ubah domisili</legend>
          <DomicileFields prefix="profil" value={domicile} onChange={setDomicile} errors={state.errors} />
          <button type="submit" className={buttonClass}>{pending ? "Menyimpan…" : "Simpan domisili"}</button>
        </fieldset>
      </form>
      {!linked ? (
        <div>
          <button type="button" disabled={relinking} className={linkButton} onClick={() => startRelink(async () => setRelinkState(await relinkDomicile()))}>
            {relinking ? "Mencocokkan…" : "Cocokkan ulang dengan wilayah program"}
          </button>
          <div className="mt-3"><Banner state={relinkState} /></div>
        </div>
      ) : null}
    </div>
  );
}

function CodeField({ error }: { error?: string }) {
  const [code, setCode] = useState("");
  return <Field id="kode-otp" name="token" label={`Kode ${OTP_LENGTH} digit`} autoComplete="one-time-code" inputMode="numeric" maxLength={OTP_LENGTH} value={code} onChange={(value) => setCode(value.replace(/\D/g, ""))} error={error} placeholder="123456" />;
}

const passwordHint = "Gunakan password khusus untuk KampungLab. Demi keamanan, jangan gunakan password yang sama dengan password emailmu.";

export function PasswordForm({ canChange }: { canChange: boolean }) {
  const [request, setRequest] = useState<AuthActionState>({});
  const [requesting, startRequest] = useTransition();
  const [state, action, pending] = useActionState<AuthActionState, FormData>(changePassword, initial);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const done = Boolean(state.message) && !state.step && !state.error;
  const awaiting = request.step === "otp" && !done;
  if (!canChange) return <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">Akun ini masuk lewat Google, jadi tidak memakai password KampungLab.</p>;
  return (
    <div className="space-y-5">
      {done ? <Banner state={state} /> : null}
      {!awaiting ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">Mengganti password perlu verifikasi: kami kirim kode ke email akunmu terlebih dahulu.</p>
          {!done ? <Banner state={request} /> : null}
          <button type="button" disabled={requesting} className={buttonClass} onClick={() => startRequest(async () => setRequest(await requestPasswordCode()))}>
            {requesting ? "Mengirim kode…" : "Kirim kode verifikasi"}
          </button>
        </div>
      ) : (
        <form action={action} noValidate className="space-y-5">
          <Banner state={state.error || state.errors ? state : request} />
          <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
            <legend className="sr-only">Ganti password</legend>
            <CodeField error={state.errors?.token} />
            <div>
              <PasswordInput id="pw-baru" name="password" label="Password baru" autoComplete="new-password" value={password} onChange={setPassword} error={state.errors?.password} describedBy="pw-baru-hint pw-baru-rules" />
              <p id="pw-baru-hint" className="mt-2 text-sm leading-6 text-slate-600">{passwordHint}</p>
              <PasswordRules id="pw-baru-rules" value={password} />
            </div>
            <PasswordInput id="pw-konfirmasi" name="confirmation" label="Konfirmasi password" autoComplete="new-password" value={confirmation} onChange={setConfirmation}
              error={confirmation && confirmation !== password ? "Konfirmasi password belum sama dengan password." : state.errors?.confirmation} />
            <button type="submit" className={buttonClass}>{pending ? "Memproses…" : "Simpan password"}</button>
          </fieldset>
        </form>
      )}
    </div>
  );
}

export function DeleteForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(deleteAccount, initial);
  const [confirm, setConfirm] = useState("");
  return (
    <form action={action} noValidate className="space-y-5">
      <p className="text-sm leading-6 text-slate-700">Akunmu akan dinonaktifkan dan tidak bisa dipakai masuk lagi. Namamu diganti menjadi “Akun dihapus”, domisili dilepas, dan semua sesi diakhiri. Draf dan pengajuan yang sudah ada tetap tersimpan sebagai arsip program tanpa identitasmu. Tindakan ini tidak bisa dibatalkan.</p>
      <Banner state={state} />
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">Hapus akun</legend>
        <Field id="hapus-konfirmasi" name="confirm" label="Ketik HAPUS untuk mengonfirmasi" autoComplete="off" maxLength={10} value={confirm} onChange={setConfirm} error={state.errors?.confirm} />
        <button type="submit" disabled={confirm.trim() !== "HAPUS"} className="min-h-12 w-full rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Menghapus…" : "Hapus akun saya"}
        </button>
      </fieldset>
    </form>
  );
}
