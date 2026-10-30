import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { requireUser } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ubah kata sandi", robots: { index: false, follow: false } };
export default async function PasswordPage() {
  await requireUser();
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-xl px-5 py-16 sm:px-8">
    <Link href="/dashboard" className="text-sm font-semibold text-emerald-900 hover:underline">← Dashboard</Link>
    <h1 className="mt-8 text-3xl font-bold">Ubah kata sandi</h1>
    <p className="mt-4 leading-7 text-slate-600">Pilih kata sandi baru untuk akun pribadimu.</p>
    <div className="mt-8 rounded-2xl border border-emerald-950/10 bg-white p-7"><AuthForm mode="password" /></div>
  </main>;
}
