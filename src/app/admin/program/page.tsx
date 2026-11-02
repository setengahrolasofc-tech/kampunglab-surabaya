import type { Metadata } from "next";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { ProgramProposalForm } from "@/components/program-proposal-form";
import { getProgramDrafts } from "@/lib/programs/data";
import { programDate, programPage, programPeriod } from "@/lib/programs/display";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draf program dan kebijakan", robots: { index: false, follow: false } };
export default async function ProgramDraftsPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const query = await searchParams;
  if (Array.isArray(query.page)) notFound();
  const page = programPage(query.page), data = await getProgramDrafts(page);
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
    <Link href="/admin" className="font-semibold text-emerald-900 underline underline-offset-4">Pengelolaan admin</Link>
    <p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">PENYUSUNAN USULAN · FR-19</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Draf program dan kebijakan</h1>
    <p className="mt-5 rounded-xl bg-amber-50 p-5 text-sm leading-7 text-amber-950">Susun usulan program/periode dan aturan evaluasi, simpan alasannya, lalu tinjau perubahan antarversi. Semua entri di sini berstatus draf. Penyimpanan belum menetapkan D-02/D-03 atau memberlakukan aturan pada pengajuan.</p>
    <details className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6"><summary className="cursor-pointer text-xl font-bold">Buat draf program/periode</summary><div className="mt-6"><p className="mb-5 text-sm leading-7 text-slate-600">Kode dan nama wajib diisi. Kolom usulan yang belum dibahas boleh tetap kosong. Kode menjadi identitas tetap draf; setiap perubahan data berikutnya mempunyai versi tersendiri.</p><ProgramProposalForm requestId={randomUUID()} /></div></details>
    <section aria-labelledby="daftar-draf" className="mt-8"><h2 id="daftar-draf" className="text-xl font-bold">Draf tersimpan</h2>{!data ? <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-5 text-amber-950">Daftar belum dapat dimuat. Muat ulang sebelum membuat atau melanjutkan perubahan.</p> : <><p className="mt-3 text-sm text-slate-600">{data.count} draf program/periode · Halaman {page + 1}</p>{data.rows.length ? <ul className="mt-5 space-y-4">{data.rows.map(row => <li key={row.id} className="rounded-2xl border border-emerald-950/10 bg-white p-6"><p className="text-xs font-bold text-amber-800">DRAF · VERSI {row.version}</p><h3 className="mt-2 text-xl font-bold"><Link href={`/admin/program/${row.id}`} className="break-words text-emerald-900 underline underline-offset-4">{row.name}</Link></h3><p className="mt-2 break-all text-sm font-semibold">{row.code}</p><p className="mt-3 text-sm leading-7 text-slate-600">Usulan periode: {programPeriod(row.period_start)} — {programPeriod(row.period_end)}<br />Terakhir disimpan {programDate(row.updated_at)}</p></li>)}</ul> : <p className="mt-5 rounded-xl border border-dashed p-6 text-sm text-slate-600">Belum ada draf pada halaman ini. Tidak ada program atau kebijakan contoh yang diaktifkan otomatis.</p>}<nav aria-label="Halaman draf program" className="mt-6 flex gap-5 text-sm font-semibold text-emerald-900">{page > 0 ? <Link href={`?page=${page}`} className="min-h-11 py-3 underline">Sebelumnya</Link> : null}{(page + 1) * 20 < data.count ? <Link href={`?page=${page + 2}`} className="min-h-11 py-3 underline">Berikutnya</Link> : null}</nav></>}</section>
  </main>;
}
