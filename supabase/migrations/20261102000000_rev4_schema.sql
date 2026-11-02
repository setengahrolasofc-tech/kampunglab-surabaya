-- Handbook Rev. 4, tahap (a): skema inti. Non-destruktif: tidak ada drop, tabel lama tetap.
-- Akun memakai public.profiles sebagai tabel pengguna; peran/status Rev. 4 ada di account_registrations.
-- Mandat Kelurahan memakai offices + office_mandates (kind='kelurahan', primary/cadangan) yang sudah ada.
-- Aturan keras: tidak ada dompet, gerbang bayar, pencairan otomatis, atau persetujuan otomatis.

create type public.rev4_account_role as enum ('INNOVATOR','KELURAHAN','BRIDA_ADMIN');
create type public.rev4_account_status as enum ('MENUNGGU_MANDAT','AKTIF','DITOLAK','DIBLOKIR');
create type public.rev4_innovation_type as enum ('PROTOTIPE','PRODUK','PROGRAM','TEKNOLOGI');
create type public.rev4_scale as enum ('KECIL_5JT','TERAPAN_15JT');
create type public.rev4_innovation_status as enum (
  'DRAFT','WAITING_KELURAHAN_MANDATE','SUBMITTED_TO_KELURAHAN','REVISION_REQUESTED','REJECTED','APPEALED',
  'APPROVED_WAITING_TERM_1','BUILDING_PHASE','COMMUNITY_TESTING','EVALUATION_TERM_2','RETEST_PENDING',
  'REFINEMENT_AND_HANDOVER','COMPLETED_PUBLISHED','STOPPED_AS_LEARNING','DISPUTED','CANCELLED_BY_KELURAHAN',
  'TERMINATED_BLACKLISTED');
create type public.rev4_fund_stage as enum ('TAHAP_1_30','TAHAP_2_30','TAHAP_3_40');
create type public.rev4_lurah_decision as enum ('LOLOS','TUNDA','GAGAL');

-- Master kelurahan: kecamatan + kelurahan, tertaut ke territories.
-- CATATAN: daftar ini masih contoh (sama dengan form daftar lama), belum dicocokkan dengan master resmi.
create table public.master_kelurahan (
  territory_id uuid primary key references public.territories(id),
  kecamatan text not null check (char_length(btrim(kecamatan)) between 1 and 80),
  kelurahan text not null check (char_length(btrim(kelurahan)) between 1 and 80),
  unique (kecamatan, kelurahan)
);
insert into public.master_kelurahan(territory_id, kecamatan, kelurahan)
select t.id, v.kec, v.kel
from (values
  ('Asemrowo','Asemrowo'),
  ('Asemrowo','Genting Kalianak'),
  ('Asemrowo','Tambak Sarioso'),
  ('Benowo','Kandangan'),
  ('Benowo','Romokalisari'),
  ('Benowo','Sememi'),
  ('Benowo','Tambak Osowilangon'),
  ('Bubutan','Alun-alun Contong'),
  ('Bubutan','Bubutan'),
  ('Bubutan','Gundih'),
  ('Bubutan','Jepara'),
  ('Bubutan','Tembok Dukuh'),
  ('Bulak','Bulak'),
  ('Bulak','Kedung Cowek'),
  ('Bulak','Kenjeran'),
  ('Bulak','Komplek Kenjeran'),
  ('Dukuh Pakis','Dukuh Kupang'),
  ('Dukuh Pakis','Dukuh Pakis'),
  ('Dukuh Pakis','Gunung Sari'),
  ('Dukuh Pakis','Pradah Kalikendal'),
  ('Gayungan','Dukuh Menanggal'),
  ('Gayungan','Gayungan'),
  ('Gayungan','Ketintang'),
  ('Gayungan','Menanggal'),
  ('Genteng','Embong Kaliasin'),
  ('Genteng','Genteng'),
  ('Genteng','Kapasari'),
  ('Genteng','Ketabang'),
  ('Genteng','Peneleh'),
  ('Gubeng','Airlangga'),
  ('Gubeng','Baratajaya'),
  ('Gubeng','Gubeng'),
  ('Gubeng','Kertajaya'),
  ('Gubeng','Mojo'),
  ('Gubeng','Pucang Sewu'),
  ('Gunung Anyar','Gunung Anyar'),
  ('Gunung Anyar','Gunung Anyar Tambak'),
  ('Gunung Anyar','Rungkut Menanggal'),
  ('Gunung Anyar','Rungkut Tengah'),
  ('Jambangan','Jambangan'),
  ('Jambangan','Karah'),
  ('Jambangan','Kebonsari'),
  ('Jambangan','Pagesangan'),
  ('Karang Pilang','Karang Pilang'),
  ('Karang Pilang','Kebraon'),
  ('Karang Pilang','Kedurus'),
  ('Karang Pilang','Warugunung'),
  ('Kenjeran','Bulak Banteng'),
  ('Kenjeran','Sidotopo Wetan'),
  ('Kenjeran','Tambak Wedi'),
  ('Kenjeran','Tanah Kali Kedinding'),
  ('Krembangan','Dupak'),
  ('Krembangan','Kemayoran'),
  ('Krembangan','Krembangan Selatan'),
  ('Krembangan','Morokrembangan'),
  ('Krembangan','Perak Barat'),
  ('Lakarsantri','Bangkingan'),
  ('Lakarsantri','Jeruk'),
  ('Lakarsantri','Lakarsantri'),
  ('Lakarsantri','Lidah Kulon'),
  ('Lakarsantri','Lidah Wetan'),
  ('Lakarsantri','Sumur Welut'),
  ('Mulyorejo','Dukuh Sutorejo'),
  ('Mulyorejo','Kalijudan'),
  ('Mulyorejo','Kalisari'),
  ('Mulyorejo','Kejawan Putih Tambak'),
  ('Mulyorejo','Manyar Sabrangan'),
  ('Mulyorejo','Mulyorejo'),
  ('Pabean Cantian','Bongkaran'),
  ('Pabean Cantian','Krembangan Utara'),
  ('Pabean Cantian','Nyamplungan'),
  ('Pabean Cantian','Perak Timur'),
  ('Pabean Cantian','Perak Utara'),
  ('Pakal','Babat Jerawat'),
  ('Pakal','Benowo'),
  ('Pakal','Pakal'),
  ('Pakal','Sumberejo'),
  ('Rungkut','Kali Rungkut'),
  ('Rungkut','Kedung Baruk'),
  ('Rungkut','Medokan Ayu'),
  ('Rungkut','Penjaringan Sari'),
  ('Rungkut','Rungkut Kidul'),
  ('Rungkut','Wonorejo'),
  ('Sambikerep','Bringin'),
  ('Sambikerep','Lontar'),
  ('Sambikerep','Made'),
  ('Sambikerep','Sambikerep'),
  ('Sawahan','Banyu Urip'),
  ('Sawahan','Kupang Krajan'),
  ('Sawahan','Pakis'),
  ('Sawahan','Petemon'),
  ('Sawahan','Putat Jaya'),
  ('Sawahan','Sawahan'),
  ('Semampir','Ampel'),
  ('Semampir','Pegirian'),
  ('Semampir','Sidotopo'),
  ('Semampir','Ujung'),
  ('Semampir','Wonokusumo'),
  ('Simokerto','Kapasan'),
  ('Simokerto','Sidodadi'),
  ('Simokerto','Simokerto'),
  ('Simokerto','Simolawang'),
  ('Simokerto','Tambak Rejo'),
  ('Sukolilo','Gebang Putih'),
  ('Sukolilo','Keputih'),
  ('Sukolilo','Klampis Ngasem'),
  ('Sukolilo','Medokan Semampir'),
  ('Sukolilo','Menur Pumpungan'),
  ('Sukolilo','Nginden Jangkungan'),
  ('Sukolilo','Semolowaru'),
  ('Sukomanunggal','Putat Gede'),
  ('Sukomanunggal','Simomulyo'),
  ('Sukomanunggal','Simomulyo Baru'),
  ('Sukomanunggal','Sono Kwijenan'),
  ('Sukomanunggal','Sukomanunggal'),
  ('Sukomanunggal','Tanjungsari'),
  ('Tambaksari','Gading'),
  ('Tambaksari','Kapas Madya Baru'),
  ('Tambaksari','Pacarkeling'),
  ('Tambaksari','Pacarkembang'),
  ('Tambaksari','Ploso'),
  ('Tambaksari','Rangkah'),
  ('Tambaksari','Tambaksari'),
  ('Tandes','Balongsari'),
  ('Tandes','Banjar Sugihan'),
  ('Tandes','Karang Poh'),
  ('Tandes','Manukan Kulon'),
  ('Tandes','Manukan Wetan'),
  ('Tandes','Tandes'),
  ('Tegalsari','Dr. Sutomo'),
  ('Tegalsari','Kedungdoro'),
  ('Tegalsari','Keputran'),
  ('Tegalsari','Tegalsari'),
  ('Tegalsari','Wonorejo'),
  ('Tenggilis Mejoyo','Kendangsari'),
  ('Tenggilis Mejoyo','Kutisari'),
  ('Tenggilis Mejoyo','Panjang Jiwo'),
  ('Tenggilis Mejoyo','Prapen'),
  ('Tenggilis Mejoyo','Tenggilis Mejoyo'),
  ('Wiyung','Babatan'),
  ('Wiyung','Balas Klumprik'),
  ('Wiyung','Jajar Tunggal'),
  ('Wiyung','Wiyung'),
  ('Wonocolo','Bendul Merisi'),
  ('Wonocolo','Jemur Wonosari'),
  ('Wonocolo','Margorejo'),
  ('Wonocolo','Sidosermo'),
  ('Wonocolo','Siwalankerto'),
  ('Wonokromo','Darmo'),
  ('Wonokromo','Jagir'),
  ('Wonokromo','Ngagel'),
  ('Wonokromo','Ngagelrejo'),
  ('Wonokromo','Sawunggaling'),
  ('Wonokromo','Wonokromo')
) as v(kec,kel)
join public.territories t on t.kind='kelurahan' and t.parent_id is null
  and t.code='SBY-'||private.area_slug(v.kec)||'-'||private.area_slug(v.kel)
on conflict do nothing;

create table public.account_registrations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.rev4_account_role not null,
  status public.rev4_account_status not null default 'MENUNGGU_MANDAT',
  phone_wa text not null check (phone_wa ~ '^\+?[0-9]{9,15}$'),
  institution text check (institution is null or char_length(btrim(institution)) between 2 and 120),
  city text check (city is null or char_length(btrim(city)) between 2 and 80),
  nip text check (nip is null or nip ~ '^[0-9]{8,24}$'),
  jabatan text check (jabatan is null or char_length(btrim(jabatan)) between 2 and 120),
  kelurahan_id uuid references public.master_kelurahan(territory_id),
  sk_path text check (sk_path is null or char_length(sk_path) <= 300),
  review_note text check (review_note is null or char_length(review_note) <= 500),
  fix_requested boolean not null default false,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role <> 'INNOVATOR' or (institution is not null and city is not null)),
  check (role <> 'KELURAHAN' or (nip is not null and jabatan is not null and kelurahan_id is not null)),
  check (role = 'KELURAHAN' or kelurahan_id is null)
);
create index account_registrations_queue on public.account_registrations(status, role, created_at);
create index account_registrations_kelurahan on public.account_registrations(kelurahan_id) where kelurahan_id is not null;
create index account_registrations_reviewer on public.account_registrations(reviewed_by) where reviewed_by is not null;

create table public.system_parameters (
  key text primary key check (key ~ '^[a-z0-9_]{3,60}$'),
  value jsonb not null,
  description text not null default '',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
insert into public.system_parameters(key, value, description) values
  ('plafon_skala_kecil', '5000000', 'Plafon maksimal Skala Kecil (rupiah)'),
  ('plafon_skala_terapan', '15000000', 'Plafon maksimal Skala Terapan (rupiah)'),
  ('durasi_bangun_kecil_hari', '30', 'Durasi bangun Skala Kecil (hari kalender)'),
  ('durasi_bangun_terapan_hari', '60', 'Durasi bangun Skala Terapan (hari kalender)'),
  ('porsi_pencairan_persen', '[30,30,40]', 'Porsi pencairan Tahap 1, 2, 3 (persen)'),
  ('dana_tak_terduga_maks_persen', '10', 'Dana tak terduga maksimal dari total RAB (persen)'),
  ('honor_maks_persen', '15', 'Honor Tim Inovator maksimal dari total RAB (persen)'),
  ('perawatan_min_bulan', '6', 'Rencana perawatan minimal (bulan)'),
  ('perawatan_maks_bulan', '12', 'Rencana perawatan maksimal (bulan)'),
  ('durasi_uji_hari', '14', 'Masa uji warga standar (hari kalender)'),
  ('perpanjangan_uji_hari', '7', 'Perpanjangan masa uji, satu kali (hari)'),
  ('ambang_responden_min', '30', 'Responden unik minimal'),
  ('ambang_rating_min', '3.8', 'Rata-rata rating minimal (skala 1-5)'),
  ('ambang_membantu_min_persen', '75', 'Persentase "Ya" minimal'),
  ('ambang_foto_min_persen', '80', 'Persentase responden dengan foto minimal'),
  ('anggota_tim_min', '2', 'Anggota tim minimal'),
  ('anggota_tim_maks', '6', 'Anggota tim maksimal')
on conflict do nothing;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  aktor_id uuid,
  aksi text not null check (char_length(aksi) between 2 and 80),
  target text not null check (char_length(target) <= 200),
  detail_json jsonb not null default '{}'::jsonb,
  waktu timestamptz not null default clock_timestamp()
);
create index audit_logs_waktu on public.audit_logs(waktu desc);

create table public.rev4_notifications (
  id uuid primary key default gen_random_uuid(),
  untuk_user_id uuid not null references public.profiles(id) on delete cascade,
  untuk_role public.rev4_account_role,
  tipe text not null check (tipe in (
    'kelurahan_tanpa_mandat','mandat_kosong','pendaftar_baru','mandat_diberikan','mandat_ditolak',
    'mandat_perbaikan','mandat_dicabut','pengajuan_diteruskan','pengajuan_menunggu_mandat')),
  pesan text not null check (char_length(pesan) between 1 and 400),
  ref_id uuid,
  tautan text check (tautan is null or tautan ~ '^/[a-z0-9/_-]*$'),
  dibaca boolean not null default false,
  dibuat_pada timestamptz not null default clock_timestamp()
);
create index rev4_notifications_inbox on public.rev4_notifications(untuk_user_id, dibaca, dibuat_pada desc);

create table public.problem_boards (
  id uuid primary key default gen_random_uuid(),
  kelurahan_id uuid not null references public.master_kelurahan(territory_id),
  created_by uuid not null references public.profiles(id),
  judul_masalah text not null check (char_length(btrim(judul_masalah)) between 5 and 160),
  kategori_tema text not null check (char_length(btrim(kategori_tema)) between 2 and 60),
  deskripsi_lokasi_rt_rw text not null check (char_length(btrim(deskripsi_lokasi_rt_rw)) between 2 and 300),
  kontak_wa_narahubung text check (kontak_wa_narahubung is null or kontak_wa_narahubung ~ '^\+?[0-9]{9,15}$'),
  status text not null default 'OPEN' check (status in ('OPEN','SOLVED')),
  solved_by_innovation_id uuid,
  created_at timestamptz not null default now()
);
create index problem_boards_kelurahan on public.problem_boards(kelurahan_id, status);
create index problem_boards_creator on public.problem_boards(created_by);

create table public.innovations (
  id uuid primary key default gen_random_uuid(),
  kode_unik text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  leader_user_id uuid not null references public.profiles(id),
  kelurahan_target_id uuid not null references public.master_kelurahan(territory_id),
  problem_board_id uuid references public.problem_boards(id),
  judul text not null check (char_length(btrim(judul)) between 5 and 160),
  tipe_inovasi public.rev4_innovation_type not null,
  skala_plafon public.rev4_scale not null,
  total_rab bigint not null default 0 check (total_rab >= 0),
  target_rt_rw text not null default '' check (char_length(target_rt_rw) <= 300),
  prd_url text, rab_url text, surat_keaslian_url text, surat_kesepakatan_url text,
  status public.rev4_innovation_status not null default 'DRAFT',
  status_before_dispute public.rev4_innovation_status,
  dispute_flag boolean not null default false,
  dispute_reason text check (dispute_reason is null or char_length(dispute_reason) <= 1000),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Plafon mengikuti tipe (Bab 8.2): PROGRAM/PRODUK -> Rp5 jt, PROTOTIPE/TEKNOLOGI -> Rp15 jt.
  check ((tipe_inovasi in ('PROGRAM','PRODUK') and skala_plafon = 'KECIL_5JT' and total_rab <= 5000000)
      or (tipe_inovasi in ('PROTOTIPE','TEKNOLOGI') and skala_plafon = 'TERAPAN_15JT' and total_rab <= 15000000))
);
create index innovations_leader on public.innovations(leader_user_id);
create index innovations_kelurahan_status on public.innovations(kelurahan_target_id, status);
create index innovations_problem on public.innovations(problem_board_id) where problem_board_id is not null;
alter table public.problem_boards add constraint problem_boards_solved_by foreign key (solved_by_innovation_id) references public.innovations(id);
create index problem_boards_solved on public.problem_boards(solved_by_innovation_id) where solved_by_innovation_id is not null;

create table public.innovation_members (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  user_id uuid references public.profiles(id),
  nama_anggota text not null check (char_length(btrim(nama_anggota)) between 2 and 100),
  peran_dalam_tim text not null check (char_length(btrim(peran_dalam_tim)) between 2 and 100),
  institusi_asal text not null check (char_length(btrim(institusi_asal)) between 2 and 120),
  kota_domisili text not null check (char_length(btrim(kota_domisili)) between 2 and 80),
  jenjang_pendidikan text not null check (jenjang_pendidikan in ('SMA_SMK','D3','S1','S2','S3','LAINNYA_DEWASA'))
);
create index innovation_members_innovation on public.innovation_members(innovation_id);
create index innovation_members_user on public.innovation_members(user_id) where user_id is not null;

create table public.logbooks_and_funds (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  tahap public.rev4_fund_stage,
  nominal_cair bigint check (nominal_cair is null or nominal_cair > 0),
  bukti_transfer_url text,
  deskripsi_progres text check (deskripsi_progres is null or char_length(deskripsi_progres) <= 2000),
  nota_belanja_url text, bast_url text, panduan_url text, lpj_akhir_url text,
  dicatat_oleh uuid not null references public.profiles(id),
  verified_by_lurah_at timestamptz,
  created_at timestamptz not null default now(),
  -- Satu pencatatan transfer per tahap. Baris logbook biasa tidak mengisi tahap.
  unique (innovation_id, tahap)
);
create index logbooks_innovation on public.logbooks_and_funds(innovation_id);
create index logbooks_recorder on public.logbooks_and_funds(dicatat_oleh);

-- Pengganti testing_integrations Rev. 4 lama: tanpa gform/gsheet/CSV. Data uji ada di survey_responses.
create table public.testing_integrations (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  survey_code text not null unique,
  qr_poster_url text,
  test_start_date timestamptz,
  test_end_date timestamptz,
  is_extended boolean not null default false,
  total_valid_respondents integer not null default 0,
  avg_rating numeric(3,2),
  helpful_percentage numeric(5,2),
  photo_valid_percentage numeric(5,2),
  is_eligible_standard boolean not null default false,
  lurah_decision public.rev4_lurah_decision,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index testing_innovation on public.testing_integrations(innovation_id);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  nama text not null check (char_length(btrim(nama)) between 2 and 100),
  usia smallint not null check (usia between 5 and 110),
  tempat_tinggal text not null check (char_length(btrim(tempat_tinggal)) between 2 and 200),
  kecamatan text not null, kelurahan text not null,
  rt text not null check (rt ~ '^[0-9]{1,3}$'), rw text not null check (rw ~ '^[0-9]{1,3}$'),
  foto_url text,
  rating smallint not null check (rating between 1 and 5),
  membantu boolean not null,
  dedupe_key text not null,
  ip_hash text not null,
  dibuat_pada timestamptz not null default clock_timestamp(),
  unique (innovation_id, dedupe_key)
);
create index survey_responses_innovation on public.survey_responses(innovation_id, dibuat_pada);
create index survey_responses_ip on public.survey_responses(innovation_id, ip_hash, dibuat_pada);

create table public.evidence_passports (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null unique references public.innovations(id),
  passport_code text not null unique,
  data_snapshot_json jsonb not null,
  sha256_hash text not null check (sha256_hash ~ '^[0-9a-f]{64}$'),
  published_at timestamptz not null default now(),
  pilot_interest_count integer not null default 0 check (pilot_interest_count >= 0)
);

-- Mesin status (Bab 8.1): pasangan transisi yang sah. Peran pelaku diperiksa oleh RPC tiap tahap; tabel ini
-- dan pemicu di bawahnya memastikan tidak ada lompatan status ilegal lewat jalur mana pun.
create table public.rev4_status_transitions (
  from_status public.rev4_innovation_status not null,
  to_status public.rev4_innovation_status not null,
  primary key (from_status, to_status)
);
insert into public.rev4_status_transitions values
  ('DRAFT','SUBMITTED_TO_KELURAHAN'),('DRAFT','WAITING_KELURAHAN_MANDATE'),
  ('WAITING_KELURAHAN_MANDATE','SUBMITTED_TO_KELURAHAN'),
  ('SUBMITTED_TO_KELURAHAN','REVISION_REQUESTED'),('SUBMITTED_TO_KELURAHAN','REJECTED'),
  ('SUBMITTED_TO_KELURAHAN','APPROVED_WAITING_TERM_1'),
  ('REVISION_REQUESTED','SUBMITTED_TO_KELURAHAN'),('REVISION_REQUESTED','WAITING_KELURAHAN_MANDATE'),
  ('REJECTED','APPEALED'),('APPEALED','SUBMITTED_TO_KELURAHAN'),('APPEALED','REJECTED'),
  ('APPROVED_WAITING_TERM_1','BUILDING_PHASE'),
  ('BUILDING_PHASE','COMMUNITY_TESTING'),
  ('COMMUNITY_TESTING','EVALUATION_TERM_2'),
  ('EVALUATION_TERM_2','REFINEMENT_AND_HANDOVER'),('EVALUATION_TERM_2','RETEST_PENDING'),
  ('EVALUATION_TERM_2','STOPPED_AS_LEARNING'),
  ('RETEST_PENDING','COMMUNITY_TESTING'),
  ('REFINEMENT_AND_HANDOVER','COMPLETED_PUBLISHED'),
  ('APPROVED_WAITING_TERM_1','CANCELLED_BY_KELURAHAN'),('BUILDING_PHASE','CANCELLED_BY_KELURAHAN'),
  ('COMMUNITY_TESTING','CANCELLED_BY_KELURAHAN'),('EVALUATION_TERM_2','CANCELLED_BY_KELURAHAN'),
  ('RETEST_PENDING','CANCELLED_BY_KELURAHAN'),('REFINEMENT_AND_HANDOVER','CANCELLED_BY_KELURAHAN'),
  ('BUILDING_PHASE','TERMINATED_BLACKLISTED'),('COMMUNITY_TESTING','TERMINATED_BLACKLISTED'),
  ('EVALUATION_TERM_2','TERMINATED_BLACKLISTED'),('RETEST_PENDING','TERMINATED_BLACKLISTED'),
  ('REFINEMENT_AND_HANDOVER','TERMINATED_BLACKLISTED'),('DISPUTED','TERMINATED_BLACKLISTED'),
  ('DISPUTED','CANCELLED_BY_KELURAHAN');
-- Sengketa: dari status aktif mana pun ke DISPUTED, lalu kembali ke status asal (disimpan di status_before_dispute).
insert into public.rev4_status_transitions
select a, 'DISPUTED' from unnest(array['SUBMITTED_TO_KELURAHAN','APPROVED_WAITING_TERM_1','BUILDING_PHASE',
  'COMMUNITY_TESTING','EVALUATION_TERM_2','RETEST_PENDING','REFINEMENT_AND_HANDOVER']::public.rev4_innovation_status[]) a;
insert into public.rev4_status_transitions
select 'DISPUTED', a from unnest(array['SUBMITTED_TO_KELURAHAN','APPROVED_WAITING_TERM_1','BUILDING_PHASE',
  'COMMUNITY_TESTING','EVALUATION_TERM_2','RETEST_PENDING','REFINEMENT_AND_HANDOVER']::public.rev4_innovation_status[]) a;
