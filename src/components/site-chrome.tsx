import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-emerald-950/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" aria-label="KampungLab Surabaya, beranda" className="flex items-center gap-3 rounded-sm">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-emerald-900 text-sm font-bold text-white">
            KL
          </span>
          <span className="text-lg font-bold tracking-tight">
            KampungLab <span className="font-normal text-emerald-900">Surabaya</span>
          </span>
        </Link>
        <nav aria-label="Navigasi utama" className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/#alur" className="rounded-sm hover:text-emerald-700">Alur program</Link>
          <Link href="/panduan" className="rounded-sm hover:text-emerald-700">Panduan</Link>
          <Link href="/dashboard" className="rounded-sm hover:text-emerald-700">Akun</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-emerald-950/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm leading-6 text-slate-600 sm:px-8 md:flex-row md:items-start md:justify-between">
        <p className="font-semibold text-emerald-950">KampungLab Surabaya</p>
        <p className="max-w-xl md:text-right">
          Prototipe konsep. Pengajuan dan uji warga belum dibuka.
          Kebijakan program masih memerlukan validasi pengelola.
        </p>
      </div>
    </footer>
  );
}
