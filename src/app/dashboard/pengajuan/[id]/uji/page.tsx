import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { TestPanel } from "@/components/innovation-views";
import { ProjectNav } from "@/components/project-nav";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Card, Main, PageHeader, SectionTitle, btnOutline, btnPrimary } from "@/components/ui";
import { actionsFor } from "@/lib/domain/workflow.mjs";
import { getAppOrigin } from "@/lib/auth/validation.mjs";
import { loadOwnProject } from "@/lib/loaders";
import type { TestSummary } from "@/lib/types";
import { extendAction, readyForTestAction, startRetestAction } from "../../../actions";

export const metadata: Metadata = { title: "Uji Warga" };

export default async function UjiPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, inv, funds } = await loadOwnProject(id);
  const { data } = await supabase.rpc("get_test_summary", { p_id: id });
  const s = data as TestSummary;
  const acts = actionsFor("INNOVATOR", inv.status);
  const adaNota = funds.some((f) => f.jenis === "LOGBOOK" && f.nota_belanja_url);
  const link = `${getAppOrigin(process.env.NEXT_PUBLIC_APP_URL)}/uji/${id}`;
  return (
    <Main>
      <PageHeader title="Panel Misi Uji Warga" subtitle={inv.judul} actions={<Link href="/dashboard" className={btnOutline}>← Semua proyek</Link>} />
      <ProjectNav id={id} active="/uji" />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="space-y-6">
        {acts.includes("siap-uji") && (
          <Card tone="emas" className="space-y-3">
            <SectionTitle>Siap Uji Warga?</SectionTitle>
            <p className="text-sm">Setelah Anda menekan tombol, website membuat <strong>survei otomatis</strong> dari data inovasi Anda (judul, masalah, tujuan, target pengguna). Pertanyaan dan hasil tidak dapat diubah inovator. Masa uji <strong>14 hari</strong>; kuota <strong>30 warga unik</strong> dari kelurahan lokasi uji.</p>
            {!adaNota && <Alert tone="perhatian">Isi dulu minimal satu entri Logbook bernota di tab Logbook & Dana.</Alert>}
            <form action={readyForTestAction}><input type="hidden" name="id" value={id} /><SubmitButton confirm="Mulai uji warga 14 hari sekarang?">Siap Uji Warga</SubmitButton></form>
          </Card>)}
        {acts.includes("uji-ulang") && (
          <Card tone="emas" className="space-y-3"><SectionTitle>Uji ulang</SectionTitle><p className="text-sm">Lurah memutuskan Tunda. Perbaiki inovasi sesuai masukan warga lalu mulai uji ulang 14 hari. Data uji ronde sebelumnya tetap tersimpan.</p>
            <form action={startRetestAction}><input type="hidden" name="id" value={id} /><SubmitButton confirm="Mulai uji ulang 14 hari?">Mulai uji ulang</SubmitButton></form></Card>)}
        {inv.status === "COMMUNITY_TESTING" && (
          <Card className="space-y-3">
            <SectionTitle>Tautan & Poster QR</SectionTitle>
            <p className="text-sm">Pasang poster di lokasi uji. Warga memindai QR dan mengisi survei tanpa akun. Tautan survei: <span className="break-all font-mono text-xs">{link}</span></p>
            <div className="flex flex-wrap gap-2"><Link href={`/dashboard/pengajuan/${id}/poster`} className={btnPrimary}>Buka & unduh Poster QR</Link>
              {acts.includes("perpanjang") && s.ada && s.status === "AKTIF" && !s.diperpanjang && (s.metrik?.responden ?? 0) < s.ambang.kuota && (
                <form action={extendAction}><input type="hidden" name="id" value={id} /><SubmitButton className={btnOutline} confirm="Perpanjang uji 7 hari? Hanya bisa sekali.">Perpanjang +7 hari</SubmitButton></form>)}</div>
          </Card>)}
        <TestPanel s={s} />
        {s.ada && s.survey_pertanyaan && s.survey_pertanyaan.length > 0 && (
          <Card><SectionTitle>Pertanyaan survei otomatis (tidak dapat diedit)</SectionTitle>
            <ol className="list-decimal space-y-1 pl-5 text-sm"><li>Apakah inovasi ini membantu? (Ya/Tidak) — wajib</li><li>Rating 1–5 — wajib</li>{s.survey_pertanyaan.map((q) => <li key={q.id}>{q.teks}</li>)}</ol></Card>)}
        {inv.status === "EVALUATION_TERM_2" && !s.keputusan && <Alert tone="perhatian">Masa uji selesai. Menunggu keputusan Lurah: Lolos, Tunda/Uji Ulang, atau Gagal.</Alert>}
        {inv.status === "EVALUATION_TERM_2" && s.keputusan === "LOLOS" && <Alert tone="sukses">Lolos uji. Menunggu Kelurahan mencatat bukti transfer Tahap 2.</Alert>}
        {inv.status === "STOPPED_AS_LEARNING" && <Alert tone="info">Proyek dihentikan sebagai pembelajaran. Gagal uji dengan nota jujur bukan sanksi.</Alert>}
      </div>
    </Main>
  );
}
