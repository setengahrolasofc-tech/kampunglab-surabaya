import type { Metadata } from "next";
import Link from "next/link";
import { Card, Main, PageHeader, SectionTitle, Stat, btnOutline } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { angka, rupiah } from "@/lib/domain/format.mjs";
import { statusLabel } from "@/lib/domain/workflow.mjs";

export const metadata: Metadata = { title: "Statistik Eksekutif" };

export default async function StatistikPage() {
  const { supabase } = await requireRole("BRIDA_ADMIN");
  await supabase.rpc("sync_due_tests");
  const [{ data }, { data: pub }] = await Promise.all([supabase.rpc("brida_stats"), supabase.rpc("public_stats")]);
  const s = (data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const p = (pub ?? {}) as Record<string, number>;
  const perStatus = Object.entries((s.per_status ?? {}) as Record<string, number>).sort((a, b) => b[1] - a[1]);
  const maks = Math.max(1, ...perStatus.map(([, n]) => n));
  const dana = (s.dana_per_tahap ?? {}) as Record<string, number>;
  return (
    <Main>
      <PageHeader title="Statistik Eksekutif" subtitle="Ringkasan program untuk pimpinan BRIDA." actions={<Link href="/admin" className={btnOutline}>← Dashboard</Link>} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Inovasi terbit (Rapor)" value={angka(p.inovasi_terbit)} /><Stat label="Inovasi berjalan" value={angka(p.inovasi_berjalan)} />
        <Stat label="Dana tercatat cair" value={rupiah(p.total_dana_cair)} /><Stat label="Warga penguji" value={angka(s.warga_penguji)} />
        <Stat label="Inovator terdaftar" value={angka(s.total_inovator)} /><Stat label="Kelurahan bermandat" value={`${angka(s.kelurahan_bermandat)} / 154`} />
        <Stat label="Masalah terbuka / selesai" value={`${angka(p.masalah_terbuka)} / ${angka(p.masalah_selesai)}`} /><Stat label="Rata-rata rating uji" value={s.rata_rating ? angka(s.rata_rating, 2) : "—"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><SectionTitle>Pengajuan per status</SectionTitle>
          <ul className="space-y-2">{perStatus.map(([st, n]) => (<li key={st} className="text-sm"><div className="flex justify-between"><span>{statusLabel(st)}</span><strong>{n}</strong></div><div className="h-1.5 rounded-full bg-celadon/60"><div className="h-1.5 rounded-full bg-teal-deep" style={{ width: `${(n / maks) * 100}%` }} /></div></li>))}
            {perStatus.length === 0 && <li className="text-sm text-indigo-space/60">Belum ada data.</li>}</ul></Card>
        <Card><SectionTitle>Dana tercatat per tahap</SectionTitle>
          <ul className="space-y-2 text-sm">{["TAHAP_1_30", "TAHAP_2_30", "TAHAP_3_40"].map((t) => <li key={t} className="flex justify-between"><span>{t.replace("TAHAP_", "Tahap ").replace(/_(\d+)$/, " ($1%)")}</span><strong>{rupiah(dana[t] ?? 0)}</strong></li>)}</ul>
          <p className="mt-3 text-xs text-indigo-space/60">Angka berasal dari bukti transfer yang dicatat Kelurahan, bukan dari transaksi di website.</p></Card>
      </div>
    </Main>
  );
}
