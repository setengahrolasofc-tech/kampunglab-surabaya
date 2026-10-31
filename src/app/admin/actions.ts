"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { manageAccess } from "@/lib/admin/access";
import { isUuid, validateAdminForm } from "@/lib/admin/validation.mjs";
import type { AdminFormState, UserAccess } from "@/lib/admin/types";

export async function lookupAccess(_state: AdminFormState, form: FormData): Promise<AdminFormState> {
  const email = typeof form.get("email") === "string" ? String(form.get("email")).trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { errors: { email: "Isi alamat email lengkap." } };
  const { data, error } = await manageAccess("lookup_user", { email });
  if (error) return { error: "Pencarian belum berhasil. Muat ulang untuk memeriksa aksesmu." };
  const account = data as unknown as UserAccess;
  if (!account.user) return { error: "Akun aktif dengan email terkonfirmasi belum ditemukan. Minta orang tersebut mendaftar dan mengonfirmasi emailnya dahulu." };
  redirect(`/admin?user=${account.user.id}`);
}

export async function updateAccess(_state: AdminFormState, form: FormData): Promise<AdminFormState> {
  const input = validateAdminForm(form);
  if (Object.keys(input.errors).length) return { errors: input.errors };
  const { error } = await manageAccess(input.operation, input.payload);
  if (error) {
    const specific: Record<string, string> = {
      SELF_ADMIN_CHANGE: "Akses admin milikmu sendiri harus diubah oleh admin aktif lain.",
      TARGET_UNAVAILABLE: "Akun tujuan belum terkonfirmasi atau sudah dinonaktifkan.",
      GRANT_UNAVAILABLE: "Penetapan sudah dicabut atau tidak tersedia. Muat ulang halaman.",
      ADMIN_REQUIRED: "Akses adminmu sudah tidak berlaku. Muat ulang halaman.",
    };
    return { error: specific[error.message] || (error.code === "23P01" ? "Periode bertumpuk dengan penetapan yang sudah ada. Periksa riwayat dan masa berlakunya." : error.code === "23505" ? "Wilayah atau jabatan tersebut sudah tersedia." : error.code === "23503" || error.code === "23514" ? "Periksa induk wilayah, jabatan, dan masa berlaku yang dipilih." : "Perubahan belum tersimpan. Periksa isian dan aksesmu, lalu coba kembali.") };
  }
  revalidatePath("/admin"); revalidatePath("/dashboard");
  const target = "user_id" in input.payload ? input.payload.user_id : null;
  redirect(`/admin?status=disimpan${isUuid(target) ? `&user=${target}` : ""}`);
}
