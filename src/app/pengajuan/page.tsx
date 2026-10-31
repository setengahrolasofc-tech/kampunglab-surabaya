import type { Metadata } from "next";
import Link from "next/link";
import { getDraftList } from "@/lib/drafts/data";
import { CreateDraftForm } from "@/components/draft-entry-forms";
import {statusLabels} from "@/lib/simulations/workflow";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengajuan Saya", robots: { index:false,follow:false } };
const savedDate = (value: string) => new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(value))+" WIB";
export default async function MyDraftsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const raw=(await searchParams).page;
  const page=raw && /^[1-9]\d{0,4}$/.test(raw) ? Number(raw)-1 : 0;
  const { drafts, count, requestId, profile, simulations } = await getDraftList(page);
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-emerald-800">RUANG INOVATOR</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Pengajuan Saya</h1></div><Link href="/dashboard" className="text-sm font-semibold text-emerald-900 underline">Dashboard pribadi</Link></div>
    <p className="mt-4 max-w-3xl leading-7 text-slate-600">Susun ide, rencana uji, dan anggaran secara bertahap. Draf hanya bisa dibuka dan diubah oleh akun pemiliknya.</p>
    <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">Tahap prototipe: simulasi DEMO dimulai pada langkah 4. Rekomendasi RT/RW, alasan revisi/penolakan, dan kirim ulang revisi tersedia untuk latihan alur. Pengiriman resmi, lampiran, pemeriksaan duplikasi otomatis, dan persetujuan program belum diaktifkan.</div>
    <div className="mt-7"><CreateDraftForm requestId={requestId} hasDomicile={Boolean(profile.domicile_rt_id)} /></div>
    <section aria-labelledby="draft-list" className="mt-10"><h2 id="draft-list" className="text-xl font-bold">Draf tersimpan ({count})</h2>{drafts.length ? <ul className="mt-5 grid gap-5 md:grid-cols-2">{drafts.map(d => <li key={d.id} className="rounded-2xl border border-emerald-950/10 bg-white p-6"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-950">Draf pribadi</span><h3 className="mt-4 break-words text-xl font-bold">{d.title || "Draf tanpa judul"}</h3><p className="mt-3 text-sm text-slate-600">Disimpan {savedDate(d.updated_at)}</p><p className="mt-2 text-sm text-slate-600">Langkah terakhir: {d.current_step} dari 4</p><Link href={`/pengajuan/${d.id}`} className="mt-5 inline-block font-semibold text-emerald-900 underline underline-offset-4">Lanjutkan draf</Link>{simulations.filter(s=>s.draft_id===d.id).slice(0,1).map(s=><Link key={s.id} href={`/simulasi/${s.id}`} className="mt-3 block text-sm font-semibold text-emerald-900 underline">DEMO putaran {s.attempt}: {statusLabels[s.status]??s.status}</Link>)}</li>)}</ul> : <p className="mt-5 rounded-2xl border border-dashed border-emerald-950/20 p-8 text-slate-600">{count ? "Tidak ada draf pada halaman ini." : "Belum ada draf. Mulai dari ide yang ingin kamu uji di kampung."}</p>}</section>
    {count>20 ? <nav aria-label="Halaman draf" className="mt-7 flex gap-5 text-sm font-semibold text-emerald-900">{page>0 ? <Link href={`/pengajuan?page=${page}`} className="underline">Sebelumnya</Link> : null}<span>Halaman {page+1}</span>{(page+1)*20<count ? <Link href={`/pengajuan?page=${page+2}`} className="underline">Berikutnya</Link> : null}</nav> : null}
    <Link href="/profil/wilayah" className="mt-8 inline-block text-sm font-semibold text-emerald-900 underline">Ubah wilayah domisili</Link>
  </main>;
}
