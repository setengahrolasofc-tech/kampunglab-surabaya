import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Panduan program",
  description: "Kenali konsep KampungLab, sepuluh tahap inovasi warga, dan prinsip pembuktian manfaat.",
};

const stages = [
  ["Ajukan inovasi", "Inovator menyiapkan data inovasi, PRD, RAB, dan pernyataan keaslian."],
  ["Verifikasi berjenjang", "RT memeriksa domisili dan masalah; RW meninjau kelayakan lokal; kelurahan menentukan keputusan atau penerusan sesuai tingkat."],
  ["Penilaian panel", "Tingkat Kecil ditinjau panel reviewer. Tingkat Mikro diputuskan kelurahan sesuai aturan kelayakan yang ditetapkan program."],
  ["Catat dana tahap awal", "Setelah keputusan berwenang, transfer dilakukan di luar platform. Bukti dan realisasinya dicatat untuk ditinjau."],
  ["Bangun inovasi", "Inovator mengembangkan solusi dan mengirim checkpoint kemajuan beserta penggunaan dana sementara."],
  ["Uji bersama warga", "Penguji memberi persetujuan, diverifikasi fasilitator, menjalankan tugas, mengunggah bukti, lalu memberi feedback."],
  ["Terbitkan Evidence Passport", "Hasil uji, tanggapan warga, dan verifikasi dirangkum dalam passport ber-QR. Hasil terverifikasi tetap dapat menunjukkan ambang belum tercapai."],
  ["Tinjau dana lanjutan", "Ambang bukti, laporan pertanggungjawaban, dan persetujuan pihak berwenang menjadi gerbang peninjauan berikutnya."],
  ["Bagikan dan rawat", "Inovasi disalurkan gratis kepada penerima program selama masa perawatan yang disepakati, disertai panduan dan pelatihan."],
  ["Tampilkan di etalase", "Bukti manfaat dan penggunaan dana yang aman dipublikasikan dapat diperiksa publik dan menjadi dasar minat pilot."],
] as const;

export default function GuidePage() {
  return (
    <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
      <Link href="/" className="rounded-sm text-sm font-semibold text-emerald-900 hover:underline">← Kembali ke beranda</Link>
      <p className="mt-10 text-xs font-bold tracking-[0.16em] text-emerald-800">PANDUAN KONSEP</p>
      <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Dari usulan sampai manfaat yang bisa diperiksa.</h1>
      <p className="mt-6 text-lg leading-8 text-slate-600">KampungLab adalah lapisan pengajuan, pembuktian, dan tata kelola inovasi warga. Keputusan tetap di tangan pihak berwenang, dan uang tidak melewati platform.</p>
      <aside aria-label="Status program" className="mt-8 rounded-2xl border border-amber-900/15 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
        Website ini masih berupa prototipe. Pendaftaran, pengajuan, dan uji warga belum dibuka. Angka plafon, durasi, serta mekanisme dana dalam handbook masih berupa usulan yang perlu divalidasi pengelola program.
      </aside>
      <section id="sepuluh-tahap" aria-labelledby="judul-tahap" className="mt-16">
        <h2 id="judul-tahap" className="text-2xl font-bold tracking-tight sm:text-3xl">Sepuluh tahap KampungLab</h2>
        <ol className="mt-8 divide-y divide-emerald-950/10">
          {stages.map(([title, description], index) => (
            <li key={title} className="flex gap-5 py-6 sm:gap-7">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-950">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="judul-hasil" className="mt-12 rounded-2xl bg-white p-7 sm:p-9">
        <h2 id="judul-hasil" className="text-2xl font-bold tracking-tight">Uji yang jujur juga boleh gagal.</h2>
        <p className="mt-4 leading-8 text-slate-600">Inovasi yang belum memenuhi ambang manfaat dicatat sebagai pembelajaran. Jika dana digunakan sesuai RAB, kegagalan uji tidak otomatis berarti pelanggaran. Feedback negatif tetap menjadi bagian dari hasil yang perlu diperiksa.</p>
      </section>
    </main>
  );
}
