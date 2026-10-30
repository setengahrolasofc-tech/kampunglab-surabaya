import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config.mjs";

const content = {
  login: { title: "Masuk ke KampungLab", description: "Gunakan akun pribadimu untuk mengakses dashboard." },
  signup: { title: "Buat akun warga", description: "Mulai dengan akun pribadi. Akses petugas diberikan melalui penetapan yang diverifikasi." },
  reset: { title: "Pulihkan kata sandi", description: "Masukkan email akunmu untuk menerima petunjuk pemulihan." },
};
const notices: Record<string, string> = {
  "perlu-masuk": "Masuk terlebih dahulu untuk membuka halaman tersebut.",
  keluar: "Kamu sudah keluar dari akun pada browser ini.",
  "tautan-gagal": "Tautan tidak valid, kedaluwarsa, atau dibuka dari browser berbeda. Coba masuk setelah email terkonfirmasi, atau minta petunjuk pemulihan baru.",
};

export async function AuthScreen({ mode, status }: { mode: keyof typeof content; status?: string }) {
  let configured = true;
  try { getSupabasePublicConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); }
  catch { configured = false; }
  if (configured) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/dashboard");
  }
  return (
    <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-xl px-5 py-12 sm:px-8 sm:py-16">
      <Link href="/" className="rounded-sm text-sm font-semibold text-emerald-900 hover:underline">← Beranda</Link>
      <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">{content[mode].title}</h1>
      <p className="mt-4 leading-7 text-slate-600">{content[mode].description}</p>
      {status && notices[status] ? <p role="status" className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm leading-6">{notices[status]}</p> : null}
      <div className="mt-8 rounded-2xl border border-emerald-950/10 bg-white p-6 sm:p-8">
        {configured ? <AuthForm mode={mode} /> : <p role="alert" className="text-sm leading-7">Layanan akun belum dikonfigurasi. Pengelola perlu mengisi konfigurasi Supabase sebelum pendaftaran dibuka.</p>}
      </div>
      <nav aria-label="Pilihan akun" className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-emerald-900">
        {mode !== "login" ? <Link href="/masuk" className="rounded-sm hover:underline">Sudah punya akun? Masuk</Link> : <Link href="/daftar" className="rounded-sm hover:underline">Belum punya akun? Daftar</Link>}
        {mode !== "reset" ? <Link href="/lupa-kata-sandi" className="rounded-sm hover:underline">Lupa kata sandi?</Link> : null}
      </nav>
    </main>
  );
}
