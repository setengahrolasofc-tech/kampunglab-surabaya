"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconSearch } from "./icons";
import { LogoHero } from "./logo";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/panduan", label: "Program" },
  { href: "/etalase", label: "Inovasi" },
  { href: "#tentang", label: "Tentang Kami" },
];

/**
 * Di puncak halaman header transparan berisi logo (mockup "LANDING PAGE").
 * Setelah digulir, header menempel di atas sebagai bilah putih bersudut membulat (mockup "2")
 * dan menampilkan logo LENGKAP: monogram K + tulisan "KampungLab Surabaya", plus menu.
 * Di HP, menu menjadi tombol hamburger.
 */
export function LandingHeader({ masukHref, masukLabel }: { masukHref: string; masukLabel: string }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const menuOpen = open && solid; // menu hanya relevan saat header menempel

  return (
    <header
      className={`no-print fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-[background,box-shadow,border-radius] duration-300 ${solid ? "rounded-b-[26px] bg-white shadow-md sm:rounded-b-[30px]" : "bg-transparent"}`}
    >
      <div className={`flex items-center justify-between px-5 transition-[height,padding] duration-300 sm:px-[5.5vw] ${solid ? "h-[60px]" : "h-[76px] pt-2 sm:h-[110px] sm:pt-16"}`}>
        <Link href="/" aria-label="KampungLab Surabaya, beranda" className="flex items-center">
          <LogoHero size={solid ? 32 : 34} />
        </Link>
        {/* Menu muncul saat header menempel; di puncak halaman hanya logo, sesuai mockup. */}
        {solid && (
          <>
            <nav aria-label="Navigasi utama" className="hidden items-center gap-6 text-sm font-medium text-[#14304a] md:flex">
              {NAV.map((n) => <Link key={n.label} href={n.href} className="hover:text-[#0b5aa6]">{n.label}</Link>)}
              <Link href="/papan-masalah" aria-label="Cari di Papan Masalah" className="p-1"><IconSearch size={17} /></Link>
              <Link href={masukHref} className="rounded-lg bg-[#0b5aa6] px-4 py-1.5 font-semibold text-white">{masukLabel}</Link>
            </nav>
            <div className="flex items-center gap-2 md:hidden">
              <Link href={masukHref} className="rounded-lg bg-[#0b5aa6] px-3.5 py-1.5 text-sm font-semibold text-white">{masukLabel}</Link>
              <button
                type="button"
                aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
                aria-expanded={menuOpen}
                aria-controls="menu-mobile"
                onClick={() => setOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[#14304a] active:bg-[#eef3f8]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
      {menuOpen && (
        <nav id="menu-mobile" aria-label="Menu" className="mx-3 mb-3 mt-1 grid rounded-2xl bg-white p-2 text-[15px] font-medium text-[#14304a] shadow-lg md:hidden">
          {NAV.map((n) => <Link key={n.label} href={n.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 active:bg-[#eef3f8]">{n.label}</Link>)}
          <Link href="/papan-masalah" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 active:bg-[#eef3f8]">Cari di Papan Masalah</Link>
        </nav>
      )}
    </header>
  );
}
