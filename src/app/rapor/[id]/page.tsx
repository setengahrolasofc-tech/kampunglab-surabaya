import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoFull } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { Alert, Main, btnOutline } from "@/components/ui";
import { angka, rupiah, tanggal } from "@/lib/domain/format.mjs";
import { isUuid } from "@/lib/form";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export const metadata: Metadata = { title: "Verifikasi Rapor Bukti Inovasi", robots: { index: false } };

export default async function RaporPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ h?: string }> }) {
  const { id } = await params;
  const { h } = await searchParams;
  if (!isUuid(id)) notFound();
  const hash = typeof h === "string" && /^[0-9a-f]{64}$/i.test(h) ? h : null;
  const supabase = createPublicSupabaseClient();
  const [{ data: row }, { data: cek }] = await Promise.all([
    supabase.from("evidence_passports").select("passport_code, data_snapshot_json, sha256_hash, published_at").eq("innovation_id", id).maybeSingle(),
    supabase.rpc("verify_rapor", { p_id: id, p_hash: hash }),
  ]);
  if (!row) notFound();
  const status = (cek as { status?: string; hash_url_cocok?: boolean } | null)?.status;
  const s = row.data_snapshot_json as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  return (
    <Main narrow>
      <div className="no-print mb-4 flex gap-2"><Link href={`/etalase/${id}`} className={btnOutline}>← Detail Etalase</Link><PrintButton /></div>
      {status === "VALID" ? <Alert tone="sukses"><strong>✓ ASLI.</strong> Hash di tautan ini cocok dengan data yang tersimpan, dan data belum berubah sejak Rapor terbit.</Alert>
        : <div role="alert" className="rounded-xl border-4 border-red-600 bg-red-50 p-4 text-red-900"><p className="text-lg font-extrabold">⚠ PERINGATAN: RAPOR TIDAK COCOK</p><p className="text-sm">{hash && !(cek as { hash_url_cocok?: boolean })?.hash_url_cocok ? "Hash pada QR/tautan berbeda dengan yang tercatat. " : ""}Data uji atau dana berubah setelah Rapor terbit, atau QR dipalsukan. Jangan dipakai sebagai bukti; laporkan ke BRIDA.</p></div>}
      <article className="print-page mt-6 rounded-2xl border-2 border-teal-deep bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-gold pb-4"><LogoFull size={46} /><div className="text-right"><p className="text-xs font-bold uppercase tracking-widest text-teal-deep">Rapor Bukti Inovasi</p><p className="font-mono text-sm">{row.passport_code}</p></div></header>
        <h1 className="mt-4 text-2xl font-extrabold">{s.judul}</h1>
        <p className="text-sm text-indigo-space/70">Kel. {s.kelurahan}, Kec. {s.kecamatan} · tipe {s.tipe} · terbit {tanggal(row.published_at)}</p>
        <p className="mt-3 text-sm">{s.ringkasan}</p>
        <table className="mt-4 w-full text-sm"><tbody>
          <tr className="border-b border-celadon"><th className="py-1.5 text-left">Responden unik (ronde {s.uji.ronde})</th><td>{s.uji.responden}</td></tr>
          <tr className="border-b border-celadon"><th className="py-1.5 text-left">Rata-rata rating</th><td>{angka(s.uji.avg_rating, 2)} / 5</td></tr>
          <tr className="border-b border-celadon"><th className="py-1.5 text-left">Menjawab “membantu”</th><td>{angka(s.uji.helpful_pct, 1)}%</td></tr>
          <tr className="border-b border-celadon"><th className="py-1.5 text-left">Melampirkan foto</th><td>{angka(s.uji.photo_pct, 1)}%</td></tr>
          <tr className="border-b border-celadon"><th className="py-1.5 text-left">Total dana tercatat cair</th><td>{rupiah(s.dana.total_cair)} (RAB {rupiah(s.dana.total_rab)})</td></tr>
        </tbody></table>
        <p className="mt-4 break-all font-mono text-[0.65rem] text-indigo-space/60">SHA-256: {row.sha256_hash}</p>
        <p className="mt-1 text-[0.65rem] text-indigo-space/60">Hash dihitung dari ID inovasi, skor uji, dan total dana cair. Pindai ulang QR atau buka {`/rapor/${id}`} untuk memeriksa keaslian.</p>
      </article>
    </Main>
  );
}
