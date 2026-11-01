"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/admin/validation.mjs";

export type DelegationFormState = { error?: string; errors?: Record<string, string> };
const messages: Record<string, string> = {
  DELEGATION_UNAVAILABLE: "Kamu tidak lagi berwenang menetapkan admin untuk wilayah ini. Muat ulang halaman.",
  ALREADY_ASSIGNED: "Wilayah ini sudah memiliki admin utama aktif.",
  TARGET_UNAVAILABLE: "Akun dengan email itu belum ditemukan, belum terkonfirmasi, atau sudah dinonaktifkan. Minta orang tersebut mendaftar dan mengonfirmasi emailnya dahulu.",
  SELF_ASSIGN: "Kamu tidak dapat menetapkan dirimu sendiri. Pilih orang lain.",
  VERIFICATION_REQUIRED: "Centang pernyataan bahwa identitas dan kewenangan orang ini sudah kamu periksa.",
  SESSION_REQUIRED: "Sesi sudah tidak berlaku. Masuk kembali sebelum melanjutkan.",
};

export async function assignDelegatedMandate(_state: DelegationFormState, form: FormData): Promise<DelegationFormState> {
  const { supabase } = await requireUser();
  const territory = form.get("territory_id");
  const email = typeof form.get("email") === "string" ? String(form.get("email")).trim().toLowerCase() : "";
  const reference = typeof form.get("reference") === "string" ? String(form.get("reference")).trim() : "";
  const errors: Record<string, string> = {};
  if (!isUuid(territory)) return { error: "Muat ulang halaman sebelum menetapkan." };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Isi alamat email lengkap.";
  if (reference.length < 2 || reference.length > 240) errors.reference = "Isi dasar penetapan 2–240 karakter, misalnya nomor surat/SK atau hasil musyawarah.";
  if (form.get("verified") !== "on") errors.verified = "Konfirmasi bahwa identitas dan kewenangan sudah kamu periksa.";
  if (Object.keys(errors).length) return { errors };
  const { error } = await supabase.rpc("delegated_mandate", { operation: "assign", payload: { territory_id: String(territory), email, reference, verified: "true" } }).abortSignal(AbortSignal.timeout(45000));
  if (error) return { error: messages[error.message] ?? (error.code === "23P01" ? "Periode bertumpuk dengan penetapan yang sudah ada." : "Penetapan belum dapat dikonfirmasi. Muat ulang halaman untuk memeriksa statusnya.") };
  revalidatePath("/notifikasi"); revalidatePath("/dashboard"); revalidatePath(`/mandat/${territory}`);
  redirect(`/mandat/${territory}?status=ditetapkan`);
}
