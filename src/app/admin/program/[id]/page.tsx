import type { Metadata } from "next";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { isUuid } from "@/lib/admin/validation.mjs";
import { getProgramDraft } from "@/lib/programs/data";
import { programDate, programPage } from "@/lib/programs/display";
import { ProgramProposalForm } from "@/components/program-proposal-form";
import { ProgramProposalDiff, ProgramProposalSummary } from "@/components/program-proposal-summary";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Versi draf program", robots: { index: false, follow: false }, referrer: "no-referrer" };
const box = "mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6";
export default async function ProgramDraftPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ version?: string | string[]; page?: string | string[]; status?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id) || Array.isArray(query.page) || Array.isArray(query.version)) notFound();
  const selectedVersion = query.version ? /^[1-9]\d{0,9}$/.test(query.version) && Number(query.version) <= 2147483647 ? Number(query.version) : -1 : null;
  if (selectedVersion === -1) notFound();
  const page = programPage(query.page), data = await getProgramDraft(id, page, selectedVersion);
  if (!data) notFound();
  const latest = data.selected.version === data.current.version;
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
    <Link href="/admin/program" className="font-semibold text-emerald-900 underline underline-offset-4">Daftar draf program</Link>
    <p className="mt-7 text-xs font-bold tracking-widest text-amber-800">DRAF USULAN · BELUM BERLAKU</p>
    <h1 className="mt-3 break-words text-3xl font-bold">{data.current.document.name}</h1><p className="mt-3 break-all text-sm font-semibold text-slate-600">{data.program.code} · Versi draf terbaru {data.current.version}</p>
    <p className="mt-5 rounded-xl bg-amber-50 p-5 text-sm leading-7 text-amber-950">Setiap versi menyimpan usulan, alasan dan atribusi saat penyimpanan. Semua versi tetap draf dan belum digunakan sebagai aturan pengajuan, rumus kelulusan atau persetujuan dana.</p>
    {query.status === "disimpan" ? <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-950">Versi draf tercatat. Aturan masih berupa usulan.</p> : null}
    <section aria-labelledby="versi-pilihan" className={box}><h2 id="versi-pilihan" className="text-xl font-bold">Usulan pada versi {data.selected.version}{latest ? " (terbaru)" : " (riwayat)"}</h2><p className="mt-3 text-sm leading-7 text-slate-600">Disimpan {programDate(data.selected.created_at)} oleh {data.selected.actor_name}.</p><p className="mt-1 break-all text-xs text-slate-500">ID aktor: {data.selected.actor_id} · Nama mengikuti profil saat versi disimpan.</p><p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-7"><strong>Alasan:</strong> {data.selected.reason}</p><ProgramProposalSummary document={data.selected.document} /></section>
    {!latest ? <section aria-labelledby="perbedaan-versi" className={box}><h2 id="perbedaan-versi" className="text-xl font-bold">Dibandingkan dengan versi draf terbaru</h2><ProgramProposalDiff before={data.selected.document} after={data.current.document} /><Link href={`/admin/program/${id}`} className="mt-5 inline-block min-h-11 py-3 text-sm font-semibold text-emerald-900 underline">Buka dan sunting versi draf terbaru</Link></section> : <details className={box}><summary className="cursor-pointer text-xl font-bold">Sunting sebagai versi draf baru</summary><div className="mt-6"><p className="mb-5 text-sm leading-7 text-slate-600">Versi lama tetap menjadi riwayat. Beri alasan perubahan; jika tab atau admin lain sudah menyimpan, periksa versi terbaru sebelum mencoba lagi.</p><ProgramProposalForm key={data.current.version} programId={id} version={data.current.version} initial={data.current.document} requestId={randomUUID()} /></div></details>}
    <section aria-labelledby="riwayat-versi" className={box}><h2 id="riwayat-versi" className="text-xl font-bold">Riwayat versi ({data.history_count})</h2><form method="get" action={`/admin/program/${id}`} className="mt-5 flex flex-wrap items-end gap-3"><div><label htmlFor="program-history-version" className="mb-2 block text-sm font-semibold">Buka nomor versi</label><input id="program-history-version" name="version" type="number" min={1} max={data.current.version} defaultValue={data.selected.version} className="min-h-11 w-36 rounded-xl border border-slate-300 bg-white px-3 py-2" /></div><button type="submit" className="min-h-11 rounded-full border border-emerald-900 px-5 py-2 text-sm font-semibold text-emerald-900">Lihat versi</button></form>{data.history.length ? <ol className="mt-6 space-y-4">{data.history.map(row => <li key={row.version} className="rounded-xl border border-slate-200 p-5"><Link href={`?version=${row.version}&page=${page + 1}`} aria-current={row.version === data.selected.version ? "page" : undefined} className="font-bold text-emerald-900 underline">Versi {row.version}</Link><p className="mt-2 text-xs leading-6 text-slate-500">{row.actor_name} · {programDate(row.created_at)}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{row.reason}</p></li>)}</ol> : <p className="mt-5 text-sm text-slate-600">Tidak ada versi pada halaman ini.</p>}<nav aria-label="Halaman riwayat versi program" className="mt-5 flex gap-5 text-sm font-semibold text-emerald-900">{page > 0 ? <Link href={`?version=${data.selected.version}&page=${page}`} className="min-h-11 py-3 underline">Sebelumnya</Link> : null}{(page + 1) * 20 < data.history_count ? <Link href={`?version=${data.selected.version}&page=${page + 2}`} className="min-h-11 py-3 underline">Berikutnya</Link> : null}</nav></section>
  </main>;
}
