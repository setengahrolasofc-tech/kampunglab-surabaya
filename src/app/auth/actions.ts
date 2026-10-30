"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { getAppOrigin, validateAuthForm } from "@/lib/auth/validation.mjs";
import type { AuthActionState } from "@/lib/auth/types";

const unavailable = { error: "Layanan akun belum dapat dihubungi. Coba lagi beberapa saat." };

export async function login(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateAuthForm(form, "login");
  if (Object.keys(input.errors).length) return { errors: input.errors };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
    if (error) return { error: "Belum berhasil masuk. Periksa email, kata sandi, dan konfirmasi emailmu." };
  } catch { return unavailable; }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateAuthForm(form, "signup");
  if (Object.keys(input.errors).length) return { errors: input.errors };
  let immediateSession = false;
  try {
    const supabase = await createServerSupabaseClient();
    const origin = getAppOrigin(process.env.NEXT_PUBLIC_APP_URL);
    const { data, error } = await supabase.auth.signUp({
      email: input.email, password: input.password,
      options: { data: { display_name: input.displayName }, emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) return { error: "Pendaftaran belum dapat diproses. Periksa isian atau coba lagi nanti. Jika sudah punya akun, gunakan halaman Masuk." };
    immediateSession = Boolean(data.session);
  } catch { return unavailable; }
  if (immediateSession) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
  return { message: "Permintaan pendaftaran diterima. Periksa email dan folder spam untuk konfirmasi. Jika sudah terdaftar, kamu bisa masuk atau memulihkan kata sandi." };
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
  return { message: "Jika alamat tersebut terdaftar, petunjuk pemulihan akan dikirim. Periksa email dan folder spam." };
}

export async function updatePassword(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateAuthForm(form, "password");
  if (Object.keys(input.errors).length) return { errors: input.errors };
  const { supabase } = await requireUser();
  try {
    const { error } = await supabase.auth.updateUser({ password: input.password });
    if (error) return { error: "Kata sandi belum dapat diperbarui. Coba kata sandi lain atau minta tautan pemulihan baru." };
  } catch { return unavailable; }
  return { message: "Kata sandi berhasil diperbarui. Kamu dapat kembali ke dashboard." };
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
