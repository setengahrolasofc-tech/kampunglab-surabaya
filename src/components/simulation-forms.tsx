"use client";
import Link from "next/link";
import { useActionState,useState } from "react";
import { submitSimulation,saveRtNote } from "@/app/simulasi/actions";
import type { SimulationFormState,SimulationRef } from "@/lib/simulations/types";
import {statusLabels} from "@/lib/simulations/workflow";
const button="min-h-12 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50";
const input="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 aria-invalid:border-red-600";
export function SimulationSubmitCard({draftId,revision,disabled,missing,existing,attachmentRevision,attachmentCount,filesPending}:{draftId:string;revision:number;disabled:boolean;missing:string[];existing:SimulationRef|null;attachmentRevision:number;attachmentCount:number;filesPending:boolean}){
  const [acknowledged,setAcknowledged]=useState(false);
  const [state,action,pending]=useActionState<SimulationFormState,FormData>(submitSimulation,{});
  const resubmit=existing?.status==="revision_requested";
  const unchanged=Boolean(resubmit&&existing&&revision<=existing.draft_revision&&attachmentRevision<=existing.attachment_revision);
  return <section aria-labelledby="simulation-submit-title" className="mt-7 rounded-2xl border border-emerald-300 bg-emerald-50 p-6">
    <p className="text-xs font-bold tracking-widest text-emerald-800">SIMULASI DEMO</p><h2 id="simulation-submit-title" className="mt-3 text-xl font-bold">Coba pengiriman ke antrean RT</h2>
    {existing?<><p className="mt-4 leading-7 text-slate-700">Putaran {existing.attempt} · {statusLabels[existing.status]??existing.status}. Salinan draf revisi {existing.draft_revision} tetap tersimpan; perubahan draf tidak mengubah salinan tersebut.</p><Link href={`/simulasi/${existing.id}`} className="mt-5 inline-block font-semibold text-emerald-900 underline">Lihat salinan dan riwayat pemeriksaan</Link></>:null}
    {!existing||resubmit?<>
      <p className="mt-4 leading-7 text-slate-700">{resubmit?"Perbaiki draf sesuai catatan, lalu kirim salinan baru. Untuk simulasi, seluruh pemeriksaan dimulai kembali dari RT. Salinan dan alasan revisi sebelumnya tetap tersimpan.":"Kirim salinan dari versi yang sudah disimpan. Salinan dibagikan kepada RT berwenang, lalu RW dan kelurahan ketika diteruskan. Keputusan ini hanya berlaku dalam simulasi."} Persetujuan program dan anggaran belum dijalankan.</p>
      {missing.length?<div className="mt-4 text-sm text-amber-950"><p className="font-semibold">Lengkapi terlebih dahulu:</p><ul className="mt-2 list-inside list-disc">{missing.map(label=><li key={label}>{label}</li>)}</ul></div>:null}
      {disabled?<p className="mt-4 text-sm font-semibold text-amber-900">Simpan seluruh perubahan draf sebelum mengirim simulasi.</p>:null}
      {unchanged?<p className="mt-4 text-sm font-semibold text-amber-900">Ubah dan simpan isi draf atau daftar lampiran sebelum kirim ulang.</p>:null}
      <p className="mt-4 text-sm leading-7 text-slate-700">{attachmentCount} lampiran pendukung siap ikut dikirim. Semua pendukung siap pada draf akan dibagikan bersama salinan ini; surat fisik mempunyai jalur terpisah.</p>{filesPending?<p className="mt-3 text-sm font-semibold text-amber-900">Masih ada unggahan tertunda. Selesaikan atau lepas reservasinya pada halaman Kelola lampiran.</p>:null}
      <form action={action} noValidate className="mt-5 space-y-4"><input type="hidden" name="draft_id" value={draftId}/><input type="hidden" name="revision" value={revision}/><input type="hidden" name="attachment_revision" value={attachmentRevision}/>{resubmit&&existing?<input type="hidden" name="previous_id" value={existing.id}/>:null}{state.error?<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-900">{state.error}</p>:null}<fieldset disabled={disabled||filesPending||unchanged||missing.length>0||pending} className="space-y-4"><legend className="sr-only">Persetujuan berbagi salinan simulasi</legend><label className="flex items-start gap-3 text-sm leading-7"><input type="checkbox" name="acknowledged" checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)} className="mt-1 size-5 shrink-0 accent-emerald-900"/><span>Saya memahami ini simulasi DEMO dan menyetujui pembagian isi salinan beserta lampiran tersimpan kepada RT, RW, dan kelurahan berwenang sesuai tahap pemeriksaan.</span></label><button type="submit" disabled={!acknowledged} className={button}>{pending?"Mengirim simulasi…":resubmit?"Kirim salinan revisi ke RT":"Kirim simulasi ke antrean RT"}</button></fieldset></form>
    </>:null}
  </section>;
}
export function RtNoteForm({simulationId,requestId}:{simulationId:string;requestId:string}){
  const [body,setBody]=useState("");const [conflict,setConflict]=useState("");
  const [domicile,setDomicile]=useState(false);const [problem,setProblem]=useState(false);
  const [state,action,pending]=useActionState<SimulationFormState,FormData>(saveRtNote,{});
  return <form action={action} noValidate className="space-y-5"><input type="hidden" name="id" value={simulationId}/><input type="hidden" name="request_id" value={requestId}/>
    {state.error||state.errors?.form?<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-900">{state.error||state.errors?.form} <Link href={`/simulasi/${simulationId}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Periksa riwayat di tab baru</Link></p>:null}
    <fieldset disabled={pending} className="space-y-5"><legend className="sr-only">Catatan pemeriksaan awal RT</legend>
      <div><label htmlFor="note-conflict" className="mb-2 block text-sm font-semibold">Deklarasi hubungan keluarga atau konflik kepentingan</label><select id="note-conflict" name="conflict" value={conflict} className={input} aria-invalid={Boolean(state.errors?.conflict)} aria-describedby={state.errors?.conflict?"note-conflict-error":undefined} onChange={e=>{setConflict(e.target.value);if(e.target.value==="family"){setDomicile(false);setProblem(false);}}}><option value="">Pilih deklarasi</option><option value="none">Tidak ada yang perlu saya laporkan</option><option value="family">Ada hubungan / konflik yang perlu dilaporkan</option></select>{state.errors?.conflict?<p id="note-conflict-error" role="alert" className="mt-2 text-sm text-red-800">{state.errors.conflict}</p>:null}</div>
      {conflict==="family"?<p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">Jelaskan konflik di bawah. Checklist pemeriksaan tidak diisi saat melaporkan konflik; pengelola perlu menyiapkan petugas yang sesuai.</p>:null}
      <label className="flex items-start gap-3 text-sm leading-7"><input type="checkbox" name="domicile_checked" disabled={conflict==="family"} checked={domicile} onChange={e=>setDomicile(e.target.checked)} className="mt-1 size-5 shrink-0 accent-emerald-900"/><span>Saya telah memeriksa kesesuaian domisili pada salinan ini.</span></label>
      <label className="flex items-start gap-3 text-sm leading-7"><input type="checkbox" name="problem_checked" disabled={conflict==="family"} checked={problem} onChange={e=>setProblem(e.target.checked)} className="mt-1 size-5 shrink-0 accent-emerald-900"/><span>Saya telah meninjau masalah nyata yang dijelaskan.</span></label>
      <div><label htmlFor="note-body" className="mb-2 block text-sm font-semibold">Catatan hasil pemeriksaan atau konflik</label><textarea id="note-body" name="body" value={body} onChange={e=>setBody(e.target.value)} rows={5} minLength={3} maxLength={4000} aria-invalid={Boolean(state.errors?.body)} aria-describedby={state.errors?.body?"note-body-error":undefined} className={input}/>{state.errors?.body?<p id="note-body-error" role="alert" className="mt-2 text-sm text-red-800">{state.errors.body}</p>:null}</div>
      <p className="text-sm leading-6 text-slate-600">Catatan terlihat oleh pengaju dan petugas berwenang sesuai tahap pemeriksaan. Penyimpanan catatan tidak memindahkan pengajuan ke RW.</p>
      <button type="submit" className={button}>{pending?"Menyimpan…":"Simpan catatan awal RT"}</button>
    </fieldset>
  </form>;
}
