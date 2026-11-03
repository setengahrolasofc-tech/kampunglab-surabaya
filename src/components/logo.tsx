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

/** Versi penuh (Beranda, Masuk, kop Rapor). Di latar gelap, letakkan di dalam kontainer putih. */
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
