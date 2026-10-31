"use client";
import Link from "next/link";
import {useActionState,useState} from "react";
import {saveReview} from "@/app/simulasi/actions";
import type {SimulationFormState} from "@/lib/simulations/types";
import {reviewChecks,stageLabels,type DecisionStage} from "@/lib/simulations/workflow";

const input="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 aria-invalid:border-red-600";
export function ReviewDecisionForm({simulationId,requestId,stage,version,blocked}:{simulationId:string;requestId:string;stage:DecisionStage;version:number;blocked:boolean}){
  const [state,action,pending]=useActionState<SimulationFormState,FormData>(saveReview,{});
  const [outcome,setOutcome]=useState("");
  const [conflict,setConflict]=useState("");
  const [body,setBody]=useState("");
  const [checks,setChecks]=useState<Record<string,boolean>>({});
  const errors=state.errors??{};
  return <form action={action} noValidate className="space-y-5">
    <input type="hidden" name="id" value={simulationId}/><input type="hidden" name="request_id" value={requestId}/><input type="hidden" name="stage" value={stage}/><input type="hidden" name="version" value={version}/>
    {state.error||errors.form?<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-7 text-red-900">{state.error||errors.form} <Link href={`/simulasi/${simulationId}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Periksa riwayat di tab baru</Link></p>:null}
    {blocked?<p className="rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-950">Akun ini pernah melaporkan konflik atau memberi rekomendasi pada tahap sebelumnya. Diperlukan petugas lain yang independen untuk keputusan substansi. Kamu dapat mencatat konflik; pengelola menyiapkan mandat pengganti yang sesuai.</p>:null}
    <fieldset disabled={pending} className="space-y-5"><legend className="sr-only">Tindakan simulasi {stageLabels[stage]}</legend>
      <div><label htmlFor="review-conflict" className="mb-2 block text-sm font-semibold">Deklarasi hubungan keluarga atau konflik kepentingan</label><select id="review-conflict" name="conflict" className={input} value={conflict} aria-invalid={Boolean(errors.conflict)} aria-describedby={errors.conflict?"review-conflict-error":undefined} onChange={e=>{setConflict(e.target.value);setOutcome(e.target.value==="reported"?"conflict":"");if(e.target.value==="reported")setChecks({});}}><option value="">Pilih deklarasi</option>{!blocked?<option value="none">Tidak ada yang perlu saya laporkan</option>:null}<option value="reported">Ada hubungan / konflik yang perlu dilaporkan</option></select>{errors.conflict?<p id="review-conflict-error" role="alert" className="mt-2 text-sm text-red-800">{errors.conflict}</p>:null}</div>
      <div><label htmlFor="review-outcome" className="mb-2 block text-sm font-semibold">Tindakan DEMO</label><select id="review-outcome" name="outcome" className={input} value={outcome} aria-invalid={Boolean(errors.outcome)} aria-describedby={errors.outcome?"review-outcome-error":undefined} onChange={e=>setOutcome(e.target.value)}><option value="">Pilih tindakan</option>{conflict==="none"&&!blocked?<><option value="forward">Rekomendasikan ke {stage==="rt"?"RW":"kelurahan"}</option><option value="revise">Minta revisi pengaju</option><option value="reject">Tolak simulasi dengan alasan</option></>:null}{conflict==="reported"?<option value="conflict">Laporkan konflik tanpa keputusan substansi</option>:null}</select>{errors.outcome?<p id="review-outcome-error" role="alert" className="mt-2 text-sm text-red-800">{errors.outcome}</p>:null}</div>
      <fieldset disabled={conflict!=="none"||blocked} aria-describedby={errors.checks?"review-checks-error":undefined} className="space-y-3"><legend className="mb-3 text-sm font-semibold">Pemeriksaan {stageLabels[stage]} · wajib untuk rekomendasi lanjut</legend>{reviewChecks[stage].map(check=><label key={check.key} className="flex items-start gap-3 text-sm leading-7"><input type="checkbox" name={`check_${check.key}`} checked={Boolean(checks[check.key])} onChange={e=>setChecks({...checks,[check.key]:e.target.checked})} className="mt-1 size-5 shrink-0 accent-emerald-900"/><span>{check.label}</span></label>)}</fieldset>
      {errors.checks?<p id="review-checks-error" role="alert" className="text-sm text-red-800">{errors.checks}</p>:null}
      {stage==="rw"?<p className="text-sm leading-7 text-slate-600">Pemeriksaan duplikasi dan RAB dilakukan manusia. Pencarian duplikasi otomatis, validasi plafon, serta persetujuan dana belum tersedia.</p>:null}
      <div><label htmlFor="review-body" className="mb-2 block text-sm font-semibold">Alasan dan catatan untuk pengaju</label><textarea id="review-body" name="body" value={body} onChange={e=>setBody(e.target.value)} rows={5} minLength={3} maxLength={4000} className={input} aria-invalid={Boolean(errors.body)} aria-describedby="review-body-help review-body-error"/><p id="review-body-help" className="mt-2 text-sm leading-6 text-slate-600">Wajib untuk semua tindakan. Jelaskan hal yang diperiksa atau perbaikan yang perlu dilakukan. Riwayat terlihat oleh pengaju dan petugas berwenang.</p><p id="review-body-error" role={errors.body?"alert":undefined} className="mt-2 text-sm text-red-800">{errors.body}</p></div>
      <p className="rounded-xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">Tindakan tercatat atas akun dan mandat aktifmu. Rekomendasi memindahkan salinan ini satu tahap; permintaan revisi dan penolakan menutup pemeriksaan pada putaran ini. Untuk DEMO, kirim ulang revisi membuat putaran baru dari RT.</p>
      <button type="submit" disabled={!outcome||!conflict} className="min-h-12 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{pending?"Menyimpan tindakan…":"Catat tindakan DEMO"}</button>
    </fieldset>
  </form>;
}
