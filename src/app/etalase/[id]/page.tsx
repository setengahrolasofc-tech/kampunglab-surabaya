import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Card, Field, Main, PageHeader, SectionTitle, Stars, btnOutline, inputCls } from "@/components/ui";
import { getAppOrigin } from "@/lib/auth/validation.mjs";
import { angka, rupiah, tanggal } from "@/lib/domain/format.mjs";
import { isUuid } from "@/lib/form";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { pilotInterestAction } from "./actions";

export const metadata: Metadata = { title: "Rapor Bukti Inovasi" };

type Snap = {
  judul: string; tipe: string; ringkasan: string; masalah: string; tujuan: string; kecamatan: string; kelurahan: string; kode: string; terbit: string;
  tim: { jumlah: number; institusi: string[] }; uji: { ronde: number; responden: number; avg_rating: number; helpful_pct: number; photo_pct: number };
  dana: { total_rab: number; tahap_1: number | null; tahap_2: number | null; tahap_3: number | null; total_cair: number; belanja_bernota: number };
  ulasan: Array<{ inisial: string; rating: number; membantu: boolean; komentar: string }>;
};

export default async function EtalaseDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const supabase = createPublicSupabaseClient();
  const { data: row } = await supabase.from("evidence_passports").select("*").eq("innovation_id", id).maybeSingle();
  if (!row) notFound();
  const s = row.data_snapshot_json as Snap;
  const { data: cek } = await supabase.rpc("verify_rapor", { p_id: id, p_hash: row.sha256_hash });
  const valid = (cek as { status?: string } | null)?.status === "VALID";
  const verifUrl = `${getAppOrigin(process.env.NEXT_PUBLIC_APP_URL)}/rapor/${id}?h=${row.sha256_hash}`;
  const svg = await QRCode.toString(verifUrl, { type: "svg", margin: 1, color: { dark: "#222E50", light: "#FFFFFF" } });
  return (
    <Main>
      <PageHeader title={s.judul} subtitle={`Rapor Bukti Inovasi ${row.passport_code} · Kel. ${s.kelurahan}, Kec. ${s.kecamatan} · terbit ${tanggal(row.published_at)}`} actions={<Link href="/etalase" className={btnOutline}>← Etalase</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      {valid ? <div className="mb-6"><Alert tone="sukses"><strong>✓ Terverifikasi.</strong> Data uji dan dana cocok dengan hash yang tercatat saat Rapor terbit.</Alert></div>
        : <div className="mb-6"><Alert tone="bahaya"><strong>Peringatan:</strong> data berubah setelah Rapor terbit. Jangan jadikan rujukan sampai BRIDA memeriksanya.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-2"><SectionTitle>Tentang inovasi</SectionTitle><p className="text-sm">{s.ringkasan}</p><p className="text-sm"><strong>Masalah:</strong> {s.masalah}</p><p className="text-sm"><strong>Tujuan:</strong> {s.tujuan}</p>
            <p className="text-xs text-indigo-space/65">Tim {s.tim.jumlah} orang{s.tim.institusi.length ? ` · ${s.tim.institusi.join(", ")}` : ""}</p></Card>
          <Card className="space-y-3"><SectionTitle>Bukti uji oleh warga (ronde {s.uji.ronde})</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-4">
              <div><p className="text-xs uppercase text-indigo-space/60">Responden unik</p><p className="text-2xl font-bold">{s.uji.responden}</p></div>
              <div><p className="text-xs uppercase text-indigo-space/60">Rata-rata rating</p><p className="text-2xl font-bold">{angka(s.uji.avg_rating, 2)}</p><Stars value={s.uji.avg_rating} /></div>
              <div><p className="text-xs uppercase text-indigo-space/60">Menjawab membantu</p><p className="text-2xl font-bold">{angka(s.uji.helpful_pct, 1)}%</p></div>
              <div><p className="text-xs uppercase text-indigo-space/60">Berfoto</p><p className="text-2xl font-bold">{angka(s.uji.photo_pct, 1)}%</p></div></div>
            {s.ulasan.length > 0 && <ul className="space-y-2 pt-2">{s.ulasan.slice(0, 6).map((u, k) => <li key={k} className="rounded-lg bg-celadon/30 px-3 py-2 text-sm"><strong>{u.inisial}</strong> · <Stars value={u.rating} /> — {u.komentar}</li>)}</ul>}
            <p className="text-xs text-indigo-space/60">Nama dan tempat tinggal penguji disamarkan; foto penguji tidak ditampilkan dan tidak dipakai untuk promosi.</p></Card>
          <Card className="space-y-2"><SectionTitle>Dana</SectionTitle>
            <ul className="space-y-1 text-sm"><li>Total RAB: <strong>{rupiah(s.dana.total_rab)}</strong></li><li>Tahap 1 / 2 / 3: {rupiah(s.dana.tahap_1)} / {rupiah(s.dana.tahap_2)} / {rupiah(s.dana.tahap_3)}</li><li>Total tercatat cair: <strong>{rupiah(s.dana.total_cair)}</strong> · belanja bernota {rupiah(s.dana.belanja_bernota)}</li></ul>
            <p className="text-xs text-indigo-space/60">Angka berasal dari bukti transfer yang dicatat Kelurahan.</p></Card>
        </div>
        <aside className="space-y-6">
          <Card className="space-y-3 text-center"><SectionTitle>Verifikasi QR</SectionTitle>
            <div className="mx-auto w-40" role="img" aria-label="Kode QR verifikasi Rapor" dangerouslySetInnerHTML={{ __html: svg }} />
            <Link href={`/rapor/${id}?h=${row.sha256_hash}`} className="text-sm font-semibold text-teal-deep underline">Buka halaman verifikasi / cetak</Link>
            <p className="break-all font-mono text-[0.6rem] text-indigo-space/55">SHA-256 {row.sha256_hash}</p></Card>
          <Card className="space-y-3"><SectionTitle>Tandai minat pilot</SectionTitle>
            <p className="text-sm text-indigo-space/75">Untuk OPD, industri, atau komunitas yang ingin memakai/menerapkan inovasi ini. Sudah {row.pilot_interest_count} yang berminat.</p>
            <form action={pilotInterestAction} className="space-y-2"><input type="hidden" name="id" value={id} />
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <Field label="Nama" htmlFor="pn"><input id="pn" name="nama" required className={inputCls} /></Field>
              <Field label="Instansi / organisasi" htmlFor="pi"><input id="pi" name="instansi" required className={inputCls} /></Field>
              <Field label="Kontak (email / WA)" htmlFor="pk"><input id="pk" name="kontak" required className={inputCls} /></Field>
              <Field label="Pesan (opsional)" htmlFor="pp"><textarea id="pp" name="pesan" rows={2} maxLength={500} className={inputCls} /></Field>
              <SubmitButton>Kirim minat</SubmitButton></form></Card>
        </aside>
      </div>
    </Main>
  );
}
