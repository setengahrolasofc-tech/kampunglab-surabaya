-- Uji: masuk Google (akun baru selalu INNOVATOR) dan alur "minta akses Kelurahan" yang menunggu mandat BRIDA.
-- Dijalankan setelah rev4_core + 20261104060000 pada database uji (lihat run-local.sh).
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

select id as kel_id from public.master_kelurahan where kecamatan = 'Gubeng' and kelurahan = 'Airlangga' \gset
insert into auth.users (email, raw_user_meta_data) values ('adm@g.test', '{"display_name":"Admin G"}') returning id as adm_id \gset
update public.users set role = 'BRIDA_ADMIN', is_verified = true where id = :'adm_id';

-- Profil Google: name/full_name dari penyedia; peran tetap INNOVATOR walau metadata mencoba menaikkan.
insert into auth.users (email, raw_user_meta_data) values
  ('dewi@gmail.test', '{"name":"Dewi Google","full_name":"Dewi Google","avatar_url":"https://x/y.png","iss":"https://accounts.google.com"}') returning id as dewi_id \gset
select pg_temp.assert((select role = 'INNOVATOR' and status = 'AKTIF' and name = 'Dewi Google' from public.users where id = :'dewi_id'), 'akun Google baru = Inovator dengan nama Google');
insert into auth.users (email, raw_user_meta_data) values ('tanpa.nama@gmail.test', '{}') returning id as tn_id \gset
select pg_temp.assert((select name = 'tanpa.nama' from public.users where id = :'tn_id'), 'nama jatuh ke bagian lokal email');
insert into auth.users (email, raw_user_meta_data) values ('nakal@gmail.test', '{"name":"Nakal","role":"BRIDA_ADMIN","kl_role":"BRIDA_ADMIN"}') returning id as nakal_id \gset
select pg_temp.assert((select role = 'INNOVATOR' from public.users where id = :'nakal_id'), 'metadata tidak boleh menaikkan peran');

-- Minta akses Kelurahan: validasi, lalu menunggu mandat tanpa wewenang.
set role authenticated;
select set_config('request.jwt.claim.sub', :'dewi_id', false);
select pg_temp.expect_error($q$select public.request_kelurahan_access('$q$ || :'kel_id' || $q$', '123', 'Lurah', '081234567890')$q$, 'NIP');
select pg_temp.expect_error($q$select public.request_kelurahan_access('$q$ || :'kel_id' || $q$', '198001012005011001', 'L', '081234567890')$q$, 'jabatan');
select pg_temp.expect_error($q$select public.request_kelurahan_access('$q$ || :'kel_id' || $q$', '198001012005011001', 'Lurah', 'abc')$q$, 'WA');
select pg_temp.expect_error($q$select public.request_kelurahan_access(gen_random_uuid(), '198001012005011001', 'Lurah', '081234567890')$q$, 'Kelurahan tidak ditemukan');
select public.request_kelurahan_access(:'kel_id', '198001012005011001', 'Lurah', '081234567890');
select pg_temp.assert((select role = 'KELURAHAN' and status = 'MENUNGGU_MANDAT' and kelurahan_id = :'kel_id' from public.users where id = :'dewi_id'), 'status menunggu mandat');
select pg_temp.assert((select count(*) = 0 from public.kelurahan_mandates where user_id = :'dewi_id'), 'belum ada mandat');
select pg_temp.expect_error($q$select public.request_kelurahan_access('$q$ || :'kel_id' || $q$', '198001012005011001', 'Lurah', '081234567890')$q$, 'sudah terdaftar');
-- Belum bermandat: tidak boleh memutus pengajuan apa pun.
select pg_temp.expect_error($q$select public.kelurahan_review(gen_random_uuid(), 'SETUJU', 'x', null)$q$, '');
reset role;
select pg_temp.assert((select count(*) = 1 from public.notifications where untuk_user_id = :'adm_id' and tipe = 'MANDAT_BARU'), 'BRIDA diberi notifikasi permintaan akses');
select pg_temp.assert((select count(*) = 1 from public.kelurahan_profiles where user_id = :'dewi_id'), 'profil kelurahan dibuat');

-- BRIDA tanpa SK tidak bisa memberi mandat; setelah SK ada, mandat diberikan dan akun aktif.
set role authenticated;
select set_config('request.jwt.claim.sub', :'adm_id', false);
select pg_temp.expect_error($q$select public.brida_decide_mandate('$q$ || :'dewi_id' || $q$', 'BERI')$q$, 'SK');
reset role;
update public.users set sk_document_url = 'sk/' || id || '/sk.pdf' where id = :'dewi_id';
set role authenticated;
select set_config('request.jwt.claim.sub', :'adm_id', false);
select public.brida_decide_mandate(:'dewi_id', 'BERI');
reset role;
select pg_temp.assert((select status = 'AKTIF' from public.users where id = :'dewi_id') and
  (select count(*) = 1 from public.kelurahan_mandates where user_id = :'dewi_id' and dicabut_pada is null), 'mandat diberikan BRIDA');

-- Akun yang sudah punya pengajuan tidak boleh menjadi Kelurahan; Admin dan Kelurahan juga ditolak.
insert into auth.users (email, raw_user_meta_data) values ('inov@g.test', '{"name":"Inov Aktif"}') returning id as inov_id \gset
insert into public.innovations (leader_user_id, kelurahan_target_id, judul, tipe_inovasi, total_rab, target_rt_rw, rencana_perawatan_bulan)
  values (:'inov_id', :'kel_id', 'Kompos Mini Gubeng', 'PRODUK', 1000000, 'RT 1 / RW 1', 6);
set role authenticated;
select set_config('request.jwt.claim.sub', :'inov_id', false);
select pg_temp.expect_error($q$select public.request_kelurahan_access('$q$ || :'kel_id' || $q$', '198001012005011001', 'Lurah', '081234567890')$q$, 'sudah punya pengajuan');
select set_config('request.jwt.claim.sub', :'adm_id', false);
select pg_temp.expect_error($q$select public.request_kelurahan_access('$q$ || :'kel_id' || $q$', '198001012005011001', 'Lurah', '081234567890')$q$, 'tidak dapat meminta akses');
reset role;
set role anon;
select pg_temp.expect_error($q$select public.request_kelurahan_access(gen_random_uuid(), '198001012005011001', 'Lurah', '081234567890')$q$, 'permission denied');
reset role;
select 'OK google_access' as hasil;
