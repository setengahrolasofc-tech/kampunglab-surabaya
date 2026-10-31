import type {Metadata} from "next";
import Link from "next/link";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isUuid} from "@/lib/admin/validation.mjs";
import {getPanelDetails} from "@/lib/panel/data";
import {panelSeats,panelStatus,panelPage} from "@/lib/panel/display";
import type {PanelSeat} from "@/lib/panel/types";
import {PanelCandidateForm,PanelRevokeForm} from "@/components/panel-forms";
import {PanelHistory} from "@/components/panel-summary";
import { refLabel } from "@/lib/display";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Susunan reviewer",robots:{index:false,follow:false}};
export default async function AdminPanelDetailPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string;status?:string}>}){
  const [{id},query]=await Promise.all([params,searchParams]);if(!isUuid(id))notFound();const page=panelPage(query.page),data=await getPanelDetails(id,page,true);if(!data?.case)notFound();const c=data.case;
  const empty=(Object.keys(panelSeats) as PanelSeat[]).filter(seat=>!data.assignments.some(a=>a.seat===seat));
  return <main id="konten-utama" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-12 sm:px-8"><Link href="/admin/panel" className="font-semibold text-emerald-900 underline">Kembali ke daftar panel</Link><p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">KOORDINASI PANEL</p><h1 className="mt-3 break-all text-3xl font-bold">{refLabel(data.simulation.reference)}</h1><p className="mt-4 text-sm">{panelStatus[c.state]} · versi susunan {c.version}</p><p className="mt-5 rounded-xl bg-amber-50 p-5 text-sm leading-7">Pastikan unsur BRIDA/OPD, akademisi, dan praktisi diperiksa manusia. Sistem menolak pengaju, pemberi rekomendasi sebelumnya, pelapor konflik, orang yang pernah mengisi kursi pada panel ini, atau akun tanpa peran reviewer aktif.</p>{query.status==="disimpan"?<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4">Perubahan penugasan berhasil dicatat.</p>:null}
    <section className="mt-7"><h2 className="text-xl font-bold">Kursi saat ini</h2><ul className="mt-5 space-y-5">{data.assignments.map(a=><li key={a.id} className="rounded-2xl border border-emerald-950/10 bg-white p-6"><h3 className="text-lg font-bold">{panelSeats[a.seat]} · {a.reviewer_name}</h3><p className="mt-3 text-sm">{a.role_current?"Peran reviewer berlaku":"Peran reviewer tidak berlaku"} · {a.submitted?"sudah mengirim nilai":"belum mengirim nilai"}</p><p className="mt-2 break-words text-sm">Dasar: {a.appointment_reference}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{a.reason}</p><details className="mt-5"><summary className="cursor-pointer font-semibold text-emerald-900">Cabut dan siapkan pengganti</summary><PanelRevokeForm caseId={id} assignmentId={a.id} version={c.version} requestId={randomUUID()}/></details></li>)}</ul>{!data.assignments.length?<p className="mt-4 text-slate-600">Belum ada kursi aktif.</p>:null}</section>
    <section className="my-7 rounded-2xl border border-emerald-950/10 bg-white p-6"><h2 className="mb-5 text-xl font-bold">Isi kursi kosong</h2>{c.state!=="open"?<p className="text-sm leading-7">Pengaju sedang menjeda pembagian. Penugasan baru tersedia setelah pengaju mengaktifkan kembali.</p>:empty.length?<PanelCandidateForm key={c.version} caseId={id} version={c.version} requestId={randomUUID()} seats={empty}/>:<p>Ketiga kursi telah terisi. Nilai individual tidak ditampilkan pada halaman administrasi ini.</p>}<Link href="/admin" className="mt-5 inline-block text-sm font-semibold text-emerald-900 underline">Kelola peran reviewer melalui Admin</Link></section>
    <PanelHistory data={data} page={page} href={`/admin/panel/${id}`} showEntries={false}/>
  </main>;
}
