import { Logo } from "@/components/Logo";

const fase = [
  ["1", "Pemetaan dan Kesepakatan Offline", "Pilih masalah di Papan Masalah, lalu tanda tangani Surat Kesepakatan Lokasi Uji."],
  ["2", "Pengajuan dan Dana Tahap 1 (30%)", "Kelurahan memeriksa berkas, lalu mentransfer di luar platform."],
  ["3", "Pembuatan dan Siap Uji Warga", "Bangun inovasi, isi Logbook dan nota, lalu terbitkan poster QR."],
  ["4", "Uji Warga dan Dana Tahap 2 (30%)", "Minimal 30 warga mengisi survei dalam 14 hari; empat standar dihitung otomatis."],
  ["5", "Serah Terima, Tahap 3 (40%), dan Rapor", "BAST, Panduan Perawatan, dan LPJ 100% menerbitkan Rapor Bukti Inovasi."],
];

// Beranda sementara (tahap a). Halaman penuh dibangun pada tahap berikutnya.
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Logo />
      <h1 className="mt-10 text-4xl font-bold">Bukti dulu, dana kemudian.</h1>
      <p className="mt-4 max-w-2xl text-lg">KampungLab tidak menyimpan atau mentransfer uang. Kami memastikan inovasi benar-benar bekerja bagi warga sebelum dana tahap lanjutan dicairkan.</p>
      <p className="mt-4 rounded-xl bg-sand-gold/40 p-4 font-semibold">Uji yang jujur boleh gagal: gagal uji dengan nota jujur dicatat sebagai pembelajaran, bukan sanksi.</p>
      <ol className="mt-8 grid gap-4 md:grid-cols-2">
        {fase.map(([n, judul, isi]) => (
          <li key={n} className="rounded-2xl bg-white p-5 shadow-sm">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-deep font-bold text-white">{n}</span>
            <h2 className="mt-3 text-lg font-bold">{judul}</h2>
            <p className="mt-1 text-sm">{isi}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
