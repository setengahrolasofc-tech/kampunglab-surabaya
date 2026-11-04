import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { Card, Empty, Main, PageHeader, PhaseTimeline, StatusBadge, btnPrimary } from "@/components/ui";
import { requireAnyUser, homeFor } from "@/lib/auth/session";
import { rupiah, tanggal } from "@/lib/domain/format.mjs";
import { phaseOf, STATUS_INFO } from "@/lib/domain/workflow.mjs";
import type { InnovationRow } from "@/lib/types";

export const metadata: Metadata = { title: "Proyek Saya" };

export default async function ProyekSayaPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const session = await requireAnyUser();
  if (session.profile.role !== "INNOVATOR") redirect(homeFor(session.profile.role));
  if (session.profile.status === "DIBLOKIR") redirect("/masuk?status=diblokir");
  const { supabase, userId } = session;
  await supabase.rpc("sync_due_tests");
  const { data } = await supabase.from("innovations").select("id, judul, status, total_rab, tipe_inovasi, kode_unik, status_changed_at, catatan_pemeriksaan, kelurahan:master_kelurahan(kecamatan, kelurahan)").eq("leader_user_id", userId).order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Array<InnovationRow & { kelurahan: { kecamatan: string; kelurahan: string } | null }>;
  return (
    <Main>
      <PageHeader title="Proyek Saya" subtitle={`Halo, ${session.profile.name}. Pantau semua pengajuan inovasi Anda di sini.`} actions={<Link href="/dashboard/pengajuan/baru" className={btnPrimary}>+ Pengajuan baru</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      {rows.length === 0 ? <Empty>Belum ada pengajuan. Mulai dari <Link href="/papan-masalah" className="font-semibold text-teal-deep underline">Papan Masalah</Link> atau buat pengajuan baru.</Empty> : (
        <ul className="space-y-4">
          {rows.map((i) => (
            <li key={i.id}><Card className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><Link href={`/dashboard/pengajuan/${i.id}`} className="text-lg font-bold text-teal-deep hover:underline">{i.judul || "(Draft tanpa judul)"}</Link>
                  <p className="text-xs text-indigo-space/65">{i.kode_unik} · {i.kelurahan ? `Kel. ${i.kelurahan.kelurahan}, Kec. ${i.kelurahan.kecamatan}` : ""} · RAB {rupiah(i.total_rab)} · diperbarui {tanggal(i.status_changed_at)}</p></div>
                <StatusBadge status={i.status} />
              </div>
              <PhaseTimeline current={phaseOf(i.status)} />
              <p className="text-sm text-indigo-space/75">{STATUS_INFO[i.status]?.hint}</p>
              {i.status === "REVISION_REQUESTED" && i.catatan_pemeriksaan && <p className="rounded-lg bg-gold/30 px-3 py-2 text-sm"><strong>Catatan Kelurahan:</strong> {i.catatan_pemeriksaan}</p>}
            </Card></li>
          ))}
        </ul>)}
    </Main>
  );
}
