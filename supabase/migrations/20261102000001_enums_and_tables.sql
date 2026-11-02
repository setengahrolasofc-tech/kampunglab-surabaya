-- KampungLab Surabaya (Handbook Rev. 4) - Tahap (a), bagian 1: skema inti.
-- Semua tabel di schema public memakai RLS (diaktifkan di migrasi 003). Fungsi bantu ada di schema private.

create schema if not exists private;

-- ---------------------------------------------------------------- enum
create type public.user_role as enum ('INNOVATOR','KELURAHAN','BRIDA_ADMIN');
create type public.user_status as enum ('MENUNGGU_MANDAT','AKTIF','DITOLAK','DIBLOKIR');
create type public.mandate_type as enum ('UTAMA','CADANGAN');
create type public.mandate_request_status as enum ('MENUNGGU','PERLU_PERBAIKAN','DIBERI','DITOLAK');
create type public.innovation_type as enum ('PROTOTIPE','PRODUK','PROGRAM','TEKNOLOGI');
create type public.plafon_scale as enum ('KECIL_5JT','TERAPAN_15JT');
create type public.innovation_status as enum (
  'DRAFT','WAITING_KELURAHAN_MANDATE','SUBMITTED_TO_KELURAHAN','REVISION_REQUESTED','REJECTED','APPEALED',
  'APPROVED_WAITING_TERM_1','BUILDING_PHASE','WAITING_BRIDA_GFORM','COMMUNITY_TESTING','EVALUATION_TERM_2',
  'RETEST_PENDING','REFINEMENT_AND_HANDOVER','COMPLETED_PUBLISHED','STOPPED_AS_LEARNING',
  'DISPUTED','CANCELLED_BY_KELURAHAN','TERMINATED_BLACKLISTED'
);
create type public.problem_status as enum ('OPEN','SOLVED');
create type public.funding_stage as enum ('TAHAP_1_30','TAHAP_2_30','TAHAP_3_40');
create type public.lurah_decision as enum ('LOLOS','TUNDA','GAGAL');
create type public.education_level as enum ('SD','SMP','SMA_SMK','D3','S1_D4','S2','S3','UMUM');
create type public.review_action as enum ('SETUJU','REVISI','TOLAK');
create type public.dispute_type as enum ('BANDING','LAPOR_KENDALA','SENGKETA');
create type public.dispute_status as enum ('DIAJUKAN','DITENGAHI','SELESAI','DITOLAK');

-- ---------------------------------------------------------------- master wilayah
create table public.master_kelurahan (
  id uuid primary key default gen_random_uuid(),
  kecamatan text not null check (length(btrim(kecamatan)) > 0),
  kelurahan text not null check (length(btrim(kelurahan)) > 0),
  unique (kecamatan, kelurahan)
);

-- ---------------------------------------------------------------- akun
-- Profil aplikasi untuk tiap akun Supabase Auth (kata sandi disimpan Supabase Auth, bukan di sini).
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  email text not null,
  role public.user_role not null,
  status public.user_status not null default 'AKTIF',
  phone_wa text,
  institusi text,
  kota_domisili text,
  nip text,
  jabatan text,
  sk_document_url text,
  is_super_admin boolean not null default false,
  is_blacklisted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role = 'BRIDA_ADMIN' or not is_super_admin)
);
create unique index users_email_lower_key on public.users (lower(email));
create index users_role_status_idx on public.users (role, status);

-- Pengajuan mandat akun Kelurahan (satu baris per akun; diproses Admin BRIDA).
create table public.mandate_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  kelurahan_id uuid not null references public.master_kelurahan(id),
  sk_document_url text,
  status public.mandate_request_status not null default 'MENUNGGU',
  catatan_brida text,
  diproses_oleh uuid references public.users(id),
  diproses_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index mandate_requests_status_idx on public.mandate_requests (status, created_at);

-- Mandat aktif = dicabut_pada IS NULL. Maksimal 1 UTAMA dan 1 CADANGAN aktif per kelurahan (total 2).
create table public.kelurahan_mandates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  kelurahan_id uuid not null references public.master_kelurahan(id),
  tipe public.mandate_type not null,
  diberikan_oleh uuid not null references public.users(id),
  diberikan_pada timestamptz not null default now(),
  dicabut_pada timestamptz,
  dicabut_oleh uuid references public.users(id),
  alasan_cabut text,
  check (dicabut_pada is null or length(btrim(coalesce(alasan_cabut,''))) > 0)
);
create unique index kelurahan_mandates_one_active_per_type on public.kelurahan_mandates (kelurahan_id, tipe) where dicabut_pada is null;
create unique index kelurahan_mandates_one_active_per_user on public.kelurahan_mandates (user_id) where dicabut_pada is null;
create index kelurahan_mandates_kelurahan_idx on public.kelurahan_mandates (kelurahan_id) where dicabut_pada is null;

-- Data pejabat per kelurahan (satu baris per kelurahan; diisi akun bermandat).
create table public.kelurahan_profiles (
  id uuid primary key default gen_random_uuid(),
  kelurahan_id uuid not null unique references public.master_kelurahan(id),
  nama_kelurahan text not null,
  kecamatan text not null,
  nama_lurah text,
  nip_lurah text,
  kontak_wa_resmi text,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- papan masalah & inovasi
create table public.problem_boards (
  id uuid primary key default gen_random_uuid(),
  kelurahan_id uuid not null references public.master_kelurahan(id),
  judul_masalah text not null check (length(btrim(judul_masalah)) between 5 and 200),
  kategori_tema text not null check (length(btrim(kategori_tema)) > 0),
  deskripsi text,
  deskripsi_lokasi_rt_rw text not null check (length(btrim(deskripsi_lokasi_rt_rw)) > 0),
  kontak_wa_narahubung text not null check (length(btrim(kontak_wa_narahubung)) > 0),
  status public.problem_status not null default 'OPEN',
  solved_by_innovation_id uuid,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index problem_boards_filter_idx on public.problem_boards (status, kelurahan_id, kategori_tema);

create table public.innovations (
  id uuid primary key default gen_random_uuid(),
  kode_unik text not null unique default ('KL-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  leader_user_id uuid not null references public.users(id),
  kelurahan_target_id uuid not null references public.master_kelurahan(id),
  problem_board_id uuid references public.problem_boards(id),
  judul text not null check (length(btrim(judul)) between 5 and 160),
  masalah text,
  tujuan text,
  target_pengguna text,
  deskripsi text,
  tipe_inovasi public.innovation_type not null,
  skala_plafon public.plafon_scale not null,
  durasi_bangun_hari integer not null default 30,
  total_rab bigint not null default 0 check (total_rab >= 0),
  rab_tak_terduga bigint not null default 0 check (rab_tak_terduga >= 0),
  rab_honor bigint not null default 0 check (rab_honor >= 0),
  rencana_perawatan_bulan integer,
  target_rt_rw text,
  prd_url text,
  rab_url text,
  surat_keaslian_url text,
  surat_kesepakatan_url text,
  status public.innovation_status not null default 'DRAFT',
  prev_status public.innovation_status,
  dispute_flag boolean not null default false,
  dispute_reason text,
  appeal_used boolean not null default false,
  cancel_reason text,
  submitted_at timestamptz,
  approved_at timestamptz,
  rka_locked_at timestamptz,
  building_started_at timestamptz,
  completed_at timestamptz,
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (rab_tak_terduga + rab_honor <= total_rab),
  check (rencana_perawatan_bulan is null or rencana_perawatan_bulan between 1 and 60)
);
create index innovations_status_idx on public.innovations (status, kelurahan_target_id);
create index innovations_leader_idx on public.innovations (leader_user_id);
alter table public.problem_boards add constraint problem_boards_solved_by_fk foreign key (solved_by_innovation_id) references public.innovations(id);

create table public.innovation_members (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  nama_anggota text not null check (length(btrim(nama_anggota)) > 0),
  peran_dalam_tim text not null check (length(btrim(peran_dalam_tim)) > 0),
  institusi_asal text,
  kota_domisili text,
  jenjang_pendidikan public.education_level not null,
  is_leader boolean not null default false,
  created_at timestamptz not null default now(),
  check (jenjang_pendidikan not in ('SD','SMP'))  -- Handbook 2.1: pelajar SMP/SD ke bawah dilarang
);
create index innovation_members_innovation_idx on public.innovation_members (innovation_id);
create unique index innovation_members_one_leader on public.innovation_members (innovation_id) where is_leader;

-- ---------------------------------------------------------------- dana, logbook, serah terima
-- Pengganti "logbooks_and_funds" (Handbook 8.2) dipecah tiga agar RLS per kolom/pelaku tegas.
create table public.fund_disbursements (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id),
  tahap public.funding_stage not null,
  nominal_seharusnya bigint not null check (nominal_seharusnya >= 0),
  nominal_cair bigint not null check (nominal_cair > 0),
  bukti_transfer_url text not null,
  tanggal_transfer date not null,
  catatan text,
  dicatat_oleh uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  unique (innovation_id, tahap),
  check (nominal_cair <= nominal_seharusnya)
);

create table public.logbook_entries (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id),
  tanggal date not null default current_date,
  deskripsi_progres text not null check (length(btrim(deskripsi_progres)) > 0),
  foto_url text,
  nota_belanja_url text,
  nominal_nota bigint check (nominal_nota is null or nominal_nota > 0),
  uraian_nota text,
  dibuat_oleh uuid not null references public.users(id),
  verified_by_lurah_at timestamptz,
  verified_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  check ((nominal_nota is null) = (nota_belanja_url is null))
);
create index logbook_entries_innovation_idx on public.logbook_entries (innovation_id, tanggal);

create table public.handover_documents (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null unique references public.innovations(id),
  bast_url text,
  bast_foto_url text,
  panduan_url text,
  pelatihan_bukti_url text,
  lpj_akhir_url text,
  bast_verified_at timestamptz,
  panduan_verified_at timestamptz,
  lpj_verified_at timestamptz,
  verified_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- uji warga (survei bawaan)
-- Tanpa gform_public_url / gsheet_embed_url / gsheet_csv_api_url / wa_anonymized_at (diganti survey_responses).
create table public.testing_integrations (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id),
  ronde integer not null default 1 check (ronde >= 1),
  qr_poster_url text,
  test_start_date date not null,
  test_end_date date not null,
  is_extended boolean not null default false,
  extended_at timestamptz,
  pertanyaan_kontekstual jsonb not null default '[]'::jsonb,
  total_valid_respondents integer not null default 0,
  avg_rating numeric(3,2),
  helpful_percentage numeric(5,2),
  photo_valid_percentage numeric(5,2),
  is_eligible_standard boolean not null default false,
  closed_at timestamptz,
  lurah_decision public.lurah_decision,
  decision_note text,
  decided_by uuid references public.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (innovation_id, ronde),
  check (test_end_date >= test_start_date)
);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id),
  ronde integer not null default 1,
  nama text not null check (length(btrim(nama)) > 0),
  usia integer not null check (usia between 5 and 110),
  tempat_tinggal text not null check (length(btrim(tempat_tinggal)) > 0),
  kecamatan text not null,
  kelurahan text not null,
  rt integer not null check (rt between 1 and 999),
  rw integer not null check (rw between 1 and 999),
  foto_url text not null,
  rating smallint not null check (rating between 1 and 5),
  membantu boolean not null,
  komentar text,
  jawaban_kontekstual jsonb not null default '{}'::jsonb,
  dedupe_key text not null,
  ip_hash text not null,
  dibuat_pada timestamptz not null default now(),
  unique (innovation_id, ronde, dedupe_key)
);
create index survey_responses_ip_idx on public.survey_responses (innovation_id, ip_hash, dibuat_pada);

-- ---------------------------------------------------------------- rapor, minat pilot
create table public.evidence_passports (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null unique references public.innovations(id),
  passport_code text not null unique,
  data_snapshot_json jsonb not null,
  sha256_hash text not null,
  published_at timestamptz not null default now(),
  pilot_interest_count integer not null default 0
);

create table public.pilot_interests (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id),
  nama text not null,
  instansi text not null,
  kontak text not null,
  pesan text,
  dibuat_pada timestamptz not null default now()
);

-- ---------------------------------------------------------------- tinjauan, riwayat, sengketa, blacklist
create table public.submission_reviews (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id),
  aksi public.review_action not null,
  catatan text,
  reviewer_id uuid not null references public.users(id),
  dibuat_pada timestamptz not null default now(),
  check (aksi = 'SETUJU' or length(btrim(coalesce(catatan,''))) > 0)
);

create table public.innovation_status_history (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id),
  dari public.innovation_status,
  ke public.innovation_status not null,
  oleh uuid references public.users(id),
  alasan text,
  waktu timestamptz not null default now()
);
create index innovation_status_history_idx on public.innovation_status_history (innovation_id, waktu);

-- Mesin status: pasangan (dari -> ke) yang sah. Peran pelaku diperiksa oleh fungsi alur kerja.
create table public.innovation_transitions (
  dari public.innovation_status not null,
  ke public.innovation_status not null,
  primary key (dari, ke)
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id),
  tipe public.dispute_type not null,
  pelapor_id uuid not null references public.users(id),
  pelapor_role public.user_role not null,
  alasan text not null check (length(btrim(alasan)) > 0),
  lampiran_url text,
  status public.dispute_status not null default 'DIAJUKAN',
  keputusan text,
  ditangani_oleh uuid references public.users(id),
  diputuskan_pada timestamptz,
  dibuat_pada timestamptz not null default now()
);
create index disputes_status_idx on public.disputes (status, dibuat_pada);

create table public.blacklist_entries (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid references public.innovations(id),
  user_id uuid references public.users(id),
  nama text not null,
  alasan text not null,
  restitusi_nominal bigint,
  dicatat_oleh uuid not null references public.users(id),
  dibuat_pada timestamptz not null default now(),
  dicabut_pada timestamptz,
  dicabut_alasan text
);

-- ---------------------------------------------------------------- notifikasi, audit, parameter
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  untuk_role public.user_role,
  untuk_user_id uuid not null references public.users(id) on delete cascade,
  tipe text not null,
  pesan text not null,
  ref_id uuid,
  dibaca boolean not null default false,
  dibaca_pada timestamptz,
  dibuat_pada timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (untuk_user_id, dibaca, dibuat_pada desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  aktor_id uuid,
  aksi text not null,
  target text,
  detail_json jsonb not null default '{}'::jsonb,
  waktu timestamptz not null default now()
);
create index audit_logs_waktu_idx on public.audit_logs (waktu desc);
create index audit_logs_aksi_idx on public.audit_logs (aksi, waktu desc);

create table public.system_parameters (
  key text primary key,
  value jsonb not null,
  deskripsi text not null,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);
