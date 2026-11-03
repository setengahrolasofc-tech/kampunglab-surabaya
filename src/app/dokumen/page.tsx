import type { Metadata } from "next";
import { Card, Main, PageHeader } from "@/components/ui";
import { TEMPLATES } from "@/lib/templates";

export const metadata: Metadata = { title: "Template dokumen" };

export default function DokumenPage() {
  return (
    <Main>
      <PageHeader title="Template dokumen" subtitle="Unduh, isi, tanda tangani bila perlu, lalu unggah sebagai scan di formulir pengajuan atau serah terima." />
      <ul className="grid gap-3 md:grid-cols-2">{TEMPLATES.map(([file, nama, untuk, kapan]) => (
        <li key={file}><Card className="flex h-full flex-col gap-1"><h2 className="font-bold">{nama}</h2><p className="text-xs text-indigo-space/65">Untuk: {untuk} · {kapan}</p>
          <a href={`/templates/${file}`} download className="mt-2 text-sm font-semibold text-teal-deep underline">Unduh .docx</a></Card></li>))}</ul>
    </Main>
  );
}
