import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/auth/actions";
import { IconBell, IconBoard, IconBook, IconCaret, IconChart, IconEdit, IconFolder, IconGear, IconHeadset, IconHome, IconInsta, IconPlay, IconQr, IconSearch } from "./icons";
import { LogoHouse } from "./logo";
import { SidebarNav, type NavItem } from "./sidebar-nav";

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Beranda", icon: <IconHome />, exact: true },
  { href: "/dashboard/proyek", label: "Proyek Saya", icon: <IconFolder />, match: ["/dashboard/proyek"] },
  { href: "/dashboard/pengajuan/baru", label: "Pengajuan Inovasi", icon: <IconEdit />, match: ["/dashboard/pengajuan"] },
  { href: "/papan-masalah", label: "Papan Masalah", icon: <IconBoard /> },
  { href: "/etalase", label: "Data & Laporan", icon: <IconChart /> },
  { href: "/panduan", label: "Panduan", icon: <IconBook /> },
  { href: "/ubah-kata-sandi", label: "Pengaturan", icon: <IconGear /> },
];

const inisial = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]!.toUpperCase()).join("");

/** Kerangka halaman mockup "Homepage (Dashboard)": sidebar navy, topbar (cari, lonceng, profil), dan footer. */
export function DashboardShell({ name, roleLabel, unread, children }: { name: string; roleLabel: string; unread: number; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9] lg:flex">
      {/* Sidebar desktop */}
      <aside className="no-print hidden w-[220px] shrink-0 bg-[#14304a] px-3 py-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link href="/" aria-label="KampungLab Surabaya, beranda" className="mb-6 px-2"><LogoHouse size={30} light /></Link>
        <SidebarNav items={ITEMS} />
        <div className="mt-auto flex items-center gap-2.5 rounded-xl bg-white/10 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#7fe0c4]"><IconHeadset size={18} /></span>
          <p className="text-[11px] leading-tight"><span className="block font-semibold">Butuh Bantuan?</span><span className="text-white/70">Hubungi Tim KampungLab</span></p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bilah atas ponsel */}
        <div className="no-print bg-[#14304a] px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] lg:hidden">
          <Link href="/" className="mb-2 block"><LogoHouse size={26} light /></Link>
          <SidebarNav items={ITEMS} orientation="horizontal" />
        </div>

        <header className="no-print flex items-center gap-3 px-4 py-3.5 sm:px-7">
          <form action="/papan-masalah" role="search" className="relative max-w-md flex-1">
            <label htmlFor="cari-dashboard" className="sr-only">Cari proyek, inovasi, atau kelurahan</label>
            <IconSearch size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#14304a]/45" />
            <input id="cari-dashboard" name="q" placeholder="Cari proyek, inovasi, atau kelurahan..." className="w-full rounded-full border-0 bg-[#e6ecf2] py-2 pl-9 pr-4 text-base text-[#14304a] sm:text-xs placeholder:text-[#14304a]/45 focus:outline-none focus:ring-2 focus:ring-[#1fa68a]/40" />
          </form>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/notifikasi" className="relative p-1.5 text-[#14304a]" aria-label={unread ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}>
              <IconBell size={19} />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-[1.05rem] rounded-full bg-[#e9b949] px-1 text-center text-[0.6rem] font-bold text-[#14304a]">{unread > 99 ? "99+" : unread}</span>}
            </Link>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#bdebcf] text-[11px] font-bold text-[#14304a]">{inisial(name)}</span>
                <span className="hidden text-left leading-tight sm:block"><span className="block text-[11px] font-semibold text-[#14304a]">{name}</span><span className="block text-[9px] text-[#14304a]/60">{roleLabel}</span></span>
                <IconCaret size={10} className="text-[#14304a]/60" />
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-[#dbe5ee] bg-white p-1.5 text-sm shadow-lg">
                <Link href="/ubah-kata-sandi" className="block rounded-lg px-3 py-2 hover:bg-[#eef3f8]">Pengaturan akun</Link>
                <form action={signOutAction}><button className="block w-full rounded-lg px-3 py-2 text-left hover:bg-[#eef3f8]">Keluar</button></form>
              </div>
            </details>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-8 sm:px-7">{children}</div>

        <footer className="no-print border-t border-[#dbe5ee] bg-white">
          <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 text-[11px] text-[#14304a] sm:flex-row sm:px-7">
            <LogoHouse size={22} />
            <nav aria-label="Tautan footer" className="flex gap-6 font-medium">
              <Link href="/" className="hover:text-[#1a8f86]">Beranda</Link><Link href="/panduan" className="hover:text-[#1a8f86]">Program</Link>
              <Link href="/panduan#faq" className="hover:text-[#1a8f86]">FAQ</Link><Link href="/verifikasi" className="hover:text-[#1a8f86]">Kontak</Link>
            </nav>
            <div className="flex items-center gap-3"><IconPlay size={15} /><IconInsta size={15} /><IconQr size={15} /></div>
          </div>
        </footer>
      </div>
    </div>
  );
}
