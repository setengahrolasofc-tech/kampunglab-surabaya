import Link from "next/link";

const journey = [
  { number: "01", title: "Ajukan ide", description: "Jelaskan masalah warga, solusi, anggaran, dan ukuran keberhasilannya." },
  { number: "02", title: "Periksa bersama", description: "Pengajuan diverifikasi RT, RW, dan kelurahan. Tingkat Kecil dilanjutkan ke panel." },
  { number: "03", title: "Bangun dan uji", description: "Kembangkan inovasi, lalu uji manfaatnya bersama warga dan fasilitator." },
  { number: "04", title: "Buktikan manfaat", description: "Hasil, tanggapan warga, dan penggunaan dana dicatat dalam Evidence Passport." },
];

const principles = [
  { title: "Bukti dulu, dana kemudian.", description: "Pendanaan lanjutan ditinjau berdasarkan hasil uji, kelengkapan laporan, dan keputusan pihak berwenang." },
  { title: "Berjenjang dan bisa ditelusuri.", description: "Setiap pemeriksaan memiliki penanggung jawab, alasan keputusan, serta riwayat yang dapat diaudit." },
  { title: "Dari panggung ke kampung.", description: "Ide diuji di lingkungan warga, kemudian hasilnya menjadi pengetahuan yang bisa dipelajari bersama." },
];

export default function HomePage() {
  return (
    <main id="konten-utama" tabIndex={-1}>
      <section aria-labelledby="judul-utama" className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <div>
          <p className="mb-7 inline-flex rounded-full border border-emerald-900/15 bg-emerald-50 px-4 py-2 text-xs font-bold tracking-wider text-emerald-900">
            PROTOTIPE KAMPUNGLAB
          </p>
          <h1 id="judul-utama" className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Dari ide warga,<br />
            <span className="text-emerald-800">jadi bukti nyata.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-slate-600">
            Ruang untuk mengajukan inovasi, menguji manfaatnya di kampung,
            dan membagikan hasil yang dapat diperiksa bersama.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link href="/panduan" className="rounded-full bg-emerald-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-800">
              Kenali KampungLab
            </Link>
            <Link href="/masuk" className="rounded-full border border-emerald-900 px-6 py-3.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">
              Login
            </Link>
          </div>
        </div>
        <aside aria-label="Prinsip pembuktian inovasi" className="rounded-3xl bg-emerald-950 p-8 text-white sm:p-10">
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-200">IDE → UJI → BUKTI → MANFAAT</p>
          <h2 className="mt-10 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Yang dinilai bukan hanya idenya. Tetapi manfaat yang terbukti.</h2>
          <p className="mt-6 leading-7 text-emerald-100">Evidence Passport merangkum hasil uji warga, verifikasi fasilitator, dan penggunaan dana dalam satu catatan yang bisa ditelusuri.</p>
          <div className="mt-10 border-t border-white/20 pt-6 text-sm leading-6 text-emerald-100">
            KampungLab mencatat dan memverifikasi. Transfer dana tetap dilakukan di luar platform oleh pihak berwenang.
          </div>
        </aside>
      </section>

      <section id="alur" aria-labelledby="judul-alur" className="border-y border-emerald-950/10 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-xs font-bold tracking-[0.16em] text-emerald-800">ALUR SINGKAT</p>
          <h2 id="judul-alur" className="mt-4 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Ide punya jalan.<br />Manfaat punya bukti.</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {journey.map((step) => (
              <li key={step.number} className="border-t border-emerald-950/15 pt-5">
                <span aria-hidden="true" className="text-sm font-semibold text-emerald-700">{step.number}</span>
                <h3 className="mt-4 text-xl font-bold tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>
          <Link href="/panduan#sepuluh-tahap" className="mt-10 inline-block rounded-sm text-sm font-semibold text-emerald-900 underline underline-offset-4">Baca sepuluh tahap lengkap</Link>
        </div>
      </section>

      <section aria-labelledby="judul-prinsip" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-bold tracking-[0.16em] text-emerald-800">PRINSIP KAMPUNGLAB</p>
        <h2 id="judul-prinsip" className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Mencoba dengan tanggung jawab.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {principles.map((principle) => (
            <article key={principle.title} className="rounded-2xl border border-emerald-950/10 bg-white p-7">
              <h3 className="text-xl font-bold leading-snug tracking-tight">{principle.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{principle.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
