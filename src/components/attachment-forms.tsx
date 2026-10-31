"use client";
import Link from "next/link";
import {useActionState} from "react";
import {uploadAttachment,archiveAttachment,restoreAttachment} from "@/app/pengajuan/[id]/lampiran/actions";
import type {FileActionState} from "@/lib/attachments/types";
export function AttachmentUploadForm({draftId,requestId,disabled=false,retryName}:{draftId:string;requestId:string;disabled?:boolean;retryName?:string}){
  const [state,action,pending]=useActionState<FileActionState,FormData>(uploadAttachment,{});
  return <form action={action} noValidate className="space-y-4">
    <input type="hidden" name="draft_id" value={draftId}/><input type="hidden" name="request_id" value={state.nextRequestId??requestId}/>
    {state.error?<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-7 text-red-900">{state.error} <Link href={`/pengajuan/${draftId}/lampiran`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Periksa daftar di tab baru</Link></p>:null}
    {state.message?<p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">{state.message}</p>:null}
    <fieldset disabled={pending||disabled} className="space-y-4"><legend className="sr-only">{retryName?"Ulangi unggahan tertunda":"Unggah lampiran draf"}</legend>
      <div><label className="mb-2 block text-sm font-semibold" htmlFor={`file-${requestId}`}>{retryName?`Pilih ulang berkas yang sama: ${retryName}`:"Pilih lampiran"}</label><input id={`file-${requestId}`} type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.webp" aria-describedby={`help-${requestId}`} className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-900"/><p id={`help-${requestId}`} className="mt-2 text-sm leading-7 text-slate-600">PDF, JPEG, PNG, atau WebP; maksimal 3 MiB. Jika pilihan berkas kosong setelah gagal, pilih ulang berkas yang sama untuk mencoba kembali.</p></div>
      <button type="submit" className="min-h-12 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50">{pending?"Mengunggah dan memeriksa…":retryName?"Ulangi unggahan":"Unggah lampiran"}</button>
    </fieldset>
  </form>;
}
export function AttachmentArchiveForm({draftId,fileId,restore=false}:{draftId:string;fileId:string;restore?:boolean}){
  const [state,action,pending]=useActionState<FileActionState,FormData>(restore?restoreAttachment:archiveAttachment,{});
  return <form action={action} className="mt-4 space-y-3"><input type="hidden" name="draft_id" value={draftId}/><input type="hidden" name="id" value={fileId}/>{state.error?<p role="alert" className="text-sm leading-7 text-red-900">{state.error}</p>:null}<button type="submit" disabled={pending} className="min-h-11 rounded-xl border border-emerald-900 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-50">{pending?"Menyimpan…":restore?"Pulihkan ke draf":"Lepas dari draf"}</button></form>;
}
