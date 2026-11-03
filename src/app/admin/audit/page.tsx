import type { Metadata } from "next";
import Link from "next/link";
import { Main, PageHeader, btnOutline, inputCls } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { tanggal } from "@/lib/domain/format.mjs";

export const metadata: Metadata = { title: "Audit Log" };
const PER = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; hal?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("BRIDA_ADMIN");
  const hal = Math.max(1, Number(sp.hal) || 1);
  const q = (sp.q ?? "").replace(/[%,()]/g, " ").trim().slice(0, 60);
  let query = supabase.from("audit_logs").select("id, aktor_id, aksi, target, detail_json, waktu", { count: "exact" }).order("waktu", { ascending: false }).range((hal - 1) * PER, hal * PER - 1);
  if (q) query = query.ilike("aksi", `%${q}%`);
  const { data, count } = await query;
  const ids = [...new Set((data ?? []).map((a) => a.aktor_id).filter(Boolean))] as string[];
  const { data: users } = ids.length ? await supabase.from("users").select("id, name, role").in("id", ids) : { data: [] };
  const nama = new Map((users ?? []).map((u) => [u.id, `${u.name} (${u.role})`]));
  const maxHal = Math.max(1, Math.ceil((count ?? 0) / PER));
  return (
    <Main>
      <PageHeader title="Audit Log" subtitle="Persetujuan, mandat, keputusan, bukti transfer, dan perubahan status. Tidak dapat diubah dari aplikasi." actions={<Link href="/admin" className={btnOutline}>← Dashboard</Link>} />
      <form method="get" className="mb-4 flex gap-2"><input name="q" defaultValue={q} placeholder="Filter aksi (mis. MANDAT, TRANSFER, STATUS)" aria-label="Filter aksi" className={inputCls + " !w-80"} /><button className={btnOutline}>Filter</button></form>
      <div className="overflow-x-auto rounded-2xl border border-celadon bg-white"><table className="w-full text-xs">
        <thead><tr className="border-b border-celadon text-left uppercase text-indigo-space/60"><th className="p-3">Waktu</th><th>Aktor</th><th>Aksi</th><th>Target</th><th>Detail</th></tr></thead>
        <tbody>{(data ?? []).map((a) => (<tr key={a.id} className="border-b border-celadon/50 align-top"><td className="p-3 whitespace-nowrap">{tanggal(a.waktu, true)}</td><td>{a.aktor_id ? nama.get(a.aktor_id) ?? a.aktor_id.slice(0, 8) : "sistem"}</td><td className="font-semibold">{a.aksi}</td><td className="font-mono">{a.target}</td><td className="max-w-xs break-words font-mono text-[0.65rem] text-indigo-space/70">{JSON.stringify(a.detail_json)}</td></tr>))}</tbody></table></div>
      <p className="mt-3 flex items-center gap-3 text-sm">Halaman {hal} dari {maxHal}
        {hal > 1 && <Link href={`/admin/audit?q=${encodeURIComponent(q)}&hal=${hal - 1}`} className={btnOutline}>← Sebelumnya</Link>}
        {hal < maxHal && <Link href={`/admin/audit?q=${encodeURIComponent(q)}&hal=${hal + 1}`} className={btnOutline}>Berikutnya →</Link>}</p>
    </Main>
  );
}
