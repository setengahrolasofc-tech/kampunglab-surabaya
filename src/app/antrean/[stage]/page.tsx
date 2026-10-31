import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getReviewQueue} from "@/lib/simulations/data";
import {getDraftContext} from "@/lib/drafts/data";
import {makeTerritoryLabels} from "@/lib/admin/validation.mjs";
import {stageLabels,evaluationPathLabel,type ReviewStage} from "@/lib/simulations/workflow";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Antrean pemeriksaan DEMO",robots:{index:false,follow:false}};
export default async function ReviewQueuePage({params,searchParams}:{params:Promise<{stage:string}>;searchParams:Promise<{page?:string;view?:string}>}){
  const [{stage:rawStage},query]=await Promise.all([params,searchParams]);
  if(!["rt","rw","kelurahan"].includes(rawStage))notFound();
  const stage=rawStage as ReviewStage;
  const raw=query.page;const page=raw&&/^[1-9]\d{0,4}$/.test(raw)?Number(raw)-1:0;
  const view=stage==="kelurahan"&&query.view==="evaluasi"?"evaluation":"pending";
  const queue=await getReviewQueue(stage,page,view);
  const paginationBase=`/antrean/${stage}?${view==="evaluation"?"view=evaluasi&":""}`;
  const context=queue.canReview?await getDraftContext():null;
  const labels=makeTerritoryLabels(context?.territories??[]);
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
    <Link href="/dashboard" className="text-sm font-semibold text-emerald-900 underline">Dashboard pribadi</Link>
    <p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">PEMERIKSAAN · DEMO</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Antrean simulasi {stageLabels[stage]}</h1>
    <p className="mt-4 max-w-3xl leading-7 text-slate-600">Salinan pada wilayah mandat utamamu. Pengaju tidak dapat memeriksa simulasinya sendiri. {stage==="kelurahan"?"Kelurahan memeriksa rekomendasi RT/RW, meminta revisi atau menolak dengan alasan, serta menyiapkan jalur evaluasi Mikro/Kecil DEMO. Panel Kecil DEMO dapat mencatat nilai individual setelah pengaju mengaktifkan pembagian; kelulusan akhir belum tersedia.":"Rekomendasi diteruskan satu tahap. Permintaan revisi dan penolakan wajib beralasan; seluruh tindakan hanya untuk simulasi DEMO."}</p>
    {!queue.canReview?<p role="status" className="mt-7 rounded-xl bg-amber-50 p-5 leading-7 text-amber-950">Antrean ini memerlukan mandat utama {stageLabels[stage]} yang aktif. Peran admin program, cadangan, atau delegasi tidak otomatis membuka antrean ini.</p>:<>
      {stage==="kelurahan"?<nav aria-label="Daftar kelurahan" className="mt-7 flex flex-wrap gap-3 text-sm font-semibold"><Link href="/antrean/kelurahan" aria-current={view==="pending"?"page":undefined} className={`rounded-xl border px-4 py-3 ${view==="pending"?"bg-emerald-900 text-white":"border-emerald-900 text-emerald-900"}`}>Menunggu pemeriksaan</Link><Link href="/antrean/kelurahan?view=evaluasi" aria-current={view==="evaluation"?"page":undefined} className={`rounded-xl border px-4 py-3 ${view==="evaluation"?"bg-emerald-900 text-white":"border-emerald-900 text-emerald-900"}`}>Rencana evaluasi DEMO</Link></nav>:null}
      <h2 className="mt-8 text-xl font-bold">{view==="evaluation"?"Menunggu evaluasi DEMO":"Menunggu pemeriksaan"} ({queue.count})</h2>
      {view==="evaluation"?<p className="mt-3 text-sm leading-7 text-slate-600">Jalur telah dipilih untuk latihan alur. Panel Kecil DEMO menyediakan penugasan dan rubrik individual. Evaluator Mikro, hasil akhir panel, keputusan kelayakan, serta persetujuan dana belum tersedia.</p>:null}
      {queue.rows.length?<ul className="mt-5 space-y-5">{queue.rows.map(s=><li key={s.id} className="rounded-2xl border border-emerald-950/10 bg-white p-6"><p className="text-xs font-semibold text-emerald-800">DEMO · Putaran {s.attempt}</p><h3 className="mt-2 break-words text-xl font-bold">{s.title}</h3><p className="mt-3 text-sm text-slate-600">{labels.get(s.rt_id)??"Wilayah tidak termuat"}</p>{s.evaluation_path?<p className="mt-3 text-sm font-semibold text-emerald-900">Jalur evaluasi: {evaluationPathLabel(s.evaluation_path)}</p>:null}<p className="mt-2 break-all text-xs text-slate-500">{s.reference}</p><Link href={`/simulasi/${s.id}`} className="mt-5 inline-block font-semibold text-emerald-900 underline">{view==="evaluation"?"Lihat rencana dan riwayat pemeriksaan":"Baca salinan dan lakukan pemeriksaan"}</Link>{stage==="kelurahan"&&s.evaluation_path==="demo_small"?<Link href={`/simulasi/${s.id}/panel`} className="ml-5 mt-5 inline-block font-semibold text-emerald-900 underline">Lihat susunan dan nilai panel DEMO</Link>:null}</li>)}</ul>:<p className="mt-5 rounded-xl border border-dashed border-emerald-950/20 p-7 text-slate-600">{view==="evaluation"?"Belum ada salinan pada rencana evaluasi DEMO di wilayahmu.":"Belum ada salinan pengaju lain yang menunggu tingkat ini pada wilayahmu."}</p>}
      {queue.count>20?<nav aria-label="Halaman antrean" className="mt-6 flex gap-5 text-sm font-semibold text-emerald-900">{page>0?<Link href={`${paginationBase}page=${page}`} className="underline">Sebelumnya</Link>:null}<span>Halaman {page+1}</span>{(page+1)*20<queue.count?<Link href={`${paginationBase}page=${page+2}`} className="underline">Berikutnya</Link>:null}</nav>:null}
    </>}
  </main>;
}
