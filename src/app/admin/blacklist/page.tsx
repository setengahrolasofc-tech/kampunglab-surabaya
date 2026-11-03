import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { Card, Empty, Field, Main, PageHeader, SectionTitle, btnDanger, btnOutline, inputCls } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { tanggal } from "@/lib/domain/format.mjs";
import { blacklistAddAction, blacklistRemoveAction } from "../actions";

export const metadata: Metadata = { title: "Daftar Hitam" };

export default async function BlacklistPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("BRIDA_ADMIN");
  const { data } = await supabase.from("blacklist").select("*").is("dihapus_pada", null).order("dicatat_pada", { ascending: false });
  return (
    <Main>
      <PageHeader title="Daftar Hitam" subtitle="Nama di daftar ini tidak dapat masuk tim pengajuan baru. Penghentian proyek menambah nama otomatis." actions={<Link href="/admin" className={btnOutline}>← Dashboard</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      <Card className="mb-8"><SectionTitle>Tambah manual</SectionTitle>
        <form action={blacklistAddAction} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <Field label="Nama lengkap" htmlFor="nama"><input id="nama" name="nama" required className={inputCls} /></Field>
          <Field label="Alasan (min. 10 karakter)" htmlFor="alasan"><input id="alasan" name="alasan" required minLength={10} className={inputCls} /></Field>
          <SubmitButton>Tambah</SubmitButton></form></Card>
      {(data ?? []).length === 0 ? <Empty>Daftar hitam kosong.</Empty> : (
        <div className="overflow-x-auto rounded-2xl border border-celadon bg-white"><table className="w-full text-sm">
          <thead><tr className="border-b border-celadon text-left text-xs uppercase text-indigo-space/60"><th className="p-3">Nama</th><th>Alasan</th><th>Sejak</th><th>Hapus</th></tr></thead>
          <tbody>{(data ?? []).map((b) => (<tr key={b.id} className="border-b border-celadon/60 align-top"><td className="p-3 font-semibold">{b.nama}</td><td>{b.alasan}</td><td>{tanggal(b.dicatat_pada)}</td>
            <td className="py-2"><form action={blacklistRemoveAction} className="flex gap-2"><input type="hidden" name="id" value={b.id} /><input name="alasan" required minLength={10} placeholder="Alasan penghapusan" aria-label="Alasan penghapusan" className={inputCls + " !w-44"} /><SubmitButton className={btnDanger} confirm="Hapus dari daftar hitam? Akun yang diblokir karena entri ini dipulihkan.">Hapus</SubmitButton></form></td></tr>))}</tbody></table></div>)}
    </Main>
  );
}
