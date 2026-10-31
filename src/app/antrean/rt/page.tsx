import type {Metadata} from "next";
import Link from "next/link";
import {getRtQueue} from "@/lib/simulations/data";
import {getDraftContext} from "@/lib/drafts/data";
import {makeTerritoryLabels} from "@/lib/admin/validation.mjs";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Antrean simulasi RT",robots:{index:false,follow:false}};
export default async function RtQueuePage({searchParams}:{searchParams:Promise<{page?:string}>}){
  const raw=(await searchParams).page;const page=raw&&/^[1-9]\d{0,4}$/.test(raw)?Number(raw)-1:0;
  const queue=await getRtQueue(page);
  const context=queue.canReview?await getDraftContext():null;
  const labels=makeTerritoryLabels(context?.territories??[]);
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8"><Link href="/dashboard" className="text-sm font-semibold text-emerald-900 underline">Dashboard pribadi</Link><p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">PEMERIKSAAN AWAL · DEMO</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Antrean simulasi RT</h1><p className="mt-4 max-w-3xl leading-7 text-slate-600">Salinan simulasi untuk wilayah mandat utama RT yang masih berlaku. Pengaju tidak dapat memeriksa simulasinya sendiri. Tahap ini menyediakan pembacaan dan catatan awal, tanpa keputusan atau perpindahan ke RW.</p>
    {!queue.canReview?<p role="status" className="mt-7 rounded-xl bg-amber-50 p-5 leading-7 text-amber-950">Antrean ini memerlukan mandat utama RT yang aktif. Peran admin program, cadangan, atau delegasi tidak otomatis membuka antrean simulasi ini.</p>:<><h2 className="mt-8 text-xl font-bold">Salinan simulasi di wilayahmu ({queue.count})</h2>{queue.rows.length?<ul className="mt-5 space-y-5">{queue.rows.map(s=><li key={s.id} className="rounded-2xl border border-emerald-950/10 bg-white p-6"><h3 className="break-words text-xl font-bold">{s.title}</h3><p className="mt-3 text-sm text-slate-600">{labels.get(s.rt_id)}</p><p className="mt-2 break-all text-xs text-slate-500">{s.reference}</p><Link href={`/simulasi/${s.id}`} className="mt-5 inline-block font-semibold text-emerald-900 underline">Baca salinan dan catat pemeriksaan</Link></li>)}</ul>:<p className="mt-5 rounded-xl border border-dashed border-emerald-950/20 p-7 text-slate-600">Belum ada salinan simulasi dari pengaju lain pada antrean wilayahmu.</p>}{queue.count>20?<nav aria-label="Halaman antrean" className="mt-6 flex gap-5 text-sm font-semibold text-emerald-900">{page>0?<Link href={`/antrean/rt?page=${page}`} className="underline">Sebelumnya</Link>:null}<span>Halaman {page+1}</span>{(page+1)*20<queue.count?<Link href={`/antrean/rt?page=${page+2}`} className="underline">Berikutnya</Link>:null}</nav>:null}</>}
  </main>;
}
