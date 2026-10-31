import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { logout } from "@/app/auth/actions";
import { getAccountSnapshot } from "@/lib/auth/account";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard pribadi", robots: { index: false, follow: false } };
const mandateLabels: Record<string, string> = { primary: "Utama", backup: "Cadangan", delegate: "Delegasi" };
const roleLabels: Record<string, string> = { program_admin: "Admin program", reviewer: "Reviewer", facilitator: "Fasilitator" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { user, profile, currentMandates, currentRoles, isAdmin, canReviewRt, error } = await getAccountSnapshot();
  const status = (await searchParams).status;

  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div><p className="text-xs font-bold tracking-widest text-emerald-800">DASHBOARD PRIBADI</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Halo, {profile?.display_name || "Warga"}.</h1><p className="mt-3 break-all text-slate-600">{user.email}</p></div>
      <form action={logout}><button type="submit" className="min-h-11 rounded-full border border-emerald-900 px-5 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">Keluar akun</button></form>
    </div>
    {status === "keluar-gagal" ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-900">Belum berhasil keluar. Coba kembali.</p> : null}
    {status === "akses-ditolak" ? <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-amber-950">Halaman pengelola memerlukan akses admin yang masih berlaku.</p> : null}
    {isAdmin ? <Link href="/admin" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800">Buka pengelolaan admin</Link> : null}
    <nav aria-label="Ruang inovator" className="mt-6 flex flex-wrap gap-4 font-semibold text-emerald-900"><Link href="/pengajuan" className="underline underline-offset-4">Pengajuan Saya</Link><Link href="/profil/wilayah" className="underline underline-offset-4">Wilayah domisili</Link>{canReviewRt?<Link href="/antrean/rt" className="underline underline-offset-4">Antrean simulasi RT</Link>:null}</nav>
    {status === "profil-disimpan" ? <p role="status" className="mt-6 rounded-xl bg-emerald-50 p-4 text-emerald-950">Nama tampilan berhasil disimpan.</p> : null}
    {error ? <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 leading-7 text-amber-950">Sebagian data akun belum dapat dimuat. Muat ulang halaman; hubungi pengelola jika tetap bermasalah. Tidak ada hak petugas yang diberikan secara otomatis.</p> : null}
    <div className="mt-10 grid gap-7 lg:grid-cols-2">
      <section aria-labelledby="profil" className="rounded-2xl border border-emerald-950/10 bg-white p-7"><h2 id="profil" className="mb-6 text-xl font-bold">Profil pribadimu</h2>{profile ? <AuthForm mode="profile" initialName={profile.display_name} /> : <p className="text-slate-600">Profil belum tersedia.</p>}<Link href="/ubah-kata-sandi" className="mt-6 inline-block text-sm font-semibold text-emerald-900 underline underline-offset-4">Ubah kata sandi</Link></section>
      <section aria-labelledby="akses" className="rounded-2xl border border-emerald-950/10 bg-white p-7"><h2 id="akses" className="text-xl font-bold">Akses dan mandat</h2><p className="mt-4 leading-7 text-slate-600">Akun terdaftar memiliki akses dasar sebagai warga/inovator. Hak petugas mengikuti penetapan berwenang dan masa berlakunya.</p>
        <h3 className="mt-6 text-sm font-bold">Mandat jabatan aktif</h3>
        {error ? <p className="mt-2 text-sm text-slate-600">Data mandat belum dapat dipastikan.</p> : currentMandates.length ? <ul className="mt-3 space-y-3">{currentMandates.map((item) => <li key={item.id} className="rounded-xl bg-emerald-50 p-3 text-sm">{item.offices?.name} · {mandateLabels[item.mandate_type] ?? item.mandate_type}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Belum ada mandat jabatan aktif.</p>}
        <h3 className="mt-6 text-sm font-bold">Penetapan peran program</h3>
        {error ? <p className="mt-2 text-sm text-slate-600">Data peran belum dapat dipastikan.</p> : currentRoles.length ? <ul className="mt-3 space-y-3">{currentRoles.map((item) => <li key={item.id} className="rounded-xl bg-emerald-50 p-3 text-sm">{roleLabels[item.role] ?? item.role}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Belum ada penetapan peran tambahan.</p>}
      </section>
    </div>
    <section aria-labelledby="selanjutnya" className="mt-7 rounded-2xl bg-emerald-950 p-7 text-white"><h2 id="selanjutnya" className="text-xl font-bold">Mulai susun inovasimu</h2><p className="mt-3 max-w-3xl leading-7 text-emerald-100">Lengkapi wilayah domisili, lalu buat draf data inovasi, PRD, dan RAB. Draf dapat disimpan dan dilanjutkan kembali. Pengiriman final dan uji warga belum dibuka.</p><Link href="/pengajuan" className="mt-5 inline-block font-semibold underline underline-offset-4">Buka Pengajuan Saya</Link></section>
  </main>;
}
