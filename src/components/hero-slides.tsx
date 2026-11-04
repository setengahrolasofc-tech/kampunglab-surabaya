"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  { base: "/images/hero-kabut", alt: "", pos: "62% 50%" },
  { base: "/images/hero-fajar", alt: "", pos: "50% 50%" },
];

/**
 * Dua foto hero (kabut pagi ↔ fajar sawah) bergantian halus. Memakai srcSet (1200 px untuk HP, 2400 px untuk layar lebar/retina)
 * dan object-cover, jadi tajam di desktop, iPad, dan iPhone. Tanpa pergantian bila perangkat meminta gerak dikurangi.
 */
export function HeroSlides() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);
  return (
    <div aria-hidden className="absolute inset-0 -z-10 bg-[#33442f]">
      {SLIDES.map((s, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={s.base}
          src={`${s.base}.jpg`}
          srcSet={`${s.base}-1200.jpg 1200w, ${s.base}.jpg 2400w`}
          sizes="100vw"
          alt={s.alt}
          decoding="async"
          fetchPriority={idx === 0 ? "high" : "low"}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms]"
          style={{ objectPosition: s.pos, opacity: i === idx ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
