"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasEmailIdentity } from "@/lib/auth/completion.mjs";
import { domicileFromMetadata } from "@/lib/auth/domicile-match.mjs";
import { linkDomicile, linkMessages } from "@/lib/auth/domicile-sync";
import { OTP_LENGTH, validateAuthForm, validateDomicile } from "@/lib/auth/validation.mjs";
import type { AuthActionState } from "@/lib/auth/types";

const unavailable = { error: "Layanan akun belum dapat dihubungi. Coba lagi beberapa saat." };
const badOtp = { error: "Kode salah atau sudah kedaluwarsa. Periksa kodenya atau kirim kode baru." };
const emailOnly = { error: "Akun ini masuk lewat Google, jadi tidak memakai password KampungLab." };
const readToken = (form: FormData) => String(form.get("token") ?? "").replace(/\s/g, "");
const tokenOk = (token: string) => new RegExp(`^\\d{${OTP_LENGTH}}$`).test(token);
const refresh = () => { revalidatePath("/profil"); revalidatePath("/dashboard"); revalidatePath("/pengajuan"); };

export async function updateName(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateAuthForm(form, "profile");
  if (Object.keys(input.errors).length) return { errors: input.errors };
  const { supabase, user } = await requireUser();
  try {
    const { data, error } = await supabase.from("profiles").update({ display_name: input.displayName }).eq("id", user.id).select("id").single();
    if (error || !data) return { error: "Nama belum tersimpan. Muat ulang halaman dan coba kembali." };
    await supabase.auth.updateUser({ data: { display_name: input.displayName } });
  } catch { return unavailable; }
  refresh();
  return { message: "Nama berhasil disimpan." };
}

export async function updateDomicile(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const domicile = validateDomicile(form);
  if (Object.keys(domicile.errors).length) return { errors: domicile.errors };
  const { supabase } = await requireUser();
  let message: string;
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        domicile_address: domicile.value.address,
        domicile_kecamatan: domicile.value.kecamatan,
        domicile_kelurahan: domicile.value.kelurahan,
        domicile_rw: domicile.value.rw,
        domicile_rt: domicile.value.rt,
      },
    });
    if (error) return { error: "Domisili belum tersimpan. Muat ulang halaman dan coba lagi." };
    message = linkMessages[await linkDomicile(supabase, domicile.value)];
  } catch { return unavailable; }
  refresh();
  return { message };
}

export async function relinkDomicile(): Promise<AuthActionState> {
  const { supabase, user } = await requireUser();
  const claim = domicileFromMetadata(user.user_metadata);
  const message = linkMessages[await linkDomicile(supabase, claim)];
  refresh();
  return { message };
}

export async function requestPasswordCode(): Promise<AuthActionState> {
  const { supabase, user } = await requireUser();
  if (!hasEmailIdentity(user) || !user.email) return emailOnly;
  try {
    const { error } = await supabase.auth.signInWithOtp({ email: user.email, options: { shouldCreateUser: false } });
    if (error) return { error: "Kode belum dapat dikirim. Tunggu sebentar lalu coba lagi." };
  } catch { return unavailable; }
  return { step: "otp", email: user.email, message: `Kode dikirim ke ${user.email}.` };
}

/** Kode dicek lewat verifyOtp (selalu divalidasi server), baru password diganti. */
export async function changePassword(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const input = validateAuthForm(form, "password");
  const token = readToken(form);
  const errors: Record<string, string> = { ...input.errors };
  if (!tokenOk(token)) errors.token = `Masukkan ${OTP_LENGTH} digit kode.`;
  if (Object.keys(errors).length) return { errors, step: "otp" };
  const { supabase, user } = await requireUser();
  if (!hasEmailIdentity(user) || !user.email) return emailOnly;
  try {
    const verified = await supabase.auth.verifyOtp({ email: user.email, token, type: "email" });
    if (verified.error) return { ...badOtp, step: "otp" };
    const { error } = await supabase.auth.updateUser({ password: input.password });
    if (error) return { error: "Password belum dapat diperbarui. Coba password lain.", step: "otp" };
  } catch { return unavailable; }
  return { message: "Password berhasil diperbarui." };
}

export async function deleteAccount(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  if (String(form.get("confirm") ?? "").trim() !== "HAPUS") return { errors: { confirm: "Ketik HAPUS untuk melanjutkan." } };
  const { supabase } = await requireUser();
  try {
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      if (/ACTIVE_ACCESS/.test(error.message)) return { error: "Akunmu masih memegang mandat jabatan atau peran program yang aktif. Minta pengelola mencabutnya dulu, lalu hapus akun." };
      return { error: "Akun belum dapat dihapus. Coba lagi nanti." };
    }
    await supabase.auth.signOut({ scope: "local" });
  } catch { return unavailable; }
  revalidatePath("/", "layout");
  redirect("/masuk?status=akun-dihapus");
}
