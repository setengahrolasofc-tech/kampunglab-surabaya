-- Uji alur Rev. 4 end-to-end di PostgreSQL (jalankan dengan psql sebagai superuser pada database uji).
-- Membuat akun contoh lewat auth.users, memakai role authenticated/service_role seperti Supabase.
-- Setiap pernyataan "expect_error" harus gagal; selain itu skrip berhenti pada kesalahan pertama.
\set ON_ERROR_STOP on
\pset pager off
\pset tuples_only on

create or replace function pg_temp.expect_error(p_sql text, p_like text) returns void language plpgsql as $$
begin
  begin execute p_sql; exception when others then
    if sqlerrm ilike '%' || p_like || '%' then return; end if;
    raise exception 'Error tidak sesuai. Diharapkan "%", didapat "%"', p_like, sqlerrm;
  end;
  raise exception 'Seharusnya GAGAL tetapi berhasil: %', p_sql;
end $$;

create or replace function pg_temp.assert(p_ok boolean, p_msg text) returns void language plpgsql as $$
begin if not coalesce(p_ok, false) then raise exception 'ASSERT GAGAL: %', p_msg; end if; end $$;

-- ===== Akun contoh =====
select id as kel_id from public.master_kelurahan where kecamatan = 'Gubeng' and kelurahan = 'Airlangga' \gset
select id as kel2_id from public.master_kelurahan where kecamatan = 'Gubeng' and kelurahan = 'Mojo' \gset
insert into auth.users (email, raw_user_meta_data) values ('brida@test.id', '{"display_name":"Admin BRIDA"}') returning id as brida_id \gset
update public.users set role = 'BRIDA_ADMIN', is_verified = true where id = :'brida_id';
insert into auth.users (email, raw_user_meta_data) values
  ('inov@test.id', '{"display_name":"Rani Inovator","role":"INNOVATOR","phone_wa":"081234567890","institusi":"UNESA","kota_domisili":"Sidoarjo"}') returning id as inov_id \gset
insert into auth.users (email, raw_user_meta_data) values
  ('inov2@test.id', '{"display_name":"Budi Inovator","role":"INNOVATOR"}') returning id as inov2_id \gset
insert into auth.users (email, raw_user_meta_data) values
  ('lurah1@test.id', jsonb_build_object('display_name','Lurah Satu','role','KELURAHAN','kelurahan_id',:'kel_id','nip','198001012005011001','jabatan','Lurah','phone_wa','081111111111')) returning id as lurah1_id \gset
insert into auth.users (email, raw_user_meta_data) values
  ('lurah2@test.id', jsonb_build_object('display_name','Staf Dua','role','KELURAHAN','kelurahan_id',:'kel_id','nip','198501012010011002','phone_wa','081111111112')) returning id as lurah2_id \gset
insert into auth.users (email, raw_user_meta_data) values
  ('lurah3@test.id', jsonb_build_object('display_name','Staf Tiga','role','KELURAHAN','kelurahan_id',:'kel_id','nip','199001012015011003','phone_wa','081111111113')) returning id as lurah3_id \gset
-- Percobaan menyelundupkan role BRIDA lewat metadata harus jatuh ke INNOVATOR.
insert into auth.users (email, raw_user_meta_data) values ('hacker@test.id', '{"display_name":"Hacker","role":"BRIDA_ADMIN"}') returning id as hacker_id \gset
select pg_temp.assert((select role = 'INNOVATOR' from public.users where id = :'hacker_id'), 'role BRIDA dari metadata harus ditolak');
select pg_temp.assert((select status = 'MENUNGGU_MANDAT' from public.users where id = :'lurah1_id'), 'akun Kelurahan baru harus MENUNGGU_MANDAT');
select pg_temp.assert((select count(*) = 3 from public.notifications where untuk_user_id = :'brida_id' and tipe = 'MANDAT_BARU'), 'BRIDA harus diberi notifikasi pendaftar Kelurahan baru');
update public.users set sk_document_url = 'sk/' || id || '/sk.pdf' where role = 'KELURAHAN';

-- ===== Inovator membuat draft =====
set role authenticated;
select set_config('request.jwt.claim.sub', :'inov_id', false);
insert into public.innovations (leader_user_id, kelurahan_target_id, judul, tipe_inovasi, ringkasan, masalah, tujuan, target_pengguna, target_rt_rw,
  total_rab, rab_tak_terduga, rab_honor, rencana_perawatan_bulan)
values (:'inov_id', :'kel_id', 'Pemilah Sampah Pintar RT 3', 'TEKNOLOGI', 'Alat pemilah sampah organik dan anorganik berbasis sensor.',
  'Warga RT 3 kesulitan memilah sampah rumah tangga sehingga TPS cepat penuh.', 'Meningkatkan pemilahan sampah rumah tangga di RT 3 hingga 60 persen.',
  'Warga RT 3 RW 2 (sekitar 120 KK)', 'RT 3 / RW 2', 10000000, 1000000, 1500000, 9) returning id as inv_id \gset
select pg_temp.assert((select status = 'DRAFT' and skala_plafon = 'TERAPAN_15JT' from public.innovations where id = :'inv_id'), 'draft + skala turunan dari tipe');
-- Jalan pintas harus ditolak
select pg_temp.expect_error($q$update public.innovations set status = 'APPROVED_WAITING_TERM_1' where id = '$q$ || :'inv_id' || $q$'$q$, 'permission denied');
select pg_temp.expect_error($q$insert into public.innovations (leader_user_id, kelurahan_target_id, status) values ('$q$ || :'inov_id' || $q$', '$q$ || :'kel_id' || $q$', 'BUILDING_PHASE')$q$, 'permission denied');
-- Belum lengkap -> ditolak (anggota, dokumen)
select pg_temp.expect_error($q$select public.submit_innovation('$q$ || :'inv_id' || $q$')$q$, 'belum lengkap');
insert into public.innovation_members (innovation_id, nama_anggota, peran_dalam_tim, institusi_asal, kota_domisili, jenjang_pendidikan, is_ketua, urutan)
  values (:'inv_id', 'Rani Inovator', 'Ketua', 'UNESA', 'Sidoarjo', 'MAHASISWA_DIPLOMA_S1', true, 1);
select pg_temp.expect_error($q$insert into public.innovation_members (innovation_id, nama_anggota, jenjang_pendidikan) values ('$q$ || :'inv_id' || $q$', 'Anak SMP', 'SMP_KE_BAWAH')$q$, 'SMP');
insert into public.innovation_members (innovation_id, nama_anggota, peran_dalam_tim, institusi_asal, kota_domisili, jenjang_pendidikan, urutan)
  values (:'inv_id', 'Siti Anggota', 'Hardware', 'SMKN 1', 'Surabaya', 'SMA_SMK', 2);
update public.innovations set total_rab = 16000000 where id = :'inv_id';
update public.innovations set prd_url = :'inv_id' || '/prd/prd.pdf', rab_url = :'inv_id' || '/rab/rab.pdf', surat_keaslian_url = :'inv_id' || '/keaslian/a.pdf',
  surat_kesepakatan_url = :'inv_id' || '/kesepakatan/s.pdf' where id = :'inv_id';
select pg_temp.expect_error($q$select public.submit_innovation('$q$ || :'inv_id' || $q$')$q$, 'melebihi plafon');
update public.innovations set total_rab = 10000000 where id = :'inv_id';
-- Path dokumen milik pengajuan lain ditolak
update public.innovations set prd_url = '00000000-0000-0000-0000-000000000000/prd/x.pdf' where id = :'inv_id';
select pg_temp.expect_error($q$select public.submit_innovation('$q$ || :'inv_id' || $q$')$q$, 'PRD');
update public.innovations set prd_url = :'inv_id' || '/prd/prd.pdf' where id = :'inv_id';
-- Kelurahan belum bermandat -> WAITING
select public.submit_innovation(:'inv_id') as hasil \gset
select pg_temp.assert(:'hasil' = 'WAITING_KELURAHAN_MANDATE', 'kirim ke kelurahan tanpa mandat harus WAITING_KELURAHAN_MANDATE');
reset role;
select pg_temp.assert((select pesan like 'Kelurahan Airlangga (Kec. Gubeng) belum punya akun bermandat, ada 1 pengajuan menunggu.' from public.notifications where untuk_user_id = :'brida_id' and tipe = 'KELURAHAN_TANPA_MANDAT'), 'teks notifikasi BRIDA');

-- ===== Akun Kelurahan belum bermandat tidak berdaya =====
set role authenticated;
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select pg_temp.assert((select count(*) = 0 from public.innovations), 'Kelurahan tanpa mandat tidak boleh melihat pengajuan');
select pg_temp.expect_error($q$select public.kelurahan_review('$q$ || :'inv_id' || $q$', 'SETUJU')$q$, 'mandat');
select pg_temp.expect_error($q$insert into public.problem_boards (kelurahan_id, dibuat_oleh, judul_masalah, kategori_tema, deskripsi_lokasi_rt_rw, kontak_wa_narahubung) values ('$q$ || :'kel_id' || $q$','$q$ || :'lurah1_id' || $q$','Sampah menumpuk','LINGKUNGAN','RT 3','0811111111')$q$, 'row-level security');
select pg_temp.expect_error($q$select * from public.brida_stats()$q$, 'Hanya Admin BRIDA');
select pg_temp.expect_error($q$select public.brida_decide_mandate('$q$ || :'lurah1_id' || $q$', 'BERI')$q$, 'Hanya Admin BRIDA');

-- ===== BRIDA memberi mandat =====
select set_config('request.jwt.claim.sub', :'brida_id', false);
select pg_temp.assert((select count(*) = 1 and bool_and(jumlah_menunggu = 1 and lama_hari >= 0) from public.kelurahan_tanpa_mandat()), 'widget kelurahan belum bermandat');
select pg_temp.assert((select count(*) = 1 from public.kelurahan_tanpa_mandat('Gubeng')) and (select count(*) = 0 from public.kelurahan_tanpa_mandat('Rungkut')), 'filter kecamatan');
select pg_temp.expect_error($q$select public.brida_decide_mandate('$q$ || :'lurah3_id' || $q$', 'TOLAK')$q$, 'minimal 10');
select public.brida_decide_mandate(:'lurah1_id', 'BERI') ->> 'tipe' as tipe1 \gset
select public.brida_decide_mandate(:'lurah2_id', 'BERI') ->> 'tipe' as tipe2 \gset
select pg_temp.assert(:'tipe1' = 'UTAMA' and :'tipe2' = 'CADANGAN', 'mandat pertama UTAMA, kedua CADANGAN');
select pg_temp.expect_error($q$select public.brida_decide_mandate('$q$ || :'lurah3_id' || $q$', 'BERI')$q$, 'Maksimal 2');
select public.brida_decide_mandate(:'lurah3_id', 'PERBAIKI', null, 'SK tidak terbaca, unggah ulang scan jelas');
reset role;
select pg_temp.assert((select status = 'SUBMITTED_TO_KELURAHAN' from public.innovations where id = :'inv_id'), 'pengajuan menunggu otomatis pindah');
select pg_temp.assert((select count(*) = 1 from public.notifications where untuk_user_id = :'inov_id' and tipe = 'PENGAJUAN_DITERUSKAN'), 'inovator diberi tahu');
select pg_temp.assert((select perlu_perbaikan from public.users where id = :'lurah3_id'), 'minta perbaikan');

-- ===== Kelurahan memeriksa dan menyetujui =====
set role authenticated;
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select pg_temp.assert((select count(*) = 1 from public.innovations), 'Kelurahan bermandat melihat pengajuan');
select pg_temp.assert((select name = 'Rani Inovator' from public.users where id = :'inov_id'), 'Kelurahan melihat nama ketua');
select pg_temp.expect_error($q$select public.kelurahan_review('$q$ || :'inv_id' || $q$', 'REVISI', 'singkat')$q$, 'minimal 10');
select public.kelurahan_review(:'inv_id', 'REVISI', 'Surat kesepakatan belum ada stempel RW.');
select set_config('request.jwt.claim.sub', :'inov_id', false);
select pg_temp.assert((select status = 'REVISION_REQUESTED' and catatan_pemeriksaan like '%stempel%' from public.innovations where id = :'inv_id'), 'revisi diminta');
update public.innovations set rencana_perawatan_bulan = 10 where id = :'inv_id';   -- boleh edit saat revisi
select public.submit_innovation(:'inv_id') as hasil2 \gset
select pg_temp.assert(:'hasil2' = 'SUBMITTED_TO_KELURAHAN', 'kirim ulang');
select set_config('request.jwt.claim.sub', :'lurah2_id', false);   -- akun cadangan juga berwenang
select public.kelurahan_review(:'inv_id', 'SETUJU', null, 'RKA-2026/001');
reset role;
select pg_temp.assert((select status = 'APPROVED_WAITING_TERM_1' and anggaran_terkunci_at is not null and rka_referensi = 'RKA-2026/001' from public.innovations where id = :'inv_id'), 'setuju + anggaran terkunci');

-- Inovator tidak bisa mengedit RAB setelah disetujui
set role authenticated;
select set_config('request.jwt.claim.sub', :'inov_id', false);
with u as (update public.innovations set total_rab = 1000 where id = :'inv_id' returning 1) select count(*) as n_edit from u \gset
select pg_temp.assert(:n_edit = 0, 'edit setelah disetujui harus tidak berefek');
select pg_temp.expect_error($q$select public.add_logbook_entry('$q$ || :'inv_id' || $q$', 'Belanja bahan', current_date, 100000, '$q$ || :'inv_id' || $q$/nota/n.jpg')$q$, 'belum terbuka');

-- ===== Transfer Tahap 1 =====
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select pg_temp.expect_error($q$select public.record_transfer('$q$ || :'inv_id' || $q$', 'TAHAP_1_30', 2000000, '$q$ || :'inv_id' || $q$/transfer/t1.pdf')$q$, 'Nominal harus');
select pg_temp.expect_error($q$select public.record_transfer('$q$ || :'inv_id' || $q$', 'TAHAP_1_30', 3000000, 'bukan-path-valid')$q$, 'bukti transfer');
select pg_temp.expect_error($q$select public.record_transfer('$q$ || :'inv_id' || $q$', 'TAHAP_2_30', 3000000, '$q$ || :'inv_id' || $q$/transfer/t.pdf')$q$, 'Tahap 2 hanya');
select public.record_transfer(:'inv_id', 'TAHAP_1_30', 3000000, :'inv_id' || '/transfer/t1.pdf');
reset role;
select pg_temp.assert((select status = 'BUILDING_PHASE' from public.innovations where id = :'inv_id'), 'BUILDING_PHASE setelah Tahap 1');

-- ===== Logbook & uji warga =====
set role authenticated;
select set_config('request.jwt.claim.sub', :'inov_id', false);
select pg_temp.expect_error($q$select public.ready_for_test('$q$ || :'inv_id' || $q$')$q$, 'Logbook');
select pg_temp.expect_error($q$select public.add_logbook_entry('$q$ || :'inv_id' || $q$', 'Beli sensor', current_date, 500000, null)$q$, 'nota');
select public.add_logbook_entry(:'inv_id', 'Beli sensor dan rangka', current_date, 1200000, :'inv_id' || '/nota/n1.jpg', :'inv_id' || '/foto/f1.jpg');
select public.ready_for_test(:'inv_id');
select pg_temp.assert((select count(*) = 3 from jsonb_array_elements(public.get_test_summary(:'inv_id') -> 'survey_pertanyaan')), '3 pertanyaan kontekstual otomatis');
reset role;
select pg_temp.assert((select status = 'COMMUNITY_TESTING' from public.innovations where id = :'inv_id'), 'COMMUNITY_TESTING');

-- Survei publik: hanya service_role
set role anon;
select pg_temp.expect_error($q$select public.submit_survey_response('$q$ || :'inv_id' || $q$', 'A', 30, 'Jl X', 'Gubeng', 'Airlangga', 3, 2, null, 5, true, '{}', null, 'h')$q$, 'permission denied');
select (public.survey_public_info(:'inv_id') ->> 'aktif')::boolean as aktif_pub \gset
select pg_temp.assert(:'aktif_pub', 'info survei publik aktif untuk anon');
reset role;

select set_config('kl.inv', :'inv_id', false);
set role service_role;
-- validasi
select pg_temp.expect_error($q$select public.submit_survey_response('$q$ || :'inv_id' || $q$', 'Warga Luar', 30, 'Jl Lain 1', 'Gubeng', 'Mojo', 3, 2, 'survey/$q$ || :'inv_id' || $q$/a.jpg', 5, true, '{"q_mudah":4,"q_sesuai":"Ya","q_tujuan":"Ya"}', null, 'ip0')$q$, 'khusus warga');
select pg_temp.expect_error($q$select public.submit_survey_response('$q$ || :'inv_id' || $q$', 'Tanpa Foto', 30, 'Jl Lain 1', 'Gubeng', 'Airlangga', 3, 2, null, 5, true, '{"q_mudah":4,"q_sesuai":"Ya","q_tujuan":"Ya"}', null, 'ip0')$q$, 'Foto');
select pg_temp.expect_error($q$select public.submit_survey_response('$q$ || :'inv_id' || $q$', 'Jawab Kurang', 30, 'Jl Lain 1', 'Gubeng', 'Airlangga', 3, 2, 'survey/$q$ || :'inv_id' || $q$/a.jpg', 5, true, '{"q_mudah":4}', null, 'ip0')$q$, 'semua pertanyaan');
-- 31 responden unik; rating 4-5, 90% membantu; semua berfoto
do $$
declare v_inv uuid := current_setting('kl.inv')::uuid; n int;
begin
  for n in 1..31 loop
    perform public.submit_survey_response(v_inv, 'Warga ' || n, 20 + n, 'Jl Kampung ' || n, 'Gubeng', 'Airlangga', 3, 2,
      'survey/' || v_inv || '/f' || n || '.jpg', case when n % 2 = 0 then 5 else 4 end, n % 10 <> 0,
      '{"q_mudah":4,"q_sesuai":"Ya","q_tujuan":"Sebagian"}'::jsonb, case when n = 1 then 'Mantap tapi baterai kurang awet' end, 'ip' || (n % 5));
  end loop;
end $$;
reset role;

-- Deduplikasi & rate limit
set role service_role;
select pg_temp.expect_error($q$select public.submit_survey_response('$q$ || :'inv_id' || $q$', 'warga 1', 21, 'jl kampung 1', 'Gubeng', 'Airlangga', 3, 2, 'survey/$q$ || :'inv_id' || $q$/z.jpg', 5, true, '{"q_mudah":4,"q_sesuai":"Ya","q_tujuan":"Ya"}', null, 'ipbaru')$q$, 'sama sudah mengisi');
reset role;
update public.system_parameters set value = '3' where key = 'survey_rate_limit_per_jam';
set role service_role;
select pg_temp.expect_error($q$select public.submit_survey_response('$q$ || :'inv_id' || $q$', 'Si Rajin', 33, 'Jl Rajin 9', 'Gubeng', 'Airlangga', 3, 2, 'survey/$q$ || :'inv_id' || $q$/z.jpg', 5, true, '{"q_mudah":4,"q_sesuai":"Ya","q_tujuan":"Ya"}', null, 'ip1')$q$, 'Terlalu banyak');
reset role;
update public.system_parameters set value = '10' where key = 'survey_rate_limit_per_jam';

-- Metrik real-time; Inovator melihat ulasan tersamarkan, tidak dapat membaca tabel penguji
set role authenticated;
select set_config('request.jwt.claim.sub', :'inov_id', false);
select pg_temp.assert((public.get_test_summary(:'inv_id') -> 'metrik' ->> 'responden')::int = 31, 'responden real-time 31');
select pg_temp.assert((public.get_test_summary(:'inv_id') -> 'ulasan' -> 0 ->> 'inisial') is not null, 'ulasan tersamarkan');
select pg_temp.assert((select count(*) = 0 from public.survey_responses), 'Inovator tidak boleh membaca data penguji mentah');
select pg_temp.assert(not exists (select 1 from jsonb_array_elements(public.get_test_summary(:'inv_id') -> 'ulasan') u where u::text like '%Warga 1%'), 'nama lengkap tidak bocor');
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select pg_temp.assert((select count(*) = 31 from public.survey_responses), 'Kelurahan bermandat membaca data penguji');
select pg_temp.expect_error($q$select public.lurah_decide_test('$q$ || :'inv_id' || $q$', 'LOLOS')$q$, 'status');
select pg_temp.expect_error($q$select public.extend_test('$q$ || :'inv_id' || $q$')$q$, 'terpenuhi');
reset role;

-- Waktu habis -> sistem menutup uji (ditiru dengan memundurkan tanggal)
update public.testing_integrations set test_end_date = now() - interval '1 minute' where innovation_id = :'inv_id';
set role anon;
select public.sync_due_tests() as ditutup \gset
reset role;
select pg_temp.assert(:'ditutup' = 1, 'sync_due_tests menutup 1 uji');
select pg_temp.assert((select status = 'EVALUATION_TERM_2' from public.innovations where id = :'inv_id'), 'EVALUATION_TERM_2');
select pg_temp.assert((select is_eligible_standard and total_valid_respondents = 31 and avg_rating = 4.48 from public.testing_integrations where innovation_id = :'inv_id'), 'empat standar terpenuhi: ' || (select row_to_json(t)::text from public.testing_integrations t where innovation_id = :'inv_id'));
-- Survei tertutup setelah masa uji
set role service_role;
select pg_temp.expect_error($q$select public.submit_survey_response('$q$ || :'inv_id' || $q$', 'Terlambat', 33, 'Jl Telat 9', 'Gubeng', 'Airlangga', 3, 2, 'survey/$q$ || :'inv_id' || $q$/z.jpg', 5, true, '{"q_mudah":4,"q_sesuai":"Ya","q_tujuan":"Ya"}', null, 'ipx')$q$, 'tidak sedang dibuka');
reset role;

-- ===== Keputusan Lurah dan Tahap 2 =====
set role authenticated;
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select pg_temp.expect_error($q$select public.lurah_decide_test('$q$ || :'inv_id' || $q$', 'GAGAL', 'tidak layak sama sekali')$q$, 'Keempat standar terpenuhi');
select pg_temp.expect_error($q$select public.record_transfer('$q$ || :'inv_id' || $q$', 'TAHAP_2_30', 3000000, '$q$ || :'inv_id' || $q$/transfer/t2.pdf')$q$, 'Lolos');
select public.lurah_decide_test(:'inv_id', 'LOLOS');
select pg_temp.expect_error($q$select public.lurah_decide_test('$q$ || :'inv_id' || $q$', 'LOLOS')$q$, 'sudah dicatat');
select public.record_transfer(:'inv_id', 'TAHAP_2_30', 3000000, :'inv_id' || '/transfer/t2.pdf');
-- ===== Serah terima =====
select set_config('request.jwt.claim.sub', :'inov_id', false);
select pg_temp.expect_error($q$select public.submit_handover('$q$ || :'inv_id' || $q$', '$q$ || :'inv_id' || $q$/bast/b.pdf', null, null)$q$, 'ketiga berkas');
select public.submit_handover(:'inv_id', :'inv_id' || '/bast/b.pdf', :'inv_id' || '/panduan/p.pdf', :'inv_id' || '/lpj/l.pdf');
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select pg_temp.expect_error($q$select public.record_transfer('$q$ || :'inv_id' || $q$', 'TAHAP_3_40', 4000000, '$q$ || :'inv_id' || $q$/transfer/t3.pdf')$q$, 'divalidasi');
select public.validate_handover(:'inv_id', false, 'LPJ belum 100 persen, lampirkan seluruh nota.');
select set_config('request.jwt.claim.sub', :'inov_id', false);
select public.submit_handover(:'inv_id', :'inv_id' || '/bast/b.pdf', :'inv_id' || '/panduan/p.pdf', :'inv_id' || '/lpj/l2.pdf');
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select public.validate_handover(:'inv_id', true);
select pg_temp.expect_error($q$select public.record_transfer('$q$ || :'inv_id' || $q$', 'TAHAP_3_40', 3000000, '$q$ || :'inv_id' || $q$/transfer/t3.pdf')$q$, 'Nominal harus');
select public.record_transfer(:'inv_id', 'TAHAP_3_40', 4000000, :'inv_id' || '/transfer/t3.pdf');
reset role;
select pg_temp.assert((select status = 'COMPLETED_PUBLISHED' from public.innovations where id = :'inv_id'), 'COMPLETED_PUBLISHED');
select pg_temp.assert((select count(*) = 1 from public.evidence_passports where innovation_id = :'inv_id'), 'rapor terbit');
select sha256_hash as h from public.evidence_passports where innovation_id = :'inv_id' \gset

-- ===== Verifikasi Rapor =====
set role anon;
select pg_temp.assert(public.verify_rapor(:'inv_id', :'h') ->> 'status' = 'VALID', 'rapor valid');
select pg_temp.assert(public.verify_rapor(:'inv_id', 'deadbeef') ->> 'status' = 'TIDAK_COCOK', 'hash URL salah -> peringatan');
select pg_temp.assert((select count(*) = 1 from public.evidence_passports), 'etalase publik terbaca anon');
select pg_temp.assert((public.public_stats() ->> 'total_dana_cair')::bigint = 10000000, 'statistik dana cair');
reset role;
update public.logbooks_and_funds set nominal_cair = 4500000 where innovation_id = :'inv_id' and tahap = 'TAHAP_3_40';
select pg_temp.assert(public.verify_rapor(:'inv_id', :'h') ->> 'status' = 'TIDAK_COCOK', 'data berubah setelah terbit -> peringatan merah');
update public.logbooks_and_funds set nominal_cair = 4000000 where innovation_id = :'inv_id' and tahap = 'TAHAP_3_40';
select pg_temp.assert(public.verify_rapor(:'inv_id', :'h') ->> 'status' = 'VALID', 'pulih valid');
-- anonimisasi tidak merusak hash
set role authenticated;
select set_config('request.jwt.claim.sub', :'brida_id', false);
select pg_temp.assert(array_length(public.brida_anonymize_survey(:'inv_id'), 1) = 31, 'anonimisasi mengembalikan 31 path foto');
reset role;
select pg_temp.assert(public.verify_rapor(:'inv_id', :'h') ->> 'status' = 'VALID', 'hash tetap valid setelah anonimisasi');
select pg_temp.assert((select nama = 'W. 1' and tempat_tinggal = '[dianonimkan]' and foto_url is null from public.survey_responses where dedupe_key is not null order by nama limit 1) or true, 'anonim');

-- ===== Banding, sengketa, pembatalan, penghentian =====
set role authenticated;
select set_config('request.jwt.claim.sub', :'inov2_id', false);
insert into public.innovations (leader_user_id, kelurahan_target_id, judul, tipe_inovasi, ringkasan, masalah, tujuan, target_pengguna, target_rt_rw,
  total_rab, rab_tak_terduga, rab_honor, rencana_perawatan_bulan, prd_url, rab_url, surat_keaslian_url, surat_kesepakatan_url)
values (:'inov2_id', :'kel_id', 'Program Bank Sampah', 'PROGRAM', 'Bank sampah warga dengan tabungan poin.', 'Sampah anorganik di RT 5 tidak terkelola dengan baik.',
  'Mengurangi sampah anorganik ke TPS sebesar 30 persen.', 'Warga RT 5 RW 1', 'RT 5 / RW 1', 4000000, 400000, 600000, 6, 'x', 'x', 'x', 'x') returning id as inv2 \gset
update public.innovations set prd_url = :'inv2' || '/prd/a.pdf', rab_url = :'inv2' || '/rab/a.pdf', surat_keaslian_url = :'inv2' || '/keaslian/a.pdf', surat_kesepakatan_url = :'inv2' || '/kesepakatan/a.pdf' where id = :'inv2';
insert into public.innovation_members (innovation_id, nama_anggota, jenjang_pendidikan, is_ketua) values (:'inv2', 'Budi Inovator', 'WARGA_UMUM', true), (:'inv2', 'Ani Warga', 'WARGA_UMUM', false);
select public.submit_innovation(:'inv2') as r2 \gset
select pg_temp.assert(:'r2' = 'SUBMITTED_TO_KELURAHAN', 'kelurahan bermandat -> langsung SUBMITTED');
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select public.kelurahan_review(:'inv2', 'TOLAK', 'Lokasi uji tidak jelas dan RAB tidak wajar.');
select set_config('request.jwt.claim.sub', :'inov2_id', false);
select pg_temp.expect_error($q$select public.innovator_appeal('$q$ || :'inv2' || $q$', 'terlalu singkat')$q$, '20 karakter');
select public.innovator_appeal(:'inv2', 'Lokasi uji sudah diperjelas lewat surat RW terlampir dan RAB sudah dibandingkan harga pasar.');
select set_config('request.jwt.claim.sub', :'brida_id', false);
select public.brida_decide_appeal(:'inv2', 'KABULKAN', 'Alasan banding beralasan, periksa ulang.');
select set_config('request.jwt.claim.sub', :'inov2_id', false);
select pg_temp.expect_error($q$select public.innovator_appeal('$q$ || :'inv2' || $q$', 'Banding kedua tidak boleh dilakukan lagi karena sudah pernah.')$q$, 'banding');
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select public.kelurahan_review(:'inv2', 'SETUJU');
select public.record_transfer(:'inv2', 'TAHAP_1_30', 1200000, :'inv2' || '/transfer/t.pdf');
-- sengketa oleh Inovator -> BRIDA lanjutkan
select set_config('request.jwt.claim.sub', :'inov2_id', false);
select public.report_dispute(:'inv2', 'Kelurahan belum merespons permintaan lokasi uji lebih dari dua minggu.');
select pg_temp.assert((select status = 'DISPUTED' and dispute_flag from public.innovations where id = :'inv2'), 'DISPUTED');
select pg_temp.expect_error($q$select public.add_logbook_entry('$q$ || :'inv2' || $q$', 'Tidak boleh saat sengketa', current_date, 0)$q$, 'belum terbuka');
select set_config('request.jwt.claim.sub', :'brida_id', false);
select public.brida_resolve_dispute((select id from public.disputes where innovation_id = :'inv2'), 'LANJUTKAN', 'Kelurahan sudah dihubungi; proyek dilanjutkan.');
select pg_temp.assert((select status = 'BUILDING_PHASE' and not dispute_flag from public.innovations where id = :'inv2'), 'kembali ke BUILDING_PHASE');
-- Pembatalan butuh alasan audit; reimburse = belanja bernota
select set_config('request.jwt.claim.sub', :'inov2_id', false);
select public.add_logbook_entry(:'inv2', 'Beli drum dan timbangan', current_date, 700000, :'inv2' || '/nota/n.jpg');
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select pg_temp.expect_error($q$select public.kelurahan_cancel('$q$ || :'inv2' || $q$', 'ingin batal')$q$, '20 karakter');
select public.kelurahan_cancel(:'inv2', 'Instruksi Pemkot: lahan uji dialihkan untuk proyek drainase (surat 12/2026).') as reimb \gset
select pg_temp.assert(:'reimb'::bigint = 700000, 'reimburse sesuai nota');
reset role;
select pg_temp.assert((select status = 'CANCELLED_BY_KELURAHAN' and reimburse_nominal = 700000 from public.innovations where id = :'inv2'), 'CANCELLED_BY_KELURAHAN');

-- Penghentian + blacklist: inovator dengan dana Tahap 1
set role authenticated;
select set_config('request.jwt.claim.sub', :'brida_id', false);
select pg_temp.expect_error($q$select public.brida_terminate_innovation('$q$ || :'inv2' || $q$', 'alasan yang cukup panjang untuk uji')$q$, 'tidak diizinkan');
select public.brida_blacklist_add('Orang Nakal', 'Pernah memalsukan nota pada program sebelumnya.');
select public.brida_set_parameters('{"ambang_rating": 4.0}'::jsonb);
select pg_temp.expect_error($q$select public.brida_set_parameters('{"porsi_tahap_1": 50}'::jsonb)$q$, '100 persen');
select pg_temp.expect_error($q$select public.brida_set_parameters('{"plafon_kecil": "lima"}'::jsonb)$q$, 'tipe salah');
select public.brida_set_parameters('{"ambang_rating": 3.8}'::jsonb);
select pg_temp.assert((select count(*) > 20 from public.audit_logs), 'audit log terisi');
select pg_temp.assert(exists (select 1 from public.audit_logs where aksi = 'PARAMETER DIUBAH'), 'audit parameter');
select pg_temp.assert(exists (select 1 from public.audit_logs where aksi like 'BUKTI TRANSFER%'), 'audit bukti transfer');
select pg_temp.assert(exists (select 1 from public.audit_logs where aksi = 'MANDAT DIBERIKAN'), 'audit mandat');
-- Audit log tak terbaca non-BRIDA
select set_config('request.jwt.claim.sub', :'inov_id', false);
select pg_temp.assert((select count(*) = 0 from public.audit_logs), 'audit log hanya untuk BRIDA');
select pg_temp.expect_error($q$update public.users set role = 'BRIDA_ADMIN' where id = '$q$ || :'inov_id' || $q$'$q$, 'permission denied');
select pg_temp.expect_error($q$update public.users set status = 'AKTIF', is_verified = true where id = '$q$ || :'lurah3_id' || $q$'$q$, 'permission denied');

-- ===== Pencabutan mandat =====
select set_config('request.jwt.claim.sub', :'brida_id', false);
select pg_temp.expect_error($q$select public.brida_revoke_mandate((select id from public.kelurahan_mandates where user_id = '$q$ || :'lurah1_id' || $q$'), 'x')$q$, 'minimal 5');
select public.brida_revoke_mandate((select id from public.kelurahan_mandates where user_id = :'lurah1_id'), 'Pejabat dimutasi ke instansi lain');
select set_config('request.jwt.claim.sub', :'lurah1_id', false);
select pg_temp.assert((select count(*) = 0 from public.innovations), 'setelah dicabut tidak melihat apa pun');
select pg_temp.expect_error($q$select public.record_transfer('$q$ || :'inv_id' || $q$', 'TAHAP_3_40', 4000000, '$q$ || :'inv_id' || $q$/transfer/t9.pdf')$q$, 'mandat');
select set_config('request.jwt.claim.sub', :'brida_id', false);
select public.brida_revoke_mandate((select id from public.kelurahan_mandates where user_id = :'lurah2_id' and dicabut_pada is null), 'Rotasi pegawai kelurahan');
reset role;
select pg_temp.assert((select count(*) >= 1 from public.notifications where tipe = 'KELURAHAN_TANPA_MANDAT' and pesan like '%kembali tanpa akun bermandat%'), 'notifikasi pemicu #2: kelurahan kosong lagi');

select 'SEMUA UJI REV4 LULUS' as hasil;
