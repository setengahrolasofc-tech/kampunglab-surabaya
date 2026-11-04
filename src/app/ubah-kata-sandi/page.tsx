import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/auth-forms";
import { Card, Main } from "@/components/ui";
import { requireAnyUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ubah password" };

export default async function UbahPage() {
  const { profile } = await requireAnyUser();
  return (
    <Main narrow>
      <Card className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-bold">Ubah password</h1>
        <p className="text-sm text-indigo-space/75">Demi keamanan, kami mengirim kode OTP ke email akun Anda untuk memastikan ini benar-benar Anda sebelum password diganti.</p>
        <ChangePasswordForm email={profile.email} />
      </Card>
    </Main>
  );
}
