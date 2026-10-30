import Link from "next/link";

export default function NotFound() {
  return (
    <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
      <p className="text-sm font-bold text-emerald-800">404</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">Halaman belum tersedia.</h1>
      <p className="mt-5 max-w-lg leading-7 text-slate-600">Alamat ini tidak ditemukan. Kamu bisa kembali ke beranda untuk membaca konsep dan alur KampungLab.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Kembali ke beranda</Link>
    </main>
  );
}
