-- Uji asap tahap (a). Jalankan di database LOKAL setelah `supabase db reset`:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/stage_a_smoke.sql
-- Seluruh skrip dibungkus transaksi dan di-ROLLBACK. Gagal = ada pesan "FAIL:" dan skrip berhenti.
begin;

-- ---- akun uji (dibuat lewat trigger pendaftaran, sama seperti alur nyata)
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data) values
 ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local',
   '{"kl_role":"BRIDA_ADMIN","kl_super_admin":"true"}', '{"name":"Admin Uji"}'),
 ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'inov@test.local',
   '{}', '{"name":"Inovator Uji","role":"INNOVATOR","phone_wa":"081200000001"}'),
 ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lurah@test.local',
   '{}', jsonb_build_object('name','Lurah Uji','role','KELURAHAN','nip','198001012005011001','jabatan','Lurah',
         'kelurahan_id',(select id from public.master_kelurahan where kelurahan='Gubeng')));

do $$ begin
  if (select count(*) from public.master_kelurahan) <> 154 then raise exception 'FAIL: master_kelurahan harus 154 baris'; end if;
  if (select status from public.users where email='lurah@test.local') <> 'MENUNGGU_MANDAT' then raise exception 'FAIL: Kelurahan baru harus MENUNGGU_MANDAT'; end if;
  if not (select is_super_admin from public.users where email='admin@test.local') then raise exception 'FAIL: super admin'; end if;
  if (select count(*) from public.notifications where tipe='MANDAT_PENDAFTAR_BARU') <> 1 then raise exception 'FAIL: notifikasi pendaftar Kelurahan baru'; end if;
end $$;

-- ---- peran BRIDA tidak bisa didaftarkan lewat user_metadata
do $$ begin
  begin
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
    values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hack@test.local', '{}', '{"name":"X","role":"BRIDA_ADMIN"}');
    raise exception 'FAIL: pendaftaran BRIDA tanpa app_metadata harus ditolak';
  exception when others then
    if sqlerrm <> 'ROLE_NOT_ALLOWED' then raise; end if;
  end;
end $$;

-- ---- inovator: plafon, tim, status
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
do $$
declare v_kel uuid := (select id from public.master_kelurahan where kelurahan='Gubeng'); v_id uuid; i int;
begin
  begin
    insert into public.innovations (kelurahan_target_id, judul, tipe_inovasi, total_rab) values (v_kel, 'Alat Uji Produk', 'PRODUK', 6000000);
    raise exception 'FAIL: PRODUK Rp6 juta harus melebihi plafon Rp5 juta';
  exception when others then if sqlerrm <> 'RAB_OVER_PLAFON' then raise; end if; end;

  insert into public.innovations (kelurahan_target_id, judul, tipe_inovasi, total_rab, rab_tak_terduga, rab_honor)
  values (v_kel, 'Sensor Banjir Kampung', 'TEKNOLOGI', 6000000, 600000, 900000) returning id into v_id;
  if (select skala_plafon from public.innovations where id=v_id) <> 'TERAPAN_15JT' then raise exception 'FAIL: skala TEKNOLOGI'; end if;
  if (select durasi_bangun_hari from public.innovations where id=v_id) <> 60 then raise exception 'FAIL: durasi 60 hari'; end if;

  begin
    update public.innovations set rab_honor = 1000000 where id = v_id;
    raise exception 'FAIL: honor di atas 15 persen harus ditolak';
  exception when others then if sqlerrm <> 'RAB_HONOR_OVER' then raise; end if; end;

  begin
    update public.innovations set status = 'COMMUNITY_TESTING' where id = v_id;
    raise exception 'FAIL: klien tidak boleh mengubah status';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.innovation_members (innovation_id, nama_anggota, peran_dalam_tim, jenjang_pendidikan) values (v_id, 'Anak SMP', 'Anggota', 'SMP');
    raise exception 'FAIL: jenjang SMP harus ditolak';
  exception when check_violation then null; end;

  for i in 1..6 loop
    insert into public.innovation_members (innovation_id, nama_anggota, peran_dalam_tim, jenjang_pendidikan) values (v_id, 'Anggota ' || i, 'Anggota', 'S1_D4');
  end loop;
  begin
    insert into public.innovation_members (innovation_id, nama_anggota, peran_dalam_tim, jenjang_pendidikan) values (v_id, 'Anggota 7', 'Anggota', 'S1_D4');
    raise exception 'FAIL: anggota ke-7 harus ditolak';
  exception when others then if sqlerrm <> 'TEAM_FULL' then raise; end if; end;

  begin
    insert into public.users (id, name, email, role) values (gen_random_uuid(), 'x', 'x@x', 'BRIDA_ADMIN');
    raise exception 'FAIL: klien tidak boleh menulis users';
  exception when insufficient_privilege then null; end;
end $$;

-- ---- Kelurahan tanpa mandat: tidak berwenang; DRAFT inovator tidak terlihat siapa pun selain ketua
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
do $$ begin
  if private.has_mandate((select id from public.master_kelurahan where kelurahan='Gubeng')) then raise exception 'FAIL: belum bermandat'; end if;
  if exists (select 1 from public.innovations) then raise exception 'FAIL: Kelurahan tidak boleh melihat DRAFT'; end if;
end $$;

-- ---- beri mandat (simulasi fungsi tahap c) lalu kirim pengajuan
reset role;
insert into public.kelurahan_mandates (user_id, kelurahan_id, tipe, diberikan_oleh)
values ('00000000-0000-4000-8000-0000000000c1', (select id from public.master_kelurahan where kelurahan='Gubeng'), 'UTAMA', '00000000-0000-4000-8000-0000000000a1');
update public.users set status = 'AKTIF' where email = 'lurah@test.local';
do $$ begin
  begin
    insert into public.kelurahan_mandates (user_id, kelurahan_id, tipe, diberikan_oleh)
    values ((select id from public.users where email='inov@test.local'), (select id from public.master_kelurahan where kelurahan='Gubeng'), 'UTAMA', '00000000-0000-4000-8000-0000000000a1');
    raise exception 'FAIL: dua mandat UTAMA aktif pada satu kelurahan harus ditolak';
  exception when unique_violation then null; end;
  perform private.set_status((select id from public.innovations limit 1), 'SUBMITTED_TO_KELURAHAN', 'uji');
  begin
    perform private.set_status((select id from public.innovations limit 1), 'COMPLETED_PUBLISHED', 'loncat');
    raise exception 'FAIL: transisi tidak sah harus ditolak';
  exception when others then if sqlerrm <> 'INVALID_TRANSITION' then raise; end if; end;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.innovations) <> 1 then raise exception 'FAIL: Kelurahan bermandat harus melihat pengajuan terkirim'; end if;
  begin
    update public.innovations set judul = 'Diubah Lurah';
    -- RLS memfilter baris (tidak ada yang cocok), jadi tidak ada baris berubah
    if found then raise exception 'FAIL: Kelurahan tidak boleh mengubah isi pengajuan'; end if;
  exception when insufficient_privilege then null; end;
end $$;

-- ---- anon: hanya tampilan publik
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  perform 1 from public.public_stats;
  perform 1 from public.problem_boards;
  begin perform 1 from public.users; raise exception 'FAIL: anon tidak boleh membaca users';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.innovations; raise exception 'FAIL: anon tidak boleh membaca innovations';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
rollback;
select 'stage_a_smoke: SEMUA LULUS' as hasil;
