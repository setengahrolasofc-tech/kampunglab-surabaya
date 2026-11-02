// Logo (Handbook 8.5): monogram "K" gradasi #007991 -> #439A86 + lingkaran emas #E9D985. `compact` = monogram saja.
export function Logo({ compact = false, onDark = false }: { compact?: boolean; onDark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${onDark ? "rounded-xl bg-white px-3 py-1.5" : ""}`}>
      <svg width="36" height="36" viewBox="0 0 36 36" role="img" aria-label="KampungLab Surabaya">
        <defs><linearGradient id="kl-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#007991" /><stop offset="1" stopColor="#439A86" /></linearGradient></defs>
        <rect x="2" y="2" width="30" height="30" rx="8" fill="url(#kl-g)" />
        <path d="M11 9v18M11 18l9-9M11 18l9 9" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="29" cy="7" r="5" fill="#E9D985" />
      </svg>
      {compact ? null : (
        <span className="leading-tight text-indigo-space">
          <span className="text-lg font-bold"><span className="text-teal-deep">Kampung</span>Lab</span>
          <span className="block text-[10px] font-semibold tracking-[0.25em]">SURABAYA</span>
        </span>
      )}
    </span>
  );
}
