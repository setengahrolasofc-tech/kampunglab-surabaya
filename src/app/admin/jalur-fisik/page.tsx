import type {Metadata} from "next";
import Link from "next/link";
import {randomUUID} from "node:crypto";
import {getPhysicalSettings} from "@/lib/physical/data";
import {physicalDate} from "@/lib/physical/display";
import {PhysicalSettingsForm} from "@/components/physical-forms";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Pengaturan jalur fisik DEMO",robots:{index:false,follow:false}};
export default async function PhysicalSettingsPage({searchParams}:{searchParams:Promise<{status?:string}>}){
  const [data,query]=await Promise.all([getPhysicalSettings(),searchParams]);
  return <main id="konten-utama" tabIndex={-1} className="mx-auto max-w-4xl px-5 py-12 sm:px-8"><Link href="/admin" className="font-semibold text-emerald-900 underline">Kembali ke admin</Link><p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">KONFIGURASI DEMO</p><h1 className="mt-3 text-3xl font-bold">Batas waktu jalur fisik</h1><p className="mt-5 text-sm leading-7 text-slate-600">Nilai awal 7 hari per tingkat, dihitung sejak masuk antrean RT/RW. Batas konfigurasi latihan 1–30 hari. Perubahan berlaku pada kelayakan permintaan baru, termasuk antrean yang sudah menunggu; waktu masuk antrean tetap. Permintaan yang sudah dikirim mempertahankan batas hari saat diajukan. Pengaturan tidak memutuskan atau memindahkan pengajuan otomatis.</p>{query.status==="disimpan"?<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4">Pengaturan DEMO berhasil dicatat.</p>:null}<section className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6"><h2 className="mb-5 text-xl font-bold">Saat ini: {data.current.delay_days} hari</h2><PhysicalSettingsForm key={data.current.version} days={data.current.delay_days} version={data.current.version} requestId={randomUUID()}/></section><section className="mt-7"><h2 className="text-xl font-bold">20 perubahan terbaru</h2><ol className="mt-5 space-y-4">{data.history.map(h=><li key={h.version} className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">Versi {h.version} · {h.delay_days} hari</h3><p className="mt-2 text-sm text-slate-600">{h.actor_name} · {physicalDate(h.created_at)}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{h.reason}</p></li>)}</ol></section></main>;
}
