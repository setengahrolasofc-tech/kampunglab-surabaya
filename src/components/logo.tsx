import type { SVGProps } from "react";

/** Monogram "K" geometris: gradasi #007991 → #439A86 dengan lingkaran emas #E9D985 di kanan atas (Bab 8.5). */
export function LogoMark({ size = 40, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="KampungLab" {...props}>
      <defs>
        <linearGradient id="kl-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#007991" />
          <stop offset="1" stopColor="#439A86" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="9" height="40" rx="3" fill="url(#kl-grad)" />
      <path d="M17 24 L33 6 H44 L28 24 L44 42 H33 Z" fill="url(#kl-grad)" />
      <circle cx="40" cy="9" r="5.5" fill="#E9D985" />
    </svg>
  );
}

/** Versi penuh (Masuk, kop Rapor). Di latar gelap, letakkan di dalam kontainer putih. */
export function LogoFull({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="leading-tight">
        <span className="block text-xl font-bold tracking-tight"><span className="text-teal-deep">Kampung</span><span className="text-indigo-space">Lab</span></span>
        <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-indigo-space/70">Surabaya</span>
      </span>
    </span>
  );
}

/** Logo hero (mockup "LANDING PAGE"): monogram K + wordmark biru "KampungLab" dan "SURABAYA" kecil. Langsung di atas foto, tanpa kotak putih. */
export function LogoHero({ size = 34, compact = false }: { size?: number; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      {!compact && (
        <span className="leading-none">
          <span className="block font-[family-name:var(--font-logo)] text-[1.2rem] font-extrabold tracking-tight text-[#0b5aa6]">KampungLab</span>
          <span className="mt-1 block text-center text-[0.5rem] font-bold uppercase tracking-[0.42em] text-[#0b5aa6]">Surabaya</span>
        </span>
      )}
    </span>
  );
}

/** Logo rumah hijau-biru dari mockup Landing Page/Dashboard (sidebar, footer). */
export function LogoHouse({ size = 28, light = false }: { size?: number; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="KampungLab Surabaya" fill="none">
        <path d="M16 3 3.5 12.5V28a1 1 0 0 0 1 1H27.5a1 1 0 0 0 1-1V12.5Z" fill="#2fbf9b" />
        <path d="M16 3 28.5 12.5V28a1 1 0 0 1-1 1H16Z" fill="#1a9a86" />
        <path d="M16 11.5 8.5 17.5V26h15v-8.5Z" fill={light ? "#14304a" : "#fff"} />
        <path d="M16 15.5 12.5 18.5V26h7v-7.5Z" fill="#2fbf9b" />
      </svg>
      <span className={`text-[0.8rem] font-bold leading-[1.05] ${light ? "text-white" : "text-[#14304a]"}`}>KampungLab<br />Surabaya</span>
    </span>
  );
}
