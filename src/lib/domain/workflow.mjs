/**
 * Cermin state machine pengajuan (Handbook Bab 8.1 + WAITING_KELURAHAN_MANDATE).
 * Sumber kebenaran ada di database (tabel innovation_transitions, trigger guard_innovation_status).
 * Berkas ini hanya mengatur tampilan (tombol/halaman sesuai status dan role); tes tests/workflow.test.mjs
 * memastikan daftar ini identik dengan seed SQL.
 */
export const STATUSES = [
  "DRAFT", "WAITING_KELURAHAN_MANDATE", "SUBMITTED_TO_KELURAHAN", "REVISION_REQUESTED", "REJECTED", "APPEALED",
  "APPROVED_WAITING_TERM_1", "BUILDING_PHASE", "WAITING_BRIDA_GFORM", "COMMUNITY_TESTING", "EVALUATION_TERM_2",
  "RETEST_PENDING", "REFINEMENT_AND_HANDOVER", "COMPLETED_PUBLISHED", "STOPPED_AS_LEARNING", "DISPUTED",
  "CANCELLED_BY_KELURAHAN", "TERMINATED_BLACKLISTED",
];

/** @type {Record<string, {label: string, tone: 'netral'|'info'|'sukses'|'perhatian'|'bahaya', hint: string}>} */
export const STATUS_INFO = {
  DRAFT: { label: "Draft", tone: "netral", hint: "Lengkapi tim, RAB, dan dokumen lalu kirim ke Kelurahan." },
  WAITING_KELURAHAN_MANDATE: { label: "Menunggu BRIDA menunjuk admin kelurahan", tone: "perhatian", hint: "Kelurahan tujuan belum punya akun bermandat. BRIDA sudah diberi tahu; pengajuan otomatis berlanjut setelah mandat diberikan." },
  SUBMITTED_TO_KELURAHAN: { label: "Menunggu pemeriksaan Kelurahan", tone: "perhatian", hint: "Kelurahan memeriksa kelengkapan berkas dan Surat Kesepakatan." },
  REVISION_REQUESTED: { label: "Perlu revisi", tone: "perhatian", hint: "Perbaiki sesuai catatan Kelurahan lalu kirim ulang." },
  REJECTED: { label: "Ditolak", tone: "bahaya", hint: "Anda dapat mengajukan banding satu kali." },
  APPEALED: { label: "Banding diproses BRIDA", tone: "info", hint: "Admin BRIDA memeriksa banding Anda." },
  APPROVED_WAITING_TERM_1: { label: "Disetujui, menunggu dana Tahap 1", tone: "info", hint: "Anggaran terkunci. Menunggu Kelurahan mencatat transfer Tahap 1 (30%)." },
  BUILDING_PHASE: { label: "Fase pembuatan", tone: "info", hint: "Bangun inovasi, isi Logbook dan unggah nota. Tekan Siap Uji Warga bila siap." },
  WAITING_BRIDA_GFORM: { label: "Menunggu aktivasi uji", tone: "info", hint: "Status warisan Rev. 4; tidak dipakai karena survei dibuat otomatis." },
  COMMUNITY_TESTING: { label: "Uji warga berjalan", tone: "info", hint: "Warga mengisi survei lewat QR di poster. Hasil tampil real-time." },
  EVALUATION_TERM_2: { label: "Evaluasi & keputusan Lurah", tone: "perhatian", hint: "Masa uji selesai. Lurah memutuskan Lolos, Tunda, atau Gagal." },
  RETEST_PENDING: { label: "Perbaikan & uji ulang", tone: "perhatian", hint: "Perbaiki inovasi lalu mulai uji ulang 14 hari." },
  REFINEMENT_AND_HANDOVER: { label: "Penyempurnaan & serah terima", tone: "info", hint: "Unggah BAST, Panduan Perawatan, dan LPJ 100%." },
  COMPLETED_PUBLISHED: { label: "Selesai & terbit di Etalase", tone: "sukses", hint: "Rapor Bukti Inovasi telah terbit." },
  STOPPED_AS_LEARNING: { label: "Dihentikan sebagai pembelajaran", tone: "netral", hint: "Gagal uji dengan nota jujur bukan sanksi." },
  DISPUTED: { label: "Sengketa dimediasi BRIDA", tone: "bahaya", hint: "Proses dibekukan sampai BRIDA memutus." },
  CANCELLED_BY_KELURAHAN: { label: "Dibatalkan Kelurahan", tone: "bahaya", hint: "Belanja bernota sah diganti dari dana operasional kelurahan." },
  TERMINATED_BLACKLISTED: { label: "Dihentikan & daftar hitam", tone: "bahaya", hint: "Mangkrak/fiktif/pemalsuan. Restitusi 100% dana diterima." },
};

export const statusLabel = (/** @type {string} */ s) => STATUS_INFO[s]?.label ?? s;

/** Lima fase di Beranda dan di garis waktu. */
export const PHASES = [
  { id: 1, nama: "Ajukan", statuses: ["DRAFT", "WAITING_KELURAHAN_MANDATE", "SUBMITTED_TO_KELURAHAN", "REVISION_REQUESTED", "REJECTED", "APPEALED", "APPROVED_WAITING_TERM_1"] },
  { id: 2, nama: "Bangun", statuses: ["BUILDING_PHASE", "WAITING_BRIDA_GFORM"] },
  { id: 3, nama: "Uji Warga", statuses: ["COMMUNITY_TESTING", "EVALUATION_TERM_2", "RETEST_PENDING"] },
  { id: 4, nama: "Serah Terima", statuses: ["REFINEMENT_AND_HANDOVER"] },
  { id: 5, nama: "Terbit", statuses: ["COMPLETED_PUBLISHED"] },
];
export const phaseOf = (/** @type {string} */ s) => PHASES.find((p) => p.statuses.includes(s))?.id ?? 0;

export const FINAL_STATUSES = ["COMPLETED_PUBLISHED", "STOPPED_AS_LEARNING", "CANCELLED_BY_KELURAHAN", "TERMINATED_BLACKLISTED"];
export const EDITABLE_STATUSES = ["DRAFT", "REVISION_REQUESTED"];
export const FUNDED_STATUSES = ["BUILDING_PHASE", "COMMUNITY_TESTING", "EVALUATION_TERM_2", "RETEST_PENDING", "REFINEMENT_AND_HANDOVER"];
export const LOGBOOK_STATUSES = FUNDED_STATUSES;
export const DISPUTABLE_STATUSES = ["SUBMITTED_TO_KELURAHAN", "REVISION_REQUESTED", "APPROVED_WAITING_TERM_1", ...FUNDED_STATUSES];
export const CANCELLABLE_STATUSES = ["APPROVED_WAITING_TERM_1", ...FUNDED_STATUSES];
export const TERMINABLE_STATUSES = [...FUNDED_STATUSES, "DISPUTED"];

/** Transisi sah: [dari, ke, aktor]. Harus identik dengan seed SQL. */
export const TRANSITIONS = (() => {
  /** @type {Array<[string, string, string]>} */
  const t = [
    ["DRAFT", "SUBMITTED_TO_KELURAHAN", "INNOVATOR"], ["DRAFT", "WAITING_KELURAHAN_MANDATE", "INNOVATOR"],
    ["REVISION_REQUESTED", "SUBMITTED_TO_KELURAHAN", "INNOVATOR"], ["REVISION_REQUESTED", "WAITING_KELURAHAN_MANDATE", "INNOVATOR"],
    ["WAITING_KELURAHAN_MANDATE", "SUBMITTED_TO_KELURAHAN", "SYSTEM"], ["SUBMITTED_TO_KELURAHAN", "WAITING_KELURAHAN_MANDATE", "SYSTEM"],
    ["SUBMITTED_TO_KELURAHAN", "APPROVED_WAITING_TERM_1", "KELURAHAN"], ["SUBMITTED_TO_KELURAHAN", "REVISION_REQUESTED", "KELURAHAN"],
    ["SUBMITTED_TO_KELURAHAN", "REJECTED", "KELURAHAN"], ["REJECTED", "APPEALED", "INNOVATOR"],
    ["APPEALED", "SUBMITTED_TO_KELURAHAN", "BRIDA_ADMIN"], ["APPEALED", "WAITING_KELURAHAN_MANDATE", "BRIDA_ADMIN"], ["APPEALED", "REJECTED", "BRIDA_ADMIN"],
    ["APPROVED_WAITING_TERM_1", "BUILDING_PHASE", "KELURAHAN"], ["BUILDING_PHASE", "COMMUNITY_TESTING", "INNOVATOR"],
    ["COMMUNITY_TESTING", "EVALUATION_TERM_2", "SYSTEM"], ["EVALUATION_TERM_2", "REFINEMENT_AND_HANDOVER", "KELURAHAN"],
    ["EVALUATION_TERM_2", "RETEST_PENDING", "KELURAHAN"], ["EVALUATION_TERM_2", "STOPPED_AS_LEARNING", "KELURAHAN"],
    ["RETEST_PENDING", "COMMUNITY_TESTING", "INNOVATOR"], ["REFINEMENT_AND_HANDOVER", "COMPLETED_PUBLISHED", "KELURAHAN"],
    ["DISPUTED", "CANCELLED_BY_KELURAHAN", "BRIDA_ADMIN"],
  ];
  for (const s of DISPUTABLE_STATUSES) {
    t.push([s, "DISPUTED", "INNOVATOR"], [s, "DISPUTED", "KELURAHAN"], ["DISPUTED", s, "BRIDA_ADMIN"]);
  }
  for (const s of CANCELLABLE_STATUSES) t.push([s, "CANCELLED_BY_KELURAHAN", "KELURAHAN"]);
  for (const s of TERMINABLE_STATUSES) t.push([s, "TERMINATED_BLACKLISTED", "BRIDA_ADMIN"]);
  return t;
})();

/** @param {string} from @param {string} to @param {string} actor */
export const canTransition = (from, to, actor) => TRANSITIONS.some(([f, t, a]) => f === from && t === to && a === actor);

/**
 * Aksi yang boleh tampil untuk seorang aktor pada status tertentu (UI saja; DB tetap penentu).
 * @param {'INNOVATOR'|'KELURAHAN'|'BRIDA_ADMIN'} role @param {string} status
 */
export function actionsFor(role, status) {
  /** @type {string[]} */
  const a = [];
  if (role === "INNOVATOR") {
    if (EDITABLE_STATUSES.includes(status)) a.push("edit", "kirim");
    if (status === "DRAFT") a.push("hapus");
    if (LOGBOOK_STATUSES.includes(status)) a.push("logbook");
    if (status === "BUILDING_PHASE") a.push("siap-uji");
    if (status === "COMMUNITY_TESTING") a.push("poster", "perpanjang");
    if (status === "RETEST_PENDING") a.push("uji-ulang");
    if (status === "REFINEMENT_AND_HANDOVER") a.push("serah-terima");
    if (status === "REJECTED") a.push("banding");
    if (DISPUTABLE_STATUSES.includes(status)) a.push("lapor-kendala");
  } else if (role === "KELURAHAN") {
    if (status === "SUBMITTED_TO_KELURAHAN") a.push("periksa");
    if (status === "APPROVED_WAITING_TERM_1") a.push("transfer-1");
    if (status === "COMMUNITY_TESTING") a.push("perpanjang");
    if (status === "EVALUATION_TERM_2") a.push("keputusan-uji", "transfer-2");
    if (status === "REFINEMENT_AND_HANDOVER") a.push("validasi-serah-terima", "transfer-3");
    if (CANCELLABLE_STATUSES.includes(status)) a.push("batalkan");
    if (DISPUTABLE_STATUSES.includes(status)) a.push("lapor-kendala");
  } else {
    if (status === "APPEALED") a.push("putus-banding");
    if (status === "DISPUTED") a.push("putus-sengketa");
    if (TERMINABLE_STATUSES.includes(status)) a.push("hentikan");
  }
  return a;
}
