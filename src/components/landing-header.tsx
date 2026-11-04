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
 * Mockup "LANDING PAGE": di puncak halaman header transparan (logo K + KampungLab di atas foto).
 * Mockup "2": setelah digulir, header menjadi bilah putih dengan sudut bawah membulat dan monogram K.
 */
export function LandingHeader({ masukHref, masukLabel }: { masukHref: string; masukLabel: string }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={`no-print fixed inset-x-0 top-0 z-40 transition-all duration-300 ${solid ? "h-[60px] rounded-b-[30px] bg-white shadow-md" : "h-[110px] bg-transparent"}`}
    >
      <div className="flex h-full items-center justify-between px-[20px] sm:px-[35px]" style={{ paddingTop: solid ? 0 : 64 }}>
        <Link href="/" aria-label="KampungLab Surabaya, beranda" className="flex items-center">
          <span className={solid ? "" : "sm:translate-x-[40px]"}>
            <LogoHero size={solid ? 30 : 34} compact={solid} />
          </span>
        </Link>
        {/* Di puncak halaman (mockup "LANDING PAGE") header hanya memuat logo; menu muncul di bilah putih setelah digulir. */}
        {solid && (
          <>
            <nav aria-label="Navigasi utama" className="hidden items-center gap-6 text-sm font-medium text-[#14304a] md:flex">
              {NAV.map((n) => <Link key={n.label} href={n.href} className="hover:text-[#0b5aa6]">{n.label}</Link>)}
              <Link href="/papan-masalah" aria-label="Cari di Papan Masalah" className="p-1"><IconSearch size={17} /></Link>
              <Link href={masukHref} className="rounded-lg bg-[#0b5aa6] px-4 py-1.5 font-semibold text-white">{masukLabel}</Link>
            </nav>
            <Link href={masukHref} className="rounded-lg bg-[#0b5aa6] px-4 py-1.5 text-sm font-semibold text-white md:hidden">{masukLabel}</Link>
          </>
        )}
      </div>
    </header>
  );
}
