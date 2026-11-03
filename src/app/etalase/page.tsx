import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Empty, Main, PageHeader, Stars, btnOutline, inputCls } from "@/components/ui";
import { KECAMATAN_KELURAHAN } from "@/lib/auth/surabaya-areas.mjs";
import { angka, rupiah, tanggal } from "@/lib/domain/format.mjs";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export const metadata: Metadata = { title: "Etalase Inovasi" };

type Snap = { judul: string; kecamatan: string; kelurahan: string; tipe: string; ringkasan: string; uji: { responden: number; avg_rating: number; helpful_pct: number }; dana: { total_cair: number } };
type Row = { innovation_id: string; passport_code: string; published_at: string; pilot_interest_count: number; data_snapshot_json: Snap };

export default async function Etalase({ searchParams }: { searchParams: Promise<{ q?: string; kec?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").replace(/[%,()]/g, " ").trim().slice(0, 60);
  const kec = sp.kec && Object.hasOwn(KECAMATAN_KELURAHAN, sp.kec) ? sp.kec : "";
  let rows: Row[] = []; let galat = false;
  try {
    let query = createPublicSupabaseClient().from("evidence_passports").select("innovation_id, passport_code, published_at, pilot_interest_count, data_snapshot_json").order("published_at", { ascending: false }).limit(60);
    if (q) query = query.ilike("data_snapshot_json->>judul", `%${q}%`);
    if (kec) query = query.eq("data_snapshot_json->>kecamatan", kec);
    const { data, error } = await query;
    galat = Boolean(error); rows = (data ?? []) as unknown as Row[];
  } catch { galat = true; }
  return (
    <Main>
      <PageHeader title="Etalase Inovasi" subtitle="Inovasi yang lolos uji warga, lengkap dengan Rapor Bukti Inovasi yang dapat diverifikasi lewat QR." />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-celadon bg-white p-4">
        <label className="text-xs font-semibold">Cari judul<input name="q" defaultValue={q} className={inputCls + " mt-1 !w-64"} /></label>
        <label className="text-xs font-semibold">Kecamatan<select name="kec" defaultValue={kec} className={inputCls + " mt-1 !w-52"}><option value="">Semua</option>{Object.keys(KECAMATAN_KELURAHAN).map((k) => <option key={k}>{k}</option>)}</select></label>
        <button className={btnOutline}>Cari</button>
      </form>
      {galat ? <Empty>Etalase belum dapat dimuat.</Empty> : rows.length === 0 ? <Empty>Belum ada inovasi yang terbit. Rapor pertama akan muncul setelah proyek lolos uji dan selesai serah terima.</Empty> : (
        <ul className="grid gap-4 md:grid-cols-2">{rows.map((r) => (
          <li key={r.innovation_id}><Link href={`/etalase/${r.innovation_id}`} className="block h-full"><Card className="h-full space-y-2 transition hover:border-teal-deep">
            <div className="flex flex-wrap items-center gap-2"><Badge tone="sukses">Terverifikasi</Badge><Badge>{r.data_snapshot_json.tipe}</Badge>{r.pilot_interest_count > 0 && <Badge tone="perhatian">{r.pilot_interest_count} minat pilot</Badge>}</div>
            <h2 className="text-lg font-bold text-teal-deep">{r.data_snapshot_json.judul}</h2>
            <p className="line-clamp-3 text-sm text-indigo-space/80">{r.data_snapshot_json.ringkasan}</p>
            <p className="text-sm"><Stars value={r.data_snapshot_json.uji.avg_rating} /> {angka(r.data_snapshot_json.uji.avg_rating, 2)} · {r.data_snapshot_json.uji.responden} warga · {angka(r.data_snapshot_json.uji.helpful_pct)}% membantu</p>
            <p className="text-xs text-indigo-space/60">Kel. {r.data_snapshot_json.kelurahan}, Kec. {r.data_snapshot_json.kecamatan} · dana cair {rupiah(r.data_snapshot_json.dana.total_cair)} · terbit {tanggal(r.published_at)}</p>
          </Card></Link></li>))}</ul>)}
    </Main>
  );
}
