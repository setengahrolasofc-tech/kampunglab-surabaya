import type { Metadata } from "next";
import Link from "next/link";
import { getDraftContext } from "@/lib/drafts/data";
import { DomicileForm } from "@/components/draft-entry-forms";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wilayah domisili", robots: { index:false,follow:false } };
export default async function DomicilePage() {
  const { profile, territories } = await getDraftContext();
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8"><Link href="/dashboard" className="text-sm font-semibold text-emerald-900 underline">Dashboard pribadi</Link><h1 className="mt-6 text-3xl font-bold">Wilayah domisili</h1><p className="mt-4 leading-7 text-slate-600">Pilih domisilimu secara berurutan. Wilayah ini menjadi isian awal untuk draf baru; perubahan profil tidak mengubah wilayah draf yang sudah ada.</p><section aria-label="Formulir domisili" className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6"><DomicileForm territories={territories} initialRt={profile.domicile_rt_id ?? ""} /></section><Link href="/pengajuan" className="mt-6 inline-block font-semibold text-emerald-900 underline">Pengajuan Saya</Link></main>;
}
