import type { Metadata } from "next";
import Link from "next/link";
import { requireProgramAdmin } from "@/lib/admin/access";
import { getMonitoringReport } from "@/lib/monitoring/data";
import { monitoringFilters, monitoringSearch, type MonitoringQuery } from "@/lib/monitoring/filters";
import { monitoringStatuses, type MonitoringGroup } from "@/lib/monitoring/types";
import { statusLabels } from "@/lib/simulations/workflow";
import { monitoringDate as date, monitoringWaitHours } from "@/lib/monitoring/display";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Monitoring dan laporan DEMO", robots: { index: false, follow: false } };
const box = "rounded-2xl border border-emerald-950/10 bg-white p-5 sm:p-7";
const select = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";

function GroupTable({ caption, rows }: { caption: string; rows: MonitoringGroup[] }) {
  return rows.length ? <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full min-w-[660px] text-left text-sm">
      <caption className="sr-only">{caption}. Setiap draf dihitung sekali menurut putaran terakhirnya.</caption>
      <thead className="bg-emerald-50 text-emerald-950"><tr>{[caption, "Jumlah draf", "Antrean RT/RW/Kel.", "Evaluasi", "Revisi", "Ditolak DEMO"].map(label => <th scope="col" key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.id ?? "unknown"} className="border-t border-slate-200"><th scope="row" className="px-4 py-4 font-semibold">{row.name}{row.code ? <span className="mt-1 block text-xs font-normal text-slate-500">{row.code}</span> : null}</th>{[row.count, row.waiting, row.evaluation, row.revision, row.rejected].map((count, index) => <td key={index} className="px-4 py-4 tabular-nums">{count}</td>)}</tr>)}</tbody>
    </table>
  </div> : <p className="mt-5 rounded-xl border border-dashed p-5 text-sm text-slate-600">Belum ada draf yang cocok pada kelompok ini.</p>;
}

export default async function MonitoringPage({ searchParams }: { searchParams: Promise<MonitoringQuery> }) {
  const filters = monitoringFilters(await searchParams);
  if (!filters) await requireProgramAdmin();
  const result = filters ? await getMonitoringReport(filters) : null;
  const data = result?.data;
  const invalid = !filters || result?.invalidFilter;
  const cards = data ? [
    ["Draf disimulasikan", data.summary.drafts, "Dihitung sekali dari putaran terakhir."],
    ["Putaran tersimpan terkait", data.summary.rounds, "Termasuk putaran lama dari draf yang lolos filter."],
    ["Antrean RT/RW/kelurahan", data.summary.waiting, "Masih menunggu pada putaran terakhir."],
    ["Antrean ≥24 jam", data.summary.waiting_24h, "Waktu berlalu; bukan status pengiriman email."],
  ] as const : [];

  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
    <Link href="/admin" className="font-semibold text-emerald-900 underline underline-offset-4">Pengelolaan admin</Link>
    <p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">LAPORAN INTERNAL · DEMO</p>
    <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Monitoring program</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Rekap simulasi dari akun pengaju aktif, memakai putaran terakhir tiap draf. Satu draf menjadi satu unit hitung; angka ini belum membuktikan jumlah inovasi unik. Isi proposal dan hasil penilaian individual tetap mengikuti akses asalnya.</p>
    {!data || !filters ? <section className={`mt-7 ${box}`}><p role="alert" className="leading-7 text-amber-950">{invalid ? "Filter tidak valid atau sudah tidak tersedia. Hapus filter untuk membuka laporan kembali." : "Laporan belum dapat dimuat. Muat ulang halaman untuk mencoba kembali."}</p><Link href="/admin/monitoring" className="mt-4 inline-block min-h-11 py-3 font-semibold text-emerald-900 underline">Buka laporan tanpa filter</Link></section> : <>
      <section aria-labelledby="filter" className={`mt-7 ${box}`}>
        <h2 id="filter" className="text-xl font-bold">Filter laporan</h2>
        <form method="get" action="/admin/monitoring" className="mt-5 space-y-5">
          <div className="grid gap-5 md:grid-cols-3">
            <label className="text-sm font-semibold">Kelurahan<select name="kelurahan_id" defaultValue={filters.kelurahan_id} className={select}><option value="">Semua kelurahan</option>{data.options.territories.map(row => <option key={row.id} value={row.id}>{row.name} ({row.code})</option>)}</select></label>
            <label className="text-sm font-semibold">Tema<select name="theme_id" defaultValue={filters.theme_id} className={select}><option value="">Semua tema</option>{data.options.themes.map(row => <option key={row.id} value={row.id}>{row.name} ({row.code})</option>)}</select></label>
            <label className="text-sm font-semibold">Status putaran terakhir<select name="status" defaultValue={filters.status} className={select}><option value="">Semua status</option>{monitoringStatuses.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
          </div>
          <div className="flex flex-wrap items-center gap-4"><button type="submit" className="min-h-11 rounded-full bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Terapkan filter</button><Link href="/admin/monitoring" className="min-h-11 py-3 text-sm font-semibold text-emerald-900 underline">Hapus filter</Link></div>
        </form>
      </section>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm"><p className="text-slate-600">Diambil <time dateTime={data.generated_at}>{date(data.generated_at)}</time></p><div className="flex flex-wrap gap-4 font-semibold text-emerald-900"><a href={`/admin/monitoring?${monitoringSearch(filters)}`} className="min-h-11 py-3 underline underline-offset-4">Muat ulang</a><a href={`/admin/monitoring/ekspor?${monitoringSearch(filters, 0)}`} className="min-h-11 py-3 underline underline-offset-4">Unduh rekap CSV</a></div></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, count, hint]) => <section key={label} className={box}><h2 className="text-sm font-semibold text-slate-600">{label}</h2><p className="mt-3 text-3xl font-bold tabular-nums">{count}</p><p className="mt-3 text-xs leading-6 text-slate-500">{hint}</p></section>)}</div>
      <section aria-labelledby="tindak-lanjut" className={`mt-6 ${box}`}>
        <h2 id="tindak-lanjut" className="text-xl font-bold">Koordinasi yang perlu diperhatikan</h2>
        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">{[
          ["Antrean tanpa petugas utama yang memenuhi syarat", data.summary.needs_primary],
          ["Permintaan dokumen fisik pending", data.summary.physical_pending],
          ["Panel Kecil belum dibagikan pengaju", data.summary.small_unshared],
          ["Panel Kecil: pembagian aktif", data.summary.small_open],
          ["Panel Kecil: pembagian dijeda", data.summary.small_paused],
        ].map(([label, count]) => <div key={String(label)}><dt className="leading-6 text-slate-600">{label}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{count}</dd></div>)}</dl>
        <p className="mt-5 text-xs leading-6 text-slate-500">Kelayakan petugas diperiksa dari mandat utama aktif, wilayah, akun, dan penghalang konflik yang tercatat. Ini bukan verifikasi independensi manual atau penetapan pengganti otomatis. Pembagian panel aktif juga belum berarti penilaian lengkap atau lolos.</p>
        <nav aria-label="Koordinasi admin" className="mt-4 flex flex-wrap gap-5 text-sm font-semibold text-emerald-900"><Link href="/admin" className="min-h-11 py-3 underline">Kelola mandat</Link><Link href="/admin/panel" className="min-h-11 py-3 underline">Koordinasi panel</Link></nav>
      </section>
      <section aria-labelledby="rekap-status" className={`mt-6 ${box}`}><h2 id="rekap-status" className="text-xl font-bold">Rekap per status</h2><div className="mt-5 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[700px] text-left text-sm"><caption className="sr-only">Status putaran terakhir draf sesuai filter</caption><thead className="bg-emerald-50"><tr>{["Status", "Draf", "Antrean ≥24 jam", "Tanpa petugas utama memenuhi syarat", "Masuk antrean tertua"].map(label => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{monitoringStatuses.map(status => { const row = data.statuses.find(item => item.status === status); return row ? <tr key={status} className="border-t border-slate-200"><th scope="row" className="px-4 py-4 font-semibold">{statusLabels[status]}</th><td className="px-4 py-4 tabular-nums">{row.count}</td><td className="px-4 py-4 tabular-nums">{row.waiting_24h}</td><td className="px-4 py-4 tabular-nums">{row.needs_primary}</td><td className="px-4 py-4">{row.oldest_queue_at ? <span><time dateTime={row.oldest_queue_at}>{date(row.oldest_queue_at)}</time><span className="mt-1 block text-xs text-slate-500">{monitoringWaitHours(row.oldest_queue_at, data.generated_at)} jam penuh menunggu</span></span> : "—"}</td></tr> : null; })}</tbody></table></div><p className="mt-4 text-xs leading-6 text-slate-500">Usia antrean dihitung untuk RT/RW/kelurahan dari waktu masuk tingkat saat ini. Angka ≥24 jam tidak menyatakan email terkirim, pelanggaran SLA, atau persetujuan otomatis.</p></section>
      <section aria-labelledby="rekap-tema" className={`mt-6 ${box}`}><h2 id="rekap-tema" className="text-xl font-bold">Rekap per tema</h2><GroupTable caption="Tema" rows={data.themes} /></section>
      <section aria-labelledby="rekap-wilayah" className={`mt-6 ${box}`}><h2 id="rekap-wilayah" className="text-xl font-bold">Rekap per kelurahan</h2><p className="mt-3 text-sm text-slate-600">{data.territory_count} kelurahan berisi draf sesuai filter · Halaman {filters.page + 1}</p><GroupTable caption="Kelurahan" rows={data.territories} /><nav aria-label="Halaman rekap kelurahan" className="mt-5 flex gap-5 text-sm font-semibold text-emerald-900">{filters.page > 0 ? <Link href={`/admin/monitoring?${monitoringSearch(filters, filters.page - 1)}`} className="min-h-11 py-3 underline">Sebelumnya</Link> : null}{(filters.page + 1) * 20 < data.territory_count ? <Link href={`/admin/monitoring?${monitoringSearch(filters, filters.page + 1)}`} className="min-h-11 py-3 underline">Berikutnya</Link> : null}</nav></section>
      <p className="mt-6 text-sm leading-7 text-slate-600">CSV memuat seluruh kelompok kelurahan sesuai filter dan diambil ulang saat diunduh. Dana, hasil uji warga, LPJ, banding, dan statistik publik belum tercakup; belum ada angka capaian untuk modul tersebut.</p>
    </>}
  </main>;
}
