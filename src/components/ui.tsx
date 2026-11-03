import type { ReactNode } from "react";
import { STATUS_INFO } from "@/lib/domain/workflow.mjs";

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export const inputCls =
  "w-full rounded-lg border border-indigo-space/25 bg-white px-3 py-2 text-sm text-indigo-space placeholder:text-indigo-space/45 focus:border-teal-deep focus:outline-none focus:ring-2 focus:ring-teal-deep/30 disabled:bg-celadon/20";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-teal-deep px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-deep/90 disabled:cursor-not-allowed disabled:opacity-60";
export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-teal-deep px-4 py-2 text-sm font-semibold text-teal-deep transition hover:bg-celadon/40 disabled:opacity-60";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60";
export const linkCls = "font-semibold text-teal-deep underline-offset-2 hover:underline";

export function Main({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return <main className={cx("mx-auto w-full px-4 py-8 sm:px-6", narrow ? "max-w-3xl" : "max-w-6xl")}>{children}</main>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-indigo-space sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-indigo-space/75">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", tone = "putih" }: { children: ReactNode; className?: string; tone?: "putih" | "celadon" | "gelap" | "emas" }) {
  const t = { putih: "bg-white border-celadon", celadon: "bg-celadon/40 border-celadon", gelap: "bg-indigo-space text-white border-indigo-space", emas: "bg-gold/30 border-gold" }[tone];
  return <section className={cx("rounded-2xl border p-5 shadow-sm", t, className)}>{children}</section>;
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return <h2 id={id} className="mb-3 text-lg font-bold text-indigo-space">{children}</h2>;
}

const TONES: Record<string, string> = {
  netral: "bg-celadon/60 text-indigo-space",
  info: "bg-teal-deep/10 text-teal-deep ring-1 ring-teal-deep/30",
  sukses: "bg-sea/15 text-[#2c6b5b] ring-1 ring-sea/40",
  perhatian: "bg-gold/50 text-indigo-space ring-1 ring-gold",
  bahaya: "bg-red-100 text-red-800 ring-1 ring-red-300",
};

export function Badge({ children, tone = "netral" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone])}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const info = STATUS_INFO[status];
  return <Badge tone={info?.tone ?? "netral"}>{info?.label ?? status}</Badge>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-indigo-space/25 bg-white/60 p-6 text-center text-sm text-indigo-space/70">{children}</p>;
}

export function Alert({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "sukses" | "bahaya" | "perhatian" }) {
  const cls = { info: "border-teal-deep/40 bg-teal-deep/5", sukses: "border-sea/50 bg-sea/10", bahaya: "border-red-300 bg-red-50 text-red-900", perhatian: "border-gold bg-gold/25" }[tone];
  return <div role={tone === "bahaya" ? "alert" : "status"} className={cx("rounded-xl border px-4 py-3 text-sm", cls)}>{children}</div>;
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-indigo-space">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-indigo-space/60">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-700" role="alert">{error}</p>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-celadon bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-space/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-indigo-space">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-indigo-space/60">{hint}</p>}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return <span aria-label={`Rating ${value} dari 5`} className="text-gold" style={{ textShadow: "0 0 1px #9a8a2a" }}>{"★".repeat(full)}<span className="text-indigo-space/20">{"★".repeat(Math.max(0, 5 - full))}</span></span>;
}

/** Garis waktu lima fase (Ajukan → Terbit). */
export function PhaseTimeline({ current }: { current: number }) {
  const phases = ["Ajukan", "Bangun", "Uji Warga", "Serah Terima", "Terbit"];
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Fase pengajuan">
      {phases.map((p, i) => {
        const n = i + 1;
        const done = current > n || current === 5;
        const active = current === n;
        return (
          <li key={p} className={cx("flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
            done ? "bg-sea text-white" : active ? "bg-teal-deep text-white" : "bg-celadon/60 text-indigo-space/70")} aria-current={active ? "step" : undefined}>
            <span aria-hidden>{done ? "✓" : n}</span>{p}
          </li>
        );
      })}
    </ol>
  );
}
