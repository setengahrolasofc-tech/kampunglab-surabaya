-- Uji perilaku tahap (a) Rev. 4. Jalankan di database LOKAL/dev setelah semua migrasi: psql -v ON_ERROR_STOP=1 -f scripts/sql/rev4_stage_a_check.sql
-- Memakai stub auth.* (lihat docs/REV4_TAHAP_A.md). Tidak untuk produksi: membuat pengguna uji.
\set ON_ERROR_STOP on
begin;
select private.rev4_set_brida_invite('undangan-uji-12345');
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-0000000000a1','admin@uji.test'),('00000000-0000-0000-0000-0000000000b1','kel@uji.test'),
 ('00000000-0000-0000-0000-0000000000c1','inov@uji.test'),('00000000-0000-0000-0000-0000000000c2','inov2@uji.test');
insert into auth.sessions(id,user_id) values ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000a1');

create or replace function pg_temp.as_user(u uuid, sess uuid default null) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', u::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub',u,'session_id',sess)::text, true);
  set local role authenticated;
end $$;
create or replace function pg_temp.reset() returns void language plpgsql as $$ begin reset role; end $$;

-- Pendaftaran: kode salah ditolak, kode benar menjadi admin.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000f1');
do $$ begin
  begin perform public.rev4_register('BRIDA_ADMIN','081234567890',p_invite=>'salah-salah-salah'); raise exception 'SEHARUSNYA GAGAL';
  exception when sqlstate '42501' then null; end;
  perform public.rev4_register('BRIDA_ADMIN','081234567890',p_invite=>'undangan-uji-12345');
  if not private.rev4_is_admin() then raise exception 'admin tidak aktif'; end if;
end $$;
select pg_temp.reset();

-- Inovator dan kelurahan mendaftar.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
select public.rev4_register('INNOVATOR','081200000001','Kampus Uji','Surabaya');
select pg_temp.reset();
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2');
select public.rev4_register('INNOVATOR','081200000002','Komunitas Uji','Malang');
select pg_temp.reset();
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select public.rev4_register('KELURAHAN','081200000003',p_nip=>'198001012005011001',p_jabatan=>'Lurah',
  p_kelurahan=>(select territory_id from public.master_kelurahan where kelurahan='Tambak Wedi'),
  p_sk_path=>'00000000-0000-0000-0000-0000000000b1/sk.pdf');
do $$ begin if private.rev4_is_kelurahan_of((select territory_id from public.master_kelurahan where kelurahan='Tambak Wedi')) then
  raise exception 'MENUNGGU_MANDAT tidak boleh punya wewenang'; end if; end $$;
select pg_temp.reset();

-- Pengajuan oleh inovator. Status tidak boleh diubah lewat UPDATE.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
insert into public.innovations(leader_user_id,kelurahan_target_id,judul,tipe_inovasi,skala_plafon,total_rab,target_rt_rw,prd_url,rab_url,surat_keaslian_url,surat_kesepakatan_url)
 select '00000000-0000-0000-0000-0000000000c1',territory_id,'Kompos mini RT 02','PRODUK','KECIL_5JT',4000000,'RW 04 RT 02','a','b','c','d'
 from public.master_kelurahan where kelurahan='Tambak Wedi';
do $$ declare v_id uuid; begin select i.id into v_id from public.innovations i limit 1;
  begin update public.innovations set status='COMPLETED_PUBLISHED' where innovations.id=v_id; raise exception 'SEHARUSNYA GAGAL';
  exception when sqlstate '42501' then null; end;
  begin update public.innovations set total_rab=6000000 where innovations.id=v_id; raise exception 'SEHARUSNYA GAGAL plafon';
  exception when sqlstate '23514' then null; end;
  begin perform public.rev4_transition(v_id,'SUBMITTED_TO_KELURAHAN'); raise exception 'SEHARUSNYA GAGAL: anggota kurang';
  exception when sqlstate '22023' then null; end;
  insert into public.innovation_members(innovation_id,user_id,nama_anggota,peran_dalam_tim,institusi_asal,kota_domisili,jenjang_pendidikan)
   values (v_id,'00000000-0000-0000-0000-0000000000c1','Ani','Ketua','Kampus Uji','Surabaya','S1'),
          (v_id,null,'Budi','Teknis','Kampus Uji','Surabaya','SMA_SMK');
  begin insert into public.innovation_members(innovation_id,nama_anggota,peran_dalam_tim,institusi_asal,kota_domisili,jenjang_pendidikan)
    values (v_id,'Cici','Anggota','SMP X','Surabaya','SMP'); raise exception 'SEHARUSNYA GAGAL SMP';
  exception when check_violation then null; end;
  -- Kelurahan tanpa mandat: masuk WAITING_KELURAHAN_MANDATE dan admin diberi notifikasi.
  perform public.rev4_transition(v_id,'SUBMITTED_TO_KELURAHAN');
  if (select status from public.innovations where innovations.id=v_id)<>'WAITING_KELURAHAN_MANDATE' then raise exception 'harus menunggu mandat'; end if;
end $$;
select pg_temp.reset();
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000f1');
do $$ begin if (select count(*) from public.rev4_notifications where tipe='kelurahan_tanpa_mandat')<>1 then raise exception 'notifikasi admin hilang'; end if; end $$;
select pg_temp.reset();

-- Pengajuan lain tidak terlihat oleh inovator lain; riwayat dan audit tercatat.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2');
do $$ begin if (select count(*) from public.innovations)<>0 then raise exception 'bocor lintas inovator'; end if;
  if (select count(*) from public.audit_logs)<>0 then raise exception 'audit bocor'; end if; end $$;
select pg_temp.reset();
do $$ begin if (select count(*) from public.audit_logs where aksi='status_inovasi')<1 then raise exception 'audit status hilang'; end if;
  begin delete from public.audit_logs; raise exception 'SEHARUSNYA GAGAL'; exception when sqlstate '42501' then null; end; end $$;

-- Anon hanya melihat pengajuan terbit.
set local role anon;
do $$ begin if (select count(*) from public.innovations)<>0 then raise exception 'anon melihat pengajuan'; end if; end $$;
reset role;
select 'OK tahap (a)' as hasil;
rollback;
