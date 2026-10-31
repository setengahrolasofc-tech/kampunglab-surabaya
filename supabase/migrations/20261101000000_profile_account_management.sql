-- Kelola akun dari /profil: ubah/kosongkan wilayah domisili dan hapus akun sendiri.
-- Tidak memberi hak akses baru; fungsi hanya bekerja untuk auth.uid() pemanggil.

create function private.set_profile_domicile(rt uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
  if actor is null or not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  -- rt null = klaim domisili belum cocok dengan wilayah program; kosongkan agar RT lama tidak tertinggal.
  if rt is not null and not exists(select 1 from public.territories where id=rt and kind='rt') then
    raise exception using errcode='22023',message='INVALID_TERRITORY';
  end if;
  update public.profiles set domicile_rt_id=rt where id=actor;
  return jsonb_build_object('saved',true,'linked',rt is not null);
end;
$$;
revoke all on function private.set_profile_domicile(uuid) from public,anon,authenticated;
grant execute on function private.set_profile_domicile(uuid) to authenticated;
create function public.set_profile_domicile(rt uuid) returns jsonb
language sql security invoker set search_path='' as $$ select private.set_profile_domicile(rt); $$;
revoke all on function public.set_profile_domicile(uuid) from public,anon,authenticated;
grant execute on function public.set_profile_domicile(uuid) to authenticated;

-- Hapus akun = soft delete + anonimisasi. Baris profil dan draf/pengajuan tidak dihapus karena
-- tabel riwayat merujuk ke profiles(id) dan kebijakan retensi (D-13) belum diputuskan.
create function private.delete_own_account() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
  if actor is null or not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if exists(select 1 from public.office_mandates where user_id=actor and status='active' and (ends_at is null or ends_at>now()))
    or exists(select 1 from public.platform_role_grants where user_id=actor and status='active' and (ends_at is null or ends_at>now())) then
    raise exception using errcode='22023',message='ACTIVE_ACCESS';
  end if;
  update public.profiles set display_name='Akun dihapus', domicile_rt_id=null where id=actor;
  delete from auth.sessions where user_id=actor;
  delete from auth.identities where user_id=actor;
  update auth.users set
    email='deleted-'||actor::text||'@deleted.invalid', phone=null, encrypted_password='',
    raw_user_meta_data='{}'::jsonb, raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)-'provider'-'providers',
    email_change='', email_change_token_new='', email_change_token_current='', recovery_token='', confirmation_token='',
    banned_until='infinity'::timestamptz, deleted_at=now()
  where id=actor;
  return jsonb_build_object('deleted',true);
end;
$$;
revoke all on function private.delete_own_account() from public,anon,authenticated;
grant execute on function private.delete_own_account() to authenticated;
create function public.delete_own_account() returns jsonb
language sql security invoker set search_path='' as $$ select private.delete_own_account(); $$;
revoke all on function public.delete_own_account() from public,anon,authenticated;
grant execute on function public.delete_own_account() to authenticated;
