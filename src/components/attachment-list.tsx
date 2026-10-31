import type {Attachment} from "@/lib/attachments/types";
export const attachmentSize=(bytes:number)=>bytes>=1024*1024?`${(bytes/(1024*1024)).toLocaleString("id-ID",{maximumFractionDigits:2})} MiB`:`${Math.ceil(bytes/1024)} KiB`;
export function AttachmentList({files,simulationId}:{files:Attachment[];simulationId?:string}){
  return files.length?<ul className="mt-5 space-y-4">{files.map(file=><li key={file.id} className="rounded-xl border border-slate-200 p-4"><p className="break-words font-semibold">{file.original_name}</p><p className="mt-2 text-xs text-slate-600">{file.mime_type} · {attachmentSize(file.byte_size)}</p><a href={`/lampiran/${file.id}${simulationId?`?simulasi=${simulationId}`:""}`} className="mt-4 inline-block text-sm font-semibold text-emerald-900 underline">Unduh lampiran privat</a></li>)}</ul>:<p className="mt-5 text-sm text-slate-600">Tidak ada lampiran pada salinan ini.</p>;
}
