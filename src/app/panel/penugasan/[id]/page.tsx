import type {Metadata} from "next";
import Link from "next/link";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isUuid} from "@/lib/admin/validation.mjs";
import {getPanelAssignment} from "@/lib/panel/data";
import {getDraftContext} from "@/lib/drafts/data";
import {validateDraftDocument} from "@/lib/drafts/schema.mjs";
import {panelSeats,panelStatus,panelDate} from "@/lib/panel/display";
import {stageLabels,outcomeLabels} from "@/lib/simulations/workflow";
import {PanelEntryForm} from "@/components/panel-forms";
import {PanelEntryReceipt} from "@/components/panel-summary";
import {AttachmentList} from "@/components/attachment-list";
import {InnovationSnapshot} from "@/components/innovation-snapshot";
import { refLabel } from "@/lib/display";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Penilaian individual",robots:{index:false,follow:false}};
const box="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6";
export default async function PanelAssignmentPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{status?:string}>}){
  const {id}=await params;if(!isUuid(id))notFound();const data=await getPanelAssignment(id);if(!data)notFound();
  const [context,query]=await Promise.all([data.can_read?getDraftContext():Promise.resolve(null),searchParams]),a=data.assignment,s=data.simulation;
  return <main id="konten-utama" tabIndex={-1} className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><Link href="/panel" className="font-semibold text-emerald-900 underline">Kembali ke penugasan saya</Link><p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">NILAI INDIVIDUAL</p><h1 className="mt-3 text-3xl font-bold">Kursi {panelSeats[a.seat]}</h1><p className="mt-4 break-all text-sm text-slate-600">{refLabel(data.reference)} · {a.reviewer_name}</p><p className="mt-3 text-sm">{panelStatus[a.status]} · {panelStatus[data.case_state]}</p><p className="mt-5 rounded-xl bg-amber-50 p-5 text-sm leading-7">Rubrik dan suara adalah penilaian individual. Rumus gabungan/kelulusan D-03 belum ditetapkan. Nilai terkirim terkunci, terlihat pengaju dan kelurahan berwenang, serta tidak menyetujui program/dana.</p>{query.status==="disimpan"?<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4">Nilai atau laporan konflik berhasil dicatat.</p>:null}
    {!data.can_read?<p className={box}>Akses proposal dan berkas sedang ditutup karena penugasan atau pembagian tidak aktif. Riwayat nilai/laporanmu yang sudah terkirim tetap terlihat di bawah selama peran reviewer berlaku.</p>:null}
    {data.entry?<section className={box}><h2 className="mb-5 text-xl font-bold">Nilai / laporanmu yang terkunci</h2><PanelEntryReceipt entry={data.entry}/></section>:null}
    {data.can_read&&s&&context?<><h2 className="mt-8 break-words text-2xl font-bold">{s.title}</h2><div className="mt-6"><InnovationSnapshot document={validateDraftDocument(s.document).data} territories={context.territories} themes={context.themes}/></div><section className={box}><h2 className="text-xl font-bold">Lampiran pendukung putaran ini</h2><AttachmentList files={data.files} panelAssignmentId={id}/></section><section className={box}><h2 className="text-xl font-bold">Riwayat rekomendasi berjenjang</h2><ol className="mt-5 space-y-4">{data.events.map(e=><li key={e.id} className="rounded-xl border border-slate-200 p-4"><h3 className="font-semibold">{stageLabels[e.stage]} · {outcomeLabels[e.outcome]} · {e.decision_method==="physical"?"rekomendasi fisik dikonfirmasi kelurahan":"digital"}</h3><p className="mt-2 text-xs text-slate-600">{e.actor_name} atas nama {e.office_name} · {panelDate(e.created_at)}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{e.body}</p></li>)}</ol></section>{data.can_score?<section className={box}><h2 className="mb-5 text-xl font-bold">Isi rubrik atau laporkan konflik</h2><PanelEntryForm assignmentId={id} workflowVersion={s.workflow_version} requestId={randomUUID()}/></section>:!data.entry?<p className={box}>Riwayat putaran ini memerlukan reviewer independen lain. Pengelola perlu memeriksa penugasanmu.</p>:null}</>:null}
  </main>;
}
