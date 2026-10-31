import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { needsDomicileCompletion } from "@/lib/auth/completion.mjs";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lengkapi data diri", robots: { index: false, follow: false } };

export default async function CompleteProfilePage() {
  const { user } = await requireUser({ allowIncomplete: true });
  if (!needsDomicileCompletion(user)) redirect("/dashboard");
  const meta = user.user_metadata ?? {};
  const suggestedName = String(meta.full_name ?? meta.name ?? meta.display_name ?? "").trim().slice(0, 80);
  return (
    <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Lengkapi data dirimu</h1>
      <p className="mt-4 leading-7 text-slate-600">
        Akunmu sudah terhubung dengan Google. Isi nama dan domisili dulu sebelum masuk ke dashboard.
      </p>
      <p className="mt-3 break-all text-sm text-slate-600">Email: {user.email}</p>
      <div className="mt-8 rounded-2xl border border-emerald-950/10 bg-white p-6 sm:p-8">
        <AuthForm mode="complete" initialName={suggestedName} />
      </div>
      <form action={logout} className="mt-6">
        <button type="submit" className="rounded-sm text-sm font-semibold text-emerald-900 hover:underline">Bukan akunmu? Keluar</button>
      </form>
    </main>
  );
}
