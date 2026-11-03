import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Empty, Main, PageHeader, btnOutline, btnPrimary, inputCls } from "@/components/ui";
import { KECAMATAN_KELURAHAN } from "@/lib/auth/surabaya-areas.mjs";
import { TEMA_MASALAH } from "@/lib/domain/innovation-rules.mjs";
import { tanggal, waLink } from "@/lib/domain/format.mjs";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export const metadata: Metadata = { title: "Papan Masalah Kelurahan" };

type Row = { id: string; judul_masalah: string; kategori_tema: string; deskripsi: string; deskripsi_lokasi_rt_rw: string; kontak_wa_narahubung: string; status: string; created_at: string; kelurahan: { kecamatan: string; kelurahan: string } };

export default async function PapanMasalah({ searchParams }: { searchParams: Promise<{ kec?: string; tema?: string; selesai?: string }> }) {
  const sp = await searchParams;
  const kec = sp.kec && Object.hasOwn(KECAMATAN_KELURAHAN, sp.kec) ? sp.kec : "";
  const tema = TEMA_MASALAH.some(([v]) => v === sp.tema) ? sp.tema! : "";
  let rows: Row[] = [];
  let galat = false;
  try {
    let q = createPublicSupabaseClient().from("problem_boards").select("*, kelurahan:master_kelurahan!inner(kecamatan, kelurahan)").eq("status", sp.selesai === "1" ? "SOLVED" : "OPEN").order("created_at", { ascending: false }).limit(100);
    if (kec) q = q.eq("kelurahan.kecamatan", kec);
    if (tema) q = q.eq("kategori_tema", tema);
    const { data, error } = await q;
    if (error) galat = true;
    rows = (data ?? []) as unknown as Row[];
  } catch { galat = true; }
  const label = Object.fromEntries(TEMA_MASALAH);
  return (
    <Main>
      <PageHeader title="Papan Masalah Kelurahan" subtitle="Masalah nyata yang diunggah Kelurahan. Pilih satu untuk diselesaikan, atau hubungi narahubung lewat WhatsApp." />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-celadon bg-white p-4">
        <label className="text-xs font-semibold">Kecamatan<select name="kec" defaultValue={kec} className={inputCls + " mt-1 !w-52"}><option value="">Semua</option>{Object.keys(KECAMATAN_KELURAHAN).map((k) => <option key={k}>{k}</option>)}</select></label>
        <label className="text-xs font-semibold">Tema<select name="tema" defaultValue={tema} className={inputCls + " mt-1 !w-44"}><option value="">Semua</option>{TEMA_MASALAH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="flex items-center gap-1 pb-2 text-xs font-semibold"><input type="checkbox" name="selesai" value="1" defaultChecked={sp.selesai === "1"} /> Tampilkan yang sudah terselesaikan</label>
        <button className={btnOutline}>Terapkan filter</button>
      </form>
      {galat ? <Empty>Papan Masalah belum dapat dimuat. Coba lagi sebentar lagi.</Empty> : rows.length === 0 ? <Empty>Belum ada masalah yang cocok dengan filter.</Empty> : (
        <ul className="grid gap-4 md:grid-cols-2">{rows.map((p) => (
          <li key={p.id}><Card className="flex h-full flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2"><Badge tone="info">{label[p.kategori_tema] ?? p.kategori_tema}</Badge>{p.status === "SOLVED" && <Badge tone="sukses">Terselesaikan</Badge>}</div>
            <h2 className="text-lg font-bold">{p.judul_masalah}</h2>
            <p className="text-sm text-indigo-space/80">{p.deskripsi}</p>
            <p className="text-xs text-indigo-space/65">Kel. {p.kelurahan.kelurahan}, Kec. {p.kelurahan.kecamatan} · {p.deskripsi_lokasi_rt_rw} · {tanggal(p.created_at)}</p>
            {p.status === "OPEN" && <div className="mt-auto flex flex-wrap gap-2">
              <a href={waLink(p.kontak_wa_narahubung, `Halo, saya melihat masalah "${p.judul_masalah}" di KampungLab Surabaya.`)} target="_blank" rel="noopener noreferrer" className={btnOutline}>Hubungi WA</a>
              <Link href={`/dashboard/pengajuan/baru?masalah=${p.id}`} className={btnPrimary}>Ajukan inovasi</Link></div>}
          </Card></li>))}</ul>)}
    </Main>
  );
}
