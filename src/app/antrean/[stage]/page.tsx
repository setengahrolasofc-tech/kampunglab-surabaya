import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getReviewQueue} from "@/lib/simulations/data";
import {getDraftContext} from "@/lib/drafts/data";
import {makeTerritoryLabels} from "@/lib/admin/validation.mjs";
import {stageLabels,type ReviewStage} from "@/lib/simulations/workflow";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Antrean pemeriksaan DEMO",robots:{index:false,follow:false}};
export default async function ReviewQueuePage({params,searchParams}:{params:Promise<{stage:string}>;searchParams:Promise<{page?:string}>}){
  const [{stage:rawStage},query]=await Promise.all([params,searchParams]);
  if(!["rt","rw","kelurahan"].includes(rawStage))notFound();
  const stage=rawStage as ReviewStage;
  const raw=query.page;const page=raw&&/^[1-9]\d{0,4}$/.test(raw)?Number(raw)-1:0;
  const queue=await getReviewQueue(stage,page);
  const context=queue.canReview?await getDraftContext():null;
  const labels=makeTerritoryLabels(context?.territories??[]);
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
    <Link href="/dashboard" className="text-sm font-semibold text-emerald-900 underline">Dashboard pribadi</Link>
    <p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">PEMERIKSAAN · DEMO</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Antrean simulasi {stageLabels[stage]}</h1>
    <p className="mt-4 max-w-3xl leading-7 text-slate-600">Salinan yang sedang menunggu tingkat {stageLabels[stage]} pada wilayah mandat utamamu. Pengaju tidak dapat memeriksa simulasinya sendiri. {stage==="kelurahan"?"Kelurahan dapat membaca salinan dan rekomendasi RT/RW. Keputusan akhir program dan panel belum dibuka.":"Rekomendasi diteruskan satu tahap. Permintaan revisi dan penolakan wajib beralasan; seluruh tindakan hanya untuk simulasi DEMO."}</p>
    {!queue.canReview?<p role="status" className="mt-7 rounded-xl bg-amber-50 p-5 leading-7 text-amber-950">Antrean ini memerlukan mandat utama {stageLabels[stage]} yang aktif. Peran admin program, cadangan, atau delegasi tidak otomatis membuka antrean ini.</p>:<>
      <h2 className="mt-8 text-xl font-bold">Menunggu pemeriksaan ({queue.count})</h2>
      {queue.rows.length?<ul className="mt-5 space-y-5">{queue.rows.map(s=><li key={s.id} className="rounded-2xl border border-emerald-950/10 bg-white p-6"><p className="text-xs font-semibold text-emerald-800">DEMO · Putaran {s.attempt}</p><h3 className="mt-2 break-words text-xl font-bold">{s.title}</h3><p className="mt-3 text-sm text-slate-600">{labels.get(s.rt_id)??"Wilayah tidak termuat"}</p><p className="mt-2 break-all text-xs text-slate-500">{s.reference}</p><Link href={`/simulasi/${s.id}`} className="mt-5 inline-block font-semibold text-emerald-900 underline">{stage==="kelurahan"?"Baca salinan dan rekomendasi":"Baca salinan dan lakukan pemeriksaan"}</Link></li>)}</ul>:<p className="mt-5 rounded-xl border border-dashed border-emerald-950/20 p-7 text-slate-600">Belum ada salinan pengaju lain yang menunggu tingkat ini pada wilayahmu.</p>}
      {queue.count>20?<nav aria-label="Halaman antrean" className="mt-6 flex gap-5 text-sm font-semibold text-emerald-900">{page>0?<Link href={`/antrean/${stage}?page=${page}`} className="underline">Sebelumnya</Link>:null}<span>Halaman {page+1}</span>{(page+1)*20<queue.count?<Link href={`/antrean/${stage}?page=${page+2}`} className="underline">Berikutnya</Link>:null}</nav>:null}
    </>}
  </main>;
}
