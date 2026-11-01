import type { Metadata } from "next";
import Link from "next/link";
import { NotificationOpenForm } from "@/components/notification-open-form";
import { getNotificationInbox } from "@/lib/notifications/data";
import type { NotificationView } from "@/lib/notifications/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifikasi", robots: { index: false, follow: false } };
const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default async function NotificationPage({ searchParams }: {
  searchParams: Promise<{ page?: string; view?: string }>;
}) {
  const query = await searchParams;
  const page = query.page && /^[1-9]\d{0,3}$/.test(query.page) ? Number(query.page) - 1 : 0;
  const view: NotificationView = query.view === "all" ? "all" : "unread";
  const data = await getNotificationInbox(page, view);
  const href = (nextPage: number) => `/notifikasi?view=${view}&page=${nextPage + 1}`;

  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
    <Link href="/dashboard" className="font-semibold text-emerald-900 underline underline-offset-4">Dashboard</Link>
    <div className="mt-7 flex flex-wrap items-start justify-between gap-5">
      <div><p className="text-xs font-bold tracking-widest text-emerald-800">PEMBARUAN UNTUKMU</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Notifikasi</h1></div>
      <a href={href(page)} className="inline-flex min-h-11 items-center rounded-full border border-emerald-900 px-5 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">Muat ulang daftar</a>
    </div>
    <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">Pembaruan dari riwayat pengajuan DEMO dan penetapan akses yang dapat kamu lihat saat ini. Buka pembaruan untuk menandainya sudah dibaca. Daftar diperbarui saat halaman dimuat.</p>
    <nav aria-label="Filter notifikasi" className="mt-7 flex flex-wrap gap-3">
      {([ ["unread", "Belum dibaca"], ["all", "Semua"] ] as const).map(([key, label]) => <Link key={key} href={`/notifikasi?view=${key}`} aria-current={view === key ? "page" : undefined} className={`min-h-11 rounded-full border px-5 py-3 text-sm font-semibold ${view === key ? "border-emerald-900 bg-emerald-900 text-white" : "border-emerald-950/20 bg-white text-emerald-900 hover:bg-emerald-50"}`}>{label}{data ? ` (${key === "unread" ? data.unread : data.total})` : ""}</Link>)}
    </nav>
    {!data ? <p role="alert" className="mt-7 rounded-xl bg-amber-50 p-5 leading-7 text-amber-950">Notifikasi belum dapat dimuat. Muat ulang daftar atau masuk kembali jika sesi telah berakhir.</p> : <>
      <p className="mt-6 text-sm text-slate-600">{data.count} pembaruan pada filter ini · Halaman {page + 1}</p>
      {data.rows.length ? <ul className="mt-5 space-y-4">{data.rows.map(item => <li key={`${item.kind}:${item.source_id}:${item.occurred_at}`} className={`rounded-2xl border bg-white p-5 sm:p-6 ${item.unread ? "border-emerald-300" : "border-emerald-950/10"}`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-bold ${item.unread ? "text-emerald-800" : "text-slate-500"}`}>{item.unread ? "BELUM DIBACA" : "SUDAH DIBACA"}</p>
            <h2 className="mt-2 text-lg font-bold leading-7">{item.label}</h2>
            {item.reference ? <p className="mt-2 break-all text-sm font-semibold text-emerald-900">{item.reference}</p> : null}
            <time dateTime={item.occurred_at} className="mt-2 block text-sm text-slate-600">{dateFormat.format(new Date(item.occurred_at))} WIB</time>
          </div>
          <NotificationOpenForm item={{ kind: item.kind, source_id: item.source_id, occurred_at: item.occurred_at }} label={`${item.label}${item.reference ? ` — ${item.reference}` : ""}`} />
        </div>
      </li>)}</ul> : <div className="mt-5 rounded-2xl border border-dashed border-emerald-950/20 p-7"><h2 className="font-bold">{page > 0 ? "Tidak ada pembaruan pada halaman ini" : view === "unread" ? "Tidak ada pembaruan yang belum dibaca" : "Belum ada pembaruan untukmu"}</h2><p className="mt-2 text-sm leading-7 text-slate-600">Daftar mengikuti status antrean, kepemilikan, dan aksesmu yang masih berlaku.</p></div>}
      <nav aria-label="Halaman notifikasi" className="mt-6 flex flex-wrap gap-5 font-semibold text-emerald-900">
        {page > 0 ? <Link href={href(page - 1)} className="min-h-11 py-3 underline underline-offset-4">Sebelumnya</Link> : null}
        {(page + 1) * 20 < data.count ? <Link href={href(page + 1)} className="min-h-11 py-3 underline underline-offset-4">Berikutnya</Link> : null}
      </nav>
    </>}
  </main>;
}
