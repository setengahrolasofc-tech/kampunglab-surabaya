import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { FundsSummary, LogbookList } from "@/components/innovation-views";
import { ProjectNav } from "@/components/project-nav";
import { SubmitButton } from "@/components/submit-button";
import { UploadField } from "@/components/upload-field";
import { Alert, Card, Field, Main, PageHeader, SectionTitle, btnOutline, inputCls } from "@/components/ui";
import { actionsFor } from "@/lib/domain/workflow.mjs";
import { loadOwnProject } from "@/lib/loaders";
import { addLogbookAction } from "../../../actions";

export const metadata: Metadata = { title: "Logbook & Dana" };

export default async function LogbookPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { inv, funds } = await loadOwnProject(id);
  const open = actionsFor("INNOVATOR", inv.status).includes("logbook");
  return (
    <Main>
      <PageHeader title="Logbook & Laporan Dana" subtitle={inv.judul} actions={<Link href="/dashboard" className={btnOutline}>← Semua proyek</Link>} />
      <ProjectNav id={id} active="/logbook" />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {open ? (
            <Card className="space-y-3">
              <SectionTitle>Tambah entri</SectionTitle>
              <form action={addLogbookAction} className="space-y-3">
                <input type="hidden" name="id" value={id} />
                <Field label="Progres kegiatan" htmlFor="deskripsi"><textarea id="deskripsi" name="deskripsi" rows={3} required minLength={5} className={inputCls} placeholder="Apa yang dikerjakan dan dibeli?" /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Tanggal" htmlFor="tanggal"><input id="tanggal" name="tanggal" type="date" className={inputCls} /></Field>
                  <Field label="Nominal belanja (Rp)" htmlFor="nominal" hint="Isi 0 bila tidak ada belanja. Belanja wajib bernota."><input id="nominal" name="nominal" inputMode="numeric" defaultValue={0} className={inputCls} /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <UploadField name="nota" prefix={`${id}/nota`} label="Foto/scan nota belanja" />
                  <UploadField name="foto" prefix={`${id}/foto`} label="Foto progres (opsional)" accept="image/*" />
                </div>
                <SubmitButton>Simpan entri</SubmitButton>
              </form>
            </Card>
          ) : <Alert tone="perhatian">Logbook terbuka otomatis setelah bukti transfer Tahap 1 dicatat Kelurahan dan tertutup bila proyek selesai, dibatalkan, atau disengketakan.</Alert>}
          <Card><SectionTitle>Riwayat Logbook</SectionTitle><LogbookList funds={funds} /></Card>
        </div>
        <FundsSummary inv={inv} funds={funds} />
      </div>
    </Main>
  );
}
