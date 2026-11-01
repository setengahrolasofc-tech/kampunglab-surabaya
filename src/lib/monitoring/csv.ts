import { statusLabels } from "@/lib/simulations/workflow";
import type { MonitoringReport } from "./types";
import { monitoringDate as wib, monitoringWaitHours } from "./display";

// Quote every cell and neutralize formula prefixes, including prefixes after whitespace/control characters.
const cell = (value: string | number) => {
  let text = String(value).replace(/[\u0000-\u001f\u007f]/g, " ");
  if (/^\s*[=+@-]/u.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
};

export function monitoringCsv(report: MonitoringReport) {
  const rows: (string | number)[][] = [
    ["KampungLab Surabaya — Laporan internal DEMO"],
    ["Diambil pada", wib(report.generated_at)],
    ["Kelurahan", report.options.territories.find(row => row.id === report.filters.kelurahan_id)?.name ?? "Semua"],
    ["Tema", report.options.themes.find(row => row.id === report.filters.theme_id)?.name ?? "Semua"],
    ["Status", report.filters.status ? statusLabels[report.filters.status] : "Semua"],
    ["Dasar hitung", "Putaran terakhir setiap draf dari akun pengaju aktif; bukan inovasi unik terverifikasi."],
    ["Cakupan putaran", "Semua putaran tersimpan milik draf yang lolos filter pada putaran terakhir."],
    [], ["Ringkasan", "Jumlah"],
    ["Draf disimulasikan", report.summary.drafts], ["Putaran terkait", report.summary.rounds],
    ["Menunggu RT/RW/kelurahan", report.summary.waiting], ["Menunggu >=24 jam", report.summary.waiting_24h],
    ["Antrean tanpa petugas utama yang memenuhi syarat", report.summary.needs_primary],
    ["Permintaan fisik pending", report.summary.physical_pending],
    ["Panel Kecil belum dibagikan", report.summary.small_unshared], ["Panel Kecil pembagian aktif", report.summary.small_open],
    ["Panel Kecil pembagian dijeda", report.summary.small_paused],
    [], ["Status", "Jumlah draf", "Antrean >=24 jam", "Tanpa petugas utama memenuhi syarat", "Antrean tertua masuk (WIB)", "Usia antrean tertua (jam penuh)"],
    ...report.statuses.map(row => [statusLabels[row.status] ?? row.status, row.count, row.waiting_24h, row.needs_primary, row.oldest_queue_at ? wib(row.oldest_queue_at) : "", row.oldest_queue_at ? monitoringWaitHours(row.oldest_queue_at, report.generated_at) : ""]),
  ];
  for (const [label, groups] of [["Tema", report.themes], ["Kelurahan", report.territories]] as const) {
    rows.push([], [label, "Kode", "Jumlah draf", "Menunggu RT/RW/kelurahan", "Menunggu evaluasi", "Perlu revisi", "Ditolak DEMO"]);
    for (const row of groups) rows.push([row.name, row.code ?? "", row.count, row.waiting, row.evaluation, row.revision, row.rejected]);
  }
  rows.push([], ["Batasan", "Statistik >=24 jam bukan status email terkirim, pelanggaran SLA, atau persetujuan otomatis. Dana, uji warga, dan keputusan akhir belum tercakup."]);
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
