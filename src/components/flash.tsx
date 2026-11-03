import { Alert } from "./ui";

/** Menampilkan pesan hasil aksi dari query ?ok= / ?err= (lihat lib/flash.ts). */
export function Flash({ ok, err }: { ok?: string | string[]; err?: string | string[] }) {
  const o = Array.isArray(ok) ? ok[0] : ok;
  const e = Array.isArray(err) ? err[0] : err;
  if (!o && !e) return null;
  return <div className="mb-4 space-y-2">{o && <Alert tone="sukses">{o}</Alert>}{e && <Alert tone="bahaya">{e}</Alert>}</div>;
}
