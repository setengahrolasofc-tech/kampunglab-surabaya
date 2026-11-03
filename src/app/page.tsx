import Link from "next/link";
import { LogoFull } from "@/components/logo";
import { Card, Main, Stat, btnOutline, btnPrimary } from "@/components/ui";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { angka, rupiah } from "@/lib/domain/format.mjs";
import { PHASES } from "@/lib/domain/workflow.mjs";

const FASE_DESKRIPSI = [
  "Pilih masalah di Papan Masalah atau survei mandiri. Sepakati lokasi uji dengan RT/RW dan Lurah, lalu ajukan ke Kelurahan.",
  "Dana Tahap 1 (30%) dicatat Kelurahan. Bangun inovasi, isi Logbook, dan unggah nota belanja.",
  "Warga memindai QR di poster dan mengisi survei. Minimal 30 warga unik selama 14 hari.",
  "Lolos uji? Dana Tahap 2 (30%) dicatat. Unggah BAST, Panduan Perawatan, dan LPJ 100%.",
  "Dana Tahap 3 (40%) dicatat dan Rapor Bukti Inovasi terbit di Etalase, dapat diverifikasi lewat QR.",
];

async function getStats() {
  try {
    const { data } = await createPublicSupabaseClient().rpc("public_stats");
    return data as Record<string, number> | null;
  } catch { return null; }
}

export default async function Beranda() {
  const s = await getStats();
  return (
    <>
      <section className="bg-gradient-to-br from-celadon/60 via-surface to-white">
        <Main>
          <div className="grid items-center gap-8 py-6 md:grid-cols-2">
            <div className="space-y-5">
              <LogoFull size={52} />
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-indigo-space sm:text-5xl">Dari ide warga, <span className="text-teal-deep">jadi bukti nyata.</span></h1>
              <p className="max-w-xl text-lg text-indigo-space/80">Dana publik cair bertahap setelah inovasi benar-benar diuji warga di kampung. Setiap hasil punya Rapor Bukti Inovasi yang bisa diverifikasi lewat QR.</p>
              <div className="flex flex-wrap gap-3"><Link href="/papan-masalah" className={btnPrimary}>Lihat Papan Masalah</Link><Link href="/daftar" className={btnOutline}>Daftar & mulai mengajukan</Link></div>
            </div>
            <Card tone="gelap" className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Prinsip utama</p>
              <p className="text-3xl font-extrabold">Uji jujur boleh gagal.</p>
              <p className="text-white/85">Hasil uji yang tidak memenuhi standar, dengan Logbook dan nota yang jujur, dihentikan sebagai pembelajaran, bukan sanksi. Yang dihukum hanya yang mangkrak, fiktif, atau memalsukan.</p>
              <p className="text-sm text-white/70">Website ini tidak menyimpan atau memindahkan uang. Transfer dilakukan Kelurahan di luar aplikasi; website hanya mencatat bukti.</p>
            </Card>
          </div>
        </Main>
      </section>
      <Main>
        <section aria-labelledby="fase" className="mb-12">
          <h2 id="fase" className="mb-5 text-2xl font-bold">Lima fase, satu jalur yang jelas</h2>
          <ol className="grid gap-4 md:grid-cols-5">
            {PHASES.map((f, i) => (
              <li key={f.id}><Card className="h-full space-y-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-deep text-sm font-bold text-white">{f.id}</span>
                <h3 className="font-bold">{f.nama}</h3><p className="text-sm text-indigo-space/75">{FASE_DESKRIPSI[i]}</p></Card></li>))}
          </ol>
        </section>
        <section aria-labelledby="statistik" className="mb-12">
          <h2 id="statistik" className="mb-5 text-2xl font-bold">Program dalam angka</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Inovasi terbit" value={s ? angka(s.inovasi_terbit) : "—"} hint="Rapor Bukti Inovasi" />
            <Stat label="Inovasi berjalan" value={s ? angka(s.inovasi_berjalan) : "—"} />
            <Stat label="Dana tercatat cair" value={s ? rupiah(s.total_dana_cair) : "—"} hint="Dari bukti transfer Kelurahan" />
            <Stat label="Warga penguji" value={s ? angka(s.warga_penguji) : "—"} hint="Satu orang, satu suara" />
            <Stat label="Masalah terbuka" value={s ? angka(s.masalah_terbuka) : "—"} /><Stat label="Masalah terselesaikan" value={s ? angka(s.masalah_selesai) : "—"} />
            <Stat label="Kelurahan bermandat" value={s ? `${angka(s.kelurahan_bermandat)} / 154` : "—"} />
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {[["Tim Inovator", "Warga, pelajar (min. SMA/SMK), mahasiswa, atau komunitas, 2–6 orang. Skala Kecil hingga Rp5 juta (30 hari), Skala Terapan hingga Rp15 juta (60 hari)."],
            ["Kelurahan", "Lurah atau staf bertugas (1 utama, 1 cadangan per kelurahan) memeriksa berkas, mencatat transfer 30-30-40, dan memutuskan hasil uji."],
            ["Admin BRIDA", "Memverifikasi SK dan memberi mandat, mengatur parameter, memutus banding dan sengketa, serta mengawasi lewat audit log."]].map(([t, d]) => (
            <Card key={t} tone="celadon"><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm text-indigo-space/80">{d}</p></Card>))}
        </section>
      </Main>
    </>
  );
}
