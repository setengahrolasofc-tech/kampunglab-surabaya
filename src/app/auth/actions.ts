"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient, hasServiceRole } from "@/lib/supabase/admin";
import { getAppOrigin, validateAuthForm, validateOtp, validateSignup } from "@/lib/auth/validation.mjs";
import type { AuthActionState } from "@/lib/auth/types";

const GENERIK = "Terjadi kendala. Coba lagi sebentar lagi.";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function sameSecret(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
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
  redirect("/dashboard");
}

export async function signupAction(_: AuthActionState, form: FormData): Promise<AuthActionState> {
  const v = validateSignup(form);
  if (Object.keys(v.errors).length) return { errors: v.errors };
  const origin = getAppOrigin(process.env.NEXT_PUBLIC_APP_URL);

  // ---- BRIDA: hanya dengan kode undangan staf (variabel lingkungan server) ----
  if (v.role === "BRIDA_ADMIN") {
    const expected = process.env.BRIDA_INVITE_CODE?.trim();
    if (!expected || expected.length < 12 || !hasServiceRole()) {
      return { error: "Pendaftaran Admin BRIDA belum dikonfigurasi di server (BRIDA_INVITE_CODE dan SUPABASE_SERVICE_ROLE_KEY)." };
    }
    if (!sameSecret(String(v.meta.kode_undangan), expected)) {
      await sleep(800);
      return { errors: { kode_undangan: "Kode undangan tidak valid." } };
    }
    try {
      const admin = createAdminSupabaseClient();
      const created = await admin.auth.admin.createUser({
        email: v.email, password: v.password, email_confirm: true,
        user_metadata: { display_name: v.meta.display_name, role: "INNOVATOR" },
      });
      if (created.error || !created.data.user) {
        return { error: created.error?.code === "email_exists" ? "Email ini sudah terdaftar. Masuk atau gunakan email lain." : GENERIK };
      }
      const promoted = await admin.from("users").update({
        role: "BRIDA_ADMIN", status: "AKTIF", is_verified: true, phone_wa: v.meta.phone_wa || null, name: v.meta.display_name,
      }).eq("id", created.data.user.id);
      if (promoted.error) return { error: GENERIK };
      await admin.from("audit_logs").insert({ aktor_id: created.data.user.id, aksi: "AKUN BRIDA DIDAFTARKAN", target: `users/${created.data.user.id}`, detail_json: { lewat: "kode undangan" } });
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
      if (error) return { message: "Akun Admin BRIDA dibuat. Silakan masuk." };
    } catch {
      return { error: GENERIK };
    }
    redirect("/admin");
  }

  // ---- Inovator dan Kelurahan: pendaftaran biasa; akun Kelurahan tanpa wewenang sampai diberi mandat ----
  const { kecamatan, kelurahan, kode_undangan: _kode, ...meta } = v.meta as Record<string, string>;
  void _kode;
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
      return { error: GENERIK };
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
    if (purpose === "recovery") await supabase.auth.resetPasswordForEmail(email);
    else await supabase.auth.resend({ type: "signup", email });
  } catch { /* respons netral */ }
  return { ...base, message: "Jika email terdaftar, kode baru sudah dikirim. Tunggu satu menit sebelum meminta lagi." };
}

export async function requestResetAction(_: AuthActionState, form: FormData): Promise<AuthActionState> {
  const { errors, email } = validateAuthForm(form, "reset");
  if (Object.keys(errors).length) return { errors };
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${getAppOrigin(process.env.NEXT_PUBLIC_APP_URL)}/auth/callback?next=/ubah-kata-sandi` });
  } catch { /* respons netral */ }
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

export async function signOutAction() {
  try { await (await createServerSupabaseClient()).auth.signOut(); } catch { /* tetap keluar */ }
  redirect("/");
}
