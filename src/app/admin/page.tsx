import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { AdminField, AdminForm } from "@/components/admin-form";
import { getAdminData } from "@/lib/admin/access";
import { isUuid, roleLabels, mandateLabels, makeTerritoryLabels } from "@/lib/admin/validation.mjs";
import { isCurrentGrant } from "@/lib/auth/validation.mjs";
import type { RoleGrant, Mandate } from "@/lib/admin/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin dan pengelolaan akses", robots: { index: false, follow: false } };
const inputClass = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900";
const boxClass = "rounded-2xl border border-emerald-950/10 bg-white p-5 sm:p-7";
const date = (value: string | null) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)) + " WIB" : "Tanpa tanggal akhir";
const field = (id: string, label: string, children: ReactNode) => <AdminField id={id} label={label}>{children}</AdminField>;
function Period({ prefix, initial }: { prefix: string; initial: string }) {
  return <><div className="grid gap-4 sm:grid-cols-2">
    {field(`${prefix}-start`, "Mulai (WIB)", <input id={`${prefix}-start`} name="starts_at" type="datetime-local" defaultValue={initial} required className={inputClass} />)}
    {field(`${prefix}-end`, "Akhir (WIB, opsional)", <input id={`${prefix}-end`} name="ends_at" type="datetime-local" className={inputClass} />)}
  </div>{field(`${prefix}-ref`, "Referensi SK / surat tugas / dasar penetapan", <input id={`${prefix}-ref`} name="reference" required minLength={2} maxLength={240} className={inputClass} />)}
    <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" name="verified" required className="mt-1 size-4 shrink-0 accent-emerald-900" /><span>Saya telah memeriksa identitas penerima, dasar kewenangan, wilayah/jabatan bila berlaku, dan masa penetapan ini.</span></label>
  </>;
}
function GrantHistory({ grants, mandate = false, actorId }: { grants: (RoleGrant | Mandate)[]; mandate?: boolean; actorId: string }) {
  if (!grants.length) return <p className="text-sm text-slate-600">Belum ada riwayat penetapan.</p>;
  return <ul className="space-y-4">{grants.map(grant => {
    const m = "office_name" in grant ? grant : null;
    const current = isCurrentGrant(grant) && (!m || m.office_active);
    const ownAdmin = "role" in grant && grant.role === "program_admin" && grant.user_id === actorId;
    const label = m ? `${m.office_name} · ${mandateLabels[m.mandate_type as keyof typeof mandateLabels]}` : roleLabels[(grant as RoleGrant).role as keyof typeof roleLabels];
    return <li key={grant.id} className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><h4 className="font-semibold">{label}</h4><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{grant.status === "revoked" ? "Dicabut" : current ? "Berlaku sekarang" : "Di luar masa berlaku / jabatan nonaktif"}</span></div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{date(grant.starts_at)} → {date(grant.ends_at)}</p>
      <p className="mt-1 break-words text-sm text-slate-600">Dasar: {grant.appointment_reference}</p>
      {grant.status === "revoked" ? <p className="mt-2 text-sm text-red-900">Dicabut {date(grant.revoked_at)}: {grant.revocation_reason}</p> : ownAdmin ? <p className="mt-3 text-sm text-slate-600">Perubahan akses adminmu memerlukan admin aktif lain.</p> : <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-red-800">Cabut penetapan ini</summary><div className="mt-4"><AdminForm operation={mandate ? "revoke_mandate" : "revoke_role"} label="Cabut akses" fields={{ id: grant.id, user_id: grant.user_id }}>
        {field(`reason-${grant.id}`, "Alasan pencabutan (wajib)", <textarea id={`reason-${grant.id}`} name="reason" required minLength={3} maxLength={500} rows={2} className={inputClass} />)}
        <p className="text-sm leading-6 text-slate-600">Pencabutan berlaku langsung. Riwayat penetapan tetap disimpan.</p>
      </AdminForm></div></details>}
    </li>;
  })}</ul>;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ user?: string; status?: string }> }) {
  const query = await searchParams;
  const { overview, account, actorId, now, error } = await getAdminData(isUuid(query.user) ? query.user : undefined);
  const initial = new Date(now + 7 * 3600000).toISOString().slice(0, 16);
  const user = account?.user;
  const territoryLabels = makeTerritoryLabels(overview?.territories ?? []);
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-emerald-800">PENGELOLA PROGRAM</p><Link href="/admin/jalur-fisik" className="mb-4 inline-block font-semibold text-emerald-900 underline">Pengaturan batas hari jalur fisik DEMO</Link><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Admin dan pengelolaan akses</h1><p className="mt-4 max-w-3xl leading-7 text-slate-600">Tetapkan petugas melalui akun pribadinya, jabatan yang tepat, dan masa berlaku yang telah diperiksa.</p></div><Link href="/dashboard" className="text-sm font-semibold text-emerald-900 underline underline-offset-4">Dashboard pribadi</Link></div>
    <nav aria-label="Bagian pengelolaan" className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-emerald-900"><Link href="/admin/panel" className="underline underline-offset-4">Panel Kecil DEMO</Link><a href="#akun" className="underline underline-offset-4">Akses akun</a><a href="#wilayah" className="underline underline-offset-4">Wilayah dan jabatan</a><a href="#riwayat" className="underline underline-offset-4">Riwayat perubahan</a></nav>
    {query.status === "disimpan" ? <p role="status" className="mt-6 rounded-xl bg-emerald-50 p-4 text-emerald-950">Perubahan berhasil disimpan.</p> : null}
    {error || !overview ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-900">Data pengelolaan belum dapat dimuat. Muat ulang; akses dan perubahan tetap diperiksa di server.</p> : <>
    <section id="akun" aria-labelledby="akun-title" className={`mt-8 scroll-mt-6 ${boxClass}`}><h2 id="akun-title" className="text-xl font-bold">Cari akun penerima akses</h2><p className="my-4 text-sm leading-6 text-slate-600">Gunakan email lengkap akun yang sudah mendaftar dan mengonfirmasi email. Pencarian ini hanya tersedia bagi admin aktif.</p><AdminForm lookup label="Cari akun">
      {field("lookup-email", "Email akun", <input id="lookup-email" name="email" type="email" autoComplete="off" required maxLength={254} className={inputClass} />)}
    </AdminForm></section>
    {user ? <section key={user.id} aria-labelledby="target-title" className="mt-7 space-y-6">
      <div className="rounded-2xl bg-emerald-950 p-6 text-white"><h2 id="target-title" className="text-xl font-bold">Akses untuk {user.display_name || "Pengguna"}</h2><p className="mt-2 break-all text-emerald-100">{user.email}</p><p className="mt-2 text-sm text-emerald-100">Periksa penerima sebelum menyimpan penetapan.</p></div>
      <div className="grid gap-6 lg:grid-cols-2"><div className={boxClass}><h3 className="mb-5 text-lg font-bold">Tetapkan peran program</h3><AdminForm operation="grant_role" label="Tetapkan peran" fields={{ user_id: user.id }}>
        {field("grant-role", "Peran", <select id="grant-role" name="role" required className={inputClass}><option value="">Pilih peran</option>{Object.entries(roleLabels).filter(([key]) => !(key === "program_admin" && user.id === actorId)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>)}
        <Period prefix="role" initial={initial} /><p className="text-sm leading-6 text-slate-600">Reviewer dan fasilitator tetap membutuhkan penugasan pada pengajuan atau misi saat modul tersebut tersedia.</p>
      </AdminForm></div><div className={boxClass}><h3 className="mb-5 text-lg font-bold">Tetapkan mandat jabatan</h3>{overview.offices.some(o => o.active) ? <AdminForm operation="grant_mandate" label="Tetapkan mandat" fields={{ user_id: user.id }}>
        {field("grant-office", "Jabatan dan wilayah", <select id="grant-office" name="office_id" required className={inputClass}><option value="">Pilih jabatan</option>{overview.offices.filter(o => o.active).map(o => <option key={o.id} value={o.id}>{o.name} · {territoryLabels.get(o.territory_id) ?? o.territory_name}</option>)}</select>)}
        {field("grant-mandate", "Jenis mandat", <select id="grant-mandate" name="mandate_type" className={inputClass}>{Object.entries(mandateLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>)}
        <Period prefix="mandate" initial={initial} /><p className="text-sm text-slate-600">Delegasi wajib memiliki tanggal akhir.</p>
      </AdminForm> : <p className="leading-7 text-slate-600">Tambahkan wilayah dan jabatan di bawah sebelum memberikan mandat.</p>}</div></div>
      <div className="grid gap-6 lg:grid-cols-2"><div className={boxClass}><h3 className="mb-5 text-lg font-bold">Riwayat peran program</h3><GrantHistory actorId={actorId} grants={account.roles ?? []} /></div><div className={boxClass}><h3 className="mb-5 text-lg font-bold">Riwayat mandat jabatan</h3><GrantHistory actorId={actorId} mandate grants={account.mandates ?? []} /></div></div>
    </section> : query.user ? <p role="status" className="mt-5 text-slate-600">Akun tujuan tidak tersedia.</p> : null}
    <section id="wilayah" aria-labelledby="wilayah-title" className="mt-10 scroll-mt-6"><h2 id="wilayah-title" className="text-2xl font-bold">Wilayah dan jabatan</h2><p className="mt-3 leading-7 text-slate-600">Masukkan wilayah sesuai sumber resmi yang kamu pegang. Untuk uji coba, beri nama dengan awalan “DEMO”. Belum ada daftar wilayah resmi yang diimpor.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><div className={boxClass}><h3 className="mb-5 text-lg font-bold">Tambah wilayah</h3><AdminForm operation="create_territory" label="Simpan wilayah">
        {field("territory-kind", "Tingkat", <select id="territory-kind" name="kind" className={inputClass}><option value="kelurahan">Kelurahan</option><option value="rw">RW</option><option value="rt">RT</option></select>)}
        {field("territory-parent", "Induk wilayah (kosong untuk kelurahan)", <select id="territory-parent" name="parent_id" className={inputClass}><option value="">Tanpa induk</option>{overview.territories.filter(t => t.kind !== "rt").map(t => <option key={t.id} value={t.id}>{territoryLabels.get(t.id)}</option>)}</select>)}
        <p className="text-sm text-slate-600">RW harus di bawah kelurahan; RT harus di bawah RW.</p>
        {field("territory-code", "Kode wilayah", <input id="territory-code" name="code" required maxLength={40} className={inputClass} />)}
        {field("territory-name", "Nama wilayah", <input id="territory-name" name="name" required maxLength={160} className={inputClass} />)}
      </AdminForm></div><div className={boxClass}><h3 className="mb-5 text-lg font-bold">Tambah jabatan</h3>{overview.territories.length ? <AdminForm operation="create_office" label="Simpan jabatan">
        {field("office-territory", "Wilayah jabatan", <select id="office-territory" name="territory_id" required className={inputClass}><option value="">Pilih wilayah</option>{overview.territories.map(t => <option key={t.id} value={t.id}>{territoryLabels.get(t.id)}</option>)}</select>)}
        {field("office-name", "Nama jabatan", <input id="office-name" name="name" required maxLength={160} className={inputClass} />)}
        <p className="text-sm leading-6 text-slate-600">Jabatan tetap tersimpan ketika pemegang berganti. Satu jabatan tersedia untuk setiap wilayah; pemegangnya diatur lewat mandat.</p>
      </AdminForm> : <p className="text-slate-600">Buat wilayah terlebih dahulu.</p>}</div></div>
      <details className={`mt-6 ${boxClass}`}><summary className="cursor-pointer font-semibold">Lihat daftar wilayah ({overview.territory_count}) dan jabatan ({overview.office_count})</summary><p className="mt-3 text-sm text-slate-600">Maksimal 500 wilayah dan 500 jabatan ditampilkan, diurutkan menurut nama.</p><div className="mt-4 grid gap-5 md:grid-cols-2"><ul className="space-y-2 text-sm">{overview.territories.map(t => <li key={t.id} className="break-words">{territoryLabels.get(t.id)}</li>)}</ul><ul className="space-y-2 text-sm">{overview.offices.map(o => <li key={o.id} className="break-words">{o.name} · {territoryLabels.get(o.territory_id) ?? o.territory_name}{o.active ? "" : " (nonaktif)"}</li>)}</ul></div></details>
    </section>
    <section id="riwayat" aria-labelledby="riwayat-title" className={`mt-10 scroll-mt-6 ${boxClass}`}><h2 id="riwayat-title" className="text-xl font-bold">Riwayat perubahan akses</h2><p className="mt-3 text-sm leading-6 text-slate-600">30 perubahan wilayah, jabatan, dan penetapan terbaru. Riwayat per akun menampilkan hingga 100 penetapan terbaru pada setiap jenis.</p>{overview.audit.length ? <ul className="mt-6 divide-y divide-slate-200">{overview.audit.map(event => {
      const labels: Record<string, string> = { "public.territories": "Wilayah", "public.offices": "Jabatan", "public.office_mandates": "Mandat jabatan", "public.platform_role_grants": "Peran program" };
      const after = event.details.after ?? {};
      const role = typeof after.role === "string" ? roleLabels[after.role as keyof typeof roleLabels] : null;
      return <li key={event.id} className="py-4 first:pt-0"><p className="font-semibold">{labels[event.entity] ?? "Penetapan"} · {event.action === "insert" ? "Ditambahkan" : event.action === "update" ? "Diperbarui" : "Dihapus"}{role ? ` · ${role}` : ""}</p><p className="mt-1 text-sm text-slate-600">{date(event.occurred_at)} · {event.actor_name || "Pengelola database"}</p>{typeof after.user_id === "string" && isUuid(after.user_id) ? <Link href={`/admin?user=${after.user_id}`} className="mt-2 inline-block text-sm font-semibold text-emerald-900 underline underline-offset-4">Lihat penerima penetapan</Link> : null}{typeof after.name === "string" ? <p className="mt-1 break-words text-sm">{after.name}</p> : null}{typeof after.appointment_reference === "string" ? <p className="mt-1 break-words text-sm">Dasar: {after.appointment_reference}</p> : null}{typeof after.revocation_reason === "string" ? <p className="mt-1 break-words text-sm text-red-900">Alasan pencabutan: {after.revocation_reason}</p> : null}</li>;
    })}</ul> : <p className="mt-5 text-slate-600">Belum ada perubahan akses.</p>}</section>
    </>}
  </main>;
}
