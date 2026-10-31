import Link from "next/link";
import { redirect } from "next/navigation";
import { loginWithGoogle } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config.mjs";

const content = {
  login: { title: "Masuk ke KampungLab", description: "Gunakan akun pribadimu untuk mengakses dashboard." },
  signup: { title: "Buat akun warga", description: "Mulai dengan akun pribadi. Kami kirim kode OTP ke emailmu untuk memastikan akun ini milikmu. Akses petugas diberikan melalui penetapan yang diverifikasi." },
  reset: { title: "Pulihkan password", description: "Masukkan email akunmu. Kami kirim kode OTP untuk mengatur ulang password." },
};
const notices: Record<string, string> = {
  "perlu-masuk": "Masuk terlebih dahulu untuk membuka halaman tersebut.",
  keluar: "Kamu sudah keluar dari akun pada browser ini.",
  "tautan-gagal": "Tautan tidak valid, kedaluwarsa, atau dibuka dari browser berbeda. Coba masuk setelah email terkonfirmasi, atau minta kode pemulihan baru.",
  "google-gagal": "Masuk dengan Google belum dapat diproses. Gunakan email dan password, atau coba lagi nanti.",
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6z" />
      <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

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
        {configured && mode === "login" ? (
          <>
            <p className="mt-6 text-center text-sm text-slate-600">
              Belum punya akun? <Link href="/daftar" className="rounded-sm font-semibold text-emerald-900 hover:underline">Daftar</Link>
            </p>
            <div role="separator" className="my-6 flex items-center gap-4 text-sm text-slate-500">
              <span className="h-px flex-1 bg-slate-200" />atau<span className="h-px flex-1 bg-slate-200" />
            </div>
            <form action={loginWithGoogle}>
              <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                <GoogleMark />Masuk dengan Google
              </button>
            </form>
          </>
        ) : null}
      </div>
      {mode !== "login" ? (
        <nav aria-label="Pilihan akun" className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-emerald-900">
          <Link href="/masuk" className="rounded-sm hover:underline">Sudah punya akun? Masuk</Link>
          {mode !== "reset" ? <Link href="/lupa-kata-sandi" className="rounded-sm hover:underline">Lupa password?</Link> : null}
        </nav>
      ) : null}
    </main>
  );
}
