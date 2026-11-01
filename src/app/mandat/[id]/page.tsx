import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/admin/validation.mjs";
import { MandateDelegationForm } from "@/components/mandate-delegation-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tetapkan admin wilayah", robots: { index: false, follow: false } };
type Overview = { territory: { id: string; kind: "rt" | "rw" | "kelurahan"; name: string; parent_name: string | null }; residents: number; assigned: boolean };
const officeName = { rt: "admin RT", rw: "admin RW", kelurahan: "admin kelurahan" } as const;

export default async function DelegatedMandatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("delegated_mandate", { operation: "overview", payload: { territory_id: id } });
  if (error?.message === "DELEGATION_UNAVAILABLE") notFound();
  const overview = error ? null : data as unknown as Overview;
  const label = overview ? officeName[overview.territory.kind] : "admin";
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
    <Link href="/notifikasi" className="font-semibold text-emerald-900 underline underline-offset-4">Notifikasi</Link>
    {!overview ? <p role="alert" className="mt-7 rounded-xl bg-amber-50 p-5 leading-7 text-amber-950">Data wilayah belum dapat dimuat. Muat ulang halaman.</p> : <>
      <p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">PENETAPAN ADMIN WILAYAH</p>
      <h1 className="mt-3 text-3xl font-bold">{overview.territory.name}{overview.territory.parent_name ? <span className="block text-lg font-normal text-slate-600">{overview.territory.parent_name}</span> : null}</h1>
      <p className="mt-4 leading-7 text-slate-700">{overview.residents} warga mendaftar dengan domisili di wilayah ini. {overview.assigned ? `${label[0].toUpperCase()}${label.slice(1)} sudah ditetapkan.` : `Tetapkan ${label} agar pengajuan warga dari wilayah ini dapat diperiksa.`}</p>
      {query.status === "ditetapkan" ? <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-950">Penetapan tercatat. Notifikasi untuk wilayah ini sudah hilang dari daftar.</p> : null}
      {overview.assigned ? null : <div className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6"><MandateDelegationForm territoryId={overview.territory.id} officeLabel={label} /></div>}
      <p className="mt-6 text-sm leading-6 text-slate-600">Penetapan ini membuat mandat utama aktif tanpa batas akhir dan tercatat di audit. Pencabutan atau penggantian dilakukan admin program lewat halaman Admin.</p>
    </>}
  </main>;
}
