import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { Alert, Badge, Card, Field, Main, PageHeader, inputCls } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { UploadField } from "@/components/upload-field";
import { getSession, homeFor } from "@/lib/auth/session";
import { resubmitRegistrationAction } from "../kelurahan/actions";

export const metadata: Metadata = { title: "Menunggu verifikasi BRIDA" };

export default async function MenungguPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session) redirect("/masuk?status=perlu-masuk");
  const { profile, mandate } = session;
  if (profile.role !== "KELURAHAN") redirect(homeFor(profile.role));
  if (profile.status === "AKTIF" && mandate) redirect("/kelurahan");
  const ditolak = profile.status === "DITOLAK";
  return (
    <Main narrow>
      <PageHeader title="Menunggu verifikasi BRIDA" subtitle="Akun Kelurahan belum punya wewenang sebelum Admin BRIDA memberi mandat. Semua fitur dashboard Kelurahan terkunci." />
      <Flash ok={sp.ok} err={sp.err} />
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Status pengajuan mandat:</span>
          {ditolak ? <Badge tone="bahaya">Ditolak</Badge> : profile.perlu_perbaikan ? <Badge tone="perhatian">Perlu perbaikan</Badge> : <Badge tone="perhatian">Menunggu mandat</Badge>}
        </div>
        {profile.catatan_verifikasi && <Alert tone={ditolak ? "bahaya" : "perhatian"}><strong>Catatan BRIDA:</strong> {profile.catatan_verifikasi}</Alert>}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase text-indigo-space/60">Nama</dt><dd>{profile.name}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-indigo-space/60">Email</dt><dd>{profile.email}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-indigo-space/60">NIP</dt><dd>{profile.nip ?? "-"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-indigo-space/60">Jabatan</dt><dd>{profile.jabatan ?? "-"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-indigo-space/60">Kelurahan</dt><dd>{profile.kelurahan ? `${profile.kelurahan.kelurahan}, Kec. ${profile.kelurahan.kecamatan}` : "-"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-indigo-space/60">Nomor WA</dt><dd>{profile.phone_wa ?? "-"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-indigo-space/60">SK / surat tugas</dt><dd>{profile.sk_document_url ? "Sudah diunggah" : <span className="font-semibold text-red-700">Belum diunggah</span>}</dd></div>
        </dl>
        {!ditolak && (!profile.sk_document_url || profile.perlu_perbaikan) && (
          <form action={resubmitRegistrationAction} className="space-y-3 border-t border-celadon pt-4">
            <h2 className="font-bold">{profile.perlu_perbaikan ? "Perbaiki data pendaftaran" : "Unggah SK / surat tugas"}</h2>
            <UploadField name="sk_path" prefix={`sk/${profile.id}`} label="SK / surat tugas (PDF atau gambar)" required accept=".pdf,.jpg,.jpeg,.png" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="NIP" htmlFor="nip"><input id="nip" name="nip" defaultValue={profile.nip ?? ""} className={inputCls} /></Field>
              <Field label="Jabatan" htmlFor="jabatan"><input id="jabatan" name="jabatan" defaultValue={profile.jabatan ?? ""} className={inputCls} /></Field>
            </div>
            <SubmitButton>Kirim ulang ke BRIDA</SubmitButton>
          </form>
        )}
        {mandate === null && profile.status === "MENUNGGU_MANDAT" && !profile.perlu_perbaikan && profile.sk_document_url && <p className="text-sm text-indigo-space/75">Data Anda sudah di antrean. Anda akan menerima notifikasi begitu mandat diberikan.</p>}
      </Card>
    </Main>
  );
}
