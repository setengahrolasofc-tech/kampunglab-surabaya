"use client";

import { useEffect, useState } from "react";

/** Dua latar hero dari mockup (kabut pagi ↔ fajar sawah) bergantian halus. Tanpa animasi bila pengguna meminta gerak dikurangi. */
export function HeroSlides() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % 2), 7000);
    return () => clearInterval(t);
  }, []);
  const layer = "absolute inset-0 bg-cover bg-center transition-opacity duration-[1600ms]";
  return (
    <div aria-hidden className="absolute inset-0 -z-10 bg-[#33442f]">
      <div className={layer} style={{ backgroundImage: "url(/images/hero-kabut.jpg)", opacity: i === 0 ? 1 : 0 }} />
      <div className={layer} style={{ backgroundImage: "url(/images/hero-fajar.jpg)", opacity: i === 1 ? 1 : 0 }} />
    </div>
  );
}
