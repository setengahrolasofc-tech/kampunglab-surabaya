import type {Metadata} from "next";
import Link from "next/link";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isUuid} from "@/lib/admin/validation.mjs";
import {getPanelDetails} from "@/lib/panel/data";
import {panelSeats,panelStatus,panelPage} from "@/lib/panel/display";
import {PanelSharingForm} from "@/components/panel-forms";
import {PanelHistory} from "@/components/panel-summary";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Panel Kecil DEMO",robots:{index:false,follow:false}};
export default async function PanelCasePage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string;status?:string}>}){
  const [{id},query]=await Promise.all([params,searchParams]);if(!isUuid(id))notFound();const page=panelPage(query.page),data=await getPanelDetails(id,page);if(!data)notFound();
  return <main id="konten-utama" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-12 sm:px-8"><Link href={`/simulasi/${id}`} className="font-semibold text-emerald-900 underline">Kembali ke salinan simulasi</Link><p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">PENILAIAN KECIL · DEMO</p><h1 className="mt-3 break-words text-3xl font-bold">Panel {data.simulation.title}</h1><p className="mt-4 text-sm text-slate-600">{data.simulation.reference}</p><p className="mt-5 rounded-xl bg-amber-50 p-5 text-sm leading-7">Tiga kursi dan rubrik individual mengikuti rancangan handbook. Nilai/suara disimpan per orang. Rumus skor gabungan, aturan lengkap panel, dan hubungan skor dengan suara masih D-03; kelulusan akhir dan dana belum ditetapkan.</p>{query.status==="disimpan"?<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4">Perubahan pembagian ke panel berhasil dicatat.</p>:null}
    <section className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6"><h2 className="mb-5 text-xl font-bold">Pembagian ke reviewer: {data.case?panelStatus[data.case.state]:"belum diaktifkan pengaju"}</h2>{data.is_owner?<PanelSharingForm key={data.case?.version??0} simulationId={id} version={data.case?.version??0} enabled={data.case?.state!=="open"} requestId={randomUUID()}/>:<p className="text-sm leading-7 text-slate-600">Hanya pengaju dapat mengaktifkan/menjeda pembagian. Admin program menyiapkan reviewer setelah pembagian diaktifkan. Kelurahan melihat nilai dan riwayat; tidak mengganti suara reviewer.</p>}</section>
    <section className="my-7 rounded-2xl border border-emerald-950/10 bg-white p-6"><h2 className="text-xl font-bold">Susunan kursi saat ini</h2><ul className="mt-5 grid gap-4 sm:grid-cols-3">{Object.entries(panelSeats).map(([seat,label])=>{const a=data.assignments.find(x=>x.seat===seat);return <li key={seat} className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold">{label}</h3><p className="mt-3">{a?.reviewer_name??"Belum ditugaskan"}</p>{a?<><p className="mt-2 text-sm">{a.submitted?"Nilai terkirim":"Belum mengirim nilai"}</p><p className="mt-2 text-sm text-slate-600">{a.role_current?"Peran reviewer berlaku":"Peran reviewer tidak berlaku; pengelola perlu memeriksa"}</p><p className="mt-2 break-words text-xs text-slate-600">Dasar: {a.appointment_reference}</p></>:null}</li>;})}</ul></section>
    <PanelHistory data={data} page={page} href={`/simulasi/${id}/panel`}/>
  </main>;
}
