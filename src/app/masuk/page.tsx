import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { LogoFull } from "@/components/logo";
import { Card, Main } from "@/components/ui";
import { getSession, homeFor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Masuk" };

const INFO: Record<string, string> = {
  "perlu-masuk": "Silakan masuk untuk melanjutkan.",
  diblokir: "Akun ini diblokir. Hubungi Admin BRIDA bila Anda merasa ini keliru.",
  "tautan-gagal": "Tautan verifikasi tidak valid atau sudah kedaluwarsa. Masuk, atau minta kode baru lewat Lupa password.",
};

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const session = await getSession();
  if (session && session.profile.status !== "DIBLOKIR") redirect(homeFor(session.profile.role));
  return (
    <Main narrow>
      <Card className="mx-auto max-w-md space-y-5">
        <div className="flex justify-center"><LogoFull size={44} /></div>
        <h1 className="text-center text-xl font-bold">Masuk</h1>
        <LoginForm info={status ? INFO[status] : undefined} />
      </Card>
    </Main>
  );
}
