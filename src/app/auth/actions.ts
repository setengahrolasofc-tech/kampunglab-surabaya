"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { getAppOrigin, isValidEmail, validateAuthForm, validateDomicile, validateOtp } from "@/lib/auth/validation.mjs";
import type { AuthActionState } from "@/lib/auth/types";

const unavailable = { error: "Layanan akun belum dapat dihubungi. Coba lagi beberapa saat." };
const badOtp = { error: "Kode OTP salah atau sudah kedaluwarsa. Periksa kodenya atau kirim ulang." };

export async function login(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateAuthForm(form, "login");
  if (Object.keys(input.errors).length) return { errors: input.errors };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
    if (error) return { error: "Belum berhasil masuk. Periksa email, password, dan konfirmasi emailmu." };
  } catch { return unavailable; }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Masuk dengan Google. Membutuhkan provider Google aktif di Supabase (lihat docs/OTP_SETUP.md). */
export async function loginWithGoogle(): Promise<void> {
  let url: string | undefined;
  try {
    const supabase = await createServerSupabaseClient();
    const origin = getAppOrigin(process.env.NEXT_PUBLIC_APP_URL);
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback` } });
    if (!error) url = data.url;
  } catch { /* Detail provider tidak ditampilkan. */ }
  if (!url) redirect("/masuk?status=google-gagal");
  redirect(url);
}

export async function signup(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateAuthForm(form, "signup");
  const domicile = validateDomicile(form);
  const errors = { ...input.errors, ...domicile.errors };
  if (Object.keys(errors).length) return { errors };
  let immediateSession = false;
  try {
    const supabase = await createServerSupabaseClient();
    const origin = getAppOrigin(process.env.NEXT_PUBLIC_APP_URL);
    const { data, error } = await supabase.auth.signUp({
      email: input.email, password: input.password,
      options: {
        // Klaim domisili tersimpan di metadata Auth. Belum diverifikasi dan tidak dipakai untuk hak akses.
        data: {
          display_name: input.displayName,
          domicile_address: domicile.value.address,
          domicile_kecamatan: domicile.value.kecamatan,
          domicile_kelurahan: domicile.value.kelurahan,
          domicile_rw: domicile.value.rw,
          domicile_rt: domicile.value.rt,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) return { error: "Pendaftaran belum dapat diproses. Periksa isian atau coba lagi nanti. Jika sudah punya akun, gunakan halaman Masuk." };
    immediateSession = Boolean(data.session);
  } catch { return unavailable; }
  if (immediateSession) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
  return { step: "otp", email: input.email };
}

export async function verifySignupOtp(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateOtp(form);
  if (input.errors.email) return { error: "Sesi verifikasi tidak valid. Ulangi dari awal." };
  if (input.errors.token) return { errors: { token: input.errors.token } };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ email: input.email, token: input.token, type: "email" });
    if (error) return badOtp;
  } catch { return unavailable; }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function requestPasswordReset(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateAuthForm(form, "reset");
  if (Object.keys(input.errors).length) return { errors: input.errors };
  try {
    const supabase = await createServerSupabaseClient();
    const origin = getAppOrigin(process.env.NEXT_PUBLIC_APP_URL);
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${origin}/auth/callback?next=/ubah-kata-sandi`,
    });
    if (error) return { error: "Permintaan belum dapat diproses. Coba lagi nanti." };
  } catch { return unavailable; }
  // Respons sama untuk email terdaftar maupun tidak, agar akun tidak dapat ditebak.
  return { step: "otp", email: input.email };
}

export async function verifyRecoveryOtp(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateOtp(form);
  if (input.errors.email) return { error: "Sesi verifikasi tidak valid. Ulangi dari awal." };
  if (input.errors.token) return { errors: { token: input.errors.token } };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ email: input.email, token: input.token, type: "recovery" });
    if (error) return badOtp;
  } catch { return unavailable; }
  revalidatePath("/", "layout");
  redirect("/ubah-kata-sandi");
}

/** Kirim ulang kode OTP. Dipanggil langsung dari komponen OTP. */
export async function resendOtp(kind: "signup" | "recovery", email: string): Promise<AuthActionState> {
  const clean = String(email ?? "").trim().toLowerCase();
  if ((kind !== "signup" && kind !== "recovery") || !isValidEmail(clean)) return { error: "Alamat email tidak valid." };
  try {
    const supabase = await createServerSupabaseClient();
    const origin = getAppOrigin(process.env.NEXT_PUBLIC_APP_URL);
    const { error } = kind === "signup"
      ? await supabase.auth.resend({ type: "signup", email: clean, options: { emailRedirectTo: `${origin}/auth/callback` } })
      : await supabase.auth.resetPasswordForEmail(clean, { redirectTo: `${origin}/auth/callback?next=/ubah-kata-sandi` });
    if (error) return { error: "Kode belum dapat dikirim ulang. Tunggu sebentar lalu coba lagi." };
  } catch { return unavailable; }
  return { message: "Kode baru sudah dikirim. Gunakan kode yang terbaru." };
}

export async function updatePassword(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateAuthForm(form, "password");
  if (Object.keys(input.errors).length) return { errors: input.errors };
  const { supabase } = await requireUser();
  try {
    const { error } = await supabase.auth.updateUser({ password: input.password });
    if (error) return { error: "Password belum dapat diperbarui. Coba password lain atau minta kode pemulihan baru." };
  } catch { return unavailable; }
  return { message: "Password berhasil diperbarui. Kamu dapat kembali ke dashboard." };
}

export async function updateProfile(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateAuthForm(form, "profile");
  if (Object.keys(input.errors).length) return { errors: input.errors };
  const { supabase, user } = await requireUser();
  try {
    const { data, error } = await supabase.from("profiles").update({ display_name: input.displayName }).eq("id", user.id).select("id").single();
    if (error || !data) return { error: "Profil belum tersimpan. Muat ulang halaman dan coba kembali." };
  } catch { return unavailable; }
  revalidatePath("/dashboard");
  redirect("/dashboard?status=profil-disimpan");
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect("/dashboard?status=keluar-gagal");
  revalidatePath("/", "layout");
  redirect("/masuk?status=keluar");
}
