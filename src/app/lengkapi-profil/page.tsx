import { redirect } from "next/navigation";

// Halaman lama dari alur sebelum Rev. 4. Profil kini dilengkapi saat pendaftaran.
export default function LengkapiProfilPage() {
  redirect("/dashboard");
}
