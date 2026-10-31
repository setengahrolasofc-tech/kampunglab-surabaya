-- Domisili warga selalu tertaut ke wilayah program.
-- 1) Semua kelurahan Surabaya (daftar yang sama dengan form daftar) dimasukkan ke territories.
--    Kode memuat kecamatan agar kelurahan bernama sama di kecamatan berbeda tidak tertukar.
-- 2) link_domicile membuat RW/RT yang belum ada di bawah kelurahan itu dari klaim warga, lalu menautkan profil.
--    RW/RT buatan klaim hanyalah satuan wilayah; tidak memberi hak akses. Mandat RT/RW tetap ditetapkan pengelola.
-- CATATAN: daftar kelurahan masih contoh yang belum dicocokkan dengan master resmi.

create function private.area_slug(value text) returns text
language sql immutable set search_path='' as $$
  select lower(btrim(regexp_replace(value,'[^a-zA-Z0-9]+','-','g'),'-'));
$$;

insert into public.territories(kind,code,name)
select 'kelurahan','SBY-'||private.area_slug(v.kec)||'-'||private.area_slug(v.kel),v.kel
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
on conflict (kind,code) where parent_id is null do nothing;

create function private.link_domicile(p_kecamatan text,p_kelurahan text,p_rw integer,p_rt integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); kel uuid; rw_id uuid; rt_id uuid;
begin
  if actor is null or not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if p_rw is null or p_rt is null or p_rw not between 1 and 999 or p_rt not between 1 and 999 then
    raise exception using errcode='22023',message='INVALID_INPUT';
  end if;
  select id into kel from public.territories where kind='kelurahan' and parent_id is null
    and code='SBY-'||private.area_slug(p_kecamatan)||'-'||private.area_slug(p_kelurahan);
  if kel is null then
    update public.profiles set domicile_rt_id=null where id=actor;
    return jsonb_build_object('linked',false);
  end if;

  select id into rw_id from public.territories where kind='rw' and parent_id=kel
    and coalesce(substring(name from '(\d+)\s*$'),substring(code from '(\d+)\s*$'))::integer=p_rw order by id limit 1;
  if rw_id is null then
    insert into public.territories(kind,code,name,parent_id)
    values('rw','RW-'||lpad(p_rw::text,2,'0'),'RW '||lpad(p_rw::text,2,'0'),kel)
    on conflict (parent_id,kind,code) where parent_id is not null do nothing;
    select id into rw_id from public.territories where kind='rw' and parent_id=kel and code='RW-'||lpad(p_rw::text,2,'0');
  end if;

  select id into rt_id from public.territories where kind='rt' and parent_id=rw_id
    and coalesce(substring(name from '(\d+)\s*$'),substring(code from '(\d+)\s*$'))::integer=p_rt order by id limit 1;
  if rt_id is null then
    insert into public.territories(kind,code,name,parent_id)
    values('rt','RT-'||lpad(p_rt::text,2,'0'),'RT '||lpad(p_rt::text,2,'0'),rw_id)
    on conflict (parent_id,kind,code) where parent_id is not null do nothing;
    select id into rt_id from public.territories where kind='rt' and parent_id=rw_id and code='RT-'||lpad(p_rt::text,2,'0');
  end if;

  update public.profiles set domicile_rt_id=rt_id where id=actor;
  return jsonb_build_object('linked',true);
end;
$$;
revoke all on function private.link_domicile(text,text,integer,integer) from public,anon,authenticated;
grant execute on function private.link_domicile(text,text,integer,integer) to authenticated;
create function public.link_domicile(p_kecamatan text,p_kelurahan text,p_rw integer,p_rt integer) returns jsonb
language sql security invoker set search_path='' as $$ select private.link_domicile(p_kecamatan,p_kelurahan,p_rw,p_rt); $$;
revoke all on function public.link_domicile(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.link_domicile(text,text,integer,integer) to authenticated;
