import type { Metadata } from "next";
import Link from "next/link";
import { Card, Main, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Panduan" };

const ATURAN: Array<[string, string]> = [
  ["Siapa yang bisa ikut?", "Tim 2–6 orang: warga, pelajar minimal SMA/SMK, mahasiswa, atau komunitas. Pelajar SMP/SD ke bawah tidak dapat menjadi anggota tim."],
  ["Berapa dananya?", "Skala Kecil (Program, Produk sederhana) maksimal Rp5.000.000 dalam 30 hari. Skala Terapan (Prototipe, Teknologi) maksimal Rp15.000.000 dalam 60 hari. Dana tak terduga maksimal 10%, honor tim maksimal 15%, dan wajib ada rencana perawatan 6–12 bulan."],
  ["Bagaimana dana cair?", "Tiga tahap 30%–30%–40%. Kelurahan mentransfer di luar aplikasi; website hanya mencatat bukti transfer. Setelah pengajuan disetujui, anggaran dikunci sehingga tidak bisa dibatalkan sepihak tanpa alasan audit."],
  ["Siapa yang menguji?", "Minimal 30 warga unik di kelurahan lokasi uji, selama 14 hari (bisa diperpanjang sekali, maksimal 7 hari). Mereka mengisi survei bawaan website lewat QR di poster, tanpa akun."],
  ["Apa standar lolosnya?", "Empat syarat sekaligus: minimal 30 responden unik, rata-rata rating minimal 3,8, minimal 75% menjawab membantu, dan minimal 80% melampirkan foto. Dihitung otomatis dan tampil real-time."],
  ["Bagaimana bila gagal?", "Gagal uji dengan nota jujur berarti dihentikan sebagai pembelajaran, bukan sanksi. Sanksi (daftar hitam dan restitusi 100% dana diterima) hanya untuk proyek mangkrak, fiktif, atau pemalsuan."],
  ["Apa itu Rapor Bukti Inovasi?", "Ringkasan hasil uji dan dana yang terbit setelah serah terima divalidasi. Setiap Rapor punya QR; bila data berubah setelah terbit, halaman verifikasi menampilkan peringatan merah."],
  ["Mengapa akun Kelurahan terkunci?", "Akun Kelurahan baru belum punya wewenang sampai Admin BRIDA memverifikasi SK dan memberi mandat (maksimal 1 utama dan 1 cadangan per kelurahan). Bila kelurahan tujuan belum punya akun bermandat, pengajuan menunggu dan BRIDA diberi tahu."],
];

export default function PanduanPage() {
  return (
    <Main narrow>
      <PageHeader title="Panduan singkat" subtitle="Aturan utama KampungLab Surabaya (Handbook Rev. 4)." />
      <div className="space-y-3">{ATURAN.map(([q, a]) => <Card key={q}><h2 className="font-bold">{q}</h2><p className="mt-1 text-sm text-indigo-space/85">{a}</p></Card>)}</div>
      <p className="mt-6 text-sm">Siap mulai? <Link href="/daftar" className="font-semibold text-teal-deep underline">Daftar akun</Link> atau lihat <Link href="/papan-masalah" className="font-semibold text-teal-deep underline">Papan Masalah</Link>.</p>
    </Main>
  );
}
