import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { PrintButton } from "@/components/print-button";
import { LogoFull } from "@/components/logo";
import { Alert, Main, btnOutline } from "@/components/ui";
import { getAppOrigin } from "@/lib/auth/validation.mjs";
import { tanggal } from "@/lib/domain/format.mjs";
import { loadOwnProject } from "@/lib/loaders";
import type { TestSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Poster QR Uji Warga" };

export default async function PosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, inv } = await loadOwnProject(id);
  const { data } = await supabase.rpc("get_test_summary", { p_id: id });
  const s = data as TestSummary;
  if (inv.status !== "COMMUNITY_TESTING" || !s.ada) {
    return <Main narrow><Alert tone="perhatian">Poster QR tersedia saat uji warga berjalan.</Alert><Link href={`/dashboard/pengajuan/${id}/uji`} className={btnOutline + " mt-4"}>← Panel uji</Link></Main>;
  }
  const url = `${getAppOrigin(process.env.NEXT_PUBLIC_APP_URL)}/uji/${id}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#222E50", light: "#FFFFFF" } });
  return (
    <Main narrow>
      <div className="no-print mb-4 flex gap-2"><Link href={`/dashboard/pengajuan/${id}/uji`} className={btnOutline}>← Panel uji</Link><PrintButton /></div>
      <article className="print-page mx-auto max-w-[210mm] rounded-2xl border-4 border-teal-deep bg-white p-8 text-center shadow-lg">
        <div className="flex justify-center"><LogoFull size={52} /></div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-teal-deep">Uji coba warga · Kel. {inv.kelurahan?.kelurahan}</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-indigo-space">{inv.judul}</h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-indigo-space/80">{inv.tujuan}</p>
        <div className="mx-auto mt-6 w-72 rounded-2xl border-2 border-celadon p-3" role="img" aria-label={`Kode QR menuju survei ${inv.judul}`} dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-4 text-2xl font-bold text-indigo-space">Pindai &amp; beri penilaian jujur</p>
        <ol className="mx-auto mt-2 max-w-md space-y-1 text-left text-base text-indigo-space/85">
          <li>1. Coba inovasi ini di lokasi.</li><li>2. Pindai QR dengan kamera ponsel.</li><li>3. Isi survei ±2 menit dan lampirkan foto. Tanpa akun.</li>
        </ol>
        <p className="mt-4 rounded-lg bg-gold/40 px-4 py-2 text-sm font-semibold text-indigo-space">Khusus warga Kelurahan {inv.kelurahan?.kelurahan}. Berlaku sampai {tanggal(s.selesai)}. Satu orang, satu suara. Jawaban jujur lebih berharga dari bintang lima.</p>
        <p className="mt-3 break-all font-mono text-[0.65rem] text-indigo-space/60">{url}</p>
        <p className="mt-2 text-xs text-indigo-space/60">Poster resmi KampungLab Surabaya · BRIDA Kota Surabaya</p>
      </article>
    </Main>
  );
}
