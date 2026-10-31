import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { DeleteForm, DomicileForm, NameForm, PasswordForm, Section } from "@/components/profile-forms";
import { hasEmailIdentity } from "@/lib/auth/completion.mjs";
import { domicileFromMetadata } from "@/lib/auth/domicile-match.mjs";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profil dan akun", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("display_name,domicile_rt_id").eq("id", user.id).maybeSingle();
  const claim = domicileFromMetadata(user.user_metadata);
  const canChange = hasEmailIdentity(user);
  return (
    <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
      <Link href="/dashboard" className="rounded-sm text-sm font-semibold text-emerald-900 hover:underline">← Dashboard</Link>
      <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">Profil dan akun</h1>
      <p className="mt-4 leading-7 text-slate-600">Ubah nama, domisili, dan password, atau hapus akunmu. Email akun: <strong className="break-all text-slate-900">{user.email}</strong>.</p>
      <div className="mt-8 space-y-7">
        <Section id="nama" title="Nama"><NameForm initialName={profile?.display_name ?? ""} /></Section>
        <Section id="domisili" title="Wilayah domisili"><DomicileForm initialDomicile={claim} linked={Boolean(profile?.domicile_rt_id)} /></Section>
        <Section id="password" title="Password"><PasswordForm canChange={canChange} /></Section>
        <Section id="hapus-akun" title="Hapus akun"><DeleteForm /></Section>
      </div>
      <form action={logout} className="mt-8">
        <button type="submit" className="rounded-sm text-sm font-semibold text-emerald-900 hover:underline">Keluar akun</button>
      </form>
    </main>
  );
}
