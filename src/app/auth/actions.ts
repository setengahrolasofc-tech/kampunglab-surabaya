"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient, hasServiceRole } from "@/lib/supabase/admin";
import { destinationForIntent, getAppOrigin, normalizeIntent, validateAuthForm, validateOtp, validateSignup } from "@/lib/auth/validation.mjs";
import type { AuthActionState } from "@/lib/auth/types";

const GENERIK = "Terjadi kendala. Coba lagi sebentar lagi.";
type AuthFailure = { code?: string; status?: number; message?: string } | null | undefined;

/**
 * Pesan untuk kegagalan KIRIM EMAIL/KODE yang tidak bergantung pada alamat email tertentu (aman ditampilkan, tidak membuka
 * daftar email). Kegagalan lain dikembalikan sebagai null agar pemanggil tetap memakai respons netral. Selalu dicatat di log server.
 */
function sendFailureMessage(where: string, error: AuthFailure): string | null {
  if (!error) return null;
  console.error(`[auth:${where}]`, error.status, error.code, error.message);
  switch (error.code) {
    case "over_email_send_rate_limit":
      return "Batas pengiriman email sedang tercapai. Tunggu beberapa menit, lalu coba lagi.";
    case "over_request_rate_limit":
      return "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.";
    case "email_address_not_authorized":
      return "Layanan email bawaan Supabase hanya mengirim ke anggota tim proyek. Atur SMTP khusus di Supabase (Authentication → SMTP) atau gunakan email anggota tim.";
    case "email_address_invalid":
      return "Alamat email ditolak. Periksa penulisannya atau gunakan email lain.";
    case "unexpected_failure":
      return "Pendaftaran gagal di database (trigger pembuatan akun). Hubungi pengelola; penyebabnya ada di log Auth Supabase.";
    case "smtp_error":
    case "hook_timeout":
      return "Layanan email belum dapat mengirim kode. Periksa pengaturan SMTP di Supabase.";
    default:
      return error.status && error.status >= 500 ? "Server autentikasi sedang bermasalah. Coba lagi beberapa saat lagi." : null;
  }
}


export async function loginAction(_: AuthActionState, form: FormData): Promise<AuthActionState> {
  const { errors, email, password } = validateAuthForm(form, "login");
  if (Object.keys(errors).length) return { errors };
  let ok = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    ok = !error;
    if (error && error.code === "email_not_confirmed") return { error: "Email belum diverifikasi. Daftar ulang atau cek kode OTP di email Anda." };
  } catch (e) {
    return { error: e instanceof Error && e.message.includes("NEXT_PUBLIC") ? e.message : GENERIK };
  }
  if (!ok) return { error: "Email atau password salah." };
  redirect(destinationForIntent(normalizeIntent(form.get("sebagai"))));
}

export async function signupAction(_: AuthActionState, form: FormData): Promise<AuthActionState> {
  const v = validateSignup(form);
  if (Object.keys(v.errors).length) return { errors: v.errors };
  const origin = getAppOrigin(process.env.NEXT_PUBLIC_APP_URL);

  // ---- Inovator dan permintaan akses Kelurahan; akun Kelurahan tanpa wewenang sampai Admin BRIDA memberi mandat ----
  // Admin BRIDA tidak bisa mendaftar di sini: hanya akun yang dipilih lewat skrip seed.
  const { kecamatan, kelurahan, ...meta } = v.meta as Record<string, string>;
  let kelurahanId: string | null = null;
  if (v.role === "KELURAHAN") {
    try {
      const pub = await createServerSupabaseClient();
      const { data } = await pub.from("master_kelurahan").select("id").eq("kecamatan", kecamatan).eq("kelurahan", kelurahan).maybeSingle();
      kelurahanId = data?.id ?? null;
    } catch { /* ditangani di bawah */ }
    if (!kelurahanId) return { errors: { kelurahan: "Kelurahan tidak ditemukan di master data." } };
    (meta as Record<string, string>).kelurahan_id = kelurahanId;
  }
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: v.email, password: v.password,
      options: { data: meta, emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      if (error.code === "weak_password") return { errors: { password: "Password ditolak karena terlalu lemah." } };
      return { error: sendFailureMessage("signup", error) ?? GENERIK };
    }
    // Email sudah terdaftar: respons netral agar daftar email tidak bisa ditebak.
    if (data.user && data.user.identities?.length === 0) return { step: "otp", purpose: "signup", email: v.email, message: "Jika email ini belum terdaftar, kode OTP sudah dikirim." };

    if (v.role === "KELURAHAN" && data.user && hasServiceRole()) {
      const sk = form.get("sk") as File;
      const ext = sk.type === "application/pdf" ? "pdf" : sk.type === "image/png" ? "png" : "jpg";
      const path = `sk/${data.user.id}/sk-penugasan.${ext}`;
      const admin = createAdminSupabaseClient();
      const up = await admin.storage.from("berkas").upload(path, Buffer.from(await sk.arrayBuffer()), { contentType: sk.type, upsert: true });
      if (!up.error) await admin.from("users").update({ sk_document_url: path }).eq("id", data.user.id);
    }
    if (data.session) redirect("/dashboard");
    return { step: "otp", purpose: "signup", email: v.email };
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    if (typeof e === "object" && e && "digest" in e) throw e;
    return { error: GENERIK };
  }
}

export async function verifyOtpAction(_: AuthActionState, form: FormData): Promise<AuthActionState> {
  const { errors, email, token } = validateOtp(form);
  const purpose: "recovery" | "signup" = form.get("purpose") === "recovery" ? "recovery" : "signup";
  if (Object.keys(errors).length) return { errors, step: "otp", email, purpose };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: purpose === "recovery" ? "recovery" : "signup" });
    if (error) return { step: "otp", email, purpose, error: "Kode salah atau sudah kedaluwarsa." };
  } catch {
    return { step: "otp", email, purpose, error: GENERIK };
  }
  redirect(purpose === "recovery" ? "/ubah-kata-sandi" : "/dashboard");
}

export async function resendOtpAction(_: AuthActionState, form: FormData): Promise<AuthActionState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const purpose: "recovery" | "signup" = form.get("purpose") === "recovery" ? "recovery" : "signup";
  const base = { step: "otp" as const, email, purpose };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ...base, error: "Alamat email tidak valid." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = purpose === "recovery" ? await supabase.auth.resetPasswordForEmail(email) : await supabase.auth.resend({ type: "signup", email });
    const failure = sendFailureMessage("resend", error);
    if (failure) return { ...base, error: failure };
  } catch (e) { console.error("[auth:resend]", e); }
  return { ...base, message: "Jika email terdaftar, kode baru sudah dikirim. Tunggu satu menit sebelum meminta lagi." };
}

export async function requestResetAction(_: AuthActionState, form: FormData): Promise<AuthActionState> {
  const { errors, email } = validateAuthForm(form, "reset");
  if (Object.keys(errors).length) return { errors };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${getAppOrigin(process.env.NEXT_PUBLIC_APP_URL)}/auth/callback?next=/ubah-kata-sandi` });
    const failure = sendFailureMessage("reset", error);
    if (failure) return { error: failure };
  } catch (e) { console.error("[auth:reset]", e); }
  return { step: "otp", purpose: "recovery", email, message: "Jika email terdaftar, kode OTP pemulihan sudah dikirim." };
}

export async function updatePasswordAction(_: AuthActionState, form: FormData): Promise<AuthActionState> {
  const { errors, password } = validateAuthForm(form, "password");
  if (Object.keys(errors).length) return { errors };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.code === "same_password" ? "Gunakan password yang berbeda dari sebelumnya." : "Sesi pemulihan sudah berakhir. Minta kode baru." };
  } catch {
    return { error: GENERIK };
  }
  redirect("/dashboard");
}

/** Masuk/daftar dengan Google. Akun baru selalu Inovator; "sebagai" hanya menentukan halaman tujuan sesudah masuk. */
export async function googleAction(form: FormData) {
  const intent = normalizeIntent(form.get("sebagai"));
  let url: string | null = null;
  try {
    const origin = getAppOrigin(process.env.NEXT_PUBLIC_APP_URL);
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback`, queryParams: { prompt: "select_account" } },
    });
    if (!error && data.url) {
      url = data.url;
      // Tujuan disimpan di cookie singkat karena URL pengalihan OAuth harus persis sama dengan daftar yang diizinkan.
      (await cookies()).set("kl_masuk_sebagai", intent, { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https:"), path: "/auth", maxAge: 600 });
    }
  } catch { /* ditangani di bawah */ }
  if (!url) redirect(`/masuk?status=google-gagal&sebagai=${intent}`);
  redirect(url);
}

export async function signOutAction() {
  try { await (await createServerSupabaseClient()).auth.signOut(); } catch { /* tetap keluar */ }
  redirect("/");
}
