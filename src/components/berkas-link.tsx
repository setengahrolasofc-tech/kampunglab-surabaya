import { linkCls } from "./ui";

/** Tautan ke berkas privat lewat /berkas (diperiksa RLS saat diklik). */
export function BerkasLink({ path, label }: { path: string | null | undefined; label: string }) {
  if (!path) return <span className="text-sm text-indigo-space/50">{label}: belum ada</span>;
  return <a href={`/berkas?path=${encodeURIComponent(path)}`} target="_blank" rel="noopener noreferrer" className={`${linkCls} text-sm`}>{label} ↗</a>;
}
