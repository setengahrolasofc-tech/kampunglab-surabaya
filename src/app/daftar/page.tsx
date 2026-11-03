import type { Metadata } from "next";
import { SignupForm } from "@/components/auth-forms";
import { LogoFull } from "@/components/logo";
import { Card, Main } from "@/components/ui";

export const metadata: Metadata = { title: "Daftar" };

export default function DaftarPage() {
  return (
    <Main narrow>
      <Card className="space-y-5">
        <div className="flex justify-center"><LogoFull size={44} /></div>
        <h1 className="text-center text-xl font-bold">Daftar akun KampungLab</h1>
        <p className="text-center text-sm text-indigo-space/75">Pilih peran Anda. Hanya ada tiga jenis akun login: Inovator, Kelurahan, dan Admin BRIDA. Warga penguji tidak perlu akun.</p>
        <SignupForm />
      </Card>
    </Main>
  );
}
