import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { ProjectNav } from "@/components/project-nav";
import { SubmitButton } from "@/components/submit-button";
import { UploadField } from "@/components/upload-field";
import { Alert, Card, Field, Main, PageHeader, SectionTitle, btnOutline, inputCls } from "@/components/ui";
import { tanggal } from "@/lib/domain/format.mjs";
import { actionsFor } from "@/lib/domain/workflow.mjs";
import { loadOwnProject } from "@/lib/loaders";
import { appealAction, disputeAction } from "../../../actions";

export const metadata: Metadata = { title: "Banding & Lapor Kendala" };

export default async function BantuanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, inv } = await loadOwnProject(id);
  const acts = actionsFor("INNOVATOR", inv.status);
  const [{ data: appeal }, { data: disputes }] = await Promise.all([
    supabase.from("appeals").select("*").eq("innovation_id", id).maybeSingle(),
    supabase.from("disputes").select("*").eq("innovation_id", id).order("dibuat_pada", { ascending: false }),
  ]);
  return (
    <Main>
      <PageHeader title="Banding & Lapor Kendala" subtitle={inv.judul} actions={<Link href="/dashboard" className={btnOutline}>← Semua proyek</Link>} />
      <ProjectNav id={id} active="/bantuan" />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <SectionTitle>Banding</SectionTitle>
          {appeal && <Alert tone={appeal.putusan === "KABULKAN" ? "sukses" : appeal.putusan ? "bahaya" : "info"}>Banding diajukan {tanggal(appeal.diajukan_pada)}. {appeal.putusan ? `Putusan: ${appeal.putusan}. ${appeal.catatan_putusan ?? ""}` : "Menunggu putusan Admin BRIDA."}</Alert>}
          {acts.includes("banding") ? (
            <form action={appealAction} className="space-y-3"><input type="hidden" name="id" value={id} />
              <p className="text-sm">Banding hanya satu kali, maksimal 7 hari sejak penolakan. Template surat ada di halaman Template.</p>
              <Field label="Alasan banding (min. 20 karakter)" htmlFor="alasan"><textarea id="alasan" name="alasan" rows={4} required minLength={20} className={inputCls} /></Field>
              <UploadField name="lampiran" prefix={`${id}/banding`} label="Lampiran (opsional)" />
              <SubmitButton confirm="Ajukan banding? Hanya bisa satu kali.">Ajukan banding</SubmitButton></form>
          ) : !appeal && <p className="text-sm text-indigo-space/70">Banding tersedia bila pengajuan ditolak Kelurahan.</p>}
        </Card>
        <Card className="space-y-3">
          <SectionTitle>Lapor Kendala</SectionTitle>
          {(disputes ?? []).map((d) => <Alert key={d.id} tone={d.status === "TERBUKA" ? "bahaya" : "sukses"}>{tanggal(d.dibuat_pada)} — {d.alasan}. {d.status === "SELESAI" ? `Selesai (${d.resolusi}): ${d.catatan_brida}` : "Dimediasi Admin BRIDA."}</Alert>)}
          {acts.includes("lapor-kendala") ? (
            <form action={disputeAction} className="space-y-3"><input type="hidden" name="id" value={id} />
              <p className="text-sm">Gunakan bila terjadi kendala yang tidak terselesaikan dengan Kelurahan (mis. tidak ada respons, dana tak kunjung dicatat). Proses akan dibekukan sampai Admin BRIDA memutus.</p>
              <Field label="Uraian kendala (min. 20 karakter)" htmlFor="alasan-k"><textarea id="alasan-k" name="alasan" rows={4} required minLength={20} className={inputCls} /></Field>
              <SubmitButton className={btnOutline} confirm="Proses akan dibekukan. Lanjutkan?">Kirim laporan</SubmitButton></form>
          ) : <p className="text-sm text-indigo-space/70">Lapor Kendala tersedia untuk pengajuan yang sedang berjalan.</p>}
        </Card>
      </div>
    </Main>
  );
}
