import type { Metadata } from "next";
import { TEMPLATES } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Template dokumen",
  description: "Unduh format dokumen KampungLab: PRD, RAB, surat pernyataan keaslian dan pertanggungjawaban, rekomendasi RT/RW, laporan, dan formulir persetujuan.",
};

export default function DocumentsPage() {
  return (
    <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold tracking-[0.16em] text-emerald-800">DOKUMEN</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Template dokumen program</h1>
      <p className="mt-4 text-lg leading-8 text-slate-600">
        Format Word yang bisa diisi, dicetak, dan ditandatangani. Isinya masih usulan dan perlu disesuaikan dengan ketentuan BRIDA/OPD sebelum dipakai resmi.
        Aplikasi saat ini baru menyediakan draf dan alur pemeriksaan; unggah berkas belum tersedia.
      </p>
      <ul className="mt-8 space-y-3">
        {TEMPLATES.map(([file, title, who, when]) => (
          <li key={file} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-950/10 bg-white p-6">
            <div>
              <h2 className="font-bold">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{who} · {when}</p>
            </div>
            <a href={`/templates/${file}`} download className="inline-flex min-h-11 items-center rounded-full border border-emerald-900 px-5 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">
              Unduh .docx
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
