import type { Metadata } from "next";
import { ResetForm } from "@/components/auth-forms";
import { Card, Main } from "@/components/ui";

export const metadata: Metadata = { title: "Lupa password" };

export default function LupaPage() {
  return (
    <Main narrow>
      <Card className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-bold">Pulihkan password</h1>
        <p className="text-sm text-indigo-space/75">Masukkan email akun Anda. Kami mengirim kode OTP; masukkan kode itu bersama password baru.</p>
        <ResetForm />
      </Card>
    </Main>
  );
}
