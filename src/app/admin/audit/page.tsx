import type { Metadata } from "next";
import Link from "next/link";
import { requireProgramAdmin } from "@/lib/admin/access";
import { isUuid } from "@/lib/admin/validation.mjs";
import { getAdminAudit } from "@/lib/audit/data";
import { auditFilters, auditSearch, type AuditQuery } from "@/lib/audit/filters";
import { auditActions, auditModules } from "@/lib/audit/types";
import { auditChangedFields, auditDate, auditEntities, auditFields, auditValue } from "@/lib/audit/display";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit administrasi", robots: { index: false, follow: false }, referrer: "no-referrer" };
const input = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal";
const moduleLinks = { access: "/admin#akun", master: "/admin#wilayah", physical: "/admin/jalur-fisik", panel: "/admin/panel" } as const;

export default async function AuditPage({ searchParams }: { searchParams: Promise<AuditQuery> }) {
  const filters = auditFilters(await searchParams);
  if (!filters) await requireProgramAdmin();
  const result = filters ? await getAdminAudit(filters) : null;
  const data = result?.data, invalid = !filters || result?.invalid;
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
    <Link href="/admin" className="font-semibold text-emerald-900 underline underline-offset-4">Pengelolaan admin</Link>
    <p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">RIWAYAT INTERNAL · BACA SAJA</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Audit administrasi</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Telusuri perubahan akses, master wilayah/jabatan, pengaturan jalur fisik dan koordinasi panel dari log yang tersimpan. Waktu mengikuti server; nama aktor adalah nama profil saat ini. Riwayat ini tidak mengubah keputusan atau memberi akses baru ke isi proposal.</p>
    {!data || !filters ? <section className="mt-7 rounded-xl bg-amber-50 p-5 text-amber-950"><p role="alert" className="leading-7">{invalid ? "Filter atau penanda halaman tidak valid. Buka riwayat tanpa filter untuk mencoba kembali." : "Riwayat belum dapat dimuat. Muat ulang atau masuk kembali jika sesi telah berakhir."}</p><Link href="/admin/audit" className="mt-4 inline-block min-h-11 py-3 font-semibold underline">Buka riwayat tanpa filter</Link></section> : <>
      <section aria-labelledby="filter-audit" className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6">
        <h2 id="filter-audit" className="text-xl font-bold">Filter riwayat</h2>
        <form method="get" action="/admin/audit" className="mt-5 space-y-5"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-semibold">Modul<select name="module" defaultValue={filters.module} className={input}>{Object.entries(auditModules).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="text-sm font-semibold">Operasi<select name="action" defaultValue={filters.action} className={input}>{Object.entries(auditActions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="text-sm font-semibold">ID akun aktor (opsional)<input name="actor_id" defaultValue={filters.actor_id} maxLength={36} placeholder="UUID lengkap akun" className={input} /></label>
          <label className="text-sm font-semibold">Dari tanggal (WIB)<input type="date" name="from" defaultValue={filters.from} className={input} /></label>
          <label className="text-sm font-semibold">Sampai tanggal (WIB, inklusif)<input type="date" name="to" defaultValue={filters.to} className={input} /></label>
        </div><div className="flex flex-wrap items-center gap-4"><button type="submit" className="min-h-11 rounded-full bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Terapkan filter</button><Link href="/admin/audit" className="min-h-11 py-3 text-sm font-semibold text-emerald-900 underline">Hapus filter</Link></div></form>
      </section>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm"><p className="text-slate-600">Menampilkan {data.rows.length} peristiwa · Diambil <time dateTime={data.generated_at}>{auditDate(data.generated_at)}</time></p><a href={`/admin/audit?${auditSearch(filters, null)}`} className="min-h-11 py-3 font-semibold text-emerald-900 underline">Muat ulang dari hasil terbaru</a></div>
      {data.rows.length ? <ol className="mt-4 space-y-5">{data.rows.map(event => {
        const changes = auditChangedFields(event);
        const subject = event.after_data.user_id ?? event.before_data.user_id;
        return <li key={`${event.source}:${event.id}`} className="rounded-2xl border border-emerald-950/10 bg-white p-5 sm:p-7">
          <p className="text-xs font-bold tracking-wide text-emerald-800">{auditModules[event.module]}</p>
          <h2 className="mt-2 text-lg font-bold">{auditEntities[event.entity] ?? "Objek administrasi"} · {auditActions[event.action as keyof typeof auditActions] ?? event.action}</h2>
          <time dateTime={event.occurred_at} className="mt-2 block text-sm text-slate-600">{auditDate(event.occurred_at)}</time>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7"><p className="font-semibold">{event.actor_id ? event.actor_name || "Akun tanpa profil saat ini" : "Proses database / aktor akun tidak tercatat"}</p>{event.actor_id ? <><p className="break-all text-xs text-slate-600">ID aktor: {event.actor_id} · Nama di atas mengikuti profil saat ini.</p><Link href={`/admin/audit?${auditSearch({ ...filters, actor_id: event.actor_id }, null)}`} className="mt-2 inline-block font-semibold text-emerald-900 underline">Filter aktivitas aktor ini</Link></> : <p className="text-xs text-slate-600">Identitas individu tidak disimpulkan dari role database.</p>}<p className="mt-2 break-all text-xs text-slate-500">Role database tercatat: {event.actor_database_role}</p></div>
          <dl className="mt-4 grid gap-4 text-xs text-slate-600 sm:grid-cols-2"><div><dt className="font-semibold">ID objek teknis</dt><dd className="mt-1 break-all">{event.entity_id}</dd></div><div><dt className="font-semibold">ID peristiwa audit</dt><dd className="mt-1 break-all">{event.id}</dd></div></dl>
          {event.has_snapshot && changes.length ? <details className="mt-5"><summary className="cursor-pointer py-2 text-sm font-semibold text-emerald-900">Lihat metadata sebelum dan sesudah ({changes.length} field)</summary><div className="mt-3 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[620px] text-left text-sm"><caption className="sr-only">Perubahan metadata administrasi yang tersimpan</caption><thead className="bg-emerald-50"><tr>{["Field", "Sebelum", "Sesudah"].map(label => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{changes.map(key => <tr key={key} className="border-t border-slate-200"><th scope="row" className="px-4 py-4 font-semibold">{auditFields[key]}</th><td className="max-w-xs break-words px-4 py-4">{auditValue(key, event.before_data[key])}</td><td className="max-w-xs break-words px-4 py-4">{auditValue(key, event.after_data[key])}</td></tr>)}</tbody></table></div></details> : <p className="mt-5 text-sm leading-7 text-slate-500">{event.has_snapshot ? "Ringkasan field yang ditampilkan tidak memuat rincian perubahan ini. Periksa riwayat objek pada modul terkait." : "Log ini hanya menyimpan aktor, objek, operasi, dan waktu; nilai sebelum/sesudah tidak tersedia."}</p>}
          <nav aria-label="Tindak lanjut riwayat" className="mt-4 flex flex-wrap gap-5 text-sm font-semibold text-emerald-900"><Link href={moduleLinks[event.module]} className="min-h-11 py-3 underline">Buka modul terkait</Link>{event.module === "access" && isUuid(subject) ? <Link href={`/admin?user=${subject}`} className="min-h-11 py-3 underline">Lihat riwayat penerima akses</Link> : null}</nav>
        </li>;
      })}</ol> : <p className="mt-5 rounded-2xl border border-dashed border-emerald-950/20 p-7 text-sm text-slate-600">Tidak ada peristiwa pada hasil ini. Log yang belum pernah dicatat tidak dibuat ulang sebagai riwayat.</p>}
      <nav aria-label="Halaman riwayat audit" className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-emerald-900">{filters.cursor ? <Link href={`/admin/audit?${auditSearch(filters, null)}`} className="min-h-11 py-3 underline">Ke awal hasil filter</Link> : null}{data.next_cursor ? <Link href={`/admin/audit?${auditSearch(filters, data.next_cursor)}`} className="min-h-11 py-3 underline">Lihat 20 peristiwa lebih lama</Link> : null}</nav>
      <p className="mt-7 text-xs leading-7 text-slate-500">Ringkasan membatasi field administrasi. Isi proposal/draf, profil warga sebagai objek perubahan, skor/suara, berkas, alasan bebas dan isi surat tidak dibuka di sini. Audit operasional lintas seluruh keputusan, anomali dan audit acak belum tersedia.</p>
    </>}
  </main>;
}
