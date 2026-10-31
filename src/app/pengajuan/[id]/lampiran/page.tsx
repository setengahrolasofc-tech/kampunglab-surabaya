import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {isUuid} from "@/lib/admin/validation.mjs";
import {getDraftAttachments} from "@/lib/attachments/data";
import {getPhysicalContext} from "@/lib/physical/data";
import type {AttachmentPurpose,DraftAttachment} from "@/lib/attachments/types";
import {physicalDate,physicalPage} from "@/lib/physical/display";
import {AttachmentUploadForm,AttachmentArchiveForm} from "@/components/attachment-forms";
import {attachmentSize} from "@/components/attachment-list";
import { refLabel } from "@/lib/display";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Lampiran draf",robots:{index:false,follow:false}};
const purposeLabel=(purpose:AttachmentPurpose)=>purpose==="physical_rt"?"Surat rekomendasi fisik RT":purpose==="physical_rw"?"Surat rekomendasi fisik RW":"Lampiran pendukung";
function FileCard({file,draftId,canUpload,archive=false}:{file:DraftAttachment;draftId:string;canUpload:boolean;archive?:boolean}){
  const physical=file.purpose!=="supporting";
  return <li className="rounded-2xl border border-emerald-950/10 bg-white p-5"><h3 className="break-words font-bold">{file.original_name}</h3><p className="mt-2 text-xs text-slate-600">{purposeLabel(file.purpose)} · {attachmentSize(file.byte_size)} · {file.mime_type}</p><p className="mt-3 text-sm leading-7 text-emerald-900">{archive?"Arsip privat. Berkas yang sudah dikaitkan dengan salinan atau permintaan tetap tersedia sesuai izin.":file.storage_state==="ready"?(physical?"Siap dipilih dari jalur fisik pada salinan terkait. Tidak ikut lampiran pendukung pengiriman biasa.":"Siap disertakan saat simulasi dikirim."):(physical?"Unggahan surat fisik belum selesai. Ulangi untuk antrean yang masih sesuai, atau lepas ke arsip.":"Unggahan belum selesai; selesaikan atau lepas sebelum mengirim simulasi.")}</p>
    {file.storage_state==="ready"?<a href={`/lampiran/${file.id}`} className="mt-4 inline-block text-sm font-semibold text-emerald-900 underline">Unduh berkas privat</a>:!archive&&file.request_id?<div className="mt-5"><AttachmentUploadForm draftId={draftId} requestId={file.request_id} retryName={file.original_name} purpose={file.purpose} simulationId={file.physical_simulation_id??undefined} disabled={!canUpload}/></div>:<p className="mt-3 text-xs text-slate-600">Unggahan tidak selesai; tidak tersedia untuk diunduh.</p>}
    {physical&&file.physical_simulation_id?<p className="mt-3"><Link href={`/simulasi/${file.physical_simulation_id}/dokumen-fisik`} className="text-sm font-semibold text-emerald-900 underline">Buka jalur fisik salinan terkait</Link></p>:null}
    {!archive||file.storage_state==="ready"?<AttachmentArchiveForm draftId={draftId} fileId={file.id} restore={archive}/>:null}
  </li>;
}
export default async function DraftAttachmentsPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string;status?:string;jenis?:string;simulasi?:string}>}){
  const [{id},query]=await Promise.all([params,searchParams]);if(!isUuid(id))notFound();
  const page=physicalPage(query.page),data=await getDraftAttachments(id,page);if(!data)notFound();
  const physicalMode=query.jenis==="physical_rt"||query.jenis==="physical_rw";
  if(query.jenis&&!physicalMode)notFound();
  if(physicalMode&&!isUuid(query.simulasi))notFound();
  const physical=physicalMode&&query.simulasi?await getPhysicalContext(query.simulasi):null;
  if(physicalMode&&(!physical||!physical.is_owner||physical.simulation.draft_id!==id))notFound();
  const archiveHref=(target:number)=>`?page=${target}${physicalMode?`&jenis=${query.jenis}&simulasi=${query.simulasi}`:""}`;
  const purpose:AttachmentPurpose=physicalMode?query.jenis as AttachmentPurpose:"supporting";
  const allowed=data.can_upload&&(!physicalMode||Boolean(physical?.eligible&&`physical_${physical.stage}`===purpose));
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8"><nav aria-label="Navigasi lampiran" className="flex flex-wrap gap-5 font-semibold text-emerald-900"><Link href={`/pengajuan/${id}`} className="underline">Kembali ke editor draf</Link>{physical?<Link href={`/simulasi/${physical.simulation.id}/dokumen-fisik`} className="underline">Kembali ke permintaan fisik · muat ulang setelah unggah</Link>:null}</nav><p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">LAMPIRAN PRIVAT</p><h1 className="mt-3 text-3xl font-bold">{physicalMode?purposeLabel(purpose):"Lampiran draf"}</h1><p className="mt-4 break-words text-slate-600">{data.draft.title||"Draf tanpa judul"}</p><p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">Lampiran pendukung siap dibekukan dan dibagikan sesuai tahap ketika simulasi dikirim. Surat fisik hanya dibagikan lewat permintaan konfirmasi terpisah dengan persetujuan pengaju. Perubahan draf tidak mengganti berkas pada salinan atau permintaan yang telah dikirim.</p><div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-950">Batas untuk semua jenis berkas: 10 aktif per draf, 50 aktif per akun, 30 reservasi unggahan baru per 24 jam. Mengganti berkas dilakukan dengan unggah baru dan lepas versi lama ke arsip privat.</div>
    {query.status==="dilepas"||query.status==="dipulihkan"?<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4">{query.status==="dilepas"?"Berkas dilepas ke arsip privat.":"Berkas dipulihkan ke daftar aktif."} Salinan dan permintaan terdahulu tetap memakai berkas sebelumnya.</p>:null}
    <section className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6"><h2 className="mb-5 text-xl font-bold">Unggah {purposeLabel(purpose).toLowerCase()}</h2>{!data.can_upload?<p className="mb-5 text-sm leading-7">Simpan pilihan tema aktif dan hierarki wilayah pada editor sebelum mengunggah.</p>:null}{physical?<p className="mb-5 text-sm leading-7">Surat ini dikaitkan dengan {refLabel(physical.simulation.reference)}. {allowed?"Batas waktu telah tercapai.":`Tahap harus sesuai dan batas ${physicalDate(physical.eligible_at)} harus tercapai. Periksa status terbaru pada salinan.`}</p>:null}<AttachmentUploadForm key={purpose} draftId={id} requestId={data.requestId} purpose={purpose} simulationId={physical?.simulation.id} disabled={!allowed||data.files.length>=10}/></section>
    <section className="mt-8"><h2 className="text-xl font-bold">Berkas aktif ({data.files.length}/10)</h2>{data.files.length?<ul className="mt-5 space-y-5">{data.files.map(file=><FileCard key={file.id} file={file} draftId={id} canUpload={data.can_upload}/>)}</ul>:<p className="mt-5 rounded-xl border border-dashed p-6 text-sm text-slate-600">Belum ada berkas aktif.</p>}</section>
    <section className="mt-9"><h2 className="text-xl font-bold">Arsip berkas yang dilepas ({data.archived_count})</h2>{data.archived.length?<ul className="mt-5 space-y-4">{data.archived.map(file=><FileCard key={file.id} file={file} draftId={id} canUpload={data.can_upload} archive/>)}</ul>:<p className="mt-4 text-sm text-slate-600">Tidak ada arsip pada halaman ini.</p>}{data.archived_count>20?<nav aria-label="Halaman arsip lampiran" className="mt-5 flex gap-5 text-sm font-semibold text-emerald-900">{page>0?<Link href={archiveHref(page)} className="underline">Sebelumnya</Link>:null}<span>Halaman {page+1}</span>{(page+1)*20<data.archived_count?<Link href={archiveHref(page+2)} className="underline">Berikutnya</Link>:null}</nav>:null}</section>
  </main>;
}
