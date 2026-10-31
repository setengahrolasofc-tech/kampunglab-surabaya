import Link from "next/link";
export default function DraftNotFound() {
  return <main id="konten-utama" className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-3xl font-bold">Draf tidak tersedia</h1><p className="mt-4 leading-7 text-slate-600">Draf tidak ditemukan atau tidak dapat dibuka oleh akunmu.</p><Link href="/pengajuan" className="mt-6 inline-block font-semibold text-emerald-900 underline">Kembali ke Pengajuan Saya</Link></main>;
}
