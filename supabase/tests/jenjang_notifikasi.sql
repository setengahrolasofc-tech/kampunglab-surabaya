-- Uji: jenjang D3/D4/S1 diterima, SMP/SD ke bawah ditolak, data lama tetap valid; tombol notifikasi bekerja untuk pemiliknya saja.
\set ON_ERROR_STOP on
\pset pager off
\pset tuples_only on
create or replace function pg_temp.assert(p_ok boolean, p_msg text) returns void language plpgsql as $$
begin if not coalesce(p_ok, false) then raise exception 'ASSERT GAGAL: %', p_msg; end if; end $$;

select id as kel_id from public.master_kelurahan where kecamatan = 'Gubeng' and kelurahan = 'Airlangga' \gset
insert into auth.users (email, raw_user_meta_data) values ('jn1@t.id', '{"display_name":"Jenjang Satu"}') returning id as u1 \gset
insert into auth.users (email, raw_user_meta_data) values ('jn2@t.id', '{"display_name":"Jenjang Dua"}') returning id as u2 \gset
insert into public.innovations (leader_user_id, kelurahan_target_id, judul, tipe_inovasi, total_rab, target_rt_rw, rencana_perawatan_bulan)
  values (:'u1', :'kel_id', 'Uji jenjang', 'PRODUK', 1000000, 'RT 1 / RW 1', 6) returning id as inv \gset
insert into public.innovation_members (innovation_id, nama_anggota, jenjang_pendidikan, urutan) values
  (:'inv', 'Mhs D3', 'MAHASISWA_D3', 1), (:'inv', 'Mhs D4', 'MAHASISWA_D4', 2), (:'inv', 'Mhs S1', 'MAHASISWA_S1', 3),
  (:'inv', 'Data Lama', 'MAHASISWA_DIPLOMA_S1', 4);
select pg_temp.assert((select count(*) = 4 from public.innovation_members where innovation_id = :'inv'), 'D3/D4/S1 dan nilai lama diterima');
do $$ begin
  begin insert into public.innovation_members (innovation_id, nama_anggota, jenjang_pendidikan, urutan)
    values ((select id from public.innovations where judul = 'Uji jenjang'), 'Anak SMP', 'SMP_KE_BAWAH', 5); raise exception 'SEHARUSNYA GAGAL';
  exception when others then if sqlerrm like 'SEHARUSNYA%' then raise; end if; end;
end $$;

-- Notifikasi: tandai satu, lalu semua; milik orang lain tidak tersentuh.
insert into public.notifications (untuk_user_id, tipe, pesan) values (:'u1', 'T', 'a'), (:'u1', 'T', 'b'), (:'u2', 'T', 'c');
select id as n1 from public.notifications where untuk_user_id = :'u1' and pesan = 'a' \gset
select set_config('request.jwt.claim.sub', :'u1', false) \gset
set role authenticated;
select public.mark_notification_read(:'n1');
select pg_temp.assert((select count(*) = 1 from public.notifications where dibaca), 'satu ditandai');
select public.mark_all_notifications_read();
select pg_temp.assert((select count(*) = 2 from public.notifications where dibaca), 'semua milik u1 ditandai');
reset role;
select pg_temp.assert((select not dibaca from public.notifications where untuk_user_id = :'u2'), 'milik orang lain tidak ikut');
select 'OK jenjang_notifikasi' as hasil;
