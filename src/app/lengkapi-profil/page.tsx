import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompleteProfileForm } from "@/components/auth-forms";
import { LogoFull } from "@/components/logo";
import { Alert, Card, Main } from "@/components/ui";
import { needsProfileCompletion } from "@/lib/auth/profile.mjs";
import { getSession, homeFor } from "@/lib/auth/session";
import { normalizeIntent } from "@/lib/auth/validation.mjs";

export const metadata: Metadata = { title: "Lengkapi data diri" };

export default async function LengkapiProfilPage({ searchParams }: { searchParams: Promise<{ sebagai?: string }> }) {
  const { sebagai } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/masuk?status=perlu-masuk");
  const { profile } = session;
  if (profile.status === "DIBLOKIR") redirect("/masuk?status=diblokir");
  if (!needsProfileCompletion(profile)) redirect(homeFor(profile.role));
  return (
    <Main narrow>
      <Card className="space-y-5">
        <div className="flex justify-center"><LogoFull size={44} /></div>
        <h1 className="text-center text-xl font-bold">Lengkapi data diri</h1>
        <p className="text-center text-sm text-indigo-space/75">
          Anda masuk dengan Google sebagai <strong>{profile.email}</strong>. Isi data berikut untuk menyelesaikan pendaftaran. Tidak perlu membuat password.
        </p>
        <Alert tone="info">Anda dapat mendaftar sebagai Inovator/Warga, atau meminta akses Kelurahan (perlu SK dan izin Admin BRIDA).</Alert>
        <CompleteProfileForm
          defaultName={profile.name} email={profile.email} defaultPhone={profile.phone_wa}
          initialRole={normalizeIntent(sebagai) === "kelurahan" ? "KELURAHAN" : "INNOVATOR"}
        />
      </Card>
    </Main>
  );
}
