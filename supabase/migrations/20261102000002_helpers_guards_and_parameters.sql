-- Tahap (a), bagian 2: fungsi bantu, pengaman data (trigger), pendaftaran akun, mesin status, parameter bawaan.
-- Fungsi di schema private tidak diekspos PostgREST (schema ini tidak ada di daftar exposed schemas).

-- ---------------------------------------------------------------- parameter
create or replace function private.param(p_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select value from public.system_parameters where key = p_key
$$;
create or replace function private.param_int(p_key text) returns integer
language sql stable security definer set search_path = '' as $$
  select (value #>> '{}')::integer from public.system_parameters where key = p_key
$$;
create or replace function private.param_num(p_key text) returns numeric
language sql stable security definer set search_path = '' as $$
  select (value #>> '{}')::numeric from public.system_parameters where key = p_key
$$;

-- ---------------------------------------------------------------- identitas pemanggil
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'BRIDA_ADMIN' and u.status = 'AKTIF')
$$;
create or replace function private.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'BRIDA_ADMIN' and u.status = 'AKTIF' and u.is_super_admin)
$$;
create or replace function private.is_active_innovator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'INNOVATOR' and u.status = 'AKTIF' and not u.is_blacklisted)
$$;
-- Akun Kelurahan hanya berwenang untuk kelurahan yang mandatnya masih aktif dan akunnya AKTIF.
create or replace function private.has_mandate(p_kelurahan uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.kelurahan_mandates m join public.users u on u.id = m.user_id
    where m.user_id = auth.uid() and m.kelurahan_id = p_kelurahan and m.dicabut_pada is null and u.status = 'AKTIF' and u.role = 'KELURAHAN')
$$;
create or replace function private.is_leader(p_innovation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.innovations i where i.id = p_innovation and i.leader_user_id = auth.uid())
$$;
create or replace function private.innovation_status_of(p_innovation uuid) returns public.innovation_status
language sql stable security definer set search_path = '' as $$
  select status from public.innovations where id = p_innovation
$$;
create or replace function private.innovation_kelurahan(p_innovation uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select kelurahan_target_id from public.innovations where id = p_innovation
$$;
create or replace function private.is_kelurahan_of(p_innovation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.innovations i where i.id = p_innovation and private.has_mandate(i.kelurahan_target_id))
$$;
create or replace function private.can_view_innovation(p_innovation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.innovations i
    where i.id = p_innovation and (i.leader_user_id = auth.uid()
      or (i.status <> 'DRAFT' and (private.has_mandate(i.kelurahan_target_id) or private.is_admin()))))
$$;
create or replace function private.kelurahan_sees_user(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.innovations i where i.leader_user_id = p_user and i.status <> 'DRAFT' and private.has_mandate(i.kelurahan_target_id))
$$;
-- Jumlah mandat aktif per kelurahan (dipakai widget "Kelurahan Belum Bermandat").
create or replace function private.active_mandate_count(p_kelurahan uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.kelurahan_mandates m join public.users u on u.id = m.user_id
  where m.kelurahan_id = p_kelurahan and m.dicabut_pada is null and u.status = 'AKTIF'
$$;

create or replace function private.today_wib() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'Asia/Jakarta')::date $$;
create or replace function private.is_live_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.status in ('AKTIF', 'MENUNGGU_MANDAT') and not u.is_blacklisted)
$$;
-- "Budi Santoso" -> "B*** S***" (data pribadi penguji tampil disamarkan, bukan nomor WA).
create or replace function private.mask_name(p_name text) returns text
language sql immutable set search_path = '' as $$ select regexp_replace(btrim(coalesce(p_name, '')), '(\S)\S*', '\1***', 'g') $$;

-- ---------------------------------------------------------------- audit & notifikasi
create or replace function private.audit(p_aksi text, p_target text, p_detail jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_logs (aktor_id, aksi, target, detail_json) values (auth.uid(), p_aksi, p_target, coalesce(p_detail, '{}'::jsonb))
$$;
create or replace function private.notify_user(p_user uuid, p_tipe text, p_pesan text, p_ref uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (untuk_role, untuk_user_id, tipe, pesan, ref_id)
  select u.role, u.id, p_tipe, p_pesan, p_ref from public.users u where u.id = p_user
$$;
-- Satu baris per Admin BRIDA aktif supaya status dibaca/belum dibaca tidak tercampur antar admin.
create or replace function private.notify_admins(p_tipe text, p_pesan text, p_ref uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (untuk_role, untuk_user_id, tipe, pesan, ref_id)
  select 'BRIDA_ADMIN'::public.user_role, u.id, p_tipe, p_pesan, p_ref from public.users u where u.role = 'BRIDA_ADMIN' and u.status = 'AKTIF'
$$;
create or replace function private.notify_kelurahan(p_kelurahan uuid, p_tipe text, p_pesan text, p_ref uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (untuk_role, untuk_user_id, tipe, pesan, ref_id)
  select 'KELURAHAN'::public.user_role, m.user_id, p_tipe, p_pesan, p_ref
  from public.kelurahan_mandates m join public.users u on u.id = m.user_id
  where m.kelurahan_id = p_kelurahan and m.dicabut_pada is null and u.status = 'AKTIF'
$$;

-- ---------------------------------------------------------------- pendaftaran akun (trigger di auth.users)
-- Keamanan: peran BRIDA_ADMIN hanya diterima dari app_metadata (hanya bisa diisi lewat Admin API/service role setelah
-- kode undangan diperiksa server). user_metadata dikendalikan klien, jadi tidak pernah dipercaya untuk peran BRIDA.
create or replace function private.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  um jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  am jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  v_role text; v_name text; v_kel uuid; v_kel_name text; v_kec text; v_req uuid; v_super boolean;
begin
  if am ? 'kl_role' then v_role := am ->> 'kl_role';
  else v_role := coalesce(nullif(um ->> 'role', ''), 'INNOVATOR'); end if;
  if v_role not in ('INNOVATOR', 'KELURAHAN', 'BRIDA_ADMIN') or (v_role = 'BRIDA_ADMIN' and am ->> 'kl_role' is distinct from 'BRIDA_ADMIN') then
    raise exception 'ROLE_NOT_ALLOWED' using errcode = '42501';
  end if;
  v_name := btrim(coalesce(um ->> 'name', ''));
  if v_name = '' then raise exception 'NAME_REQUIRED' using errcode = '22023'; end if;
  v_super := v_role = 'BRIDA_ADMIN' and lower(coalesce(am ->> 'kl_super_admin', '')) = 'true';

  insert into public.users (id, name, email, role, status, phone_wa, institusi, kota_domisili, nip, jabatan, is_super_admin)
  values (new.id, v_name, coalesce(new.email, ''), v_role::public.user_role,
          case when v_role = 'KELURAHAN' then 'MENUNGGU_MANDAT' else 'AKTIF' end::public.user_status,
          nullif(btrim(um ->> 'phone_wa'), ''), nullif(btrim(um ->> 'institusi'), ''), nullif(btrim(um ->> 'kota_domisili'), ''),
          nullif(btrim(um ->> 'nip'), ''), nullif(btrim(um ->> 'jabatan'), ''), v_super);

  if v_role = 'KELURAHAN' then
    begin v_kel := (um ->> 'kelurahan_id')::uuid; exception when others then v_kel := null; end;
    select kelurahan, kecamatan into v_kel_name, v_kec from public.master_kelurahan where id = v_kel;
    if v_kel_name is null then raise exception 'KELURAHAN_REQUIRED' using errcode = '22023'; end if;
    insert into public.mandate_requests (user_id, kelurahan_id) values (new.id, v_kel) returning id into v_req;
    perform private.notify_admins('MANDAT_PENDAFTAR_BARU',
      format('Pendaftar Kelurahan baru: %s (Kelurahan %s, Kec. %s) menunggu verifikasi mandat.', v_name, v_kel_name, v_kec), v_req);
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_auth_user();

create or replace function private.sync_auth_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email then update public.users set email = coalesce(new.email, ''), updated_at = now() where id = new.id; end if;
  return new;
end $$;
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users for each row execute function private.sync_auth_email();

-- ---------------------------------------------------------------- pengaman tabel
create or replace function private.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
create trigger users_touch before update on public.users for each row execute function private.touch_updated_at();
create trigger problem_boards_touch before update on public.problem_boards for each row execute function private.touch_updated_at();
create trigger handover_documents_touch before update on public.handover_documents for each row execute function private.touch_updated_at();

-- Pengaju mandat: kolom pelaku diisi otomatis; kirim ulang setelah PERLU_PERBAIKAN kembali ke antrean.
create or replace function private.mandate_requests_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and new.status = old.status and old.status = 'PERLU_PERBAIKAN'
     and (new.sk_document_url is distinct from old.sk_document_url or new.kelurahan_id is distinct from old.kelurahan_id) then
    new.status := 'MENUNGGU';
    perform private.notify_admins('MANDAT_PERBAIKAN_DIKIRIM', 'Pendaftar Kelurahan mengirim perbaikan data mandat dan menunggu verifikasi ulang.', new.id);
  end if;
  return new;
end $$;
create trigger mandate_requests_guard before update on public.mandate_requests for each row execute function private.mandate_requests_guard();

-- Inovasi: skala, durasi, plafon, batas tak terduga/honor, kunci anggaran, dan mesin status.
create or replace function private.innovations_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare cap numeric; v_reason text;
begin
  if tg_op = 'INSERT' then
    if new.leader_user_id is null then new.leader_user_id := auth.uid(); end if;
    if new.status <> 'DRAFT' then raise exception 'INITIAL_STATUS_MUST_BE_DRAFT' using errcode = '22023'; end if;
  else
    if new.leader_user_id <> old.leader_user_id or new.kode_unik <> old.kode_unik then raise exception 'IMMUTABLE_FIELD' using errcode = '22023'; end if;
    if old.rka_locked_at is not null and (new.total_rab <> old.total_rab or new.rab_tak_terduga <> old.rab_tak_terduga
       or new.rab_honor <> old.rab_honor or new.tipe_inovasi <> old.tipe_inovasi or new.kelurahan_target_id <> old.kelurahan_target_id) then
      raise exception 'BUDGET_LOCKED' using errcode = '22023', hint = 'Anggaran dikunci sejak Surat Kesepakatan disetujui (Handbook 6.1).';
    end if;
  end if;

  new.skala_plafon := (case when new.tipe_inovasi in ('PROGRAM', 'PRODUK') then 'KECIL_5JT' else 'TERAPAN_15JT' end)::public.plafon_scale;
  if new.skala_plafon = 'KECIL_5JT' then
    new.durasi_bangun_hari := private.param_int('durasi_bangun_kecil_hari'); cap := private.param_num('plafon_kecil');
  else
    new.durasi_bangun_hari := private.param_int('durasi_bangun_terapan_hari'); cap := private.param_num('plafon_terapan');
  end if;
  if new.total_rab > cap then raise exception 'RAB_OVER_PLAFON' using errcode = '22023', detail = format('Plafon %s, diajukan %s', cap, new.total_rab); end if;
  if new.rab_tak_terduga * 100 > new.total_rab * private.param_num('tak_terduga_maks_persen') then raise exception 'RAB_TAK_TERDUGA_OVER' using errcode = '22023'; end if;
  if new.rab_honor * 100 > new.total_rab * private.param_num('honor_maks_persen') then raise exception 'RAB_HONOR_OVER' using errcode = '22023'; end if;
  new.updated_at := now();

  if tg_op = 'UPDATE' and new.status <> old.status then
    if not exists (select 1 from public.innovation_transitions t where t.dari = old.status and t.ke = new.status) then
      raise exception 'INVALID_TRANSITION' using errcode = '22023', detail = format('%s -> %s', old.status, new.status);
    end if;
    if old.status = 'DISPUTED' and new.status not in ('CANCELLED_BY_KELURAHAN', 'TERMINATED_BLACKLISTED') and new.status is distinct from old.prev_status then
      raise exception 'DISPUTE_MUST_RETURN_TO_PREVIOUS_STATUS' using errcode = '22023';
    end if;
    v_reason := nullif(current_setting('kl.reason', true), '');
    insert into public.innovation_status_history (innovation_id, dari, ke, oleh, alasan) values (new.id, old.status, new.status, auth.uid(), v_reason);
  end if;
  return new;
end $$;
-- Pada INSERT baris induk belum ada saat BEFORE, jadi riwayat awal dicatat di trigger AFTER terpisah.
create or replace function private.innovations_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.innovation_status_history (innovation_id, dari, ke, oleh) values (new.id, null, new.status, auth.uid());
  return new;
end $$;
create trigger innovations_guard before insert or update on public.innovations for each row execute function private.innovations_guard();
create trigger innovations_after_insert after insert on public.innovations for each row execute function private.innovations_after_insert();

-- Perubahan status HANYA lewat fungsi ini (dipanggil fungsi alur kerja; tidak diberikan ke anon/authenticated).
create or replace function private.set_status(p_innovation uuid, p_to public.innovation_status, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare cur public.innovation_status;
begin
  select status into cur from public.innovations where id = p_innovation for update;
  if not found then raise exception 'INNOVATION_NOT_FOUND' using errcode = 'P0002'; end if;
  perform set_config('kl.reason', coalesce(p_reason, ''), true);
  update public.innovations set
    status = p_to,
    prev_status = case when p_to = 'DISPUTED' then cur else prev_status end,
    dispute_flag = (p_to = 'DISPUTED'),
    submitted_at = case when p_to in ('SUBMITTED_TO_KELURAHAN', 'WAITING_KELURAHAN_MANDATE') and submitted_at is null then now() else submitted_at end,
    approved_at = case when p_to = 'APPROVED_WAITING_TERM_1' then now() else approved_at end,
    rka_locked_at = case when p_to = 'APPROVED_WAITING_TERM_1' then coalesce(rka_locked_at, now()) else rka_locked_at end,
    building_started_at = case when p_to = 'BUILDING_PHASE' then now() else building_started_at end,
    completed_at = case when p_to = 'COMPLETED_PUBLISHED' then now() else completed_at end,
    stopped_at = case when p_to in ('STOPPED_AS_LEARNING', 'CANCELLED_BY_KELURAHAN', 'TERMINATED_BLACKLISTED') then now() else stopped_at end
  where id = p_innovation;
  perform set_config('kl.reason', '', true);
end $$;

-- Anggota tim: maksimal sesuai parameter (default 6).
create or replace function private.members_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.innovation_members m where m.innovation_id = new.innovation_id) >= private.param_int('tim_maks') then
    raise exception 'TEAM_FULL' using errcode = '22023', detail = 'Tim inovator maksimal 6 orang.';
  end if;
  return new;
end $$;
create trigger members_guard before insert on public.innovation_members for each row execute function private.members_guard();

-- Kolom pelaku diisi otomatis dari sesi (tidak dipercaya dari klien).
create or replace function private.set_actor_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'problem_boards' and new.created_by is null then new.created_by := auth.uid(); end if;
  if tg_table_name = 'logbook_entries' and new.dibuat_oleh is null then new.dibuat_oleh := auth.uid(); end if;
  if tg_table_name = 'disputes' then
    new.pelapor_id := coalesce(auth.uid(), new.pelapor_id);
    select role into new.pelapor_role from public.users where id = new.pelapor_id;
  end if;
  return new;
end $$;
create trigger problem_boards_actor before insert on public.problem_boards for each row execute function private.set_actor_columns();
create trigger logbook_entries_actor before insert on public.logbook_entries for each row execute function private.set_actor_columns();
create trigger disputes_actor before insert on public.disputes for each row execute function private.set_actor_columns();

-- Logbook: isi hanya oleh ketua tim dan terkunci setelah diverifikasi; verifikasi hanya oleh Kelurahan bermandat.
create or replace function private.logbook_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_kel uuid; v_content_changed boolean;
begin
  select kelurahan_target_id into v_kel from public.innovations where id = new.innovation_id;
  v_content_changed := (new.tanggal, new.deskripsi_progres, new.foto_url, new.nota_belanja_url, new.nominal_nota, new.uraian_nota)
    is distinct from (old.tanggal, old.deskripsi_progres, old.foto_url, old.nota_belanja_url, old.nominal_nota, old.uraian_nota);
  if new.innovation_id <> old.innovation_id or new.dibuat_oleh <> old.dibuat_oleh then raise exception 'IMMUTABLE_FIELD' using errcode = '22023'; end if;
  if (new.verified_by_lurah_at, new.verified_by) is distinct from (old.verified_by_lurah_at, old.verified_by) then
    if not private.has_mandate(v_kel) then raise exception 'FORBIDDEN_VERIFY' using errcode = '42501'; end if;
    if v_content_changed then raise exception 'VERIFY_ONLY' using errcode = '22023'; end if;
    new.verified_by := auth.uid();
    if new.verified_by_lurah_at is not null then new.verified_by_lurah_at := now(); end if;
  elsif v_content_changed then
    if old.verified_by_lurah_at is not null then raise exception 'ENTRY_LOCKED' using errcode = '22023'; end if;
    if not private.is_leader(new.innovation_id) then raise exception 'FORBIDDEN_EDIT' using errcode = '42501'; end if;
  end if;
  return new;
end $$;
create trigger logbook_guard before update on public.logbook_entries for each row execute function private.logbook_guard();

-- Dokumen serah terima: berkas oleh ketua tim; validasi per berkas oleh Kelurahan bermandat; berkas tervalidasi terkunci.
create or replace function private.handover_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_kel uuid;
begin
  select kelurahan_target_id into v_kel from public.innovations where id = new.innovation_id;
  if new.innovation_id <> old.innovation_id then raise exception 'IMMUTABLE_FIELD' using errcode = '22023'; end if;
  if (new.bast_verified_at, new.panduan_verified_at, new.lpj_verified_at, new.verified_by)
     is distinct from (old.bast_verified_at, old.panduan_verified_at, old.lpj_verified_at, old.verified_by) then
    if not private.has_mandate(v_kel) then raise exception 'FORBIDDEN_VERIFY' using errcode = '42501'; end if;
    if (new.bast_url, new.bast_foto_url, new.panduan_url, new.pelatihan_bukti_url, new.lpj_akhir_url)
       is distinct from (old.bast_url, old.bast_foto_url, old.panduan_url, old.pelatihan_bukti_url, old.lpj_akhir_url) then
      raise exception 'VERIFY_ONLY' using errcode = '22023';
    end if;
    new.verified_by := auth.uid();
  else
    if old.bast_verified_at is not null and (new.bast_url is distinct from old.bast_url or new.bast_foto_url is distinct from old.bast_foto_url) then raise exception 'ENTRY_LOCKED' using errcode = '22023'; end if;
    if old.panduan_verified_at is not null and (new.panduan_url is distinct from old.panduan_url or new.pelatihan_bukti_url is distinct from old.pelatihan_bukti_url) then raise exception 'ENTRY_LOCKED' using errcode = '22023'; end if;
    if old.lpj_verified_at is not null and new.lpj_akhir_url is distinct from old.lpj_akhir_url then raise exception 'ENTRY_LOCKED' using errcode = '22023'; end if;
    if not private.is_leader(new.innovation_id) then raise exception 'FORBIDDEN_EDIT' using errcode = '42501'; end if;
  end if;
  return new;
end $$;
create trigger handover_guard before update on public.handover_documents for each row execute function private.handover_guard();

-- Parameter sistem: catat siapa dan kapan; semua perubahan masuk audit log.
create or replace function private.system_parameters_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now(); new.updated_by := auth.uid();
  perform private.audit('PARAMETER_DIUBAH', old.key, jsonb_build_object('dari', old.value, 'ke', new.value));
  return new;
end $$;
create trigger system_parameters_guard before update on public.system_parameters for each row execute function private.system_parameters_guard();

-- Audit otomatis untuk perubahan wilayah master dan data mandat (aksi lain dicatat fungsi alur kerja).
create or replace function private.audit_row_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.audit(tg_table_name || '_' || lower(tg_op), coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id')),
    jsonb_build_object('sebelum', case when tg_op <> 'INSERT' then to_jsonb(old) end, 'sesudah', case when tg_op <> 'DELETE' then to_jsonb(new) end));
  return coalesce(new, old);
end $$;
create trigger kelurahan_mandates_audit after insert or update on public.kelurahan_mandates for each row execute function private.audit_row_change();
create trigger mandate_requests_audit after update on public.mandate_requests for each row execute function private.audit_row_change();
create trigger blacklist_entries_audit after insert or update on public.blacklist_entries for each row execute function private.audit_row_change();

-- ---------------------------------------------------------------- mesin status: pasangan transisi sah
insert into public.innovation_transitions (dari, ke) values
  ('DRAFT', 'SUBMITTED_TO_KELURAHAN'), ('DRAFT', 'WAITING_KELURAHAN_MANDATE'),
  ('WAITING_KELURAHAN_MANDATE', 'SUBMITTED_TO_KELURAHAN'),
  ('REVISION_REQUESTED', 'SUBMITTED_TO_KELURAHAN'), ('REVISION_REQUESTED', 'WAITING_KELURAHAN_MANDATE'),
  ('SUBMITTED_TO_KELURAHAN', 'REVISION_REQUESTED'), ('SUBMITTED_TO_KELURAHAN', 'REJECTED'), ('SUBMITTED_TO_KELURAHAN', 'APPROVED_WAITING_TERM_1'),
  ('REJECTED', 'APPEALED'), ('APPEALED', 'APPROVED_WAITING_TERM_1'), ('APPEALED', 'REJECTED'),
  ('APPROVED_WAITING_TERM_1', 'BUILDING_PHASE'),
  ('BUILDING_PHASE', 'COMMUNITY_TESTING'),          -- WAITING_BRIDA_GFORM dilewati: survei dibuat otomatis oleh website
  ('COMMUNITY_TESTING', 'EVALUATION_TERM_2'),
  ('EVALUATION_TERM_2', 'REFINEMENT_AND_HANDOVER'), ('EVALUATION_TERM_2', 'RETEST_PENDING'), ('EVALUATION_TERM_2', 'STOPPED_AS_LEARNING'),
  ('RETEST_PENDING', 'COMMUNITY_TESTING'),
  ('REFINEMENT_AND_HANDOVER', 'COMPLETED_PUBLISHED')
on conflict do nothing;
insert into public.innovation_transitions (dari, ke)
  select s, 'DISPUTED'::public.innovation_status from unnest(array['SUBMITTED_TO_KELURAHAN','APPROVED_WAITING_TERM_1','BUILDING_PHASE','COMMUNITY_TESTING','EVALUATION_TERM_2','RETEST_PENDING','REFINEMENT_AND_HANDOVER']::public.innovation_status[]) s
  on conflict do nothing;
insert into public.innovation_transitions (dari, ke)
  select 'DISPUTED'::public.innovation_status, s from unnest(array['SUBMITTED_TO_KELURAHAN','APPROVED_WAITING_TERM_1','BUILDING_PHASE','COMMUNITY_TESTING','EVALUATION_TERM_2','RETEST_PENDING','REFINEMENT_AND_HANDOVER','CANCELLED_BY_KELURAHAN','TERMINATED_BLACKLISTED']::public.innovation_status[]) s
  on conflict do nothing;
insert into public.innovation_transitions (dari, ke)
  select s, 'CANCELLED_BY_KELURAHAN'::public.innovation_status from unnest(array['APPROVED_WAITING_TERM_1','BUILDING_PHASE','COMMUNITY_TESTING','EVALUATION_TERM_2','RETEST_PENDING','REFINEMENT_AND_HANDOVER']::public.innovation_status[]) s
  on conflict do nothing;
insert into public.innovation_transitions (dari, ke)
  select s, 'TERMINATED_BLACKLISTED'::public.innovation_status from unnest(array['BUILDING_PHASE','COMMUNITY_TESTING','EVALUATION_TERM_2','RETEST_PENDING','REFINEMENT_AND_HANDOVER']::public.innovation_status[]) s
  on conflict do nothing;

-- ---------------------------------------------------------------- parameter bawaan (dapat diubah Admin BRIDA)
insert into public.system_parameters (key, value, deskripsi) values
  ('plafon_kecil', to_jsonb(5000000), 'Plafon RAB Skala Kecil (rupiah) - Program dan Produk'),
  ('plafon_terapan', to_jsonb(15000000), 'Plafon RAB Skala Terapan (rupiah) - Prototipe dan Teknologi'),
  ('durasi_bangun_kecil_hari', to_jsonb(30), 'Durasi bangun Skala Kecil (hari kalender)'),
  ('durasi_bangun_terapan_hari', to_jsonb(60), 'Durasi bangun Skala Terapan (hari kalender)'),
  ('porsi_tahap_1', to_jsonb(30), 'Porsi pencairan Tahap 1 (persen)'),
  ('porsi_tahap_2', to_jsonb(30), 'Porsi pencairan Tahap 2 (persen)'),
  ('porsi_tahap_3', to_jsonb(40), 'Porsi pencairan Tahap 3 (persen); jumlah tiga porsi harus 100'),
  ('tak_terduga_maks_persen', to_jsonb(10), 'Dana tak terduga maksimal (persen dari total RAB)'),
  ('honor_maks_persen', to_jsonb(15), 'Honorarium tim maksimal (persen dari total RAB)'),
  ('perawatan_min_bulan', to_jsonb(6), 'Rencana perawatan minimal (bulan)'),
  ('perawatan_maks_bulan', to_jsonb(12), 'Rencana perawatan maksimal (bulan)'),
  ('tim_min', to_jsonb(2), 'Anggota tim minimal'),
  ('tim_maks', to_jsonb(6), 'Anggota tim maksimal'),
  ('mandat_maks_per_kelurahan', to_jsonb(2), 'Akun bermandat aktif maksimal per kelurahan (1 utama + 1 cadangan)'),
  ('masa_uji_hari', to_jsonb(14), 'Durasi uji warga (hari kalender)'),
  ('perpanjangan_maks_hari', to_jsonb(7), 'Perpanjangan uji warga, sekali saja (hari)'),
  ('ambang_min_responden', to_jsonb(30), 'Ambang 1: responden warga unik minimal'),
  ('ambang_min_rating', to_jsonb(3.8), 'Ambang 2: rata-rata rating minimal (skala 1-5)'),
  ('ambang_min_membantu_persen', to_jsonb(75), 'Ambang 3: persentase menjawab Ya membantu minimal'),
  ('ambang_min_foto_persen', to_jsonb(80), 'Ambang 4: persentase responden melampirkan foto minimal'),
  ('tunda_rating_min', to_jsonb(3.0), 'Batas bawah rentang rating untuk keputusan Tunda/Uji Ulang'),
  ('retest_maks_kali', to_jsonb(2), 'Batas uji ulang setelah keputusan Tunda (pengaman tambahan, bukan dari handbook)'),
  ('survey_rate_limit_per_ip_per_hari', to_jsonb(10), 'Batas pengisian survei per hash IP per inovasi per 24 jam')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- hak eksekusi fungsi private
-- Hanya fungsi yang dipakai kebijakan RLS yang boleh dipanggil peran klien. Sisanya (set_status, notify_*, audit, trigger)
-- hanya dapat dipanggil dari fungsi/trigger milik owner.
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function
  private.param(text), private.param_int(text), private.param_num(text),
  private.is_admin(), private.is_super_admin(), private.is_active_innovator(), private.has_mandate(uuid), private.is_leader(uuid),
  private.innovation_status_of(uuid), private.innovation_kelurahan(uuid), private.is_kelurahan_of(uuid), private.can_view_innovation(uuid),
  private.kelurahan_sees_user(uuid), private.active_mandate_count(uuid), private.is_live_user(), private.today_wib(), private.mask_name(text)
  to anon, authenticated;
-- Trigger yang berjalan dengan hak pemanggil perlu mengeksekusi fungsi trigger milik sendiri (owner), jadi tidak perlu grant.
