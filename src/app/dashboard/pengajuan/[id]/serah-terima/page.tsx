import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { DocLinks } from "@/components/innovation-views";
import { ProjectNav } from "@/components/project-nav";
import { SubmitButton } from "@/components/submit-button";
import { UploadField } from "@/components/upload-field";
import { Alert, Badge, Card, Main, PageHeader, SectionTitle, btnOutline } from "@/components/ui";
import { tanggal } from "@/lib/domain/format.mjs";
import { actionsFor } from "@/lib/domain/workflow.mjs";
import { loadOwnProject } from "@/lib/loaders";
import { handoverAction } from "../../../actions";

export const metadata: Metadata = { title: "Serah Terima Akhir" };

export default async function SerahTerimaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { inv, funds } = await loadOwnProject(id);
  const h = funds.find((f) => f.jenis === "SERAH_TERIMA");
  const open = actionsFor("INNOVATOR", inv.status).includes("serah-terima");
  const { data: passport } = inv.status === "COMPLETED_PUBLISHED" ? { data: { id } } : { data: null };
  return (
    <Main>
      <PageHeader title="Serah Terima Akhir" subtitle={inv.judul} actions={<Link href="/dashboard" className={btnOutline}>← Semua proyek</Link>} />
      <ProjectNav id={id} active="/serah-terima" />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="space-y-6">
        {!open && !h && <Alert tone="info">Serah terima dibuka setelah Lurah memutuskan Lolos dan bukti transfer Tahap 2 dicatat.</Alert>}
        {open && (
          <Card className="space-y-3">
            <SectionTitle>Unggah berkas serah terima</SectionTitle>
            <p className="text-sm">Ketiganya divalidasi Lurah sebelum Dana Tahap 3 (40%) dicatat dan Rapor Bukti Inovasi terbit. Template ada di <Link href="/dokumen" className="font-semibold text-teal-deep underline">halaman Template</Link>.</p>
            {h?.catatan_validasi && !h.verified_by_lurah_at && <Alert tone="perhatian"><strong>Perlu diperbaiki:</strong> {h.catatan_validasi}</Alert>}
            {h?.verified_by_lurah_at ? <Badge tone="sukses">Divalidasi {tanggal(h.verified_by_lurah_at)} — menunggu transfer Tahap 3</Badge> : (
              <form action={handoverAction} className="space-y-3">
                <input type="hidden" name="id" value={id} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <UploadField name="bast" prefix={`${id}/bast`} label="BAST" required initial={h?.bast_url} />
                  <UploadField name="panduan" prefix={`${id}/panduan`} label="Panduan Perawatan" required initial={h?.panduan_url} />
                  <UploadField name="lpj" prefix={`${id}/lpj`} label="LPJ 100%" required initial={h?.lpj_akhir_url} />
                </div>
                <SubmitButton>{h ? "Kirim ulang" : "Kirim ke Kelurahan"}</SubmitButton>
              </form>)}
          </Card>)}
        {h && <Card><SectionTitle>Berkas terkirim</SectionTitle><DocLinks inv={{ ...inv, prd_url: null, rab_url: null, surat_keaslian_url: null, surat_kesepakatan_url: null }} funds={funds} /></Card>}
        {passport && <Alert tone="sukses">Rapor Bukti Inovasi sudah terbit. <Link href={`/etalase/${id}`} className="font-semibold underline">Lihat di Etalase</Link>.</Alert>}
      </div>
    </Main>
  );
}
