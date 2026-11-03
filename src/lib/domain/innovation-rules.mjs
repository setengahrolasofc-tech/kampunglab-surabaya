/** Nilai bawaan parameter; nilai hidup dibaca dari tabel system_parameters (diatur Admin BRIDA). */
export const DEFAULT_PARAMS = {
  plafon_kecil: 5_000_000, plafon_terapan: 15_000_000, durasi_bangun_kecil: 30, durasi_bangun_terapan: 60,
  porsi_tahap_1: 30, porsi_tahap_2: 30, porsi_tahap_3: 40, tak_terduga_maks_pct: 10, honor_maks_pct: 15,
  perawatan_min_bulan: 6, perawatan_maks_bulan: 12, tim_min: 2, tim_maks: 6, durasi_uji_hari: 14, perpanjangan_hari: 7,
  ambang_kuota: 30, ambang_rating: 3.8, ambang_helpful_pct: 75, ambang_foto_pct: 80, rating_tunda_min: 3.0,
  survey_foto_wajib: true, survey_rate_limit_per_jam: 10, banding_maks_hari: 7,
};

export const TIPE_INOVASI = [
  { value: "PROGRAM", label: "Program", skala: "KECIL_5JT" },
  { value: "PRODUK", label: "Produk sederhana", skala: "KECIL_5JT" },
  { value: "PROTOTIPE", label: "Prototipe", skala: "TERAPAN_15JT" },
  { value: "TEKNOLOGI", label: "Teknologi", skala: "TERAPAN_15JT" },
];
export const JENJANG = [
  { value: "SMA_SMK", label: "SMA/SMK" },
  { value: "MAHASISWA_DIPLOMA_S1", label: "Mahasiswa D3/S1" },
  { value: "PASCASARJANA", label: "Pascasarjana" },
  { value: "WARGA_UMUM", label: "Warga umum / komunitas" },
  { value: "SMP_KE_BAWAH", label: "SMP/SD ke bawah (tidak diizinkan)" },
];
export const TEMA_MASALAH = [
  ["LINGKUNGAN", "Lingkungan"], ["KESEHATAN", "Kesehatan"], ["EKONOMI", "Ekonomi"], ["PENDIDIKAN", "Pendidikan"],
  ["INFRASTRUKTUR", "Infrastruktur"], ["KEAMANAN", "Keamanan"], ["SOSIAL", "Sosial"], ["TEKNOLOGI", "Teknologi"], ["LAINNYA", "Lainnya"],
];

/** @param {string} tipe */
export const skalaOf = (tipe) => (tipe === "PROGRAM" || tipe === "PRODUK" ? "KECIL_5JT" : "TERAPAN_15JT");
/** @param {string} skala @param {typeof DEFAULT_PARAMS} p */
export const plafonOf = (skala, p = DEFAULT_PARAMS) => (skala === "KECIL_5JT" ? p.plafon_kecil : p.plafon_terapan);
/** @param {string} skala @param {typeof DEFAULT_PARAMS} p */
export const durasiBangunOf = (skala, p = DEFAULT_PARAMS) => (skala === "KECIL_5JT" ? p.durasi_bangun_kecil : p.durasi_bangun_terapan);

/** Pembagian pencairan 30-30-40 (dibulatkan seperti di SQL: round(total * porsi / 100)). @param {number} total */
export function pembagianTahap(total, p = DEFAULT_PARAMS) {
  return {
    TAHAP_1_30: Math.round((total * p.porsi_tahap_1) / 100),
    TAHAP_2_30: Math.round((total * p.porsi_tahap_2) / 100),
    TAHAP_3_40: Math.round((total * p.porsi_tahap_3) / 100),
  };
}

/**
 * Pemeriksaan kelengkapan di sisi klien (umpan balik cepat). Cerminan app.validate_submission() di database,
 * yang tetap menjadi penentu saat tombol Kirim ditekan.
 * @param {Record<string, any>} i pengajuan @param {Array<{jenjang_pendidikan: string, is_ketua: boolean}>} members
 */
export function checkSubmission(i, members, p = DEFAULT_PARAMS) {
  /** @type {string[]} */
  const e = [];
  const len = (/** @type {any} */ v) => String(v ?? "").trim().length;
  if (len(i.judul) < 5) e.push("Judul minimal 5 karakter.");
  if (len(i.ringkasan) < 20) e.push("Ringkasan minimal 20 karakter.");
  if (len(i.masalah) < 20) e.push("Uraian masalah minimal 20 karakter.");
  if (len(i.tujuan) < 20) e.push("Tujuan minimal 20 karakter.");
  if (len(i.target_pengguna) < 5) e.push("Target pengguna wajib diisi.");
  if (len(i.target_rt_rw) < 2) e.push("Target RT/RW lokasi uji wajib diisi.");
  const total = Number(i.total_rab ?? 0);
  const plafon = plafonOf(skalaOf(i.tipe_inovasi), p);
  if (total <= 0) e.push("Total RAB wajib diisi.");
  else if (total > plafon) e.push(`Total RAB melebihi plafon (${plafon.toLocaleString("id-ID")}).`);
  if (Number(i.rab_tak_terduga ?? 0) * 100 > total * p.tak_terduga_maks_pct) e.push(`Dana tak terduga maksimal ${p.tak_terduga_maks_pct}% dari total RAB.`);
  if (Number(i.rab_honor ?? 0) * 100 > total * p.honor_maks_pct) e.push(`Honorarium maksimal ${p.honor_maks_pct}% dari total RAB.`);
  const rawan = Number(i.rencana_perawatan_bulan);
  if (!(rawan >= p.perawatan_min_bulan && rawan <= p.perawatan_maks_bulan)) e.push(`Rencana perawatan ${p.perawatan_min_bulan}–${p.perawatan_maks_bulan} bulan.`);
  if (!i.prd_url) e.push("Unggah PRD.");
  if (!i.rab_url) e.push("Unggah RAB terperinci.");
  if (!i.surat_keaslian_url) e.push("Unggah Surat Pernyataan Keaslian bermeterai.");
  if (!i.surat_kesepakatan_url) e.push("Unggah Surat Kesepakatan Lokasi Uji bertanda tangan.");
  if (members.length < p.tim_min || members.length > p.tim_maks) e.push(`Tim wajib ${p.tim_min}–${p.tim_maks} orang (saat ini ${members.length}).`);
  if (members.filter((m) => m.is_ketua).length !== 1) e.push("Tentukan tepat satu ketua tim.");
  if (members.some((m) => m.jenjang_pendidikan === "SMP_KE_BAWAH")) e.push("Pelajar SMP/SD ke bawah tidak dapat menjadi anggota tim.");
  return e;
}

/** Jenis berkas yang boleh diunggah dan awalan path di Storage: <innovation_id>/<jenis>/<uuid>-<nama>. */
export const JENIS_BERKAS = ["prd", "rab", "keaslian", "kesepakatan", "nota", "foto", "bast", "panduan", "lpj", "banding", "transfer"];
