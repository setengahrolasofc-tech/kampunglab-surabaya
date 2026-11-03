import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/flash";
import { DocLinks, FundsSummary, LogbookList, TeamList, TestPanel, TIPE_LABEL } from "@/components/innovation-views";
import { SubmitButton } from "@/components/submit-button";
import { UploadField } from "@/components/upload-field";
import { Alert, Badge, Card, Field, Main, PageHeader, PhaseTimeline, SectionTitle, StatusBadge, btnDanger, btnOutline, btnPrimary, inputCls } from "@/components/ui";
import { BerkasLink } from "@/components/berkas-link";
import { requireRole } from "@/lib/auth/session";
import { actionsFor, phaseOf, STATUS_INFO } from "@/lib/domain/workflow.mjs";
import { keputusanTersedia } from "@/lib/domain/survey.mjs";
import { pembagianTahap } from "@/lib/domain/innovation-rules.mjs";
import { rupiah, tanggal, waLink } from "@/lib/domain/format.mjs";
import { isUuid } from "@/lib/form";
import type { FundRow, InnovationRow, MemberRow, TestSummary } from "@/lib/types";
import { cancelAction, decideTestAction, disputeAction, extendAction, reviewAction, transferAction, validateHandoverAction } from "../../actions";

export const metadata: Metadata = { title: "Pemeriksaan pengajuan" };

function Transfer({ id, tahap, nominal, label }: { id: string; tahap: string; nominal: number; label: string }) {
  return (
    <Card tone="celadon" className="space-y-3">
      <SectionTitle>Catat bukti transfer {label}</SectionTitle>
      <p className="text-sm">Transfer dilakukan di luar aplikasi. Unggah bukti, lalu catat. Nominal wajib <strong>{rupiah(nominal)}</strong>.</p>
      <form action={transferAction} className="space-y-3">
        <input type="hidden" name="id" value={id} /><input type="hidden" name="tahap" value={tahap} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nominal ditransfer (Rp)" htmlFor={`nom-${tahap}`}><input id={`nom-${tahap}`} name="nominal" inputMode="numeric" defaultValue={nominal} className={inputCls} /></Field>
          <UploadField name="bukti" prefix={`${id}/transfer`} label="Bukti transfer (PDF/gambar)" required />
        </div>
        <Field label="Catatan (opsional)" htmlFor={`cat-${tahap}`}><input id={`cat-${tahap}`} name="catatan" className={inputCls} /></Field>
        <SubmitButton>Catat bukti transfer</SubmitButton>
      </form>
    </Card>
  );
}

export default async function PengajuanKelurahan({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const { supabase, mandate } = await requireRole("KELURAHAN");
  await supabase.rpc("sync_due_tests");
  const { data: inv } = await supabase.from("innovations").select("*, kelurahan:master_kelurahan(kecamatan, kelurahan)").eq("id", id).maybeSingle();
  if (!inv || inv.kelurahan_target_id !== mandate!.kelurahan_id) notFound();
  const i = inv as InnovationRow;
  const [{ data: members }, { data: funds }, { data: leader }, { data: summary }, { data: survei }] = await Promise.all([
    supabase.from("innovation_members").select("*").eq("innovation_id", id).order("urutan"),
    supabase.from("logbooks_and_funds").select("*").eq("innovation_id", id).order("created_at"),
    supabase.from("users").select("name, email, phone_wa, institusi").eq("id", i.leader_user_id).maybeSingle(),
    supabase.rpc("get_test_summary", { p_id: id }),
    supabase.from("survey_responses").select("nama, usia, tempat_tinggal, rt, rw, rating, membantu, foto_url, dibuat_pada").eq("innovation_id", id).order("dibuat_pada", { ascending: false }).limit(200),
  ]);
  const ts = summary as TestSummary;
  const fl = (funds ?? []) as FundRow[];
  const acts = actionsFor("KELURAHAN", i.status);
  const split = pembagianTahap(i.total_rab);
  const handover = fl.find((f) => f.jenis === "SERAH_TERIMA");
  const tersedia = ts.ada && ts.metrik && ts.status === "SELESAI" && !ts.keputusan ? keputusanTersedia(ts.metrik, { kuota: ts.ambang.kuota, ratingTunda: 3 }) : [];
  const lolosMenungguTransfer = ts.keputusan === "LOLOS" && i.status === "EVALUATION_TERM_2";

  return (
    <Main>
      <PageHeader title={i.judul} subtitle={`${i.kode_unik} · ${TIPE_LABEL[i.tipe_inovasi]} · RAB ${rupiah(i.total_rab)} · target ${i.target_rt_rw}`}
        actions={<Link href="/kelurahan" className={btnOutline}>← Dashboard</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="mb-4 flex flex-wrap items-center gap-3"><StatusBadge status={i.status} /><PhaseTimeline current={phaseOf(i.status)} /></div>
      <p className="mb-6 text-sm text-indigo-space/75">{STATUS_INFO[i.status]?.hint}</p>
      {i.dispute_flag && <div className="mb-6"><Alert tone="bahaya"><strong>Sengketa terbuka:</strong> {i.dispute_reason}. Proses dibekukan sampai Admin BRIDA memutus.</Alert></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-3">
            <SectionTitle>Ringkasan inovasi</SectionTitle>
            <p className="text-sm">{i.ringkasan}</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold">Masalah</dt><dd className="text-indigo-space/80">{i.masalah}</dd></div>
              <div><dt className="font-semibold">Tujuan</dt><dd className="text-indigo-space/80">{i.tujuan}</dd></div>
              <div><dt className="font-semibold">Target pengguna</dt><dd>{i.target_pengguna}</dd></div>
              <div><dt className="font-semibold">Rencana perawatan</dt><dd>{i.rencana_perawatan_bulan} bulan</dd></div>
              <div><dt className="font-semibold">Dana tak terduga / honor</dt><dd>{rupiah(i.rab_tak_terduga)} / {rupiah(i.rab_honor)}</dd></div>
              <div><dt className="font-semibold">Pembagian 30-30-40</dt><dd>{rupiah(split.TAHAP_1_30)} · {rupiah(split.TAHAP_2_30)} · {rupiah(split.TAHAP_3_40)}</dd></div>
            </dl>
            <DocLinks inv={i} funds={fl} />
          </Card>

          {acts.includes("periksa") && (
            <Card tone="emas" className="space-y-3">
              <SectionTitle>Periksa berkas</SectionTitle>
              <p className="text-sm">Periksa PRD, RAB, Surat Keaslian, dan Surat Kesepakatan Lokasi Uji (TTD RT/RW, Lurah, Ketua Tim). Menyetujui akan <strong>mengunci anggaran</strong> 30-30-40 sesuai RKA Kelurahan.</p>
              <form action={reviewAction} className="space-y-3">
                <input type="hidden" name="id" value={i.id} />
                <Field label="Rujukan RKA Kelurahan (opsional, untuk persetujuan)" htmlFor="rka"><input id="rka" name="rka" className={inputCls} placeholder="No. DPA/RKA" /></Field>
                <Field label="Catatan (wajib untuk Revisi/Tolak, minimal 10 karakter)" htmlFor="catatan"><textarea id="catatan" name="catatan" rows={3} className={inputCls} /></Field>
                <div className="flex flex-wrap gap-2">
                  <button name="decision" value="SETUJU" className={btnPrimary}>Setuju</button>
                  <button name="decision" value="REVISI" className={btnOutline}>Minta revisi</button>
                  <button name="decision" value="TOLAK" className={btnDanger}>Tolak</button>
                </div>
              </form>
            </Card>)}

          {acts.includes("transfer-1") && <Transfer id={i.id} tahap="TAHAP_1_30" nominal={split.TAHAP_1_30} label="Tahap 1 (30%)" />}

          <TestPanel s={ts} />
          {acts.includes("perpanjang") && ts.ada && ts.status === "AKTIF" && !ts.diperpanjang && (ts.metrik?.responden ?? 0) < ts.ambang.kuota && (
            <form action={extendAction}><input type="hidden" name="id" value={i.id} /><SubmitButton className={btnOutline} confirm="Perpanjang masa uji 7 hari (hanya satu kali)?">Perpanjang uji +7 hari</SubmitButton></form>)}

          {tersedia.length > 0 && acts.includes("keputusan-uji") && (
            <Card tone="emas" className="space-y-3">
              <SectionTitle>Keputusan pasca uji</SectionTitle>
              <form action={decideTestAction} className="space-y-3">
                <input type="hidden" name="id" value={i.id} />
                {tersedia.includes("LOLOS") ? <p className="text-sm">Keempat standar terpenuhi. Pilih <strong>Lolos Uji &amp; Lanjut Tahap 2</strong>.</p>
                  : <Field label="Catatan keputusan (minimal 10 karakter)" htmlFor="catatan-uji"><textarea id="catatan-uji" name="catatan" rows={3} className={inputCls} /></Field>}
                <div className="flex flex-wrap gap-2">
                  {tersedia.includes("LOLOS") && <button name="decision" value="LOLOS" className={btnPrimary}>Lolos uji & lanjut Tahap 2</button>}
                  {tersedia.includes("TUNDA") && <button name="decision" value="TUNDA" className={btnOutline}>Tunda / uji ulang 14 hari</button>}
                  {tersedia.includes("GAGAL") && <button name="decision" value="GAGAL" className={btnDanger}>Gagal — hentikan sebagai pembelajaran</button>}
                </div>
              </form>
            </Card>)}
          {lolosMenungguTransfer && <Transfer id={i.id} tahap="TAHAP_2_30" nominal={split.TAHAP_2_30} label="Tahap 2 (30%)" />}

          {i.status === "REFINEMENT_AND_HANDOVER" && (
            <Card tone="celadon" className="space-y-3">
              <SectionTitle>Serah terima akhir</SectionTitle>
              {!handover ? <p className="text-sm">Menunggu inovator mengunggah BAST, Panduan Perawatan, dan LPJ 100%.</p> : (
                <>
                  <DocLinks inv={{ ...i, prd_url: null, rab_url: null, surat_keaslian_url: null, surat_kesepakatan_url: null }} funds={fl} />
                  {handover.catatan_validasi && !handover.verified_by_lurah_at && <Alert tone="perhatian">Catatan perbaikan terkirim: {handover.catatan_validasi}</Alert>}
                  {handover.verified_by_lurah_at ? <Badge tone="sukses">Divalidasi {tanggal(handover.verified_by_lurah_at)}</Badge> : (
                    <form action={validateHandoverAction} className="space-y-3"><input type="hidden" name="id" value={i.id} />
                      <Field label="Catatan (wajib bila diminta perbaikan)" htmlFor="cat-v"><input id="cat-v" name="catatan" className={inputCls} /></Field>
                      <div className="flex gap-2"><button name="valid" value="ya" className={btnPrimary}>Validasi ketiga berkas</button><button name="valid" value="tidak" className={btnOutline}>Minta perbaikan</button></div></form>)}
                </>)}
              {handover?.verified_by_lurah_at && <Transfer id={i.id} tahap="TAHAP_3_40" nominal={split.TAHAP_3_40} label="Tahap 3 (40%) — Rapor terbit otomatis" />}
            </Card>)}

          <Card><SectionTitle>Logbook inovator</SectionTitle><LogbookList funds={fl} /></Card>

          {(survei ?? []).length > 0 && (
            <Card><SectionTitle>Data penguji (hanya Kelurahan & BRIDA)</SectionTitle>
              <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-celadon text-left uppercase text-indigo-space/60"><th className="py-1">Nama</th><th>Usia</th><th>Tempat tinggal</th><th>RT/RW</th><th>Rating</th><th>Membantu</th><th>Foto</th></tr></thead>
                <tbody>{(survei ?? []).map((s, k) => (<tr key={k} className="border-b border-celadon/50"><td className="py-1">{s.nama}</td><td>{s.usia}</td><td>{s.tempat_tinggal}</td><td>{s.rt}/{s.rw}</td><td>{s.rating}</td><td>{s.membantu ? "Ya" : "Tidak"}</td><td>{s.foto_url ? <BerkasLink path={s.foto_url} label="lihat" /> : "—"}</td></tr>))}</tbody></table></div></Card>)}
        </div>

        <aside className="space-y-6">
          <Card><SectionTitle>Ketua tim</SectionTitle>
            {leader ? <div className="space-y-1 text-sm"><p className="font-semibold">{leader.name}</p><p>{leader.institusi}</p><p>{leader.email}</p>{leader.phone_wa && <a href={waLink(leader.phone_wa, `Halo, terkait pengajuan ${i.judul}`)} className="font-semibold text-teal-deep underline" target="_blank" rel="noopener noreferrer">Hubungi via WA</a>}</div> : <p className="text-sm">—</p>}
          </Card>
          <Card><SectionTitle>Tim ({(members ?? []).length} orang)</SectionTitle><TeamList members={(members ?? []) as MemberRow[]} /></Card>
          <FundsSummary inv={i} funds={fl} />
          {(acts.includes("batalkan") || acts.includes("lapor-kendala")) && (
            <Card className="space-y-4">
              {acts.includes("lapor-kendala") && (
                <form action={disputeAction} className="space-y-2"><input type="hidden" name="id" value={i.id} />
                  <SectionTitle>Lapor Kendala ke BRIDA</SectionTitle>
                  <textarea name="alasan" rows={3} required minLength={20} placeholder="Uraikan kendala (min. 20 karakter)" className={inputCls} aria-label="Uraian kendala" />
                  <SubmitButton className={btnOutline} confirm="Proses pengajuan akan dibekukan sampai BRIDA memutus. Lanjutkan?">Kirim laporan</SubmitButton></form>)}
              {acts.includes("batalkan") && (
                <form action={cancelAction} className="space-y-2 border-t border-celadon pt-4"><input type="hidden" name="id" value={i.id} />
                  <SectionTitle>Batalkan proyek</SectionTitle>
                  <p className="text-xs text-indigo-space/70">Anggaran terkunci; pembatalan sepihak memerlukan alasan audit yang sah (dasar instruksi/temuan). Belanja bernota sah inovator diganti dari dana operasional kelurahan.</p>
                  <textarea name="alasan" rows={3} required minLength={20} className={inputCls} aria-label="Alasan audit pembatalan" />
                  <SubmitButton className={btnDanger} confirm="Batalkan proyek ini? Tindakan tercatat di audit log.">Batalkan dengan alasan audit</SubmitButton></form>)}
            </Card>)}
        </aside>
      </div>
    </Main>
  );
}
