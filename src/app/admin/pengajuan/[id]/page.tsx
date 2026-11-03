import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/flash";
import { DocLinks, FundsSummary, LogbookList, TeamList, TestPanel, TIPE_LABEL } from "@/components/innovation-views";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Card, Field, Main, PageHeader, PhaseTimeline, SectionTitle, StatusBadge, btnDanger, btnOutline, btnPrimary, inputCls } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { rupiah, tanggal } from "@/lib/domain/format.mjs";
import { actionsFor, phaseOf } from "@/lib/domain/workflow.mjs";
import { isUuid } from "@/lib/form";
import type { FundRow, InnovationRow, MemberRow, TestSummary } from "@/lib/types";
import { anonymizeAction, decideAppealAction, resolveDisputeAction, terminateAction } from "../../actions";

export const metadata: Metadata = { title: "Detail pengajuan (BRIDA)" };

export default async function AdminPengajuan({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireRole("BRIDA_ADMIN");
  await supabase.rpc("sync_due_tests");
  const { data: inv } = await supabase.from("innovations").select("*, kelurahan:master_kelurahan(kecamatan, kelurahan)").eq("id", id).maybeSingle();
  if (!inv) notFound();
  const i = inv as InnovationRow;
  const [{ data: members }, { data: funds }, { data: leader }, { data: summary }, { data: appeal }, { data: disputes }, { data: audit }] = await Promise.all([
    supabase.from("innovation_members").select("*").eq("innovation_id", id).order("urutan"),
    supabase.from("logbooks_and_funds").select("*").eq("innovation_id", id).order("created_at"),
    supabase.from("users").select("name, email, phone_wa, institusi, status").eq("id", i.leader_user_id).maybeSingle(),
    supabase.rpc("get_test_summary", { p_id: id }),
    supabase.from("appeals").select("*").eq("innovation_id", id).maybeSingle(),
    supabase.from("disputes").select("*").eq("innovation_id", id).order("dibuat_pada", { ascending: false }),
    supabase.from("audit_logs").select("aksi, waktu, detail_json").eq("target", `innovations/${id}`).order("waktu", { ascending: false }).limit(30),
  ]);
  const acts = actionsFor("BRIDA_ADMIN", i.status);
  const terbuka = (disputes ?? []).find((d) => d.status === "TERBUKA");
  return (
    <Main>
      <PageHeader title={i.judul} subtitle={`${i.kode_unik} · ${TIPE_LABEL[i.tipe_inovasi]} · Kel. ${i.kelurahan?.kelurahan}, Kec. ${i.kelurahan?.kecamatan} · RAB ${rupiah(i.total_rab)}`} actions={<Link href="/admin/sengketa" className={btnOutline}>← Banding & sengketa</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="mb-6 flex flex-wrap items-center gap-3"><StatusBadge status={i.status} /><PhaseTimeline current={phaseOf(i.status)} /></div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {acts.includes("putus-banding") && appeal && (
            <Card tone="emas" className="space-y-3"><SectionTitle>Putus banding</SectionTitle>
              <p className="text-sm"><strong>Alasan inovator ({tanggal(appeal.diajukan_pada)}):</strong> {appeal.alasan}</p>
              {appeal.lampiran_url && <a className="text-sm font-semibold text-teal-deep underline" href={`/berkas?path=${encodeURIComponent(appeal.lampiran_url)}`} target="_blank" rel="noopener noreferrer">Lampiran ↗</a>}
              <p className="text-sm"><strong>Catatan Kelurahan saat menolak:</strong> {i.catatan_pemeriksaan}</p>
              <form action={decideAppealAction} className="space-y-3"><input type="hidden" name="id" value={id} />
                <Field label="Catatan putusan (min. 10 karakter)" htmlFor="cp"><textarea id="cp" name="catatan" rows={3} required className={inputCls} /></Field>
                <div className="flex gap-2"><button name="putusan" value="KABULKAN" className={btnPrimary}>Kabulkan (periksa ulang)</button><button name="putusan" value="TOLAK" className={btnDanger}>Tolak (final)</button></div></form></Card>)}
          {acts.includes("putus-sengketa") && terbuka && (
            <Card tone="emas" className="space-y-3"><SectionTitle>Mediasi sengketa</SectionTitle>
              <p className="text-sm"><strong>Pelapor ({terbuka.pelapor_role}):</strong> {terbuka.alasan}</p>
              <form action={resolveDisputeAction} className="space-y-3"><input type="hidden" name="id" value={id} /><input type="hidden" name="dispute" value={terbuka.id} />
                <Field label="Catatan putusan (min. 10 karakter)" htmlFor="cs"><textarea id="cs" name="catatan" rows={3} required className={inputCls} /></Field>
                <div className="flex flex-wrap gap-2"><button name="resolusi" value="LANJUTKAN" className={btnPrimary}>Lanjutkan proyek</button><button name="resolusi" value="CANCELLED_BY_KELURAHAN" className={btnOutline}>Batalkan (reimburse nota)</button><button name="resolusi" value="TERMINATED_BLACKLISTED" className={btnDanger}>Hentikan & daftar hitam</button></div></form></Card>)}
          {acts.includes("hentikan") && i.status !== "DISPUTED" && (
            <Card className="space-y-3"><SectionTitle>Hentikan proyek (mangkrak / fiktif / pemalsuan)</SectionTitle>
              <p className="text-sm text-indigo-space/75">Berlaku bila dana Tahap 1 sudah cair. Nama tim masuk daftar hitam, akun ketua diblokir, restitusi 100% dana diterima ke Kas Kelurahan.</p>
              <form action={terminateAction} className="space-y-3"><input type="hidden" name="id" value={id} /><textarea name="alasan" rows={3} required minLength={20} aria-label="Alasan penghentian" className={inputCls} placeholder="Alasan dan bukti (min. 20 karakter)" /><SubmitButton className={btnDanger} confirm="Hentikan proyek dan blokir akun ketua?">Hentikan & daftar hitamkan</SubmitButton></form></Card>)}
          <Card className="space-y-3"><SectionTitle>Ringkasan</SectionTitle><p className="text-sm">{i.ringkasan}</p><p className="text-sm"><strong>Masalah:</strong> {i.masalah}</p><DocLinks inv={i} funds={(funds ?? []) as FundRow[]} />
            {i.dispute_flag && <Alert tone="bahaya">Sengketa: {i.dispute_reason}</Alert>}</Card>
          <TestPanel s={summary as TestSummary} />
          {(summary as TestSummary).ada && (i.status !== "COMMUNITY_TESTING") && (
            <Card className="space-y-2"><SectionTitle>Anonimisasi data penguji</SectionTitle><p className="text-sm text-indigo-space/75">Mengubah nama penguji menjadi inisial, menghapus tempat tinggal, dan melepas foto. Rating dan hasil uji (serta hash Rapor) tidak berubah. Tidak dapat dibatalkan.</p>
              <form action={anonymizeAction}><input type="hidden" name="id" value={id} /><SubmitButton className={btnOutline} confirm="Anonimkan data penguji secara permanen?">Anonimkan data penguji</SubmitButton></form></Card>)}
          <Card><SectionTitle>Logbook</SectionTitle><LogbookList funds={(funds ?? []) as FundRow[]} /></Card>
          <Card><SectionTitle>Jejak audit pengajuan</SectionTitle>
            <ul className="space-y-1 text-sm">{(audit ?? []).map((a, k) => <li key={k}><span className="text-xs text-indigo-space/60">{tanggal(a.waktu, true)}</span> — {a.aksi}</li>)}</ul></Card>
        </div>
        <aside className="space-y-6">
          <Card><SectionTitle>Ketua tim</SectionTitle>{leader ? <div className="text-sm"><p className="font-semibold">{leader.name}</p><p>{leader.email}</p><p>{leader.institusi} · akun {leader.status}</p></div> : "—"}</Card>
          <Card><SectionTitle>Tim</SectionTitle><TeamList members={(members ?? []) as MemberRow[]} /></Card>
          <FundsSummary inv={i} funds={(funds ?? []) as FundRow[]} />
        </aside>
      </div>
    </Main>
  );
}
