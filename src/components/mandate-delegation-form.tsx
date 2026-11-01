"use client";
import { useActionState } from "react";
import { assignDelegatedMandate, type DelegationFormState } from "@/app/mandat/actions";

const input = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base aria-invalid:border-red-600";
export function MandateDelegationForm({ territoryId, officeLabel }: { territoryId: string; officeLabel: string }) {
  const [state, action, pending] = useActionState<DelegationFormState, FormData>(assignDelegatedMandate, {});
  const errors = state.errors ?? {};
  return <form action={action} noValidate className="space-y-5">
    <input type="hidden" name="territory_id" value={territoryId} />
    {state.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-900">{state.error}</p> : null}
    <fieldset disabled={pending} className="space-y-5">
      <legend className="sr-only">Tetapkan {officeLabel}</legend>
      <div><label htmlFor="mandate-email" className="mb-2 block text-sm font-semibold">Email akun yang ditetapkan</label>
        <input id="mandate-email" name="email" type="email" autoComplete="off" maxLength={254} className={input} aria-invalid={Boolean(errors.email)} aria-describedby="mandate-email-help" />
        <p id="mandate-email-help" className="mt-2 text-sm text-slate-600">Orang itu harus sudah mendaftar dan mengonfirmasi emailnya.</p>
        {errors.email ? <p role="alert" className="mt-2 text-sm text-red-800">{errors.email}</p> : null}</div>
      <div><label htmlFor="mandate-reference" className="mb-2 block text-sm font-semibold">Dasar penetapan</label>
        <input id="mandate-reference" name="reference" maxLength={240} className={input} aria-invalid={Boolean(errors.reference)} placeholder="Nomor surat/SK atau hasil musyawarah" />
        {errors.reference ? <p role="alert" className="mt-2 text-sm text-red-800">{errors.reference}</p> : null}</div>
      <label className="flex items-start gap-3 text-sm leading-7"><input type="checkbox" name="verified" className="mt-1 size-5 shrink-0 accent-emerald-900" />
        <span>Saya sudah memeriksa identitas orang ini dan berwenang menetapkannya sebagai {officeLabel}.</span></label>
      {errors.verified ? <p role="alert" className="text-sm text-red-800">{errors.verified}</p> : null}
      <button type="submit" className="min-h-12 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50">{pending ? "Menetapkan…" : `Tetapkan ${officeLabel}`}</button>
    </fieldset>
  </form>;
}
