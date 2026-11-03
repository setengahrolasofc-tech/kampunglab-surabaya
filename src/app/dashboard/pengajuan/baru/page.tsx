import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { NewDraftForm } from "@/components/new-draft-form";
import { Card, Main, PageHeader, btnOutline } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Pengajuan baru" };

export default async function BaruPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; masalah?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("INNOVATOR");
  const { data } = await supabase.from("problem_boards").select("id, judul_masalah, kelurahan:master_kelurahan(kecamatan, kelurahan)").eq("status", "OPEN").order("created_at", { ascending: false }).limit(200);
  const problems = ((data ?? []) as unknown as Array<{ id: string; judul_masalah: string; kelurahan: { kecamatan: string; kelurahan: string } | null }>)
    .map((p) => ({ id: p.id, label: `${p.judul_masalah} — Kel. ${p.kelurahan?.kelurahan ?? "?"}, Kec. ${p.kelurahan?.kecamatan ?? "?"}` }));
  return (
    <Main narrow>
      <PageHeader title="Pengajuan baru" subtitle="Pilih masalah dari Papan Masalah, atau survei mandiri dan pilih kelurahan lokasi uji. Draft bisa Anda lengkapi bertahap." actions={<Link href="/dashboard" className={btnOutline}>← Kembali</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      <Card><NewDraftForm problems={problems} defaultProblem={sp.masalah} /></Card>
    </Main>
  );
}
