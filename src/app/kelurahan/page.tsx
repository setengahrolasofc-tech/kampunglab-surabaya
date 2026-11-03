import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { Badge, Empty, Main, PageHeader, SectionTitle, Stat, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { rupiah, tanggal } from "@/lib/domain/format.mjs";
import type { InnovationRow } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard Kelurahan" };

const PERLU_TINDAKAN: Record<string, string> = {
  SUBMITTED_TO_KELURAHAN: "Periksa berkas", APPROVED_WAITING_TERM_1: "Catat transfer Tahap 1", EVALUATION_TERM_2: "Putuskan hasil uji / transfer Tahap 2",
  REFINEMENT_AND_HANDOVER: "Validasi serah terima / transfer Tahap 3", DISPUTED: "Dalam mediasi BRIDA",
};

export default async function KelurahanHome({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const { supabase, mandate, profile } = await requireRole("KELURAHAN");
  await supabase.rpc("sync_due_tests");
  const [{ data: rows }, { data: problems }] = await Promise.all([
    supabase.from("innovations").select("id, judul, status, total_rab, status_changed_at, kode_unik").eq("kelurahan_target_id", mandate!.kelurahan_id).order("status_changed_at", { ascending: false }),
    supabase.from("problem_boards").select("id, status").eq("kelurahan_id", mandate!.kelurahan_id),
  ]);
  const list = (rows ?? []) as Pick<InnovationRow, "id" | "judul" | "status" | "total_rab" | "status_changed_at" | "kode_unik">[];
  const perlu = list.filter((i) => PERLU_TINDAKAN[i.status] && i.status !== "DISPUTED");
  const lain = list.filter((i) => !perlu.includes(i));
  const kel = profile.kelurahan;
  return (
    <Main>
      <PageHeader title="Dashboard Kelurahan" subtitle={`${kel ? `Kelurahan ${kel.kelurahan}, Kec. ${kel.kecamatan}` : ""} · mandat ${mandate!.tipe === "UTAMA" ? "utama" : "cadangan"} sejak ${tanggal(mandate!.diberikan_pada)}`}
        actions={<Link href="/kelurahan/masalah" className="rounded-lg border border-teal-deep px-4 py-2 text-sm font-semibold text-teal-deep hover:bg-celadon/40">Kelola Papan Masalah</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Perlu tindakan" value={perlu.length} />
        <Stat label="Total pengajuan" value={list.length} />
        <Stat label="Masalah terbuka" value={(problems ?? []).filter((p) => p.status === "OPEN").length} />
        <Stat label="Masalah selesai" value={(problems ?? []).filter((p) => p.status === "SOLVED").length} />
      </div>
      <section className="mb-8"><SectionTitle>Antrean perlu tindakan</SectionTitle>
        {perlu.length === 0 ? <Empty>Tidak ada pengajuan yang menunggu tindakan Anda.</Empty> : (
          <ul className="space-y-2">{perlu.map((i) => (
            <li key={i.id}><Link href={`/kelurahan/pengajuan/${i.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold bg-gold/20 p-4 hover:bg-gold/30">
              <span><span className="font-semibold">{i.judul}</span><br /><span className="text-xs text-indigo-space/70">{i.kode_unik} · RAB {rupiah(i.total_rab)}</span></span>
              <span className="flex items-center gap-2"><Badge tone="perhatian">{PERLU_TINDAKAN[i.status]}</Badge></span></Link></li>
          ))}</ul>)}
      </section>
      <section><SectionTitle>Semua pengajuan lainnya</SectionTitle>
        {lain.length === 0 ? <Empty>Belum ada pengajuan lain.</Empty> : (
          <ul className="space-y-2">{lain.map((i) => (
            <li key={i.id}><Link href={`/kelurahan/pengajuan/${i.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-celadon bg-white p-4 hover:bg-celadon/30">
              <span><span className="font-semibold">{i.judul}</span><br /><span className="text-xs text-indigo-space/70">{i.kode_unik} · diperbarui {tanggal(i.status_changed_at)}</span></span><StatusBadge status={i.status} /></Link></li>
          ))}</ul>)}
      </section>
    </Main>
  );
}
