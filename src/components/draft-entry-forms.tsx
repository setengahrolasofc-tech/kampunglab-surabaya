"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { createDraft, saveDomicile } from "@/app/pengajuan/actions";
import { TerritorySelect } from "./territory-select";
import type { DraftFormState, Territory } from "@/lib/drafts/types";

const button = "min-h-12 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60";
export function DomicileForm({ territories, initialRt }: { territories: Territory[]; initialRt: string }) {
  const [rt, setRt] = useState(initialRt);
  const [savedRt,setSavedRt]=useState(initialRt);
  const [state, action, pending] = useActionState<DraftFormState,FormData>(async(previous,form)=>{
    const result=await saveDomicile(previous,form);
    if(result.saved)setSavedRt(String(form.get("rt_id")));
    return result;
  }, {});
  return <form action={action} noValidate className="space-y-5">
    {state.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{state.error}</p> : null}
    {state.saved && rt===savedRt ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-950">Wilayah domisili berhasil disimpan. <Link href="/pengajuan" className="font-semibold underline">Lanjut ke Pengajuan Saya</Link></p> : null}
    <fieldset disabled={pending} className="space-y-5"><legend className="sr-only">Wilayah domisili</legend><TerritorySelect prefix="domicile" territories={territories} value={rt} onChange={setRt} error={state.errors?.rt_id} /><button type="submit" className={button}>{pending ? "Menyimpan…" : "Simpan wilayah domisili"}</button></fieldset>
  </form>;
}
export function CreateDraftForm({ requestId, hasDomicile }: { requestId: string; hasDomicile: boolean }) {
  const [state, action, pending] = useActionState<DraftFormState,FormData>(createDraft, {});
  if (!hasDomicile) return <div className="rounded-xl bg-amber-50 p-5 text-amber-950"><p>Lengkapi kelurahan, RW, dan RT domisilimu sebelum membuat draf.</p><Link href="/profil/wilayah" className="mt-3 inline-block font-semibold underline underline-offset-4">Lengkapi wilayah domisili</Link></div>;
  return <form action={action} className="space-y-4"><input type="hidden" name="request_id" value={requestId} />{state.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{state.error}</p> : null}<button type="submit" disabled={pending} className={button}>{pending ? "Membuat draf…" : "Buat draf pengajuan"}</button></form>;
}
