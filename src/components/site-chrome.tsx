import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth/session";
import { signOutAction } from "@/app/auth/actions";
import { LogoFull, LogoMark } from "./logo";
import { NotificationBell } from "./notification-bell";
import { btnOutline, btnPrimary } from "./ui";

const NAV = [
  { href: "/papan-masalah", label: "Papan Masalah" },
  { href: "/etalase", label: "Etalase Inovasi" },
  { href: "/panduan", label: "Panduan" },
  { href: "/dokumen", label: "Template" },
];

export async function SiteHeader() {
  const session = await getSession();
  const role = session?.profile.role;
  return (
    <header className="no-print sticky top-0 z-40 bg-indigo-space text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" aria-label="KampungLab Surabaya, beranda" className="flex items-center gap-2">
          <span className="hidden rounded-lg bg-white px-3 py-1.5 sm:block"><LogoFull size={30} /></span>
          <span className="rounded-lg bg-white p-1 sm:hidden"><LogoMark size={30} /></span>
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-5 text-sm font-medium md:flex">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="text-white/85 hover:text-gold">{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <NotificationBell />
              <Link href={homeFor(role!)} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20">
                {role === "BRIDA_ADMIN" ? "Admin" : role === "KELURAHAN" ? "Kelurahan" : "Dashboard"}
              </Link>
              <form action={signOutAction}><button className="rounded-lg px-3 py-1.5 text-sm text-white/80 hover:text-gold">Keluar</button></form>
            </>
          ) : (
            <>
              <Link href="/masuk" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white hover:text-gold">Masuk</Link>
              <Link href="/daftar" className={btnPrimary + " !bg-gold !text-indigo-space hover:!bg-gold/90"}>Daftar</Link>
            </>
          )}
        </div>
      </div>
      <nav aria-label="Navigasi utama (ponsel)" className="flex gap-4 overflow-x-auto border-t border-white/10 px-4 py-2 text-xs font-medium md:hidden">
        {NAV.map((n) => <Link key={n.href} href={n.href} className="whitespace-nowrap text-white/85">{n.label}</Link>)}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-12 bg-indigo-space text-white/85">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3"><span className="rounded-lg bg-white px-3 py-1.5"><LogoFull size={28} /></span></div>
        <div className="max-w-xl space-y-1 text-xs">
          <p>Dari ide warga, jadi bukti nyata. Website ini tidak menyimpan atau memindahkan uang: transfer dilakukan Kelurahan di luar aplikasi, website hanya mencatat bukti.</p>
          <p className="text-white/60">KampungLab Surabaya · konsep Inovboyo 2.0 · Handbook Rev. 4</p>
        </div>
        <nav aria-label="Tautan footer" className="flex gap-4 text-xs"><Link href="/panduan" className="hover:text-gold">Panduan</Link><Link href="/dokumen" className="hover:text-gold">Template</Link><Link href="/verifikasi" className="hover:text-gold">Verifikasi Rapor</Link></nav>
      </div>
    </footer>
  );
}

export { btnOutline };
