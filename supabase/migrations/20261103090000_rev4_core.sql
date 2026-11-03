-- =====================================================================
-- KampungLab Surabaya — Handbook Rev. 4 (inti)
-- 3 role akun, state machine pengajuan, mandat kelurahan, notifikasi,
-- survei uji warga bawaan, Rapor Bukti Inovasi, audit log.
--
-- Migrasi ini TAMBAHAN: tabel alur lama (profiles, simulations, panel, dst.)
-- tidak dihapus. Aplikasi Rev. 4 tidak memakainya lagi.
-- Semua perubahan status pengajuan hanya lewat fungsi RPC di bawah
-- (bukan UPDATE langsung); RLS dan trigger menolak jalan pintas.
-- =====================================================================

create schema if not exists app;
grant usage on schema app to anon, authenticated, service_role;

-- ---------- Tipe enum ----------
create type public.app_role as enum ('BRIDA_ADMIN', 'KELURAHAN', 'INNOVATOR');
create type public.account_status as enum ('MENUNGGU_MANDAT', 'AKTIF', 'DITOLAK', 'DIBLOKIR');
create type public.mandate_type as enum ('UTAMA', 'CADANGAN');
create type public.innovation_status as enum (
  'DRAFT', 'WAITING_KELURAHAN_MANDATE', 'SUBMITTED_TO_KELURAHAN',
  'REVISION_REQUESTED', 'REJECTED', 'APPEALED',
  'APPROVED_WAITING_TERM_1', 'BUILDING_PHASE', 'WAITING_BRIDA_GFORM',
  'COMMUNITY_TESTING', 'EVALUATION_TERM_2', 'RETEST_PENDING',
  'REFINEMENT_AND_HANDOVER', 'COMPLETED_PUBLISHED', 'STOPPED_AS_LEARNING',
  'DISPUTED', 'CANCELLED_BY_KELURAHAN', 'TERMINATED_BLACKLISTED'
);
create type public.innovation_type as enum ('PROTOTIPE', 'PRODUK', 'PROGRAM', 'TEKNOLOGI');
create type public.plafon_scale as enum ('KECIL_5JT', 'TERAPAN_15JT');
create type public.problem_status as enum ('OPEN', 'SOLVED');
create type public.problem_theme as enum (
  'LINGKUNGAN', 'KESEHATAN', 'EKONOMI', 'PENDIDIKAN', 'INFRASTRUKTUR', 'KEAMANAN', 'SOSIAL', 'TEKNOLOGI', 'LAINNYA'
);
create type public.fund_stage as enum ('TAHAP_1_30', 'TAHAP_2_30', 'TAHAP_3_40');
create type public.record_kind as enum ('PENCAIRAN', 'LOGBOOK', 'SERAH_TERIMA');
create type public.lurah_decision as enum ('LOLOS', 'TUNDA', 'GAGAL');
create type public.education_level as enum ('SMP_KE_BAWAH', 'SMA_SMK', 'MAHASISWA_DIPLOMA_S1', 'PASCASARJANA', 'WARGA_UMUM');

-- ---------- Master kelurahan ----------
create table public.master_kelurahan (
  id uuid primary key default gen_random_uuid(),
  kecamatan text not null check (char_length(btrim(kecamatan)) between 1 and 80),
  kelurahan text not null check (char_length(btrim(kelurahan)) between 1 and 80),
  unique (kecamatan, kelurahan)
);

-- ---------- users (profil aplikasi; kredensial ada di auth.users) ----------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 100),
  email text not null default '',
  role public.app_role not null default 'INNOVATOR',
  phone_wa text check (phone_wa is null or phone_wa ~ '^[0-9+]{8,16}$'),
  institusi text check (institusi is null or char_length(institusi) <= 120),
  kota_domisili text check (kota_domisili is null or char_length(kota_domisili) <= 80),
  nip text check (nip is null or nip ~ '^[0-9 ]{8,24}$'),
  jabatan text check (jabatan is null or char_length(jabatan) <= 120),
  kelurahan_id uuid references public.master_kelurahan(id),
  sk_document_url text,
  status public.account_status not null default 'AKTIF',
  is_verified boolean not null default false,
  is_blacklisted boolean not null default false,
  catatan_verifikasi text,
  perlu_perbaikan boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role <> 'KELURAHAN' or kelurahan_id is not null)
);
create index users_role_status on public.users(role, status);
create index users_kelurahan on public.users(kelurahan_id);

create table public.kelurahan_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  kelurahan_id uuid not null references public.master_kelurahan(id),
  nama_lurah text not null,
  nip_lurah text,
  jabatan text,
  kontak_wa_resmi text
);
create index kelurahan_profiles_kel on public.kelurahan_profiles(kelurahan_id);

-- Mandat: 1 UTAMA + 1 CADANGAN aktif per kelurahan; 1 mandat aktif per akun.
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
  check ((dicabut_pada is null and alasan_cabut is null) or (dicabut_pada is not null and char_length(btrim(coalesce(alasan_cabut, ''))) >= 5))
);
create unique index mandates_one_active_per_type on public.kelurahan_mandates(kelurahan_id, tipe) where dicabut_pada is null;
create unique index mandates_one_active_per_user on public.kelurahan_mandates(user_id) where dicabut_pada is null;
create index mandates_user on public.kelurahan_mandates(user_id);

-- ---------- Parameter sistem ----------
create table public.system_parameters (
  key text primary key,
  value jsonb not null,
  keterangan text not null default '',
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

-- ---------- Papan Masalah ----------
create table public.problem_boards (
  id uuid primary key default gen_random_uuid(),
  kelurahan_id uuid not null references public.master_kelurahan(id),
  dibuat_oleh uuid not null references public.users(id),
  judul_masalah text not null check (char_length(btrim(judul_masalah)) between 5 and 160),
  kategori_tema public.problem_theme not null,
  deskripsi text not null default '' check (char_length(deskripsi) <= 2000),
  deskripsi_lokasi_rt_rw text not null check (char_length(btrim(deskripsi_lokasi_rt_rw)) between 2 and 200),
  kontak_wa_narahubung text not null check (kontak_wa_narahubung ~ '^[0-9+]{8,16}$'),
  status public.problem_status not null default 'OPEN',
  solved_by_innovation_id uuid,
  created_at timestamptz not null default now(),
  check ((status = 'OPEN' and solved_by_innovation_id is null) or (status = 'SOLVED' and solved_by_innovation_id is not null))
);
create index problem_boards_kel on public.problem_boards(kelurahan_id, status);

-- ---------- Pengajuan inovasi (tabel induk) ----------
create function app.gen_kode() returns text language sql volatile set search_path = '' as $$
  select 'KL-' || to_char(now(), 'YYMM') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

create table public.innovations (
  id uuid primary key default gen_random_uuid(),
  kode_unik text not null unique default app.gen_kode(),
  leader_user_id uuid not null references public.users(id),
  kelurahan_target_id uuid not null references public.master_kelurahan(id),
  problem_board_id uuid references public.problem_boards(id),
  judul text not null default '' check (char_length(judul) <= 160),
  tipe_inovasi public.innovation_type not null default 'PROGRAM',
  skala_plafon public.plafon_scale generated always as (
    case when tipe_inovasi in ('PROGRAM', 'PRODUK') then 'KECIL_5JT'::public.plafon_scale else 'TERAPAN_15JT'::public.plafon_scale end
  ) stored,
  ringkasan text not null default '' check (char_length(ringkasan) <= 1000),
  masalah text not null default '' check (char_length(masalah) <= 2000),
  tujuan text not null default '' check (char_length(tujuan) <= 1000),
  target_pengguna text not null default '' check (char_length(target_pengguna) <= 300),
  target_rt_rw text not null default '' check (char_length(target_rt_rw) <= 200),
  total_rab bigint not null default 0 check (total_rab >= 0),
  rab_tak_terduga bigint not null default 0 check (rab_tak_terduga >= 0),
  rab_honor bigint not null default 0 check (rab_honor >= 0),
  rencana_perawatan_bulan int check (rencana_perawatan_bulan is null or rencana_perawatan_bulan between 1 and 60),
  prd_url text, rab_url text, surat_keaslian_url text, surat_kesepakatan_url text,
  status public.innovation_status not null default 'DRAFT',
  status_changed_at timestamptz not null default now(),
  submitted_at timestamptz,
  revisi_ke int not null default 0,
  catatan_pemeriksaan text,
  diperiksa_oleh uuid references public.users(id),
  diperiksa_pada timestamptz,
  anggaran_terkunci_at timestamptz,
  rka_referensi text,
  dispute_flag boolean not null default false,
  dispute_reason text,
  status_sebelum_sengketa public.innovation_status,
  reimburse_nominal bigint,
  banding_final boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (rab_tak_terduga + rab_honor <= total_rab or total_rab = 0)
);
create index innovations_leader on public.innovations(leader_user_id);
create index innovations_kel_status on public.innovations(kelurahan_target_id, status);
create index innovations_status on public.innovations(status);
alter table public.problem_boards add constraint problem_boards_solved_by_fk
  foreign key (solved_by_innovation_id) references public.innovations(id);

create table public.innovation_members (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  nama_anggota text not null check (char_length(btrim(nama_anggota)) between 2 and 100),
  peran_dalam_tim text not null default '' check (char_length(peran_dalam_tim) <= 100),
  institusi_asal text not null default '' check (char_length(institusi_asal) <= 120),
  kota_domisili text not null default '' check (char_length(kota_domisili) <= 80),
  jenjang_pendidikan public.education_level not null,
  is_ketua boolean not null default false,
  urutan int not null default 0,
  constraint jenjang_min_sma check (jenjang_pendidikan <> 'SMP_KE_BAWAH')
);
create index innovation_members_inv on public.innovation_members(innovation_id);
create unique index innovation_members_one_ketua on public.innovation_members(innovation_id) where is_ketua;

-- ---------- Logbook & dana (pencairan 30-30-40, logbook, serah terima) ----------
create table public.logbooks_and_funds (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  jenis public.record_kind not null,
  tahap public.fund_stage,
  nominal_cair bigint check (nominal_cair is null or nominal_cair > 0),
  bukti_transfer_url text,
  deskripsi_progres text check (deskripsi_progres is null or char_length(deskripsi_progres) <= 2000),
  nominal_belanja bigint check (nominal_belanja is null or nominal_belanja >= 0),
  tanggal_kegiatan date,
  nota_belanja_url text,
  foto_progres_url text,
  bast_url text, panduan_url text, lpj_akhir_url text,
  catatan_validasi text,
  verified_by_lurah_at timestamptz,
  verified_by uuid references public.users(id),
  dicatat_oleh uuid references public.users(id),
  created_at timestamptz not null default now(),
  check (jenis <> 'PENCAIRAN' or (tahap is not null and nominal_cair is not null and bukti_transfer_url is not null)),
  check (jenis <> 'LOGBOOK' or (deskripsi_progres is not null and char_length(btrim(deskripsi_progres)) >= 5)),
  check (jenis <> 'SERAH_TERIMA' or (bast_url is not null and panduan_url is not null and lpj_akhir_url is not null))
);
create unique index funds_one_per_stage on public.logbooks_and_funds(innovation_id, tahap) where jenis = 'PENCAIRAN';
create unique index funds_one_handover on public.logbooks_and_funds(innovation_id) where jenis = 'SERAH_TERIMA';
create index funds_inv on public.logbooks_and_funds(innovation_id, jenis);

-- ---------- Uji warga (satu baris per ronde) ----------
create table public.testing_integrations (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  ronde int not null default 1,
  status text not null default 'AKTIF' check (status in ('AKTIF', 'SELESAI')),
  test_start_date timestamptz not null default now(),
  test_end_date timestamptz not null,
  is_extended boolean not null default false,
  survey_pertanyaan jsonb not null default '[]'::jsonb,
  total_valid_respondents int,
  avg_rating numeric(3, 2),
  helpful_percentage numeric(5, 2),
  photo_valid_percentage numeric(5, 2),
  is_eligible_standard boolean,
  lurah_decision public.lurah_decision,
  keputusan_catatan text,
  diputuskan_oleh uuid references public.users(id),
  diputuskan_pada timestamptz,
  data_anonymized_at timestamptz,
  unique (innovation_id, ronde)
);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  testing_id uuid not null references public.testing_integrations(id) on delete cascade,
  nama text not null check (char_length(btrim(nama)) between 1 and 100),
  usia int not null check (usia between 5 and 110),
  tempat_tinggal text not null check (char_length(btrim(tempat_tinggal)) between 3 and 200),
  kecamatan text not null,
  kelurahan text not null,
  rt int not null check (rt between 1 and 999),
  rw int not null check (rw between 1 and 999),
  foto_url text,
  has_foto boolean not null default false,
  rating int not null check (rating between 1 and 5),
  membantu boolean not null,
  jawaban_kontekstual jsonb not null default '{}'::jsonb,
  komentar text check (komentar is null or char_length(komentar) <= 600),
  dedupe_key text not null,
  ip_hash text not null,
  dibuat_pada timestamptz not null default now(),
  unique (testing_id, dedupe_key)
);
create index survey_responses_testing on public.survey_responses(testing_id);
create index survey_responses_ip on public.survey_responses(innovation_id, ip_hash, dibuat_pada);

-- ---------- Rapor Bukti Inovasi ----------
create table public.evidence_passports (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null unique references public.innovations(id),
  passport_code text not null unique,
  data_snapshot_json jsonb not null,
  sha256_hash text not null,
  published_at timestamptz not null default now(),
  pilot_interest_count int not null default 0
);

create table public.pilot_interests (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  nama text not null check (char_length(btrim(nama)) between 2 and 100),
  instansi text not null check (char_length(btrim(instansi)) between 2 and 120),
  kontak text not null check (char_length(btrim(kontak)) between 5 and 120),
  pesan text check (pesan is null or char_length(pesan) <= 500),
  ip_hash text not null,
  dibuat_pada timestamptz not null default now()
);
create index pilot_interests_inv on public.pilot_interests(innovation_id);

-- ---------- Banding, sengketa, blacklist ----------
create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  alasan text not null check (char_length(btrim(alasan)) >= 20),
  lampiran_url text,
  diajukan_oleh uuid not null references public.users(id),
  diajukan_pada timestamptz not null default now(),
  putusan text check (putusan in ('KABULKAN', 'TOLAK')),
  catatan_putusan text,
  diputuskan_oleh uuid references public.users(id),
  diputuskan_pada timestamptz
);
create unique index appeals_one_per_innovation on public.appeals(innovation_id);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  pelapor_id uuid not null references public.users(id),
  pelapor_role public.app_role not null,
  alasan text not null check (char_length(btrim(alasan)) >= 20),
  status text not null default 'TERBUKA' check (status in ('TERBUKA', 'SELESAI')),
  resolusi text check (resolusi in ('LANJUTKAN', 'CANCELLED_BY_KELURAHAN', 'TERMINATED_BLACKLISTED')),
  catatan_brida text,
  diputuskan_oleh uuid references public.users(id),
  diputuskan_pada timestamptz,
  dibuat_pada timestamptz not null default now()
);
create unique index disputes_one_open on public.disputes(innovation_id) where status = 'TERBUKA';

create table public.blacklist (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  nama_norm text generated always as (lower(btrim(nama))) stored,
  user_id uuid references public.users(id),
  innovation_id uuid references public.innovations(id),
  alasan text not null,
  dicatat_oleh uuid not null references public.users(id),
  dicatat_pada timestamptz not null default now(),
  dihapus_pada timestamptz,
  alasan_hapus text
);
create index blacklist_nama on public.blacklist(nama_norm) where dihapus_pada is null;

-- ---------- Notifikasi & audit ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  untuk_user_id uuid not null references public.users(id) on delete cascade,
  untuk_role public.app_role,
  tipe text not null,
  pesan text not null,
  ref_id uuid,
  tautan text,
  dibaca boolean not null default false,
  dibuat_pada timestamptz not null default now()
);
create index notifications_user on public.notifications(untuk_user_id, dibaca, dibuat_pada desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  aktor_id uuid,
  aksi text not null,
  target text,
  detail_json jsonb not null default '{}'::jsonb,
  waktu timestamptz not null default now()
);
create index audit_logs_waktu on public.audit_logs(waktu desc);
create index audit_logs_aksi on public.audit_logs(aksi);

-- ---------- Tabel transisi state machine (Bab 8.1) ----------
create table public.innovation_transitions (
  from_status public.innovation_status not null,
  to_status public.innovation_status not null,
  actor text not null check (actor in ('INNOVATOR', 'KELURAHAN', 'BRIDA_ADMIN', 'SYSTEM')),
  primary key (from_status, to_status, actor)
);
-- =====================================================================
-- B. Fungsi bantu, trigger, RLS, grant, storage
-- =====================================================================

-- ---------- Fungsi bantu (schema app; tidak diekspos lewat API) ----------
create function app.is_brida() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users u
    where u.id = auth.uid() and u.role = 'BRIDA_ADMIN' and u.status = 'AKTIF' and not u.is_blacklisted);
$$;

create function app.is_active_innovator() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users u
    where u.id = auth.uid() and u.role = 'INNOVATOR' and u.status = 'AKTIF' and not u.is_blacklisted);
$$;

-- Akun Kelurahan hanya berwenang bila punya mandat aktif untuk kelurahan itu DAN akun berstatus AKTIF.
create function app.is_mandated(p_kel uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.kelurahan_mandates m
    join public.users u on u.id = m.user_id
    where m.user_id = auth.uid() and m.kelurahan_id = p_kel and m.dicabut_pada is null
      and u.role = 'KELURAHAN' and u.status = 'AKTIF' and not u.is_blacklisted);
$$;

create function app.kelurahan_has_mandate(p_kel uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.kelurahan_mandates m
    join public.users u on u.id = m.user_id
    where m.kelurahan_id = p_kel and m.dicabut_pada is null
      and u.role = 'KELURAHAN' and u.status = 'AKTIF' and not u.is_blacklisted);
$$;

create function app.innovation_kelurahan(p_id uuid) returns uuid language sql stable security definer set search_path = '' as $$
  select kelurahan_target_id from public.innovations where id = p_id;
$$;

create function app.is_leader(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.innovations i where i.id = p_id and i.leader_user_id = auth.uid());
$$;

create function app.can_read_innovation(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.innovations i where i.id = p_id and (
    i.leader_user_id = auth.uid()
    or app.is_brida()
    or (i.status <> 'DRAFT' and app.is_mandated(i.kelurahan_target_id))));
$$;

create function app.can_edit_innovation(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select app.is_active_innovator() and exists (select 1 from public.innovations i
    where i.id = p_id and i.leader_user_id = auth.uid() and i.status in ('DRAFT', 'REVISION_REQUESTED'));
$$;

create function app.path_innovation_id(p_name text) returns uuid language sql immutable set search_path = '' as $$
  select case
    when p_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' then split_part(p_name, '/', 1)::uuid
    when p_name ~ '^survey/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' then split_part(p_name, '/', 2)::uuid
  end;
$$;

create function app.param_num(p_key text) returns numeric language sql stable security definer set search_path = '' as $$
  select (value #>> '{}')::numeric from public.system_parameters where key = p_key;
$$;

create function app.param_bool(p_key text) returns boolean language sql stable security definer set search_path = '' as $$
  select (value #>> '{}')::boolean from public.system_parameters where key = p_key;
$$;

create function app.initials(p_name text) returns text language sql immutable set search_path = '' as $$
  select coalesce(nullif(string_agg(upper(left(w, 1)) || '.', ' '), ''), '?')
  from regexp_split_to_table(btrim(coalesce(p_name, '')), '\s+') as w where w <> '';
$$;

-- Audit & notifikasi (selalu dipanggil dari fungsi security definer)
create function app.audit(p_aksi text, p_target text, p_detail jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_logs (aktor_id, aksi, target, detail_json) values (auth.uid(), p_aksi, p_target, coalesce(p_detail, '{}'::jsonb));
$$;

create function app.notify(p_user uuid, p_tipe text, p_pesan text, p_ref uuid default null, p_tautan text default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (untuk_user_id, untuk_role, tipe, pesan, ref_id, tautan)
  select u.id, u.role, p_tipe, p_pesan, p_ref, p_tautan from public.users u where u.id = p_user;
$$;

create function app.notify_brida(p_tipe text, p_pesan text, p_ref uuid default null, p_tautan text default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (untuk_user_id, untuk_role, tipe, pesan, ref_id, tautan)
  select u.id, 'BRIDA_ADMIN', p_tipe, p_pesan, p_ref, p_tautan
  from public.users u where u.role = 'BRIDA_ADMIN' and u.status = 'AKTIF' and not u.is_blacklisted;
$$;

create function app.notify_kelurahan(p_kel uuid, p_tipe text, p_pesan text, p_ref uuid default null, p_tautan text default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (untuk_user_id, untuk_role, tipe, pesan, ref_id, tautan)
  select u.id, 'KELURAHAN', p_tipe, p_pesan, p_ref, p_tautan
  from public.kelurahan_mandates m join public.users u on u.id = m.user_id
  where m.kelurahan_id = p_kel and m.dicabut_pada is null and u.status = 'AKTIF';
$$;

create function app.kel_label(p_kel uuid) returns text language sql stable security definer set search_path = '' as $$
  select 'Kelurahan ' || kelurahan || ' (Kec. ' || kecamatan || ')' from public.master_kelurahan where id = p_kel;
$$;

-- ---------- Trigger: akun baru di auth.users -> public.users ----------
-- Role BRIDA_ADMIN TIDAK PERNAH diambil dari metadata pendaftaran.
-- Role KELURAHAN hanya memberi status MENUNGGU_MANDAT, tanpa wewenang apa pun.
create function app.on_auth_user_created() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.app_role := 'INNOVATOR';
  v_status public.account_status := 'AKTIF';
  v_kel uuid;
  v_name text := left(btrim(coalesce(m->>'display_name', m->>'name', '')), 100);
  v_phone text := regexp_replace(coalesce(m->>'phone_wa', ''), '[^0-9+]', '', 'g');
  v_nip text := btrim(coalesce(m->>'nip', ''));
begin
  if v_phone !~ '^[0-9+]{8,16}$' then v_phone := null; end if;
  if m->>'role' = 'KELURAHAN' and v_nip ~ '^[0-9 ]{8,24}$' and (m->>'kelurahan_id') ~ '^[0-9a-f-]{36}$' then
    v_kel := (m->>'kelurahan_id')::uuid;
    if exists (select 1 from public.master_kelurahan where id = v_kel) then
      v_role := 'KELURAHAN'; v_status := 'MENUNGGU_MANDAT';
    else
      v_kel := null;
    end if;
  end if;
  insert into public.users (id, name, email, role, phone_wa, institusi, kota_domisili, nip, jabatan, kelurahan_id, status)
  values (new.id, v_name, coalesce(new.email, ''), v_role, v_phone,
          nullif(left(btrim(coalesce(m->>'institusi', '')), 120), ''),
          nullif(left(btrim(coalesce(m->>'kota_domisili', '')), 80), ''),
          case when v_role = 'KELURAHAN' then v_nip end,
          case when v_role = 'KELURAHAN' then nullif(left(btrim(coalesce(m->>'jabatan', '')), 120), '') end,
          v_kel, v_status);
  if v_role = 'KELURAHAN' then
    insert into public.kelurahan_profiles (user_id, kelurahan_id, nama_lurah, nip_lurah, jabatan, kontak_wa_resmi)
    values (new.id, v_kel, v_name, v_nip, nullif(left(btrim(coalesce(m->>'jabatan', '')), 120), ''), v_phone);
    perform app.notify_brida('MANDAT_BARU',
      'Pendaftar Kelurahan baru menunggu verifikasi: ' || v_name || ' — ' || app.kel_label(v_kel) || '.', new.id, '/admin/mandat');
  end if;
  return new;
end $$;

create trigger kampunglab_rev4_new_user after insert on auth.users
  for each row execute function app.on_auth_user_created();

-- ---------- Trigger: jaga updated_at ----------
create function app.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger users_touch before update on public.users for each row execute function app.touch_updated_at();
create trigger innovations_touch before update on public.innovations for each row execute function app.touch_updated_at();

-- ---------- Trigger: state machine pengajuan ----------
-- Status hanya boleh berubah lewat app.set_status (flag app.workflow='on') dan harus ada di tabel transisi
-- untuk aktor yang tercatat. Ini berlaku juga bila ada kode yang lupa memeriksa di sisi aplikasi.
create function app.guard_innovation_status() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if coalesce(current_setting('app.workflow', true), 'off') <> 'on' then
      raise exception 'Status pengajuan hanya dapat diubah melalui alur resmi.' using errcode = 'P0001';
    end if;
    if not exists (select 1 from public.innovation_transitions t
        where t.from_status = old.status and t.to_status = new.status
          and t.actor = coalesce(current_setting('app.actor', true), '')) then
      raise exception 'Perubahan status % ke % tidak diizinkan untuk aktor %.', old.status, new.status, coalesce(current_setting('app.actor', true), '-') using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger innovations_guard_status before update on public.innovations
  for each row execute function app.guard_innovation_status();

create function app.guard_problem_board() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('app.workflow', true), 'off') <> 'on' and (
       new.status is distinct from old.status
       or new.solved_by_innovation_id is distinct from old.solved_by_innovation_id
       or new.kelurahan_id is distinct from old.kelurahan_id
       or new.dibuat_oleh is distinct from old.dibuat_oleh) then
    raise exception 'Status SOLVED hanya diatur otomatis saat inovasi terkait terbit.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger problem_boards_guard before update on public.problem_boards
  for each row execute function app.guard_problem_board();

create function app.guard_member_limit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.innovation_members where innovation_id = new.innovation_id) >= 6 then
    raise exception 'Tim maksimal 6 orang.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger innovation_members_limit before insert on public.innovation_members
  for each row execute function app.guard_member_limit();

-- Pelajar SMP/SD ke bawah ditolak sampai tingkat tabel (constraint jenjang_min_sma) dan pesan ramah:
create function app.guard_member_level() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.jenjang_pendidikan = 'SMP_KE_BAWAH' then
    raise exception 'Pelajar SMP/SD ke bawah tidak dapat menjadi anggota tim (minimal SMA/SMK).' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger innovation_members_level before insert or update on public.innovation_members
  for each row execute function app.guard_member_level();

-- Bukti transfer, nota, dan dokumen hanya boleh menunjuk berkas milik pengajuan yang sama.
create function app.path_ok(p_path text, p_innovation uuid, p_kind text default null) returns boolean language sql immutable set search_path = '' as $$
  select p_path is not null and p_path like p_innovation::text || '/%' and p_path !~ '\.\.' and char_length(p_path) <= 300
    and (p_kind is null or split_part(p_path, '/', 2) = p_kind);
$$;

-- ---------- RLS ----------
alter table public.master_kelurahan enable row level security;
alter table public.users enable row level security;
alter table public.kelurahan_profiles enable row level security;
alter table public.kelurahan_mandates enable row level security;
alter table public.system_parameters enable row level security;
alter table public.problem_boards enable row level security;
alter table public.innovations enable row level security;
alter table public.innovation_members enable row level security;
alter table public.logbooks_and_funds enable row level security;
alter table public.testing_integrations enable row level security;
alter table public.survey_responses enable row level security;
alter table public.evidence_passports enable row level security;
alter table public.pilot_interests enable row level security;
alter table public.appeals enable row level security;
alter table public.disputes enable row level security;
alter table public.blacklist enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.innovation_transitions enable row level security;

create policy master_kelurahan_read on public.master_kelurahan for select to anon, authenticated using (true);
create policy system_parameters_read on public.system_parameters for select to anon, authenticated using (true);

create policy users_self_read on public.users for select to authenticated using (id = auth.uid());
create policy users_brida_read on public.users for select to authenticated using (app.is_brida());
create policy users_leader_for_kelurahan on public.users for select to authenticated using (
  exists (select 1 from public.innovations i
    where i.leader_user_id = users.id and i.status <> 'DRAFT' and app.is_mandated(i.kelurahan_target_id)));
create policy users_self_update on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy kelurahan_profiles_read on public.kelurahan_profiles for select to authenticated using (user_id = auth.uid() or app.is_brida());
create policy kelurahan_mandates_read on public.kelurahan_mandates for select to authenticated using (user_id = auth.uid() or app.is_brida());

create policy problem_boards_public_read on public.problem_boards for select to anon, authenticated using (true);
create policy problem_boards_insert on public.problem_boards for insert to authenticated
  with check (app.is_mandated(kelurahan_id) and dibuat_oleh = auth.uid() and status = 'OPEN' and solved_by_innovation_id is null);
create policy problem_boards_update on public.problem_boards for update to authenticated
  using (app.is_mandated(kelurahan_id) and status = 'OPEN') with check (app.is_mandated(kelurahan_id) and status = 'OPEN');
create policy problem_boards_delete on public.problem_boards for delete to authenticated
  using (app.is_mandated(kelurahan_id) and status = 'OPEN');

create policy innovations_read on public.innovations for select to authenticated using (
  leader_user_id = auth.uid() or app.is_brida() or (status <> 'DRAFT' and app.is_mandated(kelurahan_target_id)));
create policy innovations_insert on public.innovations for insert to authenticated
  with check (leader_user_id = auth.uid() and status = 'DRAFT' and app.is_active_innovator());
create policy innovations_update on public.innovations for update to authenticated
  using (leader_user_id = auth.uid() and status in ('DRAFT', 'REVISION_REQUESTED') and app.is_active_innovator())
  with check (leader_user_id = auth.uid() and status in ('DRAFT', 'REVISION_REQUESTED'));
create policy innovations_delete on public.innovations for delete to authenticated
  using (leader_user_id = auth.uid() and status = 'DRAFT');

create policy members_read on public.innovation_members for select to authenticated using (app.can_read_innovation(innovation_id));
create policy members_insert on public.innovation_members for insert to authenticated with check (app.can_edit_innovation(innovation_id));
create policy members_update on public.innovation_members for update to authenticated
  using (app.can_edit_innovation(innovation_id)) with check (app.can_edit_innovation(innovation_id));
create policy members_delete on public.innovation_members for delete to authenticated using (app.can_edit_innovation(innovation_id));

create policy funds_read on public.logbooks_and_funds for select to authenticated using (app.can_read_innovation(innovation_id));
create policy testing_read on public.testing_integrations for select to authenticated using (app.can_read_innovation(innovation_id));
-- Data penguji lengkap (nama, tempat tinggal, foto) hanya untuk Kelurahan bermandat dan Admin BRIDA.
-- Inovator dan publik membaca ringkasan tersamarkan lewat get_survey_summary().
create policy survey_responses_read on public.survey_responses for select to authenticated using (
  app.is_brida() or app.is_mandated(app.innovation_kelurahan(innovation_id)));
create policy passports_public_read on public.evidence_passports for select to anon, authenticated using (true);
create policy pilot_interests_read on public.pilot_interests for select to authenticated using (app.can_read_innovation(innovation_id));
create policy appeals_read on public.appeals for select to authenticated using (app.can_read_innovation(innovation_id));
create policy disputes_read on public.disputes for select to authenticated using (app.can_read_innovation(innovation_id));
create policy blacklist_read on public.blacklist for select to authenticated using (app.is_brida());
create policy notifications_own_read on public.notifications for select to authenticated using (untuk_user_id = auth.uid());
create policy audit_logs_brida_read on public.audit_logs for select to authenticated using (app.is_brida());

-- ---------- Grant eksplisit (tidak bergantung pada default privilege) ----------
revoke all on public.master_kelurahan, public.users, public.kelurahan_profiles, public.kelurahan_mandates,
  public.system_parameters, public.problem_boards, public.innovations, public.innovation_members,
  public.logbooks_and_funds, public.testing_integrations, public.survey_responses, public.evidence_passports,
  public.pilot_interests, public.appeals, public.disputes, public.blacklist, public.notifications,
  public.audit_logs, public.innovation_transitions from anon, authenticated;

grant select on public.master_kelurahan, public.system_parameters, public.problem_boards, public.evidence_passports to anon;
grant select on public.master_kelurahan, public.users, public.kelurahan_profiles, public.kelurahan_mandates,
  public.system_parameters, public.problem_boards, public.innovations, public.innovation_members,
  public.logbooks_and_funds, public.testing_integrations, public.survey_responses, public.evidence_passports,
  public.pilot_interests, public.appeals, public.disputes, public.blacklist, public.notifications,
  public.audit_logs to authenticated;

-- Penulisan langsung hanya untuk kolom yang memang boleh diubah pengguna.
grant update (name, phone_wa, institusi, kota_domisili) on public.users to authenticated;
grant insert (kelurahan_id, dibuat_oleh, judul_masalah, kategori_tema, deskripsi, deskripsi_lokasi_rt_rw, kontak_wa_narahubung)
  on public.problem_boards to authenticated;
grant update (judul_masalah, kategori_tema, deskripsi, deskripsi_lokasi_rt_rw, kontak_wa_narahubung) on public.problem_boards to authenticated;
grant delete on public.problem_boards to authenticated;
grant insert (leader_user_id, kelurahan_target_id, problem_board_id, judul, tipe_inovasi, ringkasan, masalah, tujuan, target_pengguna,
  target_rt_rw, total_rab, rab_tak_terduga, rab_honor, rencana_perawatan_bulan, prd_url, rab_url, surat_keaslian_url, surat_kesepakatan_url)
  on public.innovations to authenticated;
grant update (kelurahan_target_id, problem_board_id, judul, tipe_inovasi, ringkasan, masalah, tujuan, target_pengguna,
  target_rt_rw, total_rab, rab_tak_terduga, rab_honor, rencana_perawatan_bulan, prd_url, rab_url, surat_keaslian_url, surat_kesepakatan_url)
  on public.innovations to authenticated;
grant delete on public.innovations to authenticated;
grant insert (innovation_id, nama_anggota, peran_dalam_tim, institusi_asal, kota_domisili, jenjang_pendidikan, is_ketua, urutan)
  on public.innovation_members to authenticated;
grant update (nama_anggota, peran_dalam_tim, institusi_asal, kota_domisili, jenjang_pendidikan, is_ketua, urutan)
  on public.innovation_members to authenticated;
grant delete on public.innovation_members to authenticated;

grant all on public.master_kelurahan, public.users, public.kelurahan_profiles, public.kelurahan_mandates,
  public.system_parameters, public.problem_boards, public.innovations, public.innovation_members,
  public.logbooks_and_funds, public.testing_integrations, public.survey_responses, public.evidence_passports,
  public.pilot_interests, public.appeals, public.disputes, public.blacklist, public.notifications,
  public.audit_logs, public.innovation_transitions to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ---------- Storage: satu bucket privat "berkas" ----------
-- Pola nama objek:  <innovation_id>/<jenis>/<uuid>-<nama>   |   sk/<user_id>/<nama>   |   survey/<innovation_id>/<nama>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('berkas', 'berkas', false, 10485760, array[
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy berkas_read on storage.objects for select to authenticated using (
  bucket_id = 'berkas' and (
    app.is_brida()
    or name like 'sk/' || auth.uid()::text || '/%'
    or (name not like 'survey/%' and app.path_innovation_id(name) is not null and app.can_read_innovation(app.path_innovation_id(name)))
    or (name like 'survey/%' and app.path_innovation_id(name) is not null and app.is_mandated(app.innovation_kelurahan(app.path_innovation_id(name))))
  ));

create policy berkas_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'berkas' and (
    (name like 'sk/' || auth.uid()::text || '/%'
      and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'KELURAHAN'))
    or (app.path_innovation_id(name) is not null and name not like 'survey/%'
      and split_part(name, '/', 2) in ('prd', 'rab', 'keaslian', 'kesepakatan', 'nota', 'foto', 'bast', 'panduan', 'lpj', 'banding')
      and app.is_leader(app.path_innovation_id(name)) and app.is_active_innovator())
    or (app.path_innovation_id(name) is not null and name not like 'survey/%' and split_part(name, '/', 2) = 'transfer'
      and app.is_mandated(app.innovation_kelurahan(app.path_innovation_id(name))))
  ));

create policy berkas_delete on storage.objects for delete to authenticated using (
  bucket_id = 'berkas' and app.path_innovation_id(name) is not null and name not like 'survey/%'
  and split_part(name, '/', 2) in ('prd', 'rab', 'keaslian', 'kesepakatan')
  and app.can_edit_innovation(app.path_innovation_id(name)));
-- =====================================================================
-- C1. Inti alur kerja: set_status, validasi pengajuan, mandat Kelurahan
-- =====================================================================

create function app.rupiah(n numeric) returns text language sql immutable set search_path = '' as $$
  select 'Rp' || replace(to_char(n, 'FM999,999,999,999,999'), ',', '.');
$$;

create function app.begin_workflow(p_actor text) returns void language plpgsql set search_path = '' as $$
begin
  perform set_config('app.workflow', 'on', true);
  perform set_config('app.actor', p_actor, true);
end $$;

create function app.end_workflow() returns void language plpgsql set search_path = '' as $$
begin
  perform set_config('app.workflow', 'off', true);
  perform set_config('app.actor', '', true);
end $$;

-- Satu-satunya jalan mengubah status. Trigger guard memeriksa ulang terhadap tabel transisi.
create function app.set_status(p_id uuid, p_to public.innovation_status, p_actor text, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare v_from public.innovation_status;
begin
  select status into v_from from public.innovations where id = p_id for update;
  if v_from is null then raise exception 'Pengajuan tidak ditemukan.' using errcode = 'P0001'; end if;
  perform app.begin_workflow(p_actor);
  update public.innovations set status = p_to, status_changed_at = now() where id = p_id;
  perform app.end_workflow();
  perform app.audit('STATUS ' || v_from || ' -> ' || p_to, 'innovations/' || p_id,
    jsonb_build_object('aktor_peran', p_actor, 'catatan', p_note));
end $$;

-- ---------- Validasi kelengkapan pengajuan (Bab 3.3, 2.1) ----------
create function app.validate_submission(p_id uuid) returns text[] language plpgsql stable security definer set search_path = '' as $$
declare
  i public.innovations;
  e text[] := '{}';
  v_plafon numeric;
  v_members int; v_ketua int; v_blk text;
  v_min int := app.param_num('tim_min')::int;
  v_max int := app.param_num('tim_maks')::int;
begin
  select * into i from public.innovations where id = p_id;
  if not found then return array['Pengajuan tidak ditemukan.']; end if;
  if char_length(btrim(i.judul)) < 5 then e := e || array['Judul minimal 5 karakter.']::text[]; end if;
  if char_length(btrim(i.ringkasan)) < 20 then e := e || array['Ringkasan inovasi minimal 20 karakter.']::text[]; end if;
  if char_length(btrim(i.masalah)) < 20 then e := e || array['Uraian masalah minimal 20 karakter.']::text[]; end if;
  if char_length(btrim(i.tujuan)) < 20 then e := e || array['Tujuan minimal 20 karakter.']::text[]; end if;
  if char_length(btrim(i.target_pengguna)) < 5 then e := e || array['Target pengguna wajib diisi.']::text[]; end if;
  if char_length(btrim(i.target_rt_rw)) < 2 then e := e || array['Target RT/RW lokasi uji wajib diisi.']::text[]; end if;

  v_plafon := case i.skala_plafon when 'KECIL_5JT' then app.param_num('plafon_kecil') else app.param_num('plafon_terapan') end;
  if i.total_rab <= 0 then
    e := e || array['Total RAB wajib diisi.']::text[];
  elsif i.total_rab > v_plafon then
    e := e || array[('Total RAB ' || app.rupiah(i.total_rab) || ' melebihi plafon ' ||
      case i.skala_plafon when 'KECIL_5JT' then 'Skala Kecil' else 'Skala Terapan' end || ' (' || app.rupiah(v_plafon) || ').')]::text[];
  end if;
  if i.rab_tak_terduga * 100 > i.total_rab * app.param_num('tak_terduga_maks_pct') then
    e := e || array[('Dana tak terduga maksimal ' || app.param_num('tak_terduga_maks_pct')::int || '% dari total RAB.')]::text[];
  end if;
  if i.rab_honor * 100 > i.total_rab * app.param_num('honor_maks_pct') then
    e := e || array[('Honorarium tim maksimal ' || app.param_num('honor_maks_pct')::int || '% dari total RAB.')]::text[];
  end if;
  if i.rencana_perawatan_bulan is null
     or i.rencana_perawatan_bulan < app.param_num('perawatan_min_bulan')
     or i.rencana_perawatan_bulan > app.param_num('perawatan_maks_bulan') then
    e := e || array[('Rencana perawatan wajib ' || app.param_num('perawatan_min_bulan')::int || '–' || app.param_num('perawatan_maks_bulan')::int || ' bulan.')]::text[];
  end if;

  if not app.path_ok(i.prd_url, i.id, 'prd') then e := e || array['Unggah PRD (dokumen kebutuhan produk).']::text[]; end if;
  if not app.path_ok(i.rab_url, i.id, 'rab') then e := e || array['Unggah RAB terperinci per tahap.']::text[]; end if;
  if not app.path_ok(i.surat_keaslian_url, i.id, 'keaslian') then e := e || array['Unggah Surat Pernyataan Keaslian bermeterai Rp10.000.']::text[]; end if;
  if not app.path_ok(i.surat_kesepakatan_url, i.id, 'kesepakatan') then e := e || array['Unggah scan Surat Kesepakatan Lokasi Uji (TTD RT/RW, Lurah, Ketua Tim).']::text[]; end if;

  select count(*), count(*) filter (where is_ketua) into v_members, v_ketua from public.innovation_members where innovation_id = p_id;
  if v_members < v_min or v_members > v_max then e := e || array[('Tim wajib ' || v_min || '–' || v_max || ' orang (saat ini ' || v_members || ').')]::text[]; end if;
  if v_ketua <> 1 then e := e || array['Tentukan tepat satu ketua tim.']::text[]; end if;

  select string_agg(distinct m.nama_anggota, ', ') into v_blk
  from public.innovation_members m join public.blacklist b on b.nama_norm = lower(btrim(m.nama_anggota)) and b.dihapus_pada is null
  where m.innovation_id = p_id;
  if v_blk is not null then e := e || array[('Nama tercantum dalam daftar hitam program: ' || v_blk || '.')]::text[]; end if;

  if i.problem_board_id is not null and not exists (
      select 1 from public.problem_boards pb where pb.id = i.problem_board_id and pb.kelurahan_id = i.kelurahan_target_id and pb.status = 'OPEN') then
    e := e || array['Masalah yang dipilih harus berstatus OPEN dan berasal dari kelurahan yang sama.']::text[];
  end if;
  return e;
end $$;

-- ---------- Mandat Kelurahan (Bab 3.2) ----------
-- p_action: BERI | TOLAK | PERBAIKI
create function public.brida_decide_mandate(p_user uuid, p_action text, p_tipe public.mandate_type default null, p_alasan text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  u public.users; v_tipe public.mandate_type; v_mandate uuid; r record; v_pindah int := 0; v_me uuid := auth.uid();
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA yang dapat menetapkan mandat.' using errcode = '42501'; end if;
  select * into u from public.users where id = p_user and role = 'KELURAHAN' for update;
  if not found then raise exception 'Akun Kelurahan tidak ditemukan.' using errcode = 'P0001'; end if;
  if p_action not in ('BERI', 'TOLAK', 'PERBAIKI') then raise exception 'Tindakan tidak dikenal.' using errcode = 'P0001'; end if;
  if u.status <> 'MENUNGGU_MANDAT' then raise exception 'Akun ini tidak sedang menunggu mandat (status %).', u.status using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext(u.kelurahan_id::text));

  if p_action = 'BERI' then
    if u.sk_document_url is null then raise exception 'SK/surat tugas belum diunggah. Gunakan "Minta Perbaikan".' using errcode = 'P0001'; end if;
    if p_tipe is null then
      v_tipe := case when exists (select 1 from public.kelurahan_mandates m where m.kelurahan_id = u.kelurahan_id and m.tipe = 'UTAMA' and m.dicabut_pada is null)
                     then 'CADANGAN'::public.mandate_type else 'UTAMA'::public.mandate_type end;
    else
      v_tipe := p_tipe;
    end if;
    if exists (select 1 from public.kelurahan_mandates m where m.kelurahan_id = u.kelurahan_id and m.tipe = v_tipe and m.dicabut_pada is null) then
      raise exception 'Kelurahan ini sudah punya akun % aktif. Maksimal 2 akun bermandat (1 utama, 1 cadangan). Cabut mandat lama lebih dulu.', v_tipe using errcode = 'P0001';
    end if;
    insert into public.kelurahan_mandates (user_id, kelurahan_id, tipe, diberikan_oleh)
      values (u.id, u.kelurahan_id, v_tipe, v_me) returning id into v_mandate;
    update public.users set status = 'AKTIF', is_verified = true, perlu_perbaikan = false, catatan_verifikasi = null where id = u.id;
    for r in select id, leader_user_id, judul from public.innovations
             where kelurahan_target_id = u.kelurahan_id and status = 'WAITING_KELURAHAN_MANDATE' order by status_changed_at for update loop
      perform app.set_status(r.id, 'SUBMITTED_TO_KELURAHAN', 'SYSTEM', 'Mandat Kelurahan diberikan');
      perform app.notify(r.leader_user_id, 'PENGAJUAN_DITERUSKAN',
        'Kelurahan sudah memiliki akun bermandat. Pengajuan "' || r.judul || '" kini menunggu pemeriksaan berkas.', r.id, '/dashboard/pengajuan/' || r.id);
      v_pindah := v_pindah + 1;
    end loop;
    perform app.notify(u.id, 'MANDAT_DIBERIKAN',
      'Mandat ' || v_tipe || ' untuk ' || app.kel_label(u.kelurahan_id) || ' telah diberikan. Dashboard Kelurahan kini terbuka.' ||
      case when v_pindah > 0 then ' ' || v_pindah || ' pengajuan menunggu diperiksa.' else '' end, v_mandate, '/kelurahan');
    perform app.audit('MANDAT DIBERIKAN', 'users/' || u.id,
      jsonb_build_object('kelurahan_id', u.kelurahan_id, 'tipe', v_tipe, 'pengajuan_dilanjutkan', v_pindah));
    return jsonb_build_object('tipe', v_tipe, 'pengajuan_dilanjutkan', v_pindah);

  elsif p_action = 'TOLAK' then
    if char_length(btrim(coalesce(p_alasan, ''))) < 10 then raise exception 'Alasan penolakan minimal 10 karakter.' using errcode = 'P0001'; end if;
    update public.users set status = 'DITOLAK', catatan_verifikasi = btrim(p_alasan), perlu_perbaikan = false where id = u.id;
    perform app.notify(u.id, 'MANDAT_DITOLAK', 'Pendaftaran akun Kelurahan ditolak: ' || btrim(p_alasan), u.id, '/menunggu-verifikasi');
    perform app.audit('MANDAT DITOLAK', 'users/' || u.id, jsonb_build_object('alasan', btrim(p_alasan)));
    return jsonb_build_object('status', 'DITOLAK');

  else
    if char_length(btrim(coalesce(p_alasan, ''))) < 10 then raise exception 'Catatan perbaikan minimal 10 karakter.' using errcode = 'P0001'; end if;
    update public.users set perlu_perbaikan = true, catatan_verifikasi = btrim(p_alasan) where id = u.id;
    perform app.notify(u.id, 'MANDAT_PERBAIKAN', 'Data pendaftaran perlu diperbaiki: ' || btrim(p_alasan), u.id, '/menunggu-verifikasi');
    perform app.audit('MANDAT MINTA PERBAIKAN', 'users/' || u.id, jsonb_build_object('catatan', btrim(p_alasan)));
    return jsonb_build_object('status', 'PERBAIKAN');
  end if;
end $$;

create function public.brida_revoke_mandate(p_mandate uuid, p_alasan text) returns void
language plpgsql security definer set search_path = '' as $$
declare m public.kelurahan_mandates; r record; v_n int := 0;
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA yang dapat mencabut mandat.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_alasan, ''))) < 5 then raise exception 'Alasan pencabutan wajib diisi (minimal 5 karakter).' using errcode = 'P0001'; end if;
  select * into m from public.kelurahan_mandates where id = p_mandate and dicabut_pada is null for update;
  if not found then raise exception 'Mandat tidak ditemukan atau sudah dicabut.' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext(m.kelurahan_id::text));
  update public.kelurahan_mandates set dicabut_pada = now(), dicabut_oleh = auth.uid(), alasan_cabut = btrim(p_alasan) where id = m.id;
  update public.users set status = 'MENUNGGU_MANDAT', is_verified = false, catatan_verifikasi = 'Mandat dicabut: ' || btrim(p_alasan) where id = m.user_id;
  perform app.notify(m.user_id, 'MANDAT_DICABUT', 'Mandat Anda dicabut oleh Admin BRIDA. Alasan: ' || btrim(p_alasan), m.id, '/menunggu-verifikasi');
  perform app.audit('MANDAT DICABUT', 'kelurahan_mandates/' || m.id, jsonb_build_object('alasan', btrim(p_alasan), 'user_id', m.user_id, 'kelurahan_id', m.kelurahan_id));
  if not app.kelurahan_has_mandate(m.kelurahan_id) then
    for r in select id, leader_user_id, judul from public.innovations
             where kelurahan_target_id = m.kelurahan_id and status = 'SUBMITTED_TO_KELURAHAN' for update loop
      perform app.set_status(r.id, 'WAITING_KELURAHAN_MANDATE', 'SYSTEM', 'Kelurahan tidak lagi punya akun bermandat');
      perform app.notify(r.leader_user_id, 'MENUNGGU_MANDAT',
        'Menunggu BRIDA menunjuk admin kelurahan untuk pengajuan "' || r.judul || '".', r.id, '/dashboard/pengajuan/' || r.id);
      v_n := v_n + 1;
    end loop;
    select count(*) into v_n from public.innovations where kelurahan_target_id = m.kelurahan_id and status = 'WAITING_KELURAHAN_MANDATE';
    perform app.notify_brida('KELURAHAN_TANPA_MANDAT',
      app.kel_label(m.kelurahan_id) || ' kembali tanpa akun bermandat setelah mandat dicabut, ada ' || v_n || ' pengajuan menunggu.', m.kelurahan_id, '/admin');
  end if;
end $$;

-- Kelurahan memperbaiki data pendaftaran (setelah diminta BRIDA) atau mengunggah SK yang belum ada.
create function public.kelurahan_resubmit_registration(p_sk_path text default null, p_phone text default null, p_nip text default null, p_jabatan text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare u public.users;
begin
  select * into u from public.users where id = auth.uid() and role = 'KELURAHAN' for update;
  if not found then raise exception 'Hanya akun Kelurahan yang dapat memperbaiki pendaftaran.' using errcode = '42501'; end if;
  if u.status <> 'MENUNGGU_MANDAT' then raise exception 'Akun tidak sedang menunggu verifikasi.' using errcode = 'P0001'; end if;
  if p_sk_path is not null and p_sk_path not like 'sk/' || auth.uid()::text || '/%' then raise exception 'Berkas SK tidak valid.' using errcode = 'P0001'; end if;
  if p_phone is not null and regexp_replace(p_phone, '[^0-9+]', '', 'g') !~ '^[0-9+]{8,16}$' then raise exception 'Nomor WA tidak valid.' using errcode = 'P0001'; end if;
  if p_nip is not null and btrim(p_nip) !~ '^[0-9 ]{8,24}$' then raise exception 'NIP tidak valid.' using errcode = 'P0001'; end if;
  update public.users set
    sk_document_url = coalesce(p_sk_path, sk_document_url),
    phone_wa = coalesce(nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'), ''), phone_wa),
    nip = coalesce(nullif(btrim(coalesce(p_nip, '')), ''), nip),
    jabatan = coalesce(nullif(btrim(coalesce(p_jabatan, '')), ''), jabatan),
    perlu_perbaikan = false
  where id = u.id;
  update public.kelurahan_profiles set
    nip_lurah = coalesce(nullif(btrim(coalesce(p_nip, '')), ''), nip_lurah),
    jabatan = coalesce(nullif(btrim(coalesce(p_jabatan, '')), ''), jabatan),
    kontak_wa_resmi = coalesce(nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'), ''), kontak_wa_resmi)
  where user_id = u.id;
  perform app.notify_brida('MANDAT_BARU', 'Pendaftar Kelurahan memperbarui data: ' || u.name || ' — ' || app.kel_label(u.kelurahan_id) || '.', u.id, '/admin/mandat');
  perform app.audit('PENDAFTARAN KELURAHAN DIPERBARUI', 'users/' || u.id, '{}'::jsonb);
end $$;
-- =====================================================================
-- C2. Siklus pengajuan: kirim, periksa, banding, transfer, logbook, serah terima
-- =====================================================================

create function public.submit_innovation(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; v_errs text[]; v_to public.innovation_status; v_waiting int;
begin
  if not app.is_active_innovator() then raise exception 'Hanya akun Inovator aktif yang dapat mengirim pengajuan.' using errcode = '42501'; end if;
  select * into i from public.innovations where id = p_id and leader_user_id = auth.uid() for update;
  if not found then raise exception 'Pengajuan tidak ditemukan.' using errcode = 'P0001'; end if;
  if i.status not in ('DRAFT', 'REVISION_REQUESTED') then
    raise exception 'Pengajuan tidak dapat dikirim pada status %.', i.status using errcode = 'P0001';
  end if;
  v_errs := app.validate_submission(p_id);
  if coalesce(array_length(v_errs, 1), 0) > 0 then
    raise exception 'Pengajuan belum lengkap: %', array_to_string(v_errs, ' | ') using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtext(i.kelurahan_target_id::text));
  v_to := case when app.kelurahan_has_mandate(i.kelurahan_target_id)
               then 'SUBMITTED_TO_KELURAHAN'::public.innovation_status else 'WAITING_KELURAHAN_MANDATE'::public.innovation_status end;
  perform app.set_status(p_id, v_to, 'INNOVATOR', 'Pengajuan dikirim');
  update public.innovations set submitted_at = coalesce(submitted_at, now()),
    revisi_ke = revisi_ke + case when i.status = 'REVISION_REQUESTED' then 1 else 0 end where id = p_id;
  if v_to = 'SUBMITTED_TO_KELURAHAN' then
    perform app.notify_kelurahan(i.kelurahan_target_id, 'PENGAJUAN_BARU',
      'Pengajuan "' || i.judul || '" menunggu pemeriksaan berkas.', p_id, '/kelurahan/pengajuan/' || p_id);
  else
    select count(*) into v_waiting from public.innovations where kelurahan_target_id = i.kelurahan_target_id and status = 'WAITING_KELURAHAN_MANDATE';
    perform app.notify_brida('KELURAHAN_TANPA_MANDAT',
      app.kel_label(i.kelurahan_target_id) || ' belum punya akun bermandat, ada ' || v_waiting || ' pengajuan menunggu.',
      i.kelurahan_target_id, '/admin');
  end if;
  return v_to::text;
end $$;

-- Pemeriksaan berkas oleh Kelurahan bermandat: SETUJU | REVISI | TOLAK
create function public.kelurahan_review(p_id uuid, p_decision text, p_catatan text default null, p_rka text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; v_to public.innovation_status; v_note text := nullif(btrim(coalesce(p_catatan, '')), '');
begin
  select * into i from public.innovations where id = p_id for update;
  if not found or not app.is_mandated(i.kelurahan_target_id) then raise exception 'Anda tidak memiliki mandat untuk pengajuan ini.' using errcode = '42501'; end if;
  if i.status <> 'SUBMITTED_TO_KELURAHAN' then raise exception 'Pengajuan tidak sedang menunggu pemeriksaan (status %).', i.status using errcode = 'P0001'; end if;
  if p_decision not in ('SETUJU', 'REVISI', 'TOLAK') then raise exception 'Keputusan tidak dikenal.' using errcode = 'P0001'; end if;
  if p_decision <> 'SETUJU' and char_length(coalesce(v_note, '')) < 10 then raise exception 'Alasan revisi/penolakan wajib diisi (minimal 10 karakter).' using errcode = 'P0001'; end if;
  v_to := case p_decision when 'SETUJU' then 'APPROVED_WAITING_TERM_1' when 'REVISI' then 'REVISION_REQUESTED' else 'REJECTED' end;
  perform app.set_status(p_id, v_to, 'KELURAHAN', v_note);
  update public.innovations set catatan_pemeriksaan = v_note, diperiksa_oleh = auth.uid(), diperiksa_pada = now(),
    anggaran_terkunci_at = case when p_decision = 'SETUJU' then now() end,
    rka_referensi = case when p_decision = 'SETUJU' then nullif(btrim(coalesce(p_rka, '')), '') end
  where id = p_id;
  perform app.notify(i.leader_user_id, 'PEMERIKSAAN_' || p_decision,
    case p_decision
      when 'SETUJU' then 'Pengajuan "' || i.judul || '" disetujui. Anggaran dikunci; menunggu bukti transfer Tahap 1 dari Kelurahan.'
      when 'REVISI' then 'Pengajuan "' || i.judul || '" perlu direvisi: ' || v_note
      else 'Pengajuan "' || i.judul || '" ditolak: ' || v_note || ' Anda dapat mengajukan banding.' end,
    p_id, '/dashboard/pengajuan/' || p_id);
end $$;

-- ---------- Banding ----------
create function public.innovator_appeal(p_id uuid, p_alasan text, p_lampiran text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations;
begin
  select * into i from public.innovations where id = p_id and leader_user_id = auth.uid() for update;
  if not found or not app.is_active_innovator() then raise exception 'Pengajuan tidak ditemukan.' using errcode = 'P0001'; end if;
  if i.status <> 'REJECTED' or i.banding_final then raise exception 'Banding hanya untuk pengajuan yang ditolak dan belum pernah dibanding.' using errcode = 'P0001'; end if;
  if i.diperiksa_pada is not null and now() > i.diperiksa_pada + make_interval(days => app.param_num('banding_maks_hari')::int) then
    raise exception 'Batas waktu banding (% hari sejak keputusan) sudah lewat.', app.param_num('banding_maks_hari')::int using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_alasan, ''))) < 20 then raise exception 'Alasan banding minimal 20 karakter.' using errcode = 'P0001'; end if;
  if p_lampiran is not null and not app.path_ok(p_lampiran, p_id, 'banding') then raise exception 'Lampiran banding tidak valid.' using errcode = 'P0001'; end if;
  insert into public.appeals (innovation_id, alasan, lampiran_url, diajukan_oleh) values (p_id, btrim(p_alasan), p_lampiran, auth.uid());
  perform app.set_status(p_id, 'APPEALED', 'INNOVATOR', 'Banding diajukan');
  perform app.notify_brida('BANDING_BARU', 'Banding baru untuk pengajuan "' || i.judul || '".', p_id, '/admin/pengajuan/' || p_id);
end $$;

create function public.brida_decide_appeal(p_innovation uuid, p_putusan text, p_catatan text) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; v_to public.innovation_status; v_note text := btrim(coalesce(p_catatan, ''));
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA yang dapat memutus banding.' using errcode = '42501'; end if;
  select * into i from public.innovations where id = p_innovation for update;
  if not found or i.status <> 'APPEALED' then raise exception 'Tidak ada banding yang menunggu putusan.' using errcode = 'P0001'; end if;
  if p_putusan not in ('KABULKAN', 'TOLAK') then raise exception 'Putusan tidak dikenal.' using errcode = 'P0001'; end if;
  if char_length(v_note) < 10 then raise exception 'Catatan putusan minimal 10 karakter.' using errcode = 'P0001'; end if;
  if p_putusan = 'KABULKAN' then
    v_to := case when app.kelurahan_has_mandate(i.kelurahan_target_id) then 'SUBMITTED_TO_KELURAHAN' else 'WAITING_KELURAHAN_MANDATE' end;
  else
    v_to := 'REJECTED';
  end if;
  perform app.set_status(p_innovation, v_to, 'BRIDA_ADMIN', 'Putusan banding ' || p_putusan);
  update public.appeals set putusan = p_putusan, catatan_putusan = v_note, diputuskan_oleh = auth.uid(), diputuskan_pada = now() where innovation_id = p_innovation;
  update public.innovations set banding_final = (p_putusan = 'TOLAK') where id = p_innovation;
  perform app.notify(i.leader_user_id, 'BANDING_' || p_putusan,
    case p_putusan when 'KABULKAN' then 'Banding dikabulkan. Pengajuan "' || i.judul || '" diperiksa ulang oleh Kelurahan. ' || v_note
                   else 'Banding ditolak untuk pengajuan "' || i.judul || '". ' || v_note end, p_innovation, '/dashboard/pengajuan/' || p_innovation);
  if v_to = 'SUBMITTED_TO_KELURAHAN' then
    perform app.notify_kelurahan(i.kelurahan_target_id, 'PENGAJUAN_BARU', 'Pengajuan "' || i.judul || '" dikembalikan lewat putusan banding dan menunggu pemeriksaan ulang.', p_innovation, '/kelurahan/pengajuan/' || p_innovation);
  end if;
end $$;

-- ---------- Transfer dana 30-30-40 (hanya pencatatan bukti; uang tidak melalui aplikasi) ----------
create function public.record_transfer(p_id uuid, p_tahap public.fund_stage, p_nominal bigint, p_bukti_path text, p_catatan text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; v_porsi numeric; v_expected bigint; v_to public.innovation_status;
begin
  select * into i from public.innovations where id = p_id for update;
  if not found or not app.is_mandated(i.kelurahan_target_id) then raise exception 'Anda tidak memiliki mandat untuk pengajuan ini.' using errcode = '42501'; end if;
  v_porsi := case p_tahap when 'TAHAP_1_30' then app.param_num('porsi_tahap_1') when 'TAHAP_2_30' then app.param_num('porsi_tahap_2') else app.param_num('porsi_tahap_3') end;
  v_expected := round(i.total_rab * v_porsi / 100)::bigint;
  if p_nominal is distinct from v_expected then
    raise exception 'Nominal harus % (% persen dari total RAB %).', app.rupiah(v_expected), v_porsi::int, app.rupiah(i.total_rab) using errcode = 'P0001';
  end if;
  if not app.path_ok(p_bukti_path, p_id, 'transfer') then raise exception 'Unggah bukti transfer terlebih dahulu.' using errcode = 'P0001'; end if;

  if p_tahap = 'TAHAP_1_30' then
    if i.status <> 'APPROVED_WAITING_TERM_1' then raise exception 'Tahap 1 hanya dicatat setelah pengajuan disetujui (status %).', i.status using errcode = 'P0001'; end if;
    v_to := 'BUILDING_PHASE';
  elsif p_tahap = 'TAHAP_2_30' then
    if i.status <> 'EVALUATION_TERM_2' or not exists (
        select 1 from public.testing_integrations t where t.innovation_id = p_id and t.lurah_decision = 'LOLOS'
          and t.ronde = (select max(ronde) from public.testing_integrations where innovation_id = p_id)) then
      raise exception 'Tahap 2 hanya dicatat setelah keputusan "Lolos Uji & Lanjut Tahap 2".' using errcode = 'P0001';
    end if;
    v_to := 'REFINEMENT_AND_HANDOVER';
  else
    if i.status <> 'REFINEMENT_AND_HANDOVER' or not exists (
        select 1 from public.logbooks_and_funds f where f.innovation_id = p_id and f.jenis = 'SERAH_TERIMA' and f.verified_by_lurah_at is not null) then
      raise exception 'Tahap 3 hanya dicatat setelah BAST, Panduan Perawatan, dan LPJ 100%% divalidasi Kelurahan.' using errcode = 'P0001';
    end if;
    v_to := 'COMPLETED_PUBLISHED';
  end if;
  insert into public.logbooks_and_funds (innovation_id, jenis, tahap, nominal_cair, bukti_transfer_url, deskripsi_progres, dicatat_oleh)
    values (p_id, 'PENCAIRAN', p_tahap, p_nominal, p_bukti_path, nullif(btrim(coalesce(p_catatan, '')), ''), auth.uid());
  perform app.set_status(p_id, v_to, 'KELURAHAN', 'Bukti transfer ' || p_tahap);
  perform app.audit('BUKTI TRANSFER ' || p_tahap, 'innovations/' || p_id, jsonb_build_object('nominal', p_nominal, 'berkas', p_bukti_path));
  if p_tahap = 'TAHAP_3_40' then perform app.issue_passport(p_id); end if;
  perform app.notify(i.leader_user_id, 'TRANSFER_' || p_tahap,
    case p_tahap
      when 'TAHAP_1_30' then 'Dana Tahap 1 (' || app.rupiah(p_nominal) || ') tercatat. Logbook kini terbuka — unggah progres dan nota belanja.'
      when 'TAHAP_2_30' then 'Dana Tahap 2 (' || app.rupiah(p_nominal) || ') tercatat. Lanjutkan penyempurnaan dan serah terima.'
      else 'Dana Tahap 3 (' || app.rupiah(p_nominal) || ') tercatat. Rapor Bukti Inovasi Anda telah terbit di Etalase.' end,
    p_id, '/dashboard/pengajuan/' || p_id);
end $$;

-- ---------- Logbook ----------
create function public.add_logbook_entry(p_id uuid, p_deskripsi text, p_tanggal date default null, p_nominal bigint default 0, p_nota_path text default null, p_foto_path text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; v_tahap public.fund_stage;
begin
  select * into i from public.innovations where id = p_id and leader_user_id = auth.uid() for update;
  if not found or not app.is_active_innovator() then raise exception 'Pengajuan tidak ditemukan.' using errcode = 'P0001'; end if;
  if i.status not in ('BUILDING_PHASE', 'COMMUNITY_TESTING', 'EVALUATION_TERM_2', 'RETEST_PENDING', 'REFINEMENT_AND_HANDOVER') then
    raise exception 'Logbook belum terbuka atau sudah ditutup (status %).', i.status using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_deskripsi, ''))) < 5 then raise exception 'Deskripsi progres minimal 5 karakter.' using errcode = 'P0001'; end if;
  if coalesce(p_nominal, 0) < 0 then raise exception 'Nominal belanja tidak valid.' using errcode = 'P0001'; end if;
  if coalesce(p_nominal, 0) > 0 and not app.path_ok(p_nota_path, p_id, 'nota') then raise exception 'Belanja wajib dilengkapi foto/scan nota.' using errcode = 'P0001'; end if;
  if p_nota_path is not null and not app.path_ok(p_nota_path, p_id, 'nota') then raise exception 'Berkas nota tidak valid.' using errcode = 'P0001'; end if;
  if p_foto_path is not null and not app.path_ok(p_foto_path, p_id, 'foto') then raise exception 'Berkas foto tidak valid.' using errcode = 'P0001'; end if;
  v_tahap := case when exists (select 1 from public.logbooks_and_funds where innovation_id = p_id and jenis = 'PENCAIRAN' and tahap = 'TAHAP_2_30')
                  then 'TAHAP_2_30'::public.fund_stage else 'TAHAP_1_30'::public.fund_stage end;
  insert into public.logbooks_and_funds (innovation_id, jenis, tahap, deskripsi_progres, nominal_belanja, tanggal_kegiatan, nota_belanja_url, foto_progres_url, dicatat_oleh)
    values (p_id, 'LOGBOOK', v_tahap, btrim(p_deskripsi), coalesce(p_nominal, 0), coalesce(p_tanggal, current_date), p_nota_path, p_foto_path, auth.uid());
  perform app.audit('LOGBOOK DITAMBAH', 'innovations/' || p_id, jsonb_build_object('nominal', coalesce(p_nominal, 0), 'tahap', v_tahap));
end $$;

-- ---------- Serah terima akhir (BAST + Panduan Perawatan + LPJ 100%) ----------
create function public.submit_handover(p_id uuid, p_bast text, p_panduan text, p_lpj text) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations;
begin
  select * into i from public.innovations where id = p_id and leader_user_id = auth.uid() for update;
  if not found or not app.is_active_innovator() then raise exception 'Pengajuan tidak ditemukan.' using errcode = 'P0001'; end if;
  if i.status <> 'REFINEMENT_AND_HANDOVER' then raise exception 'Serah terima dibuka setelah Dana Tahap 2 tercatat (status %).', i.status using errcode = 'P0001'; end if;
  if not (app.path_ok(p_bast, p_id, 'bast') and app.path_ok(p_panduan, p_id, 'panduan') and app.path_ok(p_lpj, p_id, 'lpj')) then
    raise exception 'Unggah ketiga berkas: BAST, Panduan Perawatan, dan LPJ 100%%.' using errcode = 'P0001';
  end if;
  insert into public.logbooks_and_funds (innovation_id, jenis, bast_url, panduan_url, lpj_akhir_url, dicatat_oleh)
    values (p_id, 'SERAH_TERIMA', p_bast, p_panduan, p_lpj, auth.uid())
  on conflict (innovation_id) where jenis = 'SERAH_TERIMA'
  do update set bast_url = excluded.bast_url, panduan_url = excluded.panduan_url, lpj_akhir_url = excluded.lpj_akhir_url,
    verified_by_lurah_at = null, verified_by = null, catatan_validasi = null, created_at = now();
  perform app.audit('SERAH TERIMA DIUNGGAH', 'innovations/' || p_id, '{}'::jsonb);
  perform app.notify_kelurahan(i.kelurahan_target_id, 'SERAH_TERIMA', 'Berkas serah terima "' || i.judul || '" menunggu validasi.', p_id, '/kelurahan/pengajuan/' || p_id);
end $$;

create function public.validate_handover(p_id uuid, p_valid boolean, p_catatan text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; v_note text := nullif(btrim(coalesce(p_catatan, '')), '');
begin
  select * into i from public.innovations where id = p_id for update;
  if not found or not app.is_mandated(i.kelurahan_target_id) then raise exception 'Anda tidak memiliki mandat untuk pengajuan ini.' using errcode = '42501'; end if;
  if i.status <> 'REFINEMENT_AND_HANDOVER' then raise exception 'Pengajuan tidak sedang dalam tahap serah terima.' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.logbooks_and_funds where innovation_id = p_id and jenis = 'SERAH_TERIMA') then raise exception 'Inovator belum mengunggah berkas serah terima.' using errcode = 'P0001'; end if;
  if not p_valid and char_length(coalesce(v_note, '')) < 10 then raise exception 'Catatan perbaikan minimal 10 karakter.' using errcode = 'P0001'; end if;
  update public.logbooks_and_funds set
    verified_by_lurah_at = case when p_valid then now() end,
    verified_by = case when p_valid then auth.uid() end,
    catatan_validasi = v_note
  where innovation_id = p_id and jenis = 'SERAH_TERIMA';
  perform app.audit(case when p_valid then 'SERAH TERIMA DIVALIDASI' else 'SERAH TERIMA DIMINTA PERBAIKAN' end, 'innovations/' || p_id, jsonb_build_object('catatan', v_note));
  perform app.notify(i.leader_user_id, 'SERAH_TERIMA_VALIDASI',
    case when p_valid then 'BAST, Panduan Perawatan, dan LPJ "' || i.judul || '" divalidasi. Menunggu bukti transfer Tahap 3.'
         else 'Berkas serah terima perlu diperbaiki: ' || v_note end, p_id, '/dashboard/pengajuan/' || p_id || '/serah-terima');
end $$;

-- ---------- Pembatalan oleh Kelurahan, sengketa, penghentian (Bab 6) ----------
create function app.funds_received(p_id uuid) returns bigint language sql stable security definer set search_path = '' as $$
  select coalesce(sum(nominal_cair), 0)::bigint from public.logbooks_and_funds where innovation_id = p_id and jenis = 'PENCAIRAN';
$$;

create function app.do_cancel(p_id uuid, p_actor text, p_alasan text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; v_reimburse bigint;
begin
  select * into i from public.innovations where id = p_id for update;
  -- Reimburse = seluruh belanja bernota sah di Logbook (Bab 6.1).
  select coalesce(sum(nominal_belanja), 0)::bigint into v_reimburse from public.logbooks_and_funds
    where innovation_id = p_id and jenis = 'LOGBOOK' and nota_belanja_url is not null;
  perform app.set_status(p_id, 'CANCELLED_BY_KELURAHAN', p_actor, p_alasan);
  update public.innovations set reimburse_nominal = v_reimburse, catatan_pemeriksaan = p_alasan where id = p_id;
  perform app.notify(i.leader_user_id, 'PROYEK_DIBATALKAN',
    'Proyek "' || i.judul || '" dibatalkan Kelurahan. Belanja bernota sah di Logbook (' || app.rupiah(v_reimburse) || ') wajib diganti dari dana operasional kelurahan. Alasan: ' || p_alasan, p_id, '/dashboard/pengajuan/' || p_id);
  perform app.notify_brida('PROYEK_DIBATALKAN', 'Pengajuan "' || i.judul || '" dibatalkan. Reimburse ' || app.rupiah(v_reimburse) || '.', p_id, '/admin/pengajuan/' || p_id);
  return v_reimburse;
end $$;

create function public.kelurahan_cancel(p_id uuid, p_alasan text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare i public.innovations;
begin
  select * into i from public.innovations where id = p_id for update;
  if not found or not app.is_mandated(i.kelurahan_target_id) then raise exception 'Anda tidak memiliki mandat untuk pengajuan ini.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_alasan, ''))) < 20 then
    raise exception 'Pembatalan memerlukan alasan audit yang sah (minimal 20 karakter, sebutkan dasar instruksi/temuan).' using errcode = 'P0001';
  end if;
  return app.do_cancel(p_id, 'KELURAHAN', btrim(p_alasan));
end $$;

create function app.do_terminate(p_id uuid, p_alasan text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; m record; v_funds bigint;
begin
  select * into i from public.innovations where id = p_id for update;
  v_funds := app.funds_received(p_id);
  perform app.set_status(p_id, 'TERMINATED_BLACKLISTED', 'BRIDA_ADMIN', p_alasan);
  for m in select nama_anggota from public.innovation_members where innovation_id = p_id loop
    insert into public.blacklist (nama, user_id, innovation_id, alasan, dicatat_oleh)
      values (m.nama_anggota, null, p_id, p_alasan, auth.uid());
  end loop;
  update public.blacklist set user_id = i.leader_user_id
    where innovation_id = p_id and nama_norm = (select lower(btrim(name)) from public.users where id = i.leader_user_id);
  update public.users set status = 'DIBLOKIR', is_blacklisted = true where id = i.leader_user_id;
  perform app.notify(i.leader_user_id, 'PROYEK_DIHENTIKAN',
    'Proyek "' || i.judul || '" dihentikan (mangkrak/fiktif/pemalsuan). Anda wajib mengembalikan 100% dana yang diterima (' || app.rupiah(v_funds) || ') ke Kas Kelurahan sesuai Surat Pernyataan. Akun diblokir. Alasan: ' || p_alasan, p_id, null);
  perform app.notify_kelurahan(i.kelurahan_target_id, 'PROYEK_DIHENTIKAN', 'Proyek "' || i.judul || '" dihentikan Admin BRIDA. Restitusi 100% dana diterima: ' || app.rupiah(v_funds) || '.', p_id, '/kelurahan/pengajuan/' || p_id);
  return v_funds;
end $$;

create function public.brida_terminate_innovation(p_id uuid, p_alasan text) returns bigint
language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA yang dapat menghentikan proyek.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_alasan, ''))) < 20 then raise exception 'Alasan penghentian minimal 20 karakter.' using errcode = 'P0001'; end if;
  if app.funds_received(p_id) <= 0 then raise exception 'Sanksi hanya berlaku bila inovator telah menerima Dana Tahap 1.' using errcode = 'P0001'; end if;
  return app.do_terminate(p_id, btrim(p_alasan));
end $$;

create function public.report_dispute(p_id uuid, p_alasan text) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; v_actor text; v_role public.app_role;
begin
  select * into i from public.innovations where id = p_id for update;
  if not found then raise exception 'Pengajuan tidak ditemukan.' using errcode = 'P0001'; end if;
  if i.leader_user_id = auth.uid() and app.is_active_innovator() then v_actor := 'INNOVATOR'; v_role := 'INNOVATOR';
  elsif app.is_mandated(i.kelurahan_target_id) then v_actor := 'KELURAHAN'; v_role := 'KELURAHAN';
  else raise exception 'Hanya Inovator pengaju atau Kelurahan bermandat yang dapat melapor.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_alasan, ''))) < 20 then raise exception 'Uraian kendala minimal 20 karakter.' using errcode = 'P0001'; end if;
  insert into public.disputes (innovation_id, pelapor_id, pelapor_role, alasan) values (p_id, auth.uid(), v_role, btrim(p_alasan));
  perform app.set_status(p_id, 'DISPUTED', v_actor, 'Lapor Kendala');
  update public.innovations set dispute_flag = true, dispute_reason = btrim(p_alasan), status_sebelum_sengketa = i.status where id = p_id;
  perform app.notify_brida('SENGKETA_BARU', 'Lapor Kendala baru untuk pengajuan "' || i.judul || '" dari ' || lower(v_role::text) || '.', p_id, '/admin/pengajuan/' || p_id);
  perform app.notify(case when v_actor = 'INNOVATOR' then null else i.leader_user_id end, 'SENGKETA', 'Pengajuan "' || i.judul || '" dalam mediasi Admin BRIDA (Lapor Kendala).', p_id, '/dashboard/pengajuan/' || p_id);
  if v_actor = 'INNOVATOR' then
    perform app.notify_kelurahan(i.kelurahan_target_id, 'SENGKETA', 'Inovator melapor kendala pada "' || i.judul || '". Admin BRIDA akan menengahi.', p_id, '/kelurahan/pengajuan/' || p_id);
  end if;
end $$;

-- p_resolusi: LANJUTKAN | CANCELLED_BY_KELURAHAN | TERMINATED_BLACKLISTED
create function public.brida_resolve_dispute(p_dispute uuid, p_resolusi text, p_catatan text) returns void
language plpgsql security definer set search_path = '' as $$
declare d public.disputes; i public.innovations; v_note text := btrim(coalesce(p_catatan, ''));
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA yang dapat memutus sengketa.' using errcode = '42501'; end if;
  select * into d from public.disputes where id = p_dispute and status = 'TERBUKA' for update;
  if not found then raise exception 'Sengketa tidak ditemukan atau sudah selesai.' using errcode = 'P0001'; end if;
  if p_resolusi not in ('LANJUTKAN', 'CANCELLED_BY_KELURAHAN', 'TERMINATED_BLACKLISTED') then raise exception 'Resolusi tidak dikenal.' using errcode = 'P0001'; end if;
  if char_length(v_note) < 10 then raise exception 'Catatan putusan minimal 10 karakter.' using errcode = 'P0001'; end if;
  select * into i from public.innovations where id = d.innovation_id for update;
  if p_resolusi = 'LANJUTKAN' then
    perform app.set_status(i.id, i.status_sebelum_sengketa, 'BRIDA_ADMIN', 'Sengketa selesai: dilanjutkan');
  elsif p_resolusi = 'CANCELLED_BY_KELURAHAN' then
    perform app.do_cancel(i.id, 'BRIDA_ADMIN', v_note);
  else
    if app.funds_received(i.id) <= 0 then raise exception 'Sanksi hanya berlaku bila inovator telah menerima Dana Tahap 1.' using errcode = 'P0001'; end if;
    perform app.do_terminate(i.id, v_note);
  end if;
  update public.disputes set status = 'SELESAI', resolusi = p_resolusi, catatan_brida = v_note, diputuskan_oleh = auth.uid(), diputuskan_pada = now() where id = d.id;
  update public.innovations set dispute_flag = false, dispute_reason = null, status_sebelum_sengketa = null where id = i.id;
  perform app.notify(i.leader_user_id, 'SENGKETA_SELESAI', 'Mediasi pengajuan "' || i.judul || '" selesai (' || p_resolusi || '). ' || v_note, i.id, '/dashboard/pengajuan/' || i.id);
  perform app.notify_kelurahan(i.kelurahan_target_id, 'SENGKETA_SELESAI', 'Mediasi pengajuan "' || i.judul || '" selesai (' || p_resolusi || '). ' || v_note, i.id, '/kelurahan/pengajuan/' || i.id);
end $$;

-- ---------- Daftar hitam manual ----------
create function public.brida_blacklist_add(p_nama text, p_alasan text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_nama, ''))) < 3 or char_length(btrim(coalesce(p_alasan, ''))) < 10 then raise exception 'Nama dan alasan (minimal 10 karakter) wajib diisi.' using errcode = 'P0001'; end if;
  insert into public.blacklist (nama, alasan, dicatat_oleh) values (btrim(p_nama), btrim(p_alasan), auth.uid());
  perform app.audit('BLACKLIST DITAMBAH', 'blacklist', jsonb_build_object('nama', btrim(p_nama), 'alasan', btrim(p_alasan)));
end $$;

create function public.brida_blacklist_remove(p_id uuid, p_alasan text) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.blacklist;
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_alasan, ''))) < 10 then raise exception 'Alasan penghapusan minimal 10 karakter.' using errcode = 'P0001'; end if;
  select * into b from public.blacklist where id = p_id and dihapus_pada is null for update;
  if not found then raise exception 'Entri tidak ditemukan.' using errcode = 'P0001'; end if;
  update public.blacklist set dihapus_pada = now(), alasan_hapus = btrim(p_alasan) where id = p_id;
  if b.user_id is not null and not exists (select 1 from public.blacklist where user_id = b.user_id and dihapus_pada is null) then
    update public.users set is_blacklisted = false, status = 'AKTIF' where id = b.user_id and status = 'DIBLOKIR';
  end if;
  perform app.audit('BLACKLIST DIHAPUS', 'blacklist/' || p_id, jsonb_build_object('nama', b.nama, 'alasan', btrim(p_alasan)));
end $$;

-- ---------- Parameter sistem ----------
create function public.brida_set_parameters(p_values jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare k text; v jsonb; cur jsonb; v_before jsonb := '{}'::jsonb; v_porsi numeric;
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA yang dapat mengubah parameter.' using errcode = '42501'; end if;
  for k, v in select * from jsonb_each(p_values) loop
    select value into cur from public.system_parameters where key = k for update;
    if cur is null then raise exception 'Parameter % tidak dikenal.', k using errcode = 'P0001'; end if;
    if jsonb_typeof(cur) <> jsonb_typeof(v) then raise exception 'Parameter % bertipe salah.', k using errcode = 'P0001'; end if;
    if jsonb_typeof(v) = 'number' and (v #>> '{}')::numeric < 0 then raise exception 'Parameter % tidak boleh negatif.', k using errcode = 'P0001'; end if;
    v_before := v_before || jsonb_build_object(k, cur);
    update public.system_parameters set value = v, updated_by = auth.uid(), updated_at = now() where key = k;
  end loop;
  select sum(app.param_num(x)) into v_porsi from unnest(array['porsi_tahap_1', 'porsi_tahap_2', 'porsi_tahap_3']) x;
  if v_porsi <> 100 then raise exception 'Total porsi pencairan harus 100 persen (saat ini % persen).', v_porsi using errcode = 'P0001'; end if;
  if app.param_num('tim_min') > app.param_num('tim_maks') or app.param_num('tim_min') < 2 then raise exception 'Batas ukuran tim tidak valid.' using errcode = 'P0001'; end if;
  perform app.audit('PARAMETER DIUBAH', 'system_parameters', jsonb_build_object('sebelum', v_before, 'sesudah', p_values));
end $$;

-- ---------- Notifikasi ----------
create function public.mark_notification_read(p_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.notifications set dibaca = true where id = p_id and untuk_user_id = auth.uid();
$$;
create function public.mark_all_notifications_read() returns void
language sql security definer set search_path = '' as $$
  update public.notifications set dibaca = true where untuk_user_id = auth.uid() and not dibaca;
$$;
-- =====================================================================
-- C3. Uji warga (survei bawaan), keputusan Lurah, Rapor Bukti Inovasi, data publik
-- =====================================================================

-- Pertanyaan kontekstual diturunkan dari data pengajuan; dibekukan per ronde uji. Inovator tidak dapat mengubahnya.
create function app.build_survey_questions(p_id uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_array(
    jsonb_build_object('id', 'q_mudah', 'tipe', 'skala',
      'teks', 'Seberapa mudah "' || left(i.judul, 100) || '" dipahami dan dicoba oleh warga?'),
    jsonb_build_object('id', 'q_sesuai', 'tipe', 'pilihan', 'pilihan', jsonb_build_array('Ya', 'Sebagian', 'Tidak'),
      'teks', 'Apakah solusi ini sesuai dengan kebutuhan ' || left(i.target_pengguna, 120) || ' di lingkungan Anda?'),
    jsonb_build_object('id', 'q_tujuan', 'tipe', 'pilihan', 'pilihan', jsonb_build_array('Ya', 'Sebagian', 'Tidak'),
      'teks', 'Apakah tujuan berikut terasa tercapai: "' || left(i.tujuan, 160) || '"?'))
  from public.innovations i where i.id = p_id;
$$;

create function app.test_metrics(p_testing uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  with a as (
    select count(*) as n,
      coalesce(round(avg(rating)::numeric, 2), 0) as avg_rating,
      case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where membantu) / count(*), 2) end as helpful,
      case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where has_foto) / count(*), 2) end as photo
    from public.survey_responses where testing_id = p_testing)
  select jsonb_build_object('responden', n, 'avg_rating', avg_rating, 'helpful_pct', helpful, 'photo_pct', photo,
    'eligible', (n >= app.param_num('ambang_kuota') and avg_rating >= app.param_num('ambang_rating')
                 and helpful >= app.param_num('ambang_helpful_pct') and photo >= app.param_num('ambang_foto_pct')))
  from a;
$$;

create function public.ready_for_test(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations;
begin
  select * into i from public.innovations where id = p_id and leader_user_id = auth.uid() for update;
  if not found or not app.is_active_innovator() then raise exception 'Pengajuan tidak ditemukan.' using errcode = 'P0001'; end if;
  if i.status <> 'BUILDING_PHASE' then raise exception 'Uji warga hanya dapat dimulai dari fase pembuatan (status %).', i.status using errcode = 'P0001'; end if;
  if not exists (select 1 from public.logbooks_and_funds where innovation_id = p_id and jenis = 'LOGBOOK' and nota_belanja_url is not null) then
    raise exception 'Isi Logbook dengan minimal satu entri bernota sebelum menekan "Siap Uji Warga".' using errcode = 'P0001';
  end if;
  insert into public.testing_integrations (innovation_id, ronde, test_start_date, test_end_date, survey_pertanyaan)
    values (p_id, 1, now(), now() + make_interval(days => app.param_num('durasi_uji_hari')::int), app.build_survey_questions(p_id));
  perform app.set_status(p_id, 'COMMUNITY_TESTING', 'INNOVATOR', 'Siap Uji Warga: survei dibuat otomatis');
  perform app.notify_kelurahan(i.kelurahan_target_id, 'UJI_DIMULAI', 'Uji warga "' || i.judul || '" dimulai. Hasil tampil real-time di dashboard.', p_id, '/kelurahan/pengajuan/' || p_id);
end $$;

create function public.start_retest(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; v_ronde int;
begin
  select * into i from public.innovations where id = p_id and leader_user_id = auth.uid() for update;
  if not found or not app.is_active_innovator() then raise exception 'Pengajuan tidak ditemukan.' using errcode = 'P0001'; end if;
  if i.status <> 'RETEST_PENDING' then raise exception 'Uji ulang hanya setelah keputusan Tunda/Perbaikan.' using errcode = 'P0001'; end if;
  select coalesce(max(ronde), 0) + 1 into v_ronde from public.testing_integrations where innovation_id = p_id;
  insert into public.testing_integrations (innovation_id, ronde, test_start_date, test_end_date, survey_pertanyaan)
    values (p_id, v_ronde, now(), now() + make_interval(days => app.param_num('durasi_uji_hari')::int), app.build_survey_questions(p_id));
  perform app.set_status(p_id, 'COMMUNITY_TESTING', 'INNOVATOR', 'Uji ulang ronde ' || v_ronde);
  perform app.notify_kelurahan(i.kelurahan_target_id, 'UJI_DIMULAI', 'Uji ulang (ronde ' || v_ronde || ') "' || i.judul || '" dimulai.', p_id, '/kelurahan/pengajuan/' || p_id);
end $$;

-- Perpanjangan sekali, maks. 7 hari, tanpa biaya; hanya bila kuota belum genap.
create function public.extend_test(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; t public.testing_integrations; v_n int;
begin
  select * into i from public.innovations where id = p_id for update;
  if not found or not (i.leader_user_id = auth.uid() or app.is_mandated(i.kelurahan_target_id)) then raise exception 'Tidak berwenang.' using errcode = '42501'; end if;
  if i.status <> 'COMMUNITY_TESTING' then raise exception 'Perpanjangan hanya saat masa uji berjalan.' using errcode = 'P0001'; end if;
  select * into t from public.testing_integrations where innovation_id = p_id and status = 'AKTIF' order by ronde desc limit 1 for update;
  if not found or t.test_end_date < now() then raise exception 'Masa uji sudah berakhir.' using errcode = 'P0001'; end if;
  if t.is_extended then raise exception 'Perpanjangan hanya dapat dilakukan satu kali.' using errcode = 'P0001'; end if;
  select count(*) into v_n from public.survey_responses where testing_id = t.id;
  if v_n >= app.param_num('ambang_kuota') then raise exception 'Kuota responden sudah terpenuhi; perpanjangan tidak diperlukan.' using errcode = 'P0001'; end if;
  update public.testing_integrations set is_extended = true,
    test_end_date = test_end_date + make_interval(days => app.param_num('perpanjangan_hari')::int) where id = t.id;
  perform app.audit('UJI DIPERPANJANG', 'innovations/' || p_id, jsonb_build_object('ronde', t.ronde, 'responden', v_n));
end $$;

create function app.close_test(p_testing uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare t public.testing_integrations; i public.innovations; m jsonb;
begin
  select * into t from public.testing_integrations where id = p_testing for update;
  select * into i from public.innovations where id = t.innovation_id for update;
  m := app.test_metrics(p_testing);
  update public.testing_integrations set status = 'SELESAI',
    total_valid_respondents = (m->>'responden')::int, avg_rating = (m->>'avg_rating')::numeric,
    helpful_percentage = (m->>'helpful_pct')::numeric, photo_valid_percentage = (m->>'photo_pct')::numeric,
    is_eligible_standard = (m->>'eligible')::boolean where id = p_testing;
  perform app.set_status(i.id, 'EVALUATION_TERM_2', 'SYSTEM', 'Masa uji selesai');
  perform app.notify_kelurahan(i.kelurahan_target_id, 'UJI_SELESAI', 'Masa uji "' || i.judul || '" selesai. Putuskan: Lolos, Tunda/Uji Ulang, atau Gagal.', i.id, '/kelurahan/pengajuan/' || i.id);
  perform app.notify(i.leader_user_id, 'UJI_SELESAI', 'Masa uji "' || i.judul || '" selesai. Menunggu keputusan Lurah.', i.id, '/dashboard/pengajuan/' || i.id || '/uji');
end $$;

-- Idempoten; hanya menutup uji yang waktunya habis. Aman dipanggil dari halaman mana pun.
create function public.sync_due_tests() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; v_n int := 0;
begin
  for r in select t.id from public.testing_integrations t join public.innovations i on i.id = t.innovation_id
           where t.status = 'AKTIF' and t.test_end_date < now() and i.status = 'COMMUNITY_TESTING' for update of t skip locked loop
    perform app.close_test(r.id);
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

create function public.lurah_decide_test(p_id uuid, p_decision public.lurah_decision, p_catatan text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; t public.testing_integrations; v_note text := nullif(btrim(coalesce(p_catatan, '')), ''); v_kuota numeric := app.param_num('ambang_kuota');
begin
  select * into i from public.innovations where id = p_id for update;
  if not found or not app.is_mandated(i.kelurahan_target_id) then raise exception 'Anda tidak memiliki mandat untuk pengajuan ini.' using errcode = '42501'; end if;
  if i.status <> 'EVALUATION_TERM_2' then raise exception 'Keputusan hanya setelah masa uji selesai (status %).', i.status using errcode = 'P0001'; end if;
  select * into t from public.testing_integrations where innovation_id = p_id order by ronde desc limit 1 for update;
  if t.status <> 'SELESAI' or t.lurah_decision is not null then raise exception 'Keputusan untuk ronde ini sudah dicatat.' using errcode = 'P0001'; end if;
  if p_decision = 'LOLOS' and not coalesce(t.is_eligible_standard, false) then
    raise exception 'Lolos hanya bila keempat standar kelayakan terpenuhi.' using errcode = 'P0001';
  end if;
  if p_decision in ('TUNDA', 'GAGAL') and coalesce(t.is_eligible_standard, false) then
    raise exception 'Keempat standar terpenuhi; pilih Lolos.' using errcode = 'P0001';
  end if;
  if p_decision = 'TUNDA' and not (t.total_valid_respondents < v_kuota or t.avg_rating >= app.param_num('rating_tunda_min')) then
    raise exception 'Tunda/Uji Ulang hanya bila responden kurang dari kuota atau rating rata-rata minimal % ; selain itu pilih Gagal.', app.param_num('rating_tunda_min') using errcode = 'P0001';
  end if;
  if p_decision <> 'LOLOS' and char_length(coalesce(v_note, '')) < 10 then raise exception 'Catatan keputusan minimal 10 karakter.' using errcode = 'P0001'; end if;
  update public.testing_integrations set lurah_decision = p_decision, keputusan_catatan = v_note, diputuskan_oleh = auth.uid(), diputuskan_pada = now() where id = t.id;
  if p_decision = 'TUNDA' then perform app.set_status(p_id, 'RETEST_PENDING', 'KELURAHAN', v_note);
  elsif p_decision = 'GAGAL' then perform app.set_status(p_id, 'STOPPED_AS_LEARNING', 'KELURAHAN', v_note);
  else perform app.audit('KEPUTUSAN LOLOS', 'innovations/' || p_id, jsonb_build_object('ronde', t.ronde)); end if;
  perform app.notify(i.leader_user_id, 'KEPUTUSAN_UJI_' || p_decision,
    case p_decision
      when 'LOLOS' then '"' || i.judul || '" lolos uji warga. Menunggu bukti transfer Tahap 2.'
      when 'TUNDA' then '"' || i.judul || '" ditunda: perbaiki produk lalu uji ulang 14 hari. ' || v_note
      else '"' || i.judul || '" dihentikan sebagai pembelajaran (bukan sanksi selama nota jujur). ' || v_note end,
    p_id, '/dashboard/pengajuan/' || p_id || '/uji');
end $$;

-- Ringkasan uji untuk Inovator/Kelurahan/BRIDA: ambang, metrik real-time, ulasan TERSAMARKAN.
create function public.get_test_summary(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare t public.testing_integrations; m jsonb; v_ulasan jsonb;
begin
  if not app.can_read_innovation(p_id) then raise exception 'Tidak berwenang.' using errcode = '42501'; end if;
  select * into t from public.testing_integrations where innovation_id = p_id order by ronde desc limit 1;
  if not found then return jsonb_build_object('ada', false, 'ambang', jsonb_build_object(
      'kuota', app.param_num('ambang_kuota'), 'rating', app.param_num('ambang_rating'), 'helpful', app.param_num('ambang_helpful_pct'), 'foto', app.param_num('ambang_foto_pct'))); end if;
  m := case when t.status = 'AKTIF' then app.test_metrics(t.id) else jsonb_build_object(
    'responden', t.total_valid_respondents, 'avg_rating', t.avg_rating, 'helpful_pct', t.helpful_percentage, 'photo_pct', t.photo_valid_percentage, 'eligible', t.is_eligible_standard) end;
  select coalesce(jsonb_agg(jsonb_build_object('inisial', app.initials(nama), 'rating', rating, 'membantu', membantu, 'komentar', komentar, 'waktu', dibuat_pada) order by dibuat_pada desc), '[]'::jsonb)
    into v_ulasan from (select * from public.survey_responses where testing_id = t.id order by dibuat_pada desc limit 30) s;
  return jsonb_build_object('ada', true, 'ronde', t.ronde, 'status', t.status, 'mulai', t.test_start_date, 'selesai', t.test_end_date,
    'diperpanjang', t.is_extended, 'sisa_hari', greatest(0, ceil(extract(epoch from (t.test_end_date - now())) / 86400.0))::int,
    'metrik', m, 'keputusan', t.lurah_decision, 'keputusan_catatan', t.keputusan_catatan, 'survey_pertanyaan', t.survey_pertanyaan, 'ulasan', v_ulasan,
    'ambang', jsonb_build_object('kuota', app.param_num('ambang_kuota'), 'rating', app.param_num('ambang_rating'), 'helpful', app.param_num('ambang_helpful_pct'), 'foto', app.param_num('ambang_foto_pct')));
end $$;

-- ---------- Survei publik (tanpa akun) ----------
create function public.survey_public_info(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; t public.testing_integrations; k public.master_kelurahan;
begin
  select * into i from public.innovations where id = p_id;
  if not found or i.status <> 'COMMUNITY_TESTING' then return jsonb_build_object('aktif', false); end if;
  select * into t from public.testing_integrations where innovation_id = p_id and status = 'AKTIF' order by ronde desc limit 1;
  if not found or t.test_end_date < now() then return jsonb_build_object('aktif', false); end if;
  select * into k from public.master_kelurahan where id = i.kelurahan_target_id;
  return jsonb_build_object('aktif', true, 'judul', i.judul, 'masalah', i.masalah, 'tujuan', i.tujuan, 'kecamatan', k.kecamatan, 'kelurahan', k.kelurahan,
    'sampai', t.test_end_date, 'pertanyaan', t.survey_pertanyaan, 'foto_wajib', app.param_bool('survey_foto_wajib'));
end $$;

-- Hanya service_role (server aplikasi menghitung ip_hash dan mengunggah foto lebih dulu).
create function public.submit_survey_response(p_innovation uuid, p_nama text, p_usia int, p_tempat_tinggal text, p_kecamatan text, p_kelurahan text,
  p_rt int, p_rw int, p_foto_path text, p_rating int, p_membantu boolean, p_jawaban jsonb, p_komentar text, p_ip_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare i public.innovations; t public.testing_integrations; k public.master_kelurahan; q jsonb; v_ans jsonb; v_key text; v_n int; v_total int;
begin
  select * into i from public.innovations where id = p_innovation;
  if not found or i.status <> 'COMMUNITY_TESTING' then raise exception 'Uji warga untuk inovasi ini tidak sedang dibuka.' using errcode = 'P0001'; end if;
  select * into t from public.testing_integrations where innovation_id = p_innovation and status = 'AKTIF' order by ronde desc limit 1;
  if not found or t.test_end_date < now() then raise exception 'Masa uji sudah berakhir.' using errcode = 'P0001'; end if;
  select * into k from public.master_kelurahan where id = i.kelurahan_target_id;
  if lower(btrim(p_kecamatan)) <> lower(k.kecamatan) or lower(btrim(p_kelurahan)) <> lower(k.kelurahan) then
    raise exception 'Uji ini khusus warga Kelurahan % (Kec. %).', k.kelurahan, k.kecamatan using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_nama, ''))) < 1 or char_length(btrim(p_nama)) > 100 then raise exception 'Isi nama atau inisial.' using errcode = 'P0001'; end if;
  if p_usia is null or p_usia < 5 or p_usia > 110 then raise exception 'Usia tidak valid.' using errcode = 'P0001'; end if;
  if char_length(btrim(coalesce(p_tempat_tinggal, ''))) < 3 then raise exception 'Isi tempat tinggal (jalan/kampung).' using errcode = 'P0001'; end if;
  if p_rt is null or p_rt < 1 or p_rt > 999 or p_rw is null or p_rw < 1 or p_rw > 999 then raise exception 'RT/RW tidak valid.' using errcode = 'P0001'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Rating harus 1–5.' using errcode = 'P0001'; end if;
  if p_membantu is null then raise exception 'Jawab apakah inovasi ini membantu.' using errcode = 'P0001'; end if;
  if p_foto_path is null and app.param_bool('survey_foto_wajib') then raise exception 'Foto bukti penggunaan wajib dilampirkan.' using errcode = 'P0001'; end if;
  if p_foto_path is not null and p_foto_path not like 'survey/' || p_innovation::text || '/%' then raise exception 'Foto tidak valid.' using errcode = 'P0001'; end if;
  v_ans := '{}'::jsonb;
  for q in select * from jsonb_array_elements(t.survey_pertanyaan) loop
    if p_jawaban is null or not (p_jawaban ? (q->>'id')) then raise exception 'Jawab semua pertanyaan.' using errcode = 'P0001'; end if;
    if q->>'tipe' = 'skala' then
      if (p_jawaban->>(q->>'id')) !~ '^[1-5]$' then raise exception 'Jawaban skala harus 1–5.' using errcode = 'P0001'; end if;
      v_ans := v_ans || jsonb_build_object(q->>'id', (p_jawaban->>(q->>'id'))::int);
    else
      if not (q->'pilihan') @> to_jsonb(p_jawaban->>(q->>'id')) then raise exception 'Pilihan jawaban tidak valid.' using errcode = 'P0001'; end if;
      v_ans := v_ans || jsonb_build_object(q->>'id', p_jawaban->>(q->>'id'));
    end if;
  end loop;
  select count(*) into v_n from public.survey_responses
    where innovation_id = p_innovation and ip_hash = p_ip_hash and dibuat_pada > now() - interval '1 hour';
  if v_n >= app.param_num('survey_rate_limit_per_jam') then raise exception 'Terlalu banyak pengiriman dari jaringan ini. Coba lagi nanti.' using errcode = 'P0001'; end if;
  v_key := encode(sha256(convert_to(lower(btrim(p_nama)) || '|' || p_usia || '|' || lower(btrim(p_tempat_tinggal)) || '|' || p_rt || '|' || p_rw, 'UTF8')), 'hex');
  begin
    insert into public.survey_responses (innovation_id, testing_id, nama, usia, tempat_tinggal, kecamatan, kelurahan, rt, rw, foto_url, has_foto,
      rating, membantu, jawaban_kontekstual, komentar, dedupe_key, ip_hash)
    values (p_innovation, t.id, btrim(p_nama), p_usia, btrim(p_tempat_tinggal), k.kecamatan, k.kelurahan, p_rt, p_rw, p_foto_path, p_foto_path is not null,
      p_rating, p_membantu, v_ans, nullif(btrim(coalesce(p_komentar, '')), ''), v_key, p_ip_hash);
  exception when unique_violation then
    raise exception 'Responden dengan data yang sama sudah mengisi (satu orang satu suara).' using errcode = 'P0001';
  end;
  select count(*) into v_total from public.survey_responses where testing_id = t.id;
  return jsonb_build_object('ok', true, 'total', v_total);
end $$;

-- BRIDA: anonimisasi data penguji (nama jadi inisial, tempat tinggal dihapus, foto dilepas). Mengembalikan path foto untuk dihapus dari storage.
create function public.brida_anonymize_survey(p_id uuid) returns text[]
language plpgsql security definer set search_path = '' as $$
declare v_paths text[];
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA.' using errcode = '42501'; end if;
  if exists (select 1 from public.innovations where id = p_id and status = 'COMMUNITY_TESTING') then
    raise exception 'Data tidak dapat dianonimkan saat masa uji berjalan.' using errcode = 'P0001';
  end if;
  select coalesce(array_agg(foto_url) filter (where foto_url is not null), '{}') into v_paths from public.survey_responses where innovation_id = p_id;
  update public.survey_responses set nama = app.initials(nama), tempat_tinggal = '[dianonimkan]', foto_url = null where innovation_id = p_id;
  update public.testing_integrations set data_anonymized_at = now() where innovation_id = p_id;
  perform app.audit('DATA PENGUJI DIANONIMKAN', 'innovations/' || p_id, jsonb_build_object('foto_dihapus', coalesce(array_length(v_paths, 1), 0)));
  return v_paths;
end $$;

-- ---------- Rapor Bukti Inovasi ----------
-- Hash = SHA-256 dari: ID inovasi | rata-rata rating | % membantu | % foto | jumlah responden | total dana cair (ronde Lolos terakhir).
create function app.rapor_hash(p_id uuid) returns text language sql stable security definer set search_path = '' as $$
  select encode(sha256(convert_to(
    p_id::text || '|' || to_char(coalesce(t.avg_rating, 0), 'FM990.00') || '|' || to_char(coalesce(t.helpful_percentage, 0), 'FM990.00') || '|' ||
    to_char(coalesce(t.photo_valid_percentage, 0), 'FM990.00') || '|' || coalesce(t.total_valid_respondents, 0) || '|' || app.funds_received(p_id), 'UTF8')), 'hex')
  from (select * from public.testing_integrations where innovation_id = p_id and lurah_decision = 'LOLOS' order by ronde desc limit 1) t;
$$;

create function app.issue_passport(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare i public.innovations; k public.master_kelurahan; t public.testing_integrations; v_ulasan jsonb; v_snap jsonb; v_inst jsonb;
begin
  select * into i from public.innovations where id = p_id;
  select * into k from public.master_kelurahan where id = i.kelurahan_target_id;
  select * into t from public.testing_integrations where innovation_id = p_id and lurah_decision = 'LOLOS' order by ronde desc limit 1;
  select coalesce(jsonb_agg(jsonb_build_object('inisial', app.initials(nama), 'rating', rating, 'membantu', membantu, 'komentar', komentar) order by dibuat_pada), '[]'::jsonb)
    into v_ulasan from public.survey_responses where testing_id = t.id and komentar is not null;
  select coalesce(jsonb_agg(distinct institusi_asal) filter (where institusi_asal <> ''), '[]'::jsonb) into v_inst from public.innovation_members where innovation_id = p_id;
  v_snap := jsonb_build_object(
    'judul', i.judul, 'tipe', i.tipe_inovasi, 'skala', i.skala_plafon, 'ringkasan', i.ringkasan, 'masalah', i.masalah, 'tujuan', i.tujuan,
    'kecamatan', k.kecamatan, 'kelurahan', k.kelurahan, 'kode', i.kode_unik,
    'tim', jsonb_build_object('jumlah', (select count(*) from public.innovation_members where innovation_id = p_id), 'institusi', v_inst),
    'uji', jsonb_build_object('ronde', t.ronde, 'responden', t.total_valid_respondents, 'avg_rating', t.avg_rating, 'helpful_pct', t.helpful_percentage, 'photo_pct', t.photo_valid_percentage),
    'dana', jsonb_build_object('total_rab', i.total_rab,
      'tahap_1', (select nominal_cair from public.logbooks_and_funds where innovation_id = p_id and tahap = 'TAHAP_1_30' and jenis = 'PENCAIRAN'),
      'tahap_2', (select nominal_cair from public.logbooks_and_funds where innovation_id = p_id and tahap = 'TAHAP_2_30' and jenis = 'PENCAIRAN'),
      'tahap_3', (select nominal_cair from public.logbooks_and_funds where innovation_id = p_id and tahap = 'TAHAP_3_40' and jenis = 'PENCAIRAN'),
      'total_cair', app.funds_received(p_id),
      'belanja_bernota', (select coalesce(sum(nominal_belanja), 0) from public.logbooks_and_funds where innovation_id = p_id and jenis = 'LOGBOOK' and nota_belanja_url is not null)),
    'ulasan', v_ulasan, 'terbit', now());
  insert into public.evidence_passports (innovation_id, passport_code, data_snapshot_json, sha256_hash)
    values (p_id, 'RBI-' || i.kode_unik, v_snap, app.rapor_hash(p_id));
  if i.problem_board_id is not null then
    perform app.begin_workflow('SYSTEM');
    update public.problem_boards set status = 'SOLVED', solved_by_innovation_id = p_id where id = i.problem_board_id;
    perform app.end_workflow();
  end if;
  perform app.audit('RAPOR DITERBITKAN', 'innovations/' || p_id, jsonb_build_object('hash', app.rapor_hash(p_id)));
end $$;

-- Verifikasi QR: hitung ulang hash dari data hidup. Beda dengan hash tersimpan/URL = peringatan merah.
create function public.verify_rapor(p_id uuid, p_hash text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e public.evidence_passports; v_now text;
begin
  select * into e from public.evidence_passports where innovation_id = p_id;
  if not found then return jsonb_build_object('status', 'TIDAK_DITEMUKAN'); end if;
  v_now := app.rapor_hash(p_id);
  return jsonb_build_object('status', case when v_now = e.sha256_hash and (p_hash is null or lower(p_hash) = e.sha256_hash) then 'VALID' else 'TIDAK_COCOK' end,
    'hash_tersimpan', e.sha256_hash, 'hash_saat_ini', v_now, 'hash_url_cocok', (p_hash is not null and lower(p_hash) = e.sha256_hash));
end $$;

-- Dipanggil server dengan service_role (ip_hash dihitung server).
create function public.tandai_minat_pilot(p_id uuid, p_nama text, p_instansi text, p_kontak text, p_pesan text, p_ip_hash text) returns int
language plpgsql security definer set search_path = '' as $$
declare v_n int;
begin
  if not exists (select 1 from public.evidence_passports where innovation_id = p_id) then raise exception 'Inovasi belum memiliki Rapor Bukti Inovasi.' using errcode = 'P0001'; end if;
  if (select count(*) from public.pilot_interests where innovation_id = p_id and ip_hash = p_ip_hash and dibuat_pada > now() - interval '1 day') >= 3 then
    raise exception 'Terlalu banyak pengiriman. Coba lagi besok.' using errcode = 'P0001';
  end if;
  insert into public.pilot_interests (innovation_id, nama, instansi, kontak, pesan, ip_hash)
    values (p_id, btrim(p_nama), btrim(p_instansi), btrim(p_kontak), nullif(btrim(coalesce(p_pesan, '')), ''), p_ip_hash);
  update public.evidence_passports set pilot_interest_count = pilot_interest_count + 1 where innovation_id = p_id returning pilot_interest_count into v_n;
  return v_n;
end $$;

-- ---------- Data publik & dashboard BRIDA ----------
create function public.public_stats() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'inovasi_terbit', (select count(*) from public.evidence_passports),
    'inovasi_berjalan', (select count(*) from public.innovations where status in ('APPROVED_WAITING_TERM_1', 'BUILDING_PHASE', 'COMMUNITY_TESTING', 'EVALUATION_TERM_2', 'RETEST_PENDING', 'REFINEMENT_AND_HANDOVER')),
    'total_dana_cair', (select coalesce(sum(nominal_cair), 0) from public.logbooks_and_funds where jenis = 'PENCAIRAN'),
    'masalah_terbuka', (select count(*) from public.problem_boards where status = 'OPEN'),
    'masalah_selesai', (select count(*) from public.problem_boards where status = 'SOLVED'),
    'kelurahan_bermandat', (select count(distinct kelurahan_id) from public.kelurahan_mandates where dicabut_pada is null),
    'warga_penguji', (select count(*) from public.survey_responses));
$$;

create function public.kelurahan_tanpa_mandat(p_kecamatan text default null, p_semua boolean default false)
returns table (kelurahan_id uuid, kecamatan text, kelurahan text, jumlah_menunggu int, menunggu_sejak timestamptz, lama_hari int)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA.' using errcode = '42501'; end if;
  return query
    select k.id, k.kecamatan, k.kelurahan, count(i.id)::int, min(i.status_changed_at),
      case when count(i.id) = 0 then 0 else floor(extract(epoch from (now() - min(i.status_changed_at))) / 86400)::int end
    from public.master_kelurahan k
    left join public.innovations i on i.kelurahan_target_id = k.id and i.status = 'WAITING_KELURAHAN_MANDATE'
    where not app.kelurahan_has_mandate(k.id) and (p_kecamatan is null or k.kecamatan = p_kecamatan)
    group by k.id, k.kecamatan, k.kelurahan
    having p_semua or count(i.id) > 0
    order by count(i.id) desc, min(i.status_changed_at) asc nulls last, k.kecamatan, k.kelurahan;
end $$;

create function public.brida_stats() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not app.is_brida() then raise exception 'Hanya Admin BRIDA.' using errcode = '42501'; end if;
  return jsonb_build_object(
    'per_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.innovations group by status) s),
    'dana_per_tahap', (select coalesce(jsonb_object_agg(tahap, total), '{}'::jsonb) from (select tahap, sum(nominal_cair) total from public.logbooks_and_funds where jenis = 'PENCAIRAN' group by tahap) s),
    'total_inovator', (select count(*) from public.users where role = 'INNOVATOR'),
    'kelurahan_bermandat', (select count(distinct kelurahan_id) from public.kelurahan_mandates where dicabut_pada is null),
    'antrean_mandat', (select count(*) from public.users where role = 'KELURAHAN' and status = 'MENUNGGU_MANDAT'),
    'sengketa_terbuka', (select count(*) from public.disputes where status = 'TERBUKA'),
    'banding_menunggu', (select count(*) from public.innovations where status = 'APPEALED'),
    'rata_rating', (select round(avg(avg_rating), 2) from public.testing_integrations where status = 'SELESAI' and total_valid_respondents > 0),
    'warga_penguji', (select count(*) from public.survey_responses),
    'blacklist_aktif', (select count(*) from public.blacklist where dihapus_pada is null));
end $$;
-- =====================================================================
-- D. Data awal: transisi state machine, parameter, master kelurahan, grant fungsi
-- =====================================================================

insert into public.innovation_transitions (from_status, to_status, actor) values
  ('DRAFT', 'SUBMITTED_TO_KELURAHAN', 'INNOVATOR'),
  ('DRAFT', 'WAITING_KELURAHAN_MANDATE', 'INNOVATOR'),
  ('REVISION_REQUESTED', 'SUBMITTED_TO_KELURAHAN', 'INNOVATOR'),
  ('REVISION_REQUESTED', 'WAITING_KELURAHAN_MANDATE', 'INNOVATOR'),
  ('WAITING_KELURAHAN_MANDATE', 'SUBMITTED_TO_KELURAHAN', 'SYSTEM'),
  ('SUBMITTED_TO_KELURAHAN', 'WAITING_KELURAHAN_MANDATE', 'SYSTEM'),
  ('SUBMITTED_TO_KELURAHAN', 'APPROVED_WAITING_TERM_1', 'KELURAHAN'),
  ('SUBMITTED_TO_KELURAHAN', 'REVISION_REQUESTED', 'KELURAHAN'),
  ('SUBMITTED_TO_KELURAHAN', 'REJECTED', 'KELURAHAN'),
  ('REJECTED', 'APPEALED', 'INNOVATOR'),
  ('APPEALED', 'SUBMITTED_TO_KELURAHAN', 'BRIDA_ADMIN'),
  ('APPEALED', 'WAITING_KELURAHAN_MANDATE', 'BRIDA_ADMIN'),
  ('APPEALED', 'REJECTED', 'BRIDA_ADMIN'),
  ('APPROVED_WAITING_TERM_1', 'BUILDING_PHASE', 'KELURAHAN'),
  ('BUILDING_PHASE', 'COMMUNITY_TESTING', 'INNOVATOR'),
  ('COMMUNITY_TESTING', 'EVALUATION_TERM_2', 'SYSTEM'),
  ('EVALUATION_TERM_2', 'REFINEMENT_AND_HANDOVER', 'KELURAHAN'),
  ('EVALUATION_TERM_2', 'RETEST_PENDING', 'KELURAHAN'),
  ('EVALUATION_TERM_2', 'STOPPED_AS_LEARNING', 'KELURAHAN'),
  ('RETEST_PENDING', 'COMMUNITY_TESTING', 'INNOVATOR'),
  ('REFINEMENT_AND_HANDOVER', 'COMPLETED_PUBLISHED', 'KELURAHAN'),
  ('DISPUTED', 'CANCELLED_BY_KELURAHAN', 'BRIDA_ADMIN');

-- Lapor Kendala: Inovator atau Kelurahan dapat membuka sengketa dari status aktif; BRIDA mengembalikan ke status semula.
insert into public.innovation_transitions (from_status, to_status, actor)
select s::public.innovation_status, 'DISPUTED', a
from unnest(array['SUBMITTED_TO_KELURAHAN', 'REVISION_REQUESTED', 'APPROVED_WAITING_TERM_1', 'BUILDING_PHASE', 'COMMUNITY_TESTING',
  'EVALUATION_TERM_2', 'RETEST_PENDING', 'REFINEMENT_AND_HANDOVER']) s, unnest(array['INNOVATOR', 'KELURAHAN']) a;
insert into public.innovation_transitions (from_status, to_status, actor)
select 'DISPUTED', s::public.innovation_status, 'BRIDA_ADMIN'
from unnest(array['SUBMITTED_TO_KELURAHAN', 'REVISION_REQUESTED', 'APPROVED_WAITING_TERM_1', 'BUILDING_PHASE', 'COMMUNITY_TESTING',
  'EVALUATION_TERM_2', 'RETEST_PENDING', 'REFINEMENT_AND_HANDOVER']) s;
-- Pembatalan oleh Kelurahan (wajib alasan audit) dan oleh BRIDA setelah mediasi.
insert into public.innovation_transitions (from_status, to_status, actor)
select s::public.innovation_status, 'CANCELLED_BY_KELURAHAN', 'KELURAHAN'
from unnest(array['APPROVED_WAITING_TERM_1', 'BUILDING_PHASE', 'COMMUNITY_TESTING', 'EVALUATION_TERM_2', 'RETEST_PENDING', 'REFINEMENT_AND_HANDOVER']) s;
-- Penghentian mangkrak/fiktif/pemalsuan: hanya setelah Dana Tahap 1 cair.
insert into public.innovation_transitions (from_status, to_status, actor)
select s::public.innovation_status, 'TERMINATED_BLACKLISTED', 'BRIDA_ADMIN'
from unnest(array['BUILDING_PHASE', 'COMMUNITY_TESTING', 'EVALUATION_TERM_2', 'RETEST_PENDING', 'REFINEMENT_AND_HANDOVER', 'DISPUTED']) s;

insert into public.system_parameters (key, value, keterangan) values
  ('plafon_kecil', '5000000', 'Plafon Skala Kecil (Rp)'),
  ('plafon_terapan', '15000000', 'Plafon Skala Terapan (Rp)'),
  ('durasi_bangun_kecil', '30', 'Durasi bangun Skala Kecil (hari kalender)'),
  ('durasi_bangun_terapan', '60', 'Durasi bangun Skala Terapan (hari kalender)'),
  ('porsi_tahap_1', '30', 'Porsi pencairan Tahap 1 (%)'),
  ('porsi_tahap_2', '30', 'Porsi pencairan Tahap 2 (%)'),
  ('porsi_tahap_3', '40', 'Porsi pencairan Tahap 3 (%)'),
  ('tak_terduga_maks_pct', '10', 'Dana tak terduga maks. (% total RAB)'),
  ('honor_maks_pct', '15', 'Honorarium tim maks. (% total RAB)'),
  ('perawatan_min_bulan', '6', 'Rencana perawatan minimum (bulan)'),
  ('perawatan_maks_bulan', '12', 'Rencana perawatan maksimum (bulan)'),
  ('tim_min', '2', 'Anggota tim minimum'),
  ('tim_maks', '6', 'Anggota tim maksimum'),
  ('durasi_uji_hari', '14', 'Durasi uji warga (hari kalender)'),
  ('perpanjangan_hari', '7', 'Perpanjangan uji, satu kali (hari)'),
  ('ambang_kuota', '30', 'Ambang 1: minimal responden unik'),
  ('ambang_rating', '3.8', 'Ambang 2: rata-rata rating minimal (1–5)'),
  ('ambang_helpful_pct', '75', 'Ambang 3: minimal % menjawab "Ya, membantu"'),
  ('ambang_foto_pct', '80', 'Ambang 4: minimal % melampirkan foto'),
  ('rating_tunda_min', '3.0', 'Rating minimal agar keputusan Tunda/Uji Ulang tersedia'),
  ('survey_foto_wajib', 'true', 'Foto bukti wajib di formulir survei'),
  ('survey_rate_limit_per_jam', '10', 'Maks. kiriman survei per hash IP per inovasi per jam'),
  ('banding_maks_hari', '7', 'Batas pengajuan banding sejak keputusan (hari kalender)')
on conflict (key) do nothing;

-- Master kelurahan Kota Surabaya (31 kecamatan, 154 kelurahan). Daftar masih perlu divalidasi terhadap master resmi.
insert into public.master_kelurahan (kecamatan, kelurahan) values
  ('Asemrowo', 'Asemrowo'),
  ('Asemrowo', 'Genting Kalianak'),
  ('Asemrowo', 'Tambak Sarioso'),
  ('Benowo', 'Kandangan'),
  ('Benowo', 'Romokalisari'),
  ('Benowo', 'Sememi'),
  ('Benowo', 'Tambak Osowilangon'),
  ('Bubutan', 'Alun-alun Contong'),
  ('Bubutan', 'Bubutan'),
  ('Bubutan', 'Gundih'),
  ('Bubutan', 'Jepara'),
  ('Bubutan', 'Tembok Dukuh'),
  ('Bulak', 'Bulak'),
  ('Bulak', 'Kedung Cowek'),
  ('Bulak', 'Kenjeran'),
  ('Bulak', 'Komplek Kenjeran'),
  ('Dukuh Pakis', 'Dukuh Kupang'),
  ('Dukuh Pakis', 'Dukuh Pakis'),
  ('Dukuh Pakis', 'Gunung Sari'),
  ('Dukuh Pakis', 'Pradah Kalikendal'),
  ('Gayungan', 'Dukuh Menanggal'),
  ('Gayungan', 'Gayungan'),
  ('Gayungan', 'Ketintang'),
  ('Gayungan', 'Menanggal'),
  ('Genteng', 'Embong Kaliasin'),
  ('Genteng', 'Genteng'),
  ('Genteng', 'Kapasari'),
  ('Genteng', 'Ketabang'),
  ('Genteng', 'Peneleh'),
  ('Gubeng', 'Airlangga'),
  ('Gubeng', 'Baratajaya'),
  ('Gubeng', 'Gubeng'),
  ('Gubeng', 'Kertajaya'),
  ('Gubeng', 'Mojo'),
  ('Gubeng', 'Pucang Sewu'),
  ('Gunung Anyar', 'Gunung Anyar'),
  ('Gunung Anyar', 'Gunung Anyar Tambak'),
  ('Gunung Anyar', 'Rungkut Menanggal'),
  ('Gunung Anyar', 'Rungkut Tengah'),
  ('Jambangan', 'Jambangan'),
  ('Jambangan', 'Karah'),
  ('Jambangan', 'Kebonsari'),
  ('Jambangan', 'Pagesangan'),
  ('Karang Pilang', 'Karang Pilang'),
  ('Karang Pilang', 'Kebraon'),
  ('Karang Pilang', 'Kedurus'),
  ('Karang Pilang', 'Warugunung'),
  ('Kenjeran', 'Bulak Banteng'),
  ('Kenjeran', 'Sidotopo Wetan'),
  ('Kenjeran', 'Tambak Wedi'),
  ('Kenjeran', 'Tanah Kali Kedinding'),
  ('Krembangan', 'Dupak'),
  ('Krembangan', 'Kemayoran'),
  ('Krembangan', 'Krembangan Selatan'),
  ('Krembangan', 'Morokrembangan'),
  ('Krembangan', 'Perak Barat'),
  ('Lakarsantri', 'Bangkingan'),
  ('Lakarsantri', 'Jeruk'),
  ('Lakarsantri', 'Lakarsantri'),
  ('Lakarsantri', 'Lidah Kulon'),
  ('Lakarsantri', 'Lidah Wetan'),
  ('Lakarsantri', 'Sumur Welut'),
  ('Mulyorejo', 'Dukuh Sutorejo'),
  ('Mulyorejo', 'Kalijudan'),
  ('Mulyorejo', 'Kalisari'),
  ('Mulyorejo', 'Kejawan Putih Tambak'),
  ('Mulyorejo', 'Manyar Sabrangan'),
  ('Mulyorejo', 'Mulyorejo'),
  ('Pabean Cantian', 'Bongkaran'),
  ('Pabean Cantian', 'Krembangan Utara'),
  ('Pabean Cantian', 'Nyamplungan'),
  ('Pabean Cantian', 'Perak Timur'),
  ('Pabean Cantian', 'Perak Utara'),
  ('Pakal', 'Babat Jerawat'),
  ('Pakal', 'Benowo'),
  ('Pakal', 'Pakal'),
  ('Pakal', 'Sumberejo'),
  ('Rungkut', 'Kali Rungkut'),
  ('Rungkut', 'Kedung Baruk'),
  ('Rungkut', 'Medokan Ayu'),
  ('Rungkut', 'Penjaringan Sari'),
  ('Rungkut', 'Rungkut Kidul'),
  ('Rungkut', 'Wonorejo'),
  ('Sambikerep', 'Bringin'),
  ('Sambikerep', 'Lontar'),
  ('Sambikerep', 'Made'),
  ('Sambikerep', 'Sambikerep'),
  ('Sawahan', 'Banyu Urip'),
  ('Sawahan', 'Kupang Krajan'),
  ('Sawahan', 'Pakis'),
  ('Sawahan', 'Petemon'),
  ('Sawahan', 'Putat Jaya'),
  ('Sawahan', 'Sawahan'),
  ('Semampir', 'Ampel'),
  ('Semampir', 'Pegirian'),
  ('Semampir', 'Sidotopo'),
  ('Semampir', 'Ujung'),
  ('Semampir', 'Wonokusumo'),
  ('Simokerto', 'Kapasan'),
  ('Simokerto', 'Sidodadi'),
  ('Simokerto', 'Simokerto'),
  ('Simokerto', 'Simolawang'),
  ('Simokerto', 'Tambak Rejo'),
  ('Sukolilo', 'Gebang Putih'),
  ('Sukolilo', 'Keputih'),
  ('Sukolilo', 'Klampis Ngasem'),
  ('Sukolilo', 'Medokan Semampir'),
  ('Sukolilo', 'Menur Pumpungan'),
  ('Sukolilo', 'Nginden Jangkungan'),
  ('Sukolilo', 'Semolowaru'),
  ('Sukomanunggal', 'Putat Gede'),
  ('Sukomanunggal', 'Simomulyo'),
  ('Sukomanunggal', 'Simomulyo Baru'),
  ('Sukomanunggal', 'Sono Kwijenan'),
  ('Sukomanunggal', 'Sukomanunggal'),
  ('Sukomanunggal', 'Tanjungsari'),
  ('Tambaksari', 'Gading'),
  ('Tambaksari', 'Kapas Madya Baru'),
  ('Tambaksari', 'Pacarkeling'),
  ('Tambaksari', 'Pacarkembang'),
  ('Tambaksari', 'Ploso'),
  ('Tambaksari', 'Rangkah'),
  ('Tambaksari', 'Tambaksari'),
  ('Tandes', 'Balongsari'),
  ('Tandes', 'Banjar Sugihan'),
  ('Tandes', 'Karang Poh'),
  ('Tandes', 'Manukan Kulon'),
  ('Tandes', 'Manukan Wetan'),
  ('Tandes', 'Tandes'),
  ('Tegalsari', 'Dr. Sutomo'),
  ('Tegalsari', 'Kedungdoro'),
  ('Tegalsari', 'Keputran'),
  ('Tegalsari', 'Tegalsari'),
  ('Tegalsari', 'Wonorejo'),
  ('Tenggilis Mejoyo', 'Kendangsari'),
  ('Tenggilis Mejoyo', 'Kutisari'),
  ('Tenggilis Mejoyo', 'Panjang Jiwo'),
  ('Tenggilis Mejoyo', 'Prapen'),
  ('Tenggilis Mejoyo', 'Tenggilis Mejoyo'),
  ('Wiyung', 'Babatan'),
  ('Wiyung', 'Balas Klumprik'),
  ('Wiyung', 'Jajar Tunggal'),
  ('Wiyung', 'Wiyung'),
  ('Wonocolo', 'Bendul Merisi'),
  ('Wonocolo', 'Jemur Wonosari'),
  ('Wonocolo', 'Margorejo'),
  ('Wonocolo', 'Sidosermo'),
  ('Wonocolo', 'Siwalankerto'),
  ('Wonokromo', 'Darmo'),
  ('Wonokromo', 'Jagir'),
  ('Wonokromo', 'Ngagel'),
  ('Wonokromo', 'Ngagelrejo'),
  ('Wonokromo', 'Sawunggaling'),
  ('Wonokromo', 'Wonokromo')
on conflict (kecamatan, kelurahan) do nothing;

-- ---------- Grant eksekusi RPC ----------
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = any (array[
    'brida_decide_mandate', 'brida_revoke_mandate', 'kelurahan_resubmit_registration', 'submit_innovation', 'kelurahan_review',
    'innovator_appeal', 'brida_decide_appeal', 'record_transfer', 'add_logbook_entry', 'submit_handover', 'validate_handover',
    'kelurahan_cancel', 'brida_terminate_innovation', 'report_dispute', 'brida_resolve_dispute', 'brida_blacklist_add',
    'brida_blacklist_remove', 'brida_set_parameters', 'mark_notification_read', 'mark_all_notifications_read',
    'ready_for_test', 'start_retest', 'extend_test', 'sync_due_tests', 'lurah_decide_test', 'get_test_summary',
    'survey_public_info', 'submit_survey_response', 'brida_anonymize_survey', 'verify_rapor', 'tandai_minat_pilot',
    'public_stats', 'kelurahan_tanpa_mandat', 'brida_stats']) loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
    if r.proname not in ('submit_survey_response', 'tandai_minat_pilot') then
      execute format('grant execute on function %s to authenticated', r.sig);
    end if;
    if r.proname in ('sync_due_tests', 'survey_public_info', 'verify_rapor', 'public_stats') then
      execute format('grant execute on function %s to anon', r.sig);
    end if;
  end loop;
end $$;

-- Fungsi bantu schema app dipakai oleh kebijakan RLS; tidak diekspos sebagai API.
grant execute on all functions in schema app to anon, authenticated, service_role;
