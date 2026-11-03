import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { DocLinks, JENJANG_LABEL, TeamList, TIPE_LABEL } from "@/components/innovation-views";
import { ProjectNav } from "@/components/project-nav";
import { SubmitButton } from "@/components/submit-button";
import { UploadField } from "@/components/upload-field";
import { Alert, Card, Field, Main, PageHeader, PhaseTimeline, SectionTitle, StatusBadge, btnDanger, btnOutline, inputCls } from "@/components/ui";
import { actionsFor, phaseOf, STATUS_INFO } from "@/lib/domain/workflow.mjs";
import { checkSubmission, DEFAULT_PARAMS, JENJANG, pembagianTahap, plafonOf, TIPE_INOVASI } from "@/lib/domain/innovation-rules.mjs";
import { rupiah } from "@/lib/domain/format.mjs";
import { loadOwnProject, loadParams } from "@/lib/loaders";
import { addMemberAction, deleteDraftAction, removeMemberAction, saveDraftAction, submitAction } from "../../actions";

export const metadata: Metadata = { title: "Pengajuan" };

export default async function PengajuanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, inv, members, funds } = await loadOwnProject(id);
  const p = { ...DEFAULT_PARAMS, ...(await loadParams(supabase)) } as typeof DEFAULT_PARAMS;
  const acts = actionsFor("INNOVATOR", inv.status);
  const editable = acts.includes("edit");
  const kurang = editable ? checkSubmission(inv, members, p) : [];
  const split = pembagianTahap(inv.total_rab, p);
  const plafon = plafonOf(inv.skala_plafon, p);
  const tunggu = inv.status === "WAITING_KELURAHAN_MANDATE";
  return (
    <Main>
      <PageHeader title={inv.judul || "Draft tanpa judul"} subtitle={`${inv.kode_unik} · Kel. ${inv.kelurahan?.kelurahan}, Kec. ${inv.kelurahan?.kecamatan} · ${TIPE_LABEL[inv.tipe_inovasi]}`} actions={<Link href="/dashboard" className={btnOutline}>← Semua proyek</Link>} />
      <ProjectNav id={id} active="" />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3"><StatusBadge status={inv.status} /><PhaseTimeline current={phaseOf(inv.status)} /></div>
        {tunggu ? <Alert tone="perhatian"><strong>Menunggu BRIDA menunjuk admin kelurahan.</strong> Kelurahan tujuan belum punya akun bermandat. BRIDA sudah diberi notifikasi; pengajuan Anda otomatis berlanjut ke Kelurahan begitu mandat diberikan.</Alert> : <p className="text-sm text-indigo-space/75">{STATUS_INFO[inv.status]?.hint}</p>}
        {inv.catatan_pemeriksaan && ["REVISION_REQUESTED", "REJECTED", "CANCELLED_BY_KELURAHAN"].includes(inv.status) && <Alert tone="perhatian"><strong>Catatan:</strong> {inv.catatan_pemeriksaan}</Alert>}
        {inv.dispute_flag && <Alert tone="bahaya"><strong>Sengketa dimediasi BRIDA.</strong> {inv.dispute_reason}</Alert>}
      </div>

      {editable ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <form action={saveDraftAction} className="space-y-6 lg:col-span-2">
            <input type="hidden" name="id" value={id} />
            <Card className="space-y-4">
              <SectionTitle>Data inovasi</SectionTitle>
              <Field label="Judul" htmlFor="judul"><input id="judul" name="judul" defaultValue={inv.judul} maxLength={160} className={inputCls} /></Field>
              <Field label="Tipe inovasi" htmlFor="tipe_inovasi" hint={`Plafon ${inv.skala_plafon === "KECIL_5JT" ? "Skala Kecil" : "Skala Terapan"}: ${rupiah(plafon)}, durasi ${inv.skala_plafon === "KECIL_5JT" ? p.durasi_bangun_kecil : p.durasi_bangun_terapan} hari.`}>
                <select id="tipe_inovasi" name="tipe_inovasi" defaultValue={inv.tipe_inovasi} className={inputCls}>{TIPE_INOVASI.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
              <Field label="Ringkasan inovasi" htmlFor="ringkasan"><textarea id="ringkasan" name="ringkasan" rows={3} defaultValue={inv.ringkasan} maxLength={1000} className={inputCls} /></Field>
              <Field label="Masalah yang diselesaikan" htmlFor="masalah" hint="Dipakai untuk menyusun pertanyaan survei warga secara otomatis."><textarea id="masalah" name="masalah" rows={3} defaultValue={inv.masalah} maxLength={2000} className={inputCls} /></Field>
              <Field label="Tujuan terukur" htmlFor="tujuan"><textarea id="tujuan" name="tujuan" rows={2} defaultValue={inv.tujuan} maxLength={1000} className={inputCls} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Target pengguna" htmlFor="target_pengguna"><input id="target_pengguna" name="target_pengguna" defaultValue={inv.target_pengguna} className={inputCls} placeholder="Warga RT 3 RW 2 (±120 KK)" /></Field>
                <Field label="Lokasi uji (RT/RW)" htmlFor="target_rt_rw"><input id="target_rt_rw" name="target_rt_rw" defaultValue={inv.target_rt_rw} className={inputCls} placeholder="RT 3 / RW 2" /></Field>
              </div>
            </Card>
            <Card className="space-y-4">
              <SectionTitle>RAB & perawatan</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Total RAB (Rp)" htmlFor="total_rab" hint={`Maks ${rupiah(plafon)}`}><input id="total_rab" name="total_rab" inputMode="numeric" defaultValue={inv.total_rab} className={inputCls} /></Field>
                <Field label="Dana tak terduga (Rp)" htmlFor="rab_tak_terduga" hint={`Maks ${p.tak_terduga_maks_pct}% total`}><input id="rab_tak_terduga" name="rab_tak_terduga" inputMode="numeric" defaultValue={inv.rab_tak_terduga} className={inputCls} /></Field>
                <Field label="Honor tim (Rp)" htmlFor="rab_honor" hint={`Maks ${p.honor_maks_pct}% total`}><input id="rab_honor" name="rab_honor" inputMode="numeric" defaultValue={inv.rab_honor} className={inputCls} /></Field>
              </div>
              <Field label="Rencana perawatan (bulan)" htmlFor="rencana_perawatan_bulan" hint={`${p.perawatan_min_bulan}–${p.perawatan_maks_bulan} bulan`}><input id="rencana_perawatan_bulan" name="rencana_perawatan_bulan" inputMode="numeric" defaultValue={inv.rencana_perawatan_bulan ?? ""} className={inputCls + " sm:max-w-[10rem]"} /></Field>
              {inv.total_rab > 0 && <p className="text-sm text-indigo-space/75">Pencairan 30-30-40 (setelah disimpan): {rupiah(split.TAHAP_1_30)} · {rupiah(split.TAHAP_2_30)} · {rupiah(split.TAHAP_3_40)}.</p>}
            </Card>
            <Card className="space-y-4">
              <SectionTitle>Dokumen</SectionTitle>
              <p className="text-xs text-indigo-space/70">Unduh template di <Link href="/dokumen" className="font-semibold text-teal-deep underline">halaman Template</Link>. Surat Kesepakatan wajib bertanda tangan basah/stempel Ketua RT/RW, Lurah, dan Ketua Tim.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <UploadField name="prd_url" prefix={`${id}/prd`} label="PRD" initial={inv.prd_url} />
                <UploadField name="rab_url" prefix={`${id}/rab`} label="RAB terperinci per tahap" initial={inv.rab_url} />
                <UploadField name="surat_keaslian_url" prefix={`${id}/keaslian`} label="Surat Keaslian (bermeterai Rp10.000)" initial={inv.surat_keaslian_url} />
                <UploadField name="surat_kesepakatan_url" prefix={`${id}/kesepakatan`} label="Scan Surat Kesepakatan Lokasi Uji" initial={inv.surat_kesepakatan_url} />
              </div>
            </Card>
            <div className="flex flex-wrap gap-3"><SubmitButton className="inline-flex rounded-lg bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white">Simpan draft</SubmitButton></div>
          </form>

          <aside className="space-y-6">
            <Card className="space-y-3">
              <SectionTitle>Tim ({members.length}/{p.tim_maks})</SectionTitle>
              <ul className="space-y-2">{members.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-2 rounded-lg border border-celadon bg-white p-2 text-sm">
                  <span><strong>{m.nama_anggota}</strong>{m.is_ketua && " (ketua)"}<br /><span className="text-xs text-indigo-space/65">{m.peran_dalam_tim} · {JENJANG_LABEL[m.jenjang_pendidikan]}</span></span>
                  {!m.is_ketua && <form action={removeMemberAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="member" value={m.id} /><button className="text-xs font-semibold text-red-700 hover:underline" aria-label={`Hapus ${m.nama_anggota}`}>Hapus</button></form>}
                </li>))}</ul>
              {members.length < p.tim_maks && (
                <form action={addMemberAction} className="space-y-2 border-t border-celadon pt-3">
                  <input type="hidden" name="id" value={id} />
                  <input name="nama_anggota" required placeholder="Nama anggota" aria-label="Nama anggota" className={inputCls} />
                  <input name="peran_dalam_tim" placeholder="Peran (mis. Hardware)" aria-label="Peran" className={inputCls} />
                  <input name="institusi_asal" placeholder="Institusi asal" aria-label="Institusi" className={inputCls} />
                  <input name="kota_domisili" placeholder="Kota domisili" aria-label="Kota" className={inputCls} />
                  <select name="jenjang_pendidikan" defaultValue="MAHASISWA_DIPLOMA_S1" aria-label="Jenjang" className={inputCls}>{JENJANG.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}</select>
                  <SubmitButton className={btnOutline}>+ Tambah anggota</SubmitButton>
                </form>)}
              <p className="text-xs text-indigo-space/60">Tim wajib {p.tim_min}–{p.tim_maks} orang; pelajar SMP/SD ke bawah ditolak.</p>
            </Card>
            <Card className="space-y-3">
              <SectionTitle>Kelengkapan</SectionTitle>
              {kurang.length === 0 ? <p className="text-sm font-semibold text-[#2c6b5b]">✓ Lengkap. Simpan draft lalu kirim.</p> : <ul className="list-disc space-y-1 pl-5 text-sm">{kurang.map((k) => <li key={k}>{k}</li>)}</ul>}
              <p className="text-xs text-indigo-space/60">Daftar ini dihitung dari data yang sudah tersimpan. Pemeriksaan resmi dilakukan sistem saat Anda menekan Kirim.</p>
              <form action={submitAction}><input type="hidden" name="id" value={id} /><SubmitButton confirm="Kirim pengajuan ke Kelurahan? Data tidak dapat diubah sampai ada keputusan.">Kirim ke Kelurahan</SubmitButton></form>
              {acts.includes("hapus") && <form action={deleteDraftAction}><input type="hidden" name="id" value={id} /><SubmitButton className={btnDanger} confirm="Hapus draft ini?">Hapus draft</SubmitButton></form>}
            </Card>
          </aside>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="space-y-3 lg:col-span-2">
            <SectionTitle>Ringkasan</SectionTitle>
            <p className="text-sm">{inv.ringkasan}</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold">Masalah</dt><dd>{inv.masalah}</dd></div><div><dt className="font-semibold">Tujuan</dt><dd>{inv.tujuan}</dd></div>
              <div><dt className="font-semibold">Target</dt><dd>{inv.target_pengguna} · {inv.target_rt_rw}</dd></div>
              <div><dt className="font-semibold">RAB</dt><dd>{rupiah(inv.total_rab)} → {rupiah(split.TAHAP_1_30)} · {rupiah(split.TAHAP_2_30)} · {rupiah(split.TAHAP_3_40)}</dd></div>
            </dl>
            <DocLinks inv={inv} funds={funds} />
          </Card>
          <Card><SectionTitle>Tim</SectionTitle><TeamList members={members} /></Card>
        </div>
      )}
    </Main>
  );
}
