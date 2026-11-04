import type { Metadata } from "next";
import { SignupForm } from "@/components/auth-forms";
import { LogoFull } from "@/components/logo";
import { Card, Main } from "@/components/ui";

export const metadata: Metadata = { title: "Daftar" };

export default async function DaftarPage({ searchParams }: { searchParams: Promise<{ sebagai?: string }> }) {
  const { sebagai } = await searchParams;
  return (
    <Main narrow>
      <Card className="space-y-5">
        <div className="flex justify-center"><LogoFull size={44} /></div>
        <h1 className="text-center text-xl font-bold">Daftar akun KampungLab</h1>
        <p className="text-center text-sm text-indigo-space/75">Daftar sebagai Inovator/Warga, atau minta akses Kelurahan (perlu izin Admin BRIDA). Akun Admin BRIDA tidak dibuat lewat pendaftaran. Warga penguji survei tidak perlu akun.</p>
        <SignupForm initialRole={sebagai === "kelurahan" ? "KELURAHAN" : "INNOVATOR"} />
      </Card>
    </Main>
  );
}
