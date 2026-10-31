import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Wilayah domisili kini diubah dari /profil dengan form yang sama seperti saat daftar. */
export default async function DomicilePage() {
  await requireUser();
  redirect("/profil#domisili");
}
