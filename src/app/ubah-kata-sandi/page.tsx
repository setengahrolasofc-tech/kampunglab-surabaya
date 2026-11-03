import type { Metadata } from "next";
import { PasswordForm } from "@/components/auth-forms";
import { Card, Main } from "@/components/ui";
import { requireAnyUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ubah password" };

export default async function UbahPage() {
  await requireAnyUser();
  return (
    <Main narrow>
      <Card className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-bold">Buat password baru</h1>
        <PasswordForm />
      </Card>
    </Main>
  );
}
