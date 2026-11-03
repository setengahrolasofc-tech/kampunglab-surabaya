import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { Empty, Main, PageHeader, SectionTitle, StatusBadge, btnOutline, inputCls } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { rupiah, tanggal } from "@/lib/domain/format.mjs";
import { STATUSES, statusLabel } from "@/lib/domain/workflow.mjs";

export const metadata: Metadata = { title: "Banding & Sengketa" };

type Row = { id: string; judul: string; status: string; total_rab: number; kode_unik: string; status_changed_at: string; kelurahan: { kecamatan: string; kelurahan: string } | null };

function List({ rows, kosong }: { rows: Row[]; kosong: string }) {
  return rows.length === 0 ? <Empty>{kosong}</Empty> : (
    <ul className="space-y-2">{rows.map((i) => (
      <li key={i.id}><Link href={`/admin/pengajuan/${i.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-celadon bg-white p-4 hover:bg-celadon/30">
        <span><span className="font-semibold">{i.judul}</span><br /><span className="text-xs text-indigo-space/65">{i.kode_unik} · Kel. {i.kelurahan?.kelurahan}, Kec. {i.kelurahan?.kecamatan} · RAB {rupiah(i.total_rab)} · {tanggal(i.status_changed_at)}</span></span><StatusBadge status={i.status} /></Link></li>))}</ul>);
}

export default async function SengketaPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; status?: string; q?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("BRIDA_ADMIN");
  const filter = sp.status && STATUSES.includes(sp.status) ? sp.status : null;
  const q = (sp.q ?? "").replace(/[%,()]/g, " ").trim().slice(0, 60);
  const sel = "id, judul, status, total_rab, kode_unik, status_changed_at, kelurahan:master_kelurahan(kecamatan, kelurahan)";
  const [{ data: banding }, { data: sengketa }] = await Promise.all([
    supabase.from("innovations").select(sel).eq("status", "APPEALED").order("status_changed_at"),
    supabase.from("innovations").select(sel).eq("status", "DISPUTED").order("status_changed_at"),
  ]);
  let all = supabase.from("innovations").select(sel).neq("status", "DRAFT").order("status_changed_at", { ascending: false }).limit(100);
  if (filter) all = all.eq("status", filter);
  if (q) all = all.or(`judul.ilike.%${q}%,kode_unik.ilike.%${q}%`);
  const { data: semua } = await all;
  return (
    <Main>
      <PageHeader title="Meja Banding & Sengketa" subtitle="Putus banding, mediasi Lapor Kendala, dan hentikan proyek mangkrak/fiktif." actions={<Link href="/admin" className={btnOutline}>← Dashboard</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="space-y-8">
        <section><SectionTitle>Banding menunggu putusan ({(banding ?? []).length})</SectionTitle><List rows={(banding ?? []) as unknown as Row[]} kosong="Tidak ada banding." /></section>
        <section><SectionTitle>Sengketa terbuka ({(sengketa ?? []).length})</SectionTitle><List rows={(sengketa ?? []) as unknown as Row[]} kosong="Tidak ada sengketa." /></section>
        <section>
          <SectionTitle>Semua pengajuan</SectionTitle>
          <form method="get" className="mb-3 flex flex-wrap gap-2"><input name="q" defaultValue={q} placeholder="Cari judul atau kode" aria-label="Cari" className={inputCls + " !w-64"} />
            <select name="status" defaultValue={filter ?? ""} aria-label="Status" className={inputCls + " !w-64"}><option value="">Semua status</option>{STATUSES.filter((s) => s !== "DRAFT").map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select><button className={btnOutline}>Cari</button></form>
          <List rows={(semua ?? []) as unknown as Row[]} kosong="Tidak ada hasil." />
        </section>
      </div>
    </Main>
  );
}
