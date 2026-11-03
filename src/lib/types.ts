export type AppRole = "BRIDA_ADMIN" | "KELURAHAN" | "INNOVATOR";
export type AccountStatus = "MENUNGGU_MANDAT" | "AKTIF" | "DITOLAK" | "DIBLOKIR";

export interface AppUserRow {
  id: string; name: string; email: string; role: AppRole; phone_wa: string | null; institusi: string | null;
  kota_domisili: string | null; nip: string | null; jabatan: string | null; kelurahan_id: string | null;
  sk_document_url: string | null; status: AccountStatus; is_verified: boolean; is_blacklisted: boolean;
  catatan_verifikasi: string | null; perlu_perbaikan: boolean; created_at: string;
  kelurahan?: { kecamatan: string; kelurahan: string } | null;
}

export interface MandateRow {
  id: string; user_id: string; kelurahan_id: string; tipe: "UTAMA" | "CADANGAN"; diberikan_pada: string;
  dicabut_pada: string | null; alasan_cabut: string | null;
}

export interface InnovationRow {
  id: string; kode_unik: string; leader_user_id: string; kelurahan_target_id: string; problem_board_id: string | null;
  judul: string; tipe_inovasi: "PROTOTIPE" | "PRODUK" | "PROGRAM" | "TEKNOLOGI"; skala_plafon: "KECIL_5JT" | "TERAPAN_15JT";
  ringkasan: string; masalah: string; tujuan: string; target_pengguna: string; target_rt_rw: string;
  total_rab: number; rab_tak_terduga: number; rab_honor: number; rencana_perawatan_bulan: number | null;
  prd_url: string | null; rab_url: string | null; surat_keaslian_url: string | null; surat_kesepakatan_url: string | null;
  status: string; status_changed_at: string; submitted_at: string | null; revisi_ke: number;
  catatan_pemeriksaan: string | null; diperiksa_pada: string | null; anggaran_terkunci_at: string | null; rka_referensi: string | null;
  dispute_flag: boolean; dispute_reason: string | null; reimburse_nominal: number | null; banding_final: boolean;
  created_at: string; updated_at: string;
  kelurahan?: { kecamatan: string; kelurahan: string } | null;
}

export interface MemberRow {
  id: string; innovation_id: string; nama_anggota: string; peran_dalam_tim: string; institusi_asal: string;
  kota_domisili: string; jenjang_pendidikan: string; is_ketua: boolean; urutan: number;
}

export interface FundRow {
  id: string; innovation_id: string; jenis: "PENCAIRAN" | "LOGBOOK" | "SERAH_TERIMA"; tahap: string | null;
  nominal_cair: number | null; bukti_transfer_url: string | null; deskripsi_progres: string | null; nominal_belanja: number | null;
  tanggal_kegiatan: string | null; nota_belanja_url: string | null; foto_progres_url: string | null; bast_url: string | null;
  panduan_url: string | null; lpj_akhir_url: string | null; catatan_validasi: string | null; verified_by_lurah_at: string | null; created_at: string;
}

export interface SurveyQuestion { id: string; tipe: "skala" | "pilihan"; teks: string; pilihan?: string[] }

export interface TestSummary {
  ada: boolean; ronde?: number; status?: "AKTIF" | "SELESAI"; mulai?: string; selesai?: string; diperpanjang?: boolean; sisa_hari?: number;
  metrik?: { responden: number; avg_rating: number; helpful_pct: number; photo_pct: number; eligible: boolean };
  keputusan?: "LOLOS" | "TUNDA" | "GAGAL" | null; keputusan_catatan?: string | null; survey_pertanyaan?: SurveyQuestion[];
  ulasan?: Array<{ inisial: string; rating: number; membantu: boolean; komentar: string | null; waktu: string }>;
  ambang: { kuota: number; rating: number; helpful: number; foto: number };
}

export interface NotificationRow { id: string; tipe: string; pesan: string; tautan: string | null; dibaca: boolean; dibuat_pada: string }
