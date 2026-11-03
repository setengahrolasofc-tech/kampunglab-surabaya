import type { Metadata } from "next";
import Link from "next/link";
import { BerkasLink } from "@/components/berkas-link";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Badge, Card, Empty, Main, PageHeader, SectionTitle, btnDanger, btnOutline, btnPrimary, inputCls } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { tanggal } from "@/lib/domain/format.mjs";
import { decideMandateAction, revokeMandateAction } from "../actions";

export const metadata: Metadata = { title: "Antrean Mandat Kelurahan" };

type Pendaftar = { id: string; name: string; email: string; nip: string | null; jabatan: string | null; phone_wa: string | null; sk_document_url: string | null; created_at: string; perlu_perbaikan: boolean; catatan_verifikasi: string | null; kelurahan: { kecamatan: string; kelurahan: string } | null; kelurahan_id: string };
type Mandat = { id: string; tipe: string; diberikan_pada: string; kelurahan: { kecamatan: string; kelurahan: string } | null; user: { name: string; email: string } | null };

export default async function MandatPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("BRIDA_ADMIN");
  const [{ data: antre }, { data: aktif }] = await Promise.all([
    supabase.from("users").select("id, name, email, nip, jabatan, phone_wa, sk_document_url, created_at, perlu_perbaikan, catatan_verifikasi, kelurahan_id, kelurahan:master_kelurahan(kecamatan, kelurahan)").eq("role", "KELURAHAN").eq("status", "MENUNGGU_MANDAT").order("created_at"),
    supabase.from("kelurahan_mandates").select("id, tipe, diberikan_pada, kelurahan:master_kelurahan(kecamatan, kelurahan), user:users!kelurahan_mandates_user_id_fkey(name, email)").is("dicabut_pada", null).order("diberikan_pada", { ascending: false }),
  ]);
  const queue = (antre ?? []) as unknown as Pendaftar[];
  const mandates = (aktif ?? []) as unknown as Mandat[];
  return (
    <Main>
      <PageHeader title="Antrean Mandat Kelurahan" subtitle="Periksa data dan SK pendaftar. Maksimal 2 akun bermandat aktif per kelurahan (1 utama, 1 cadangan)." actions={<Link href="/admin" className={btnOutline}>← Dashboard</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      <SectionTitle>Menunggu verifikasi ({queue.length})</SectionTitle>
      {queue.length === 0 ? <Empty>Tidak ada pendaftar yang menunggu.</Empty> : (
        <ul className="mb-10 space-y-4">{queue.map((u) => (
          <li key={u.id}><Card className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="font-bold">{u.name}</p><p className="text-sm text-indigo-space/75">{u.email} · WA {u.phone_wa ?? "-"}</p>
                <p className="text-sm">NIP {u.nip ?? "-"} · {u.jabatan ?? "-"} · <strong>Kel. {u.kelurahan?.kelurahan}, Kec. {u.kelurahan?.kecamatan}</strong></p>
                <p className="text-xs text-indigo-space/60">Mendaftar {tanggal(u.created_at, true)}</p></div>
              <div className="flex flex-col items-end gap-1"><BerkasLink path={u.sk_document_url} label="SK / surat tugas" />{u.perlu_perbaikan && <Badge tone="perhatian">Menunggu perbaikan pendaftar</Badge>}</div>
            </div>
            {u.catatan_verifikasi && <Alert tone="perhatian">Catatan sebelumnya: {u.catatan_verifikasi}</Alert>}
            <form action={decideMandateAction} className="space-y-2">
              <input type="hidden" name="user" value={u.id} />
              <input name="alasan" placeholder="Alasan / catatan (wajib untuk Tolak dan Minta Perbaikan, min. 10 karakter)" aria-label="Alasan" className={inputCls} />
              <div className="flex flex-wrap items-center gap-2">
                <select name="tipe" aria-label="Jenis mandat" className={inputCls + " !w-auto"}><option value="">Otomatis (utama/cadangan)</option><option value="UTAMA">Utama</option><option value="CADANGAN">Cadangan</option></select>
                <button name="action" value="BERI" className={btnPrimary}>Beri Mandat</button>
                <button name="action" value="PERBAIKI" className={btnOutline}>Minta Perbaikan</button>
                <button name="action" value="TOLAK" className={btnDanger}>Tolak</button>
              </div>
            </form>
          </Card></li>))}</ul>)}
      <SectionTitle>Mandat aktif ({mandates.length})</SectionTitle>
      {mandates.length === 0 ? <Empty>Belum ada mandat aktif.</Empty> : (
        <div className="overflow-x-auto rounded-2xl border border-celadon bg-white"><table className="w-full text-sm">
          <thead><tr className="border-b border-celadon text-left text-xs uppercase text-indigo-space/60"><th className="p-3">Kelurahan</th><th>Akun</th><th>Tipe</th><th>Sejak</th><th>Cabut mandat</th></tr></thead>
          <tbody>{mandates.map((m) => (
            <tr key={m.id} className="border-b border-celadon/60 align-top"><td className="p-3 font-semibold">{m.kelurahan?.kelurahan}<br /><span className="text-xs font-normal text-indigo-space/60">Kec. {m.kelurahan?.kecamatan}</span></td>
              <td>{m.user?.name}<br /><span className="text-xs text-indigo-space/60">{m.user?.email}</span></td><td><Badge tone={m.tipe === "UTAMA" ? "info" : "netral"}>{m.tipe}</Badge></td><td>{tanggal(m.diberikan_pada)}</td>
              <td className="py-2"><form action={revokeMandateAction} className="flex gap-2"><input type="hidden" name="mandate" value={m.id} /><input name="alasan" required minLength={5} placeholder="Alasan pencabutan" aria-label="Alasan pencabutan" className={inputCls + " !w-44"} /><SubmitButton className={btnDanger} confirm="Cabut mandat ini? Akun kembali terkunci.">Cabut</SubmitButton></form></td></tr>))}</tbody></table></div>)}
    </Main>
  );
}
