import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Card, Empty, Field, Main, PageHeader, SectionTitle, btnDanger, btnOutline, inputCls } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { TEMA_MASALAH } from "@/lib/domain/innovation-rules.mjs";
import { createProblemAction, deleteProblemAction, updateProblemAction } from "../actions";

export const metadata: Metadata = { title: "Papan Masalah (Kelurahan)" };

function ProblemFields({ p }: { p?: { judul_masalah: string; kategori_tema: string; deskripsi: string; deskripsi_lokasi_rt_rw: string; kontak_wa_narahubung: string } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2"><Field label="Judul masalah" htmlFor="judul_masalah"><input id="judul_masalah" name="judul_masalah" required minLength={5} defaultValue={p?.judul_masalah} className={inputCls} /></Field></div>
      <Field label="Tema" htmlFor="kategori_tema"><select id="kategori_tema" name="kategori_tema" defaultValue={p?.kategori_tema ?? "LINGKUNGAN"} className={inputCls}>{TEMA_MASALAH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
      <Field label="Lokasi (RT/RW, titik)" htmlFor="deskripsi_lokasi_rt_rw"><input id="deskripsi_lokasi_rt_rw" name="deskripsi_lokasi_rt_rw" required defaultValue={p?.deskripsi_lokasi_rt_rw} className={inputCls} placeholder="RT 3 / RW 2, gang masjid" /></Field>
      <Field label="Nomor WA narahubung" htmlFor="kontak_wa_narahubung" hint="Tampil di Papan Masalah publik sebagai tombol Hubungi WA."><input id="kontak_wa_narahubung" name="kontak_wa_narahubung" required inputMode="tel" defaultValue={p?.kontak_wa_narahubung} className={inputCls} /></Field>
      <div className="sm:col-span-2"><Field label="Uraian masalah" htmlFor="deskripsi"><textarea id="deskripsi" name="deskripsi" rows={3} defaultValue={p?.deskripsi} className={inputCls} /></Field></div>
    </div>
  );
}

export default async function MasalahKelurahan({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const { supabase, mandate } = await requireRole("KELURAHAN");
  const { data } = await supabase.from("problem_boards").select("*").eq("kelurahan_id", mandate!.kelurahan_id).order("created_at", { ascending: false });
  return (
    <Main>
      <PageHeader title="Papan Masalah Kelurahan" subtitle="Masalah yang Anda unggah tampil publik agar inovator bisa memilihnya. Mengunggah masalah bersifat opsional." actions={<Link href="/kelurahan" className={btnOutline}>← Dashboard</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      <Card className="mb-8"><SectionTitle>Tambah masalah</SectionTitle>
        <form action={createProblemAction} className="space-y-3"><ProblemFields /><SubmitButton>Unggah ke Papan Masalah</SubmitButton></form></Card>
      <SectionTitle>Masalah kelurahan Anda</SectionTitle>
      {(data ?? []).length === 0 ? <Empty>Belum ada masalah diunggah.</Empty> : (
        <ul className="space-y-3">{(data ?? []).map((p) => (
          <li key={p.id}><Card>
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{p.judul_masalah}</h3>{p.status === "SOLVED" ? <Badge tone="sukses">Terselesaikan</Badge> : <Badge tone="info">Terbuka</Badge>}</div>
            <p className="text-sm text-indigo-space/70">{p.deskripsi_lokasi_rt_rw} · WA {p.kontak_wa_narahubung}</p>
            {p.status === "OPEN" && (
              <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-teal-deep">Ubah / hapus</summary>
                <form action={updateProblemAction} className="mt-3 space-y-3"><input type="hidden" name="id" value={p.id} /><ProblemFields p={p} /><SubmitButton>Simpan perubahan</SubmitButton></form>
                <form action={deleteProblemAction} className="mt-2"><input type="hidden" name="id" value={p.id} /><SubmitButton className={btnDanger} confirm="Hapus masalah ini?">Hapus</SubmitButton></form>
              </details>)}
          </Card></li>
        ))}</ul>)}
    </Main>
  );
}
