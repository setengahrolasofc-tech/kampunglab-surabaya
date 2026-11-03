import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { Badge, Card, Empty, Main, PageHeader, SectionTitle, Stat, btnOutline, btnPrimary, inputCls } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { KECAMATAN_KELURAHAN } from "@/lib/auth/surabaya-areas.mjs";
import { rupiah } from "@/lib/domain/format.mjs";

export const metadata: Metadata = { title: "Dashboard Admin BRIDA" };

type Kosong = { kelurahan_id: string; kecamatan: string; kelurahan: string; jumlah_menunggu: number; menunggu_sejak: string | null; lama_hari: number };

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; kec?: string; semua?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("BRIDA_ADMIN");
  await supabase.rpc("sync_due_tests");
  const kec = sp.kec && Object.hasOwn(KECAMATAN_KELURAHAN, sp.kec) ? sp.kec : null;
  const semua = sp.semua === "1";
  const [{ data: stats }, { data: kosong }] = await Promise.all([
    supabase.rpc("brida_stats"),
    supabase.rpc("kelurahan_tanpa_mandat", { p_kecamatan: kec, p_semua: semua }),
  ]);
  const s = (stats ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const rows = (kosong ?? []) as Kosong[];
  const totalDana = Object.values((s.dana_per_tahap ?? {}) as Record<string, number>).reduce((a, b) => a + Number(b), 0);
  return (
    <Main>
      <PageHeader title="Dashboard Admin BRIDA" subtitle="Antrean mandat, kelurahan tanpa admin, banding & sengketa, parameter sistem, dan audit." />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Antrean mandat" value={s.antrean_mandat ?? 0} hint="Pendaftar Kelurahan" />
        <Stat label="Banding menunggu" value={s.banding_menunggu ?? 0} />
        <Stat label="Sengketa terbuka" value={s.sengketa_terbuka ?? 0} />
        <Stat label="Dana tercatat cair" value={rupiah(totalDana)} hint="Hanya pencatatan bukti" />
      </div>
      <Card tone="emas" className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle id="kelurahan-kosong">Kelurahan belum bermandat</SectionTitle>
          <form className="flex flex-wrap items-end gap-2" method="get">
            <label className="text-xs font-semibold">Kecamatan<select name="kec" defaultValue={kec ?? ""} className={inputCls + " mt-1"}><option value="">Semua</option>{Object.keys(KECAMATAN_KELURAHAN).map((k) => <option key={k}>{k}</option>)}</select></label>
            <label className="flex items-center gap-1 text-xs font-semibold"><input type="checkbox" name="semua" value="1" defaultChecked={semua} /> Tampilkan semua yang belum bermandat</label>
            <button className={btnOutline}>Terapkan</button>
          </form>
        </div>
        {rows.length === 0 ? <div className="mt-3"><Empty>{semua ? "Semua kelurahan sudah bermandat." : "Tidak ada pengajuan yang menunggu kelurahan tanpa mandat."}</Empty></div> : (
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-gold text-left text-xs uppercase text-indigo-space/70"><th className="py-1.5">Kelurahan</th><th>Kecamatan</th><th>Pengajuan menunggu</th><th>Lama menunggu</th><th /></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.kelurahan_id} className="border-b border-gold/60">
                <td className="py-2 font-semibold">{r.kelurahan}</td><td>{r.kecamatan}</td>
                <td>{r.jumlah_menunggu > 0 ? <Badge tone="perhatian">{r.jumlah_menunggu} pengajuan</Badge> : "0"}</td>
                <td>{r.jumlah_menunggu > 0 ? `${r.lama_hari} hari` : "—"}</td>
                <td className="text-right"><Link href="/admin/mandat" className={btnPrimary}>Ke antrean mandat</Link></td></tr>))}</tbody></table></div>)}
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["/admin/mandat", "Antrean & Mandat", "Beri/cabut mandat akun Kelurahan"], ["/admin/sengketa", "Banding & Sengketa", "Meja banding, mediasi, penghentian"], ["/admin/parameter", "Parameter Sistem", "Plafon, porsi, durasi, ambang"], ["/admin/blacklist", "Daftar Hitam", "Kelola nama yang diblokir"], ["/admin/statistik", "Statistik Eksekutif", "Ringkasan program"], ["/admin/audit", "Audit Log", "Semua aksi penting"]].map(([h, t, d]) => (
          <Link key={h} href={h} className="rounded-2xl border border-celadon bg-white p-4 hover:bg-celadon/30"><p className="font-bold text-teal-deep">{t}</p><p className="text-sm text-indigo-space/70">{d}</p></Link>))}
      </div>
    </Main>
  );
}
