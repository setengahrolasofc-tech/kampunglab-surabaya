import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isUuid } from "@/lib/admin/validation.mjs";
import { getPhysicalLetter, PhysicalLetterError } from "@/lib/physical/letter-data";
import { PHYSICAL_LETTER_VERSION, physicalLetterChecks, physicalLetterSearch } from "@/lib/physical/letter";
import { physicalDate } from "@/lib/physical/display";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draf surat rekomendasi fisik", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function PhysicalLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  let loaded: Awaited<ReturnType<typeof getPhysicalLetter>> | null = null;
  let message = "";
  try {
    loaded = await getPhysicalLetter(id);
    await loaded.assertCurrent();
  } catch (error) {
    if (!(error instanceof PhysicalLetterError)) throw error;
    if (error.code === "UNAVAILABLE") notFound();
    loaded = null;
    message = error.code === "NOT_READY" ? "Jalur fisik belum tersedia. Periksa tahap dan batas waktu pada halaman pengajuan fisik."
      : error.code === "CHANGED" ? "Antrean atau pengaturan berubah. Muat ulang pratinjau untuk memakai konteks terbaru." : "Data surat belum dapat dimuat. Coba muat ulang halaman.";
  }
  const data = loaded?.data;
  const fields = data ? [
    ["Referensi salinan", data.reference], ["Nama inovasi", data.title], ["Nama tampilan akun pengaju", data.applicantName],
    ["Wilayah", `RT ${data.rt} / RW ${data.rw} / Kelurahan ${data.kelurahan}`],
    ["Sumber", `Putaran ${data.attempt} · Revisi draf ${data.draftRevision} · Versi alur ${data.workflowVersion}`],
    ["Masuk antrean", physicalDate(data.queueEnteredAt)],
    ["Batas saat disiapkan", `${data.delayDays} × 24 jam · Versi pengaturan ${data.settingsVersion} · Terbuka sejak ${physicalDate(data.eligibleAt)}`],
  ] : [];

  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
    <Link href={`/simulasi/${id}/dokumen-fisik`} className="font-semibold text-emerald-900 underline underline-offset-4">Kembali ke pengajuan fisik</Link>
    <p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">PRATINJAU PRIVAT · DEMO</p>
    <h1 className="mt-3 text-3xl font-bold">Draf surat rekomendasi {data?.stage.toUpperCase() ?? "fisik"}</h1>
    {!data ? <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-5 leading-7 text-amber-950">{message}</p> : <>
      <p className="mt-5 rounded-xl bg-amber-50 p-5 text-sm leading-7 text-amber-950">Data terisi dari salinan yang dikirim dan konteks antrean saat ini. Surat masih berupa draf DEMO; nomor surat resmi, identitas pemohon sesuai dokumen, pemeriksaan, keputusan, nama pemeriksa, tanggal tanda tangan, dan stempel diisi manual.</p>
      <section aria-labelledby="data-surat" className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6">
        <h2 id="data-surat" className="text-xl font-bold">Data yang terisi otomatis</h2>
        <dl className="mt-5 divide-y divide-slate-200">{fields.map(([label, value]) => <div key={label} className="grid gap-2 py-4 sm:grid-cols-[190px_1fr]"><dt className="text-sm font-semibold">{label}</dt><dd className="min-w-0 break-words text-sm leading-7 text-slate-600">{value}</dd></div>)}</dl>
        <p className="mt-4 text-xs leading-6 text-slate-500">Nama tampilan akun bukan verifikasi identitas resmi. Wilayah memakai nama/kode master saat pratinjau dibuka; putaran dan isi mengacu pada salinan, bukan draf pribadi yang sedang diedit.</p>
      </section>
      <section aria-labelledby="isi-prd" className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6">
        <h2 id="isi-prd" className="text-xl font-bold">Uraian dari isian salinan</h2>
        <dl className="mt-5 space-y-5">{[["Masalah", data.problem], ["Penerima manfaat", data.beneficiaries], ["Perkiraan jumlah", data.beneficiaryCount]].map(([label, value]) => <div key={label}><dt className="text-sm font-semibold">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{value || "Belum tersedia pada isian teks salinan. Lengkapi secara manual sesuai PRD putaran ini."}</dd></div>)}</dl>
        <p className="mt-5 text-xs leading-6 text-slate-500">Isian yang tersedia dicantumkan pada lampiran Word. Bila pengajuan memakai PRD unggahan dan isian teksnya kosong, bagian tersebut perlu dilengkapi dari dokumen PRD yang sama.</p>
      </section>
      <section aria-labelledby="manual" className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6">
        <h2 id="manual" className="text-xl font-bold">Bagian yang diisi pemeriksa di Word/kertas</h2>
        <ul className="mt-5 space-y-3 text-sm leading-7">{physicalLetterChecks[data.stage].map(label => <li key={label} className="flex gap-3"><span aria-hidden="true">☐</span><span>{label}</span></li>)}</ul>
        <p className="mt-5 text-sm leading-7 text-slate-600">Semua kotak pemeriksaan dan keputusan pada file Word dimulai kosong. Jika ada konflik kepentingan, hubungi pengelola untuk pemeriksa independen. Setelah ditandatangani dan distempel, unggah scan/foto melalui jalur fisik untuk diperiksa kelurahan.</p>
      </section>
      <div className="mt-7 rounded-2xl bg-emerald-950 p-6 text-white"><h2 className="text-xl font-bold">Unduh dan lengkapi surat</h2><p className="mt-3 text-sm leading-7 text-emerald-100">File Word dapat diedit sebelum dicetak. Pengunduhan memeriksa kembali pemilik, tahap, versi alur, dan batas antrean. Konfirmasi rekomendasi tetap dilakukan lewat pemeriksaan manual pada aplikasi.</p><a href={`/simulasi/${id}/dokumen-fisik/surat/unduh?${physicalLetterSearch(data)}`} className="mt-5 inline-flex min-h-12 items-center rounded-full bg-white px-5 py-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50">Unduh draf terisi (.docx)</a></div>
      <p className="mt-5 text-xs leading-6 text-slate-500">Disiapkan {physicalDate(data.generatedAt)} · {PHYSICAL_LETTER_VERSION}. Penyusunan draf tidak mencatat rekomendasi atau mengubah status pengajuan.</p>
    </>}
  </main>;
}
