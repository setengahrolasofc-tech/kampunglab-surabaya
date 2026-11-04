-- Masuk dengan Google dan "minta akses Kelurahan".
-- 1) Akun baru dari Google tetap INNOVATOR (peran tidak pernah diambil dari penyedia login); nama diambil dari profil Google.
-- 2) Akun Inovator yang belum punya pengajuan boleh meminta akses Kelurahan. Statusnya MENUNGGU_MANDAT: tanpa wewenang
--    sampai Admin BRIDA memberi mandat lewat antrean mandat yang sudah ada.
-- 3) Admin BRIDA tidak dapat dibuat dari pendaftaran; hanya dari akun yang dipilih lewat skrip seed (service role).

create or replace function app.on_auth_user_created() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.app_role := 'INNOVATOR';
  v_status public.account_status := 'AKTIF';
  v_kel uuid;
  v_name text := left(btrim(coalesce(nullif(btrim(m->>'display_name'), ''), nullif(btrim(m->>'name'), ''),
                   nullif(btrim(m->>'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1), '')), 100);
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

-- Akun Inovator (email atau Google) meminta akses Kelurahan. Tidak membuka wewenang apa pun: status MENUNGGU_MANDAT.
create function public.request_kelurahan_access(p_kelurahan uuid, p_nip text, p_jabatan text, p_phone text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  u public.users;
  v_nip text := btrim(coalesce(p_nip, ''));
  v_jab text := left(btrim(coalesce(p_jabatan, '')), 120);
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
begin
  if auth.uid() is null then raise exception 'Silakan masuk dulu.' using errcode = '42501'; end if;
  select * into u from public.users where id = auth.uid() for update;
  if not found then raise exception 'Akun tidak ditemukan.' using errcode = '42501'; end if;
  if u.role = 'KELURAHAN' then raise exception 'Akun ini sudah terdaftar sebagai Kelurahan.' using errcode = 'P0001'; end if;
  if u.role <> 'INNOVATOR' or u.status <> 'AKTIF' then raise exception 'Akun ini tidak dapat meminta akses Kelurahan.' using errcode = '42501'; end if;
  if exists (select 1 from public.innovations where leader_user_id = u.id) then
    raise exception 'Akun ini sudah punya pengajuan inovasi, jadi tidak dapat dipakai sebagai Kelurahan. Daftar dengan email lain untuk akses Kelurahan.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.master_kelurahan where id = p_kelurahan) then raise exception 'Kelurahan tidak ditemukan.' using errcode = 'P0001'; end if;
  if v_nip !~ '^[0-9 ]{8,24}$' then raise exception 'NIP tidak valid (8–24 angka).' using errcode = 'P0001'; end if;
  if char_length(v_jab) < 3 then raise exception 'Isi jabatan.' using errcode = 'P0001'; end if;
  if v_phone !~ '^[0-9+]{8,16}$' then raise exception 'Nomor WA tidak valid.' using errcode = 'P0001'; end if;

  update public.users set role = 'KELURAHAN', status = 'MENUNGGU_MANDAT', kelurahan_id = p_kelurahan, nip = v_nip, jabatan = v_jab,
    phone_wa = v_phone, perlu_perbaikan = false, catatan_verifikasi = null where id = u.id;
  insert into public.kelurahan_profiles (user_id, kelurahan_id, nama_lurah, nip_lurah, jabatan, kontak_wa_resmi)
  values (u.id, p_kelurahan, u.name, v_nip, v_jab, v_phone)
  on conflict (user_id) do update set kelurahan_id = excluded.kelurahan_id, nip_lurah = excluded.nip_lurah,
    jabatan = excluded.jabatan, kontak_wa_resmi = excluded.kontak_wa_resmi;
  perform app.notify_brida('MANDAT_BARU',
    'Permintaan akses Kelurahan: ' || u.name || ' — ' || app.kel_label(p_kelurahan) || '. Menunggu SK dan verifikasi.', u.id, '/admin/mandat');
  perform app.audit('AKSES KELURAHAN DIMINTA', 'users/' || u.id, jsonb_build_object('kelurahan_id', p_kelurahan));
end $$;

revoke all on function public.request_kelurahan_access(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.request_kelurahan_access(uuid, text, text, text) to authenticated, service_role;
