import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KelurahanAccessForm } from "@/components/auth-forms";
import { Flash } from "@/components/flash";
import { Alert, Card, Main, PageHeader } from "@/components/ui";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Minta akses Kelurahan" };

export default async function MintaAksesPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session) redirect("/masuk?sebagai=kelurahan&status=perlu-masuk");
  const { profile, mandate } = session;
  if (profile.status === "DIBLOKIR") redirect("/masuk?status=diblokir");
  if (profile.role === "BRIDA_ADMIN") redirect("/admin");
  if (profile.role === "KELURAHAN") redirect(profile.status === "AKTIF" && mandate ? "/kelurahan" : "/menunggu-verifikasi");
  return (
    <Main narrow>
      <PageHeader title="Minta akses Kelurahan" subtitle="Dashboard Kelurahan hanya dibuka untuk Lurah atau staf yang ditugaskan, setelah Admin BRIDA memeriksa SK/surat tugas dan memberi izin." />
      <Flash ok={sp.ok} err={sp.err} />
      <Card className="space-y-4">
        <Alert tone="perhatian">Setelah permintaan dikirim, akun ini berubah menjadi akun Kelurahan berstatus <strong>menunggu mandat</strong>. Akun yang sudah punya pengajuan inovasi tidak dapat dialihkan; daftar dengan email lain.</Alert>
        <KelurahanAccessForm defaultPhone={profile.phone_wa} />
      </Card>
    </Main>
  );
}
