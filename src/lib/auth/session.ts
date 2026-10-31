import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Mengembalikan sesi pengguna, atau mengarahkan ke halaman Masuk.
 * Bila konfigurasi Supabase belum lengkap (misalnya variabel lingkungan belum diisi di Vercel),
 * pengguna tetap diarahkan ke Masuk, yang menampilkan pesan "belum dikonfigurasi",
 * bukan halaman error server.
 */
export async function requireUser() {
  let supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null;
  let user: User | null = null;
  try {
    supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch { /* Konfigurasi atau layanan tidak tersedia: perlakukan sebagai belum masuk. */ }
  if (!supabase || !user) redirect("/masuk?status=perlu-masuk");
  return { supabase, user };
}
