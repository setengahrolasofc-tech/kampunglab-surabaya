import { evaluateStandards } from "@/lib/domain/survey.mjs";
import { angka, rupiah, tanggal } from "@/lib/domain/format.mjs";
import { pembagianTahap } from "@/lib/domain/innovation-rules.mjs";
import type { FundRow, InnovationRow, MemberRow, TestSummary } from "@/lib/types";
import { BerkasLink } from "./berkas-link";
import { Badge, Card, SectionTitle, Stars, cx } from "./ui";

const TAHAP_LABEL: Record<string, string> = { TAHAP_1_30: "Tahap 1 (30%)", TAHAP_2_30: "Tahap 2 (30%)", TAHAP_3_40: "Tahap 3 (40%)" };
export const JENJANG_LABEL: Record<string, string> = { SMA_SMK: "SMA/SMK", MAHASISWA_D3: "Mahasiswa D3", MAHASISWA_D4: "Mahasiswa D4", MAHASISWA_S1: "Mahasiswa S1", MAHASISWA_DIPLOMA_S1: "Mahasiswa D3/S1", PASCASARJANA: "Pascasarjana", WARGA_UMUM: "Warga umum", SMP_KE_BAWAH: "SMP/SD ke bawah" };
export const TIPE_LABEL: Record<string, string> = { PROGRAM: "Program", PRODUK: "Produk sederhana", PROTOTIPE: "Prototipe", TEKNOLOGI: "Teknologi" };

/** Empat standar kelayakan + rekap real-time. Data berasal dari get_test_summary() (ulasan sudah tersamarkan). */
export function TestPanel({ s }: { s: TestSummary }) {
  if (!s.ada || !s.metrik) {
    return <Card><SectionTitle>Uji warga</SectionTitle><p className="text-sm text-indigo-space/70">Uji warga belum dimulai. Ambang kelayakan: {s.ambang.kuota} responden unik, rating ≥ {String(s.ambang.rating).replace(".", ",")}, ≥ {s.ambang.helpful}% menjawab Ya, ≥ {s.ambang.foto}% berfoto.</p></Card>;
  }
  const { standar, eligible } = evaluateStandards(s.metrik, s.ambang);
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>Hasil uji warga — ronde {s.ronde}</SectionTitle>
        <div className="flex flex-wrap items-center gap-2">
          {s.status === "AKTIF" ? <Badge tone="info">Berjalan · sisa {s.sisa_hari} hari</Badge> : <Badge tone="netral">Selesai</Badge>}
          {s.diperpanjang && <Badge tone="perhatian">Diperpanjang</Badge>}
          {eligible ? <Badge tone="sukses">Memenuhi Standar Kelayakan</Badge> : <Badge tone="perhatian">Belum memenuhi standar</Badge>}
        </div>
      </div>
      <p className="text-xs text-indigo-space/65">Periode {tanggal(s.mulai)} – {tanggal(s.selesai)}. Angka diperbarui otomatis dari survei bawaan website.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {standar.map((x) => {
          const pct = Math.min(100, x.id === "rating" ? (x.nilai / 5) * 100 : (x.nilai / (x.id === "kuota" ? x.target : 100)) * 100);
          return (
            <li key={x.id} className={cx("rounded-xl border p-3", x.ok ? "border-sea/50 bg-sea/10" : "border-celadon bg-white")}>
              <div className="flex items-start justify-between gap-2"><span className="text-sm font-semibold">{x.label}</span><span aria-label={x.ok ? "terpenuhi" : "belum"}>{x.ok ? "✓" : "○"}</span></div>
              <p className="mt-1 text-xl font-bold">{x.id === "kuota" ? angka(x.nilai) : x.id === "rating" ? angka(x.nilai, 2) : `${angka(x.nilai, 1)}%`}</p>
              <div className="mt-2 h-1.5 rounded-full bg-celadon/60"><div className={cx("h-1.5 rounded-full", x.ok ? "bg-sea" : "bg-teal-deep")} style={{ width: `${pct}%` }} /></div>
            </li>
          );
        })}
      </ul>
      {s.keputusan && <p className="text-sm"><strong>Keputusan Lurah:</strong> {s.keputusan}{s.keputusan_catatan ? ` — ${s.keputusan_catatan}` : ""}</p>}
      {s.ulasan && s.ulasan.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold">Ulasan warga (nama disamarkan)</h3>
          <ul className="space-y-2">
            {s.ulasan.filter((u) => u.komentar).slice(0, 8).map((u, i) => (
              <li key={i} className="rounded-lg bg-celadon/30 px-3 py-2 text-sm"><span className="font-semibold">{u.inisial}</span> · <Stars value={u.rating} /> · {u.membantu ? "membantu" : "belum membantu"}<br />{u.komentar}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export function FundsSummary({ inv, funds }: { inv: InnovationRow; funds: FundRow[] }) {
  const split = pembagianTahap(inv.total_rab);
  const cair = funds.filter((f) => f.jenis === "PENCAIRAN");
  const logbook = funds.filter((f) => f.jenis === "LOGBOOK");
  const belanja = logbook.reduce((a, f) => a + Number(f.nominal_belanja ?? 0), 0);
  const total = cair.reduce((a, f) => a + Number(f.nominal_cair ?? 0), 0);
  return (
    <Card className="space-y-3">
      <SectionTitle>Dana & pencairan 30-30-40</SectionTitle>
      <p className="text-xs text-indigo-space/65">Uang tidak melalui website. Kelurahan mentransfer di luar aplikasi dan mencatat bukti transfer di sini.{inv.anggaran_terkunci_at ? ` Anggaran terkunci sejak ${tanggal(inv.anggaran_terkunci_at)}${inv.rka_referensi ? ` (RKA: ${inv.rka_referensi})` : ""}.` : ""}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-celadon text-left text-xs uppercase text-indigo-space/60"><th className="py-1.5">Tahap</th><th>Rencana</th><th>Tercatat cair</th><th>Bukti</th></tr></thead>
          <tbody>
            {(["TAHAP_1_30", "TAHAP_2_30", "TAHAP_3_40"] as const).map((t) => {
              const row = cair.find((f) => f.tahap === t);
              return (
                <tr key={t} className="border-b border-celadon/60">
                  <td className="py-1.5 font-semibold">{TAHAP_LABEL[t]}</td><td>{rupiah(split[t])}</td>
                  <td>{row ? <span className="font-semibold text-[#2c6b5b]">{rupiah(row.nominal_cair)} · {tanggal(row.created_at)}</span> : <span className="text-indigo-space/50">Belum</span>}</td>
                  <td>{row && <BerkasLink path={row.bukti_transfer_url} label="Bukti" />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm">Total tercatat cair <strong>{rupiah(total)}</strong> dari RAB {rupiah(inv.total_rab)} · belanja bernota di Logbook <strong>{rupiah(belanja)}</strong>{inv.reimburse_nominal != null && <> · reimburse pembatalan <strong>{rupiah(inv.reimburse_nominal)}</strong></>}.</p>
    </Card>
  );
}

export function LogbookList({ funds }: { funds: FundRow[] }) {
  const rows = funds.filter((f) => f.jenis === "LOGBOOK");
  if (!rows.length) return <p className="text-sm text-indigo-space/65">Belum ada entri Logbook.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((f) => (
        <li key={f.id} className="rounded-xl border border-celadon bg-white p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{tanggal(f.tanggal_kegiatan)}</span><Badge tone="netral">{TAHAP_LABEL[f.tahap ?? ""] ?? ""}</Badge></div>
          <p className="mt-1 whitespace-pre-line">{f.deskripsi_progres}</p>
          <div className="mt-1 flex flex-wrap gap-4"><span>Belanja: <strong>{rupiah(f.nominal_belanja)}</strong></span><BerkasLink path={f.nota_belanja_url} label="Nota" />{f.foto_progres_url && <BerkasLink path={f.foto_progres_url} label="Foto progres" />}</div>
        </li>
      ))}
    </ul>
  );
}

export function TeamList({ members }: { members: MemberRow[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {members.map((m) => (
        <li key={m.id} className="rounded-xl border border-celadon bg-white p-3 text-sm">
          <p className="font-semibold">{m.nama_anggota} {m.is_ketua && <Badge tone="info">Ketua</Badge>}</p>
          <p className="text-indigo-space/70">{m.peran_dalam_tim || "—"} · {JENJANG_LABEL[m.jenjang_pendidikan] ?? m.jenjang_pendidikan}</p>
          <p className="text-xs text-indigo-space/60">{[m.institusi_asal, m.kota_domisili].filter(Boolean).join(" · ")}</p>
        </li>
      ))}
    </ul>
  );
}

export function DocLinks({ inv, funds }: { inv: InnovationRow; funds?: FundRow[] }) {
  const h = funds?.find((f) => f.jenis === "SERAH_TERIMA");
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1">
      <BerkasLink path={inv.prd_url} label="PRD" /><BerkasLink path={inv.rab_url} label="RAB" />
      <BerkasLink path={inv.surat_keaslian_url} label="Surat Keaslian" /><BerkasLink path={inv.surat_kesepakatan_url} label="Surat Kesepakatan" />
      {h && <><BerkasLink path={h.bast_url} label="BAST" /><BerkasLink path={h.panduan_url} label="Panduan Perawatan" /><BerkasLink path={h.lpj_akhir_url} label="LPJ 100%" /></>}
    </div>
  );
}
