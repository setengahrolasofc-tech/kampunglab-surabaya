-- Handbook Rev. 4, tahap (a), bagian 2: RLS, mesin status, audit, pendaftaran, mandat, seed parameter.
-- Pola repo dipertahankan: tabel dicabut dari anon/authenticated, hanya SELECT yang diberi lewat RLS,
-- seluruh tulisan lewat fungsi SECURITY DEFINER (private) dengan pembungkus SECURITY INVOKER (public).
-- Tidak ada dompet, gerbang bayar, pencairan otomatis, atau persetujuan otomatis. Tidak ada NIK.

create extension if not exists pgcrypto with schema extensions;

-- ===== Audit =====
create function private.rev4_log(p_aksi text, p_target text, p_detail jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_logs(aktor_id, aksi, target, detail_json)
  values (auth.uid(), p_aksi, left(p_target, 200), coalesce(p_detail, '{}'::jsonb));
$$;
revoke all on function private.rev4_log(text, text, jsonb) from public, anon, authenticated;

-- audit_logs tidak boleh diubah atau dihapus oleh siapa pun (termasuk lewat SQL biasa).
create function private.rev4_audit_immutable() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'audit_logs bersifat append-only' using errcode = '42501'; end; $$;
revoke all on function private.rev4_audit_immutable() from public, anon, authenticated;
create trigger audit_logs_append_only before update or delete on public.audit_logs
  for each row execute function private.rev4_audit_immutable();
create trigger audit_logs_no_truncate before truncate on public.audit_logs
  for each statement execute function private.rev4_audit_immutable();

-- ===== Identitas dan wewenang =====
create function private.rev4_is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_program_admin();
$$;

-- Akun Kelurahan hanya berwenang untuk kelurahan yang mandatnya aktif (utama/cadangan) dan akunnya AKTIF.
create function private.rev4_mandated_kelurahan() returns setof uuid language sql stable security definer set search_path = '' as $$
  select o.territory_id
  from public.office_mandates m
  join public.offices o on o.id = m.office_id and o.kind = 'kelurahan' and o.active
  join public.account_registrations r on r.user_id = m.user_id and r.role = 'KELURAHAN' and r.status = 'AKTIF'
  join auth.users u on u.id = m.user_id
  where auth.uid() is not null and m.user_id = auth.uid()
    and m.status = 'active' and m.mandate_type in ('primary', 'backup')
    and m.starts_at <= clock_timestamp() and (m.ends_at is null or m.ends_at > clock_timestamp())
    and u.email_confirmed_at is not null and u.deleted_at is null
    and (u.banned_until is null or u.banned_until <= clock_timestamp());
$$;

create function private.rev4_is_kelurahan_of(p_territory uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_territory in (select private.rev4_mandated_kelurahan());
$$;

create function private.rev4_has_active_mandate(p_territory uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.office_mandates m
    join public.offices o on o.id = m.office_id and o.kind = 'kelurahan' and o.active and o.territory_id = p_territory
    join public.account_registrations r on r.user_id = m.user_id and r.role = 'KELURAHAN' and r.status = 'AKTIF'
    where m.status = 'active' and m.mandate_type in ('primary', 'backup')
      and m.starts_at <= clock_timestamp() and (m.ends_at is null or m.ends_at > clock_timestamp()));
$$;

create function private.rev4_member_of(p_innovation uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.innovations i where i.id = p_innovation and i.leader_user_id = auth.uid()
    union all
    select 1 from public.innovation_members m where m.innovation_id = p_innovation and m.user_id = auth.uid());
$$;

create function private.rev4_can_read_innovation(p_innovation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    private.rev4_is_admin()
    or private.rev4_member_of(p_innovation)
    or exists (select 1 from public.innovations i where i.id = p_innovation
               and i.status <> 'DRAFT' and private.rev4_is_kelurahan_of(i.kelurahan_target_id)));
$$;

revoke all on function private.rev4_is_admin(), private.rev4_mandated_kelurahan(), private.rev4_is_kelurahan_of(uuid),
  private.rev4_has_active_mandate(uuid), private.rev4_member_of(uuid), private.rev4_can_read_innovation(uuid)
  from public, anon, authenticated;
grant execute on function private.rev4_is_admin(), private.rev4_mandated_kelurahan(), private.rev4_is_kelurahan_of(uuid),
  private.rev4_has_active_mandate(uuid), private.rev4_member_of(uuid), private.rev4_can_read_innovation(uuid)
  to authenticated;

create function private.rev4_account_active(p_role public.rev4_account_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.account_registrations r join auth.users u on u.id = r.user_id
    where r.user_id = auth.uid() and r.role = p_role and r.status = 'AKTIF'
      and u.email_confirmed_at is not null and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= clock_timestamp()));
$$;
revoke all on function private.rev4_account_active(public.rev4_account_role) from public, anon, authenticated;
grant execute on function private.rev4_account_active(public.rev4_account_role) to authenticated;

-- ===== RLS: pengaturan dasar =====
revoke all on public.master_kelurahan, public.account_registrations, public.system_parameters, public.audit_logs,
  public.rev4_notifications, public.problem_boards, public.innovations, public.innovation_members,
  public.logbooks_and_funds, public.testing_integrations, public.survey_responses, public.evidence_passports,
  public.rev4_status_transitions from public, anon, authenticated;

alter table public.master_kelurahan enable row level security;
alter table public.account_registrations enable row level security;
alter table public.system_parameters enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rev4_notifications enable row level security;
alter table public.problem_boards enable row level security;
alter table public.innovations enable row level security;
alter table public.innovation_members enable row level security;
alter table public.logbooks_and_funds enable row level security;
alter table public.testing_integrations enable row level security;
alter table public.survey_responses enable row level security;
alter table public.evidence_passports enable row level security;
alter table public.rev4_status_transitions enable row level security;

grant select on public.master_kelurahan, public.system_parameters, public.problem_boards to anon, authenticated;
grant select on public.account_registrations, public.audit_logs, public.rev4_notifications, public.innovations,
  public.innovation_members, public.logbooks_and_funds, public.testing_integrations, public.survey_responses,
  public.rev4_status_transitions to authenticated;
grant select on public.evidence_passports to anon, authenticated;
-- Etalase publik: hanya kolom aman dari inovasi terbit (RLS membatasi ke COMPLETED_PUBLISHED).
grant select (id, kode_unik, kelurahan_target_id, problem_board_id, judul, tipe_inovasi, skala_plafon, total_rab, status)
  on public.innovations to anon;
grant update (dibaca) on public.rev4_notifications to authenticated;

create policy master_kelurahan_read on public.master_kelurahan for select to anon, authenticated using (true);
create policy system_parameters_read on public.system_parameters for select to anon, authenticated using (true);
create policy transitions_read on public.rev4_status_transitions for select to authenticated using (true);

create policy registrations_own on public.account_registrations for select to authenticated
  using (user_id = auth.uid() or private.rev4_is_admin());
create policy audit_admin_read on public.audit_logs for select to authenticated using (private.rev4_is_admin());

create policy notifications_own on public.rev4_notifications for select to authenticated using (untuk_user_id = auth.uid());
create policy notifications_mark_read on public.rev4_notifications for update to authenticated
  using (untuk_user_id = auth.uid()) with check (untuk_user_id = auth.uid());

-- Papan Masalah: publik membaca; hanya Akun Kelurahan bermandat yang menulis (lewat RPC), RLS memblokir sisanya.
create policy problem_boards_public on public.problem_boards for select to anon, authenticated using (true);

create policy innovations_read on public.innovations for select to authenticated
  using (private.rev4_can_read_innovation(id));
create policy innovations_public on public.innovations for select to anon
  using (status = 'COMPLETED_PUBLISHED');
create policy members_read on public.innovation_members for select to authenticated
  using (private.rev4_can_read_innovation(innovation_id));
create policy logbook_read on public.logbooks_and_funds for select to authenticated
  using (private.rev4_can_read_innovation(innovation_id));
create policy testing_read on public.testing_integrations for select to authenticated
  using (private.rev4_can_read_innovation(innovation_id));
create policy survey_read on public.survey_responses for select to authenticated
  using (private.rev4_can_read_innovation(innovation_id));
create policy passports_public on public.evidence_passports for select to anon, authenticated using (true);

-- Penulisan langsung oleh klien hanya untuk isi pengajuan oleh ketua tim (kolom konten, saat DRAFT/REVISI).
grant insert (leader_user_id, kelurahan_target_id, problem_board_id, judul, tipe_inovasi, skala_plafon, total_rab,
  target_rt_rw, prd_url, rab_url, surat_keaslian_url, surat_kesepakatan_url) on public.innovations to authenticated;
grant update (kelurahan_target_id, problem_board_id, judul, tipe_inovasi, skala_plafon, total_rab, target_rt_rw,
  prd_url, rab_url, surat_keaslian_url, surat_kesepakatan_url) on public.innovations to authenticated;
grant insert, update, delete on public.innovation_members to authenticated;
grant insert (innovation_id, deskripsi_progres, nota_belanja_url, dicatat_oleh) on public.logbooks_and_funds to authenticated;

create policy innovations_insert on public.innovations for insert to authenticated
  with check (leader_user_id = auth.uid() and private.rev4_account_active('INNOVATOR'));
create policy innovations_update on public.innovations for update to authenticated
  using (leader_user_id = auth.uid() and status in ('DRAFT', 'REVISION_REQUESTED'))
  with check (leader_user_id = auth.uid() and status in ('DRAFT', 'REVISION_REQUESTED'));
create policy members_write_ins on public.innovation_members for insert to authenticated
  with check (exists (select 1 from public.innovations i where i.id = innovation_id and i.leader_user_id = auth.uid()
    and i.status in ('DRAFT', 'REVISION_REQUESTED')));
create policy members_write_upd on public.innovation_members for update to authenticated
  using (exists (select 1 from public.innovations i where i.id = innovation_id and i.leader_user_id = auth.uid()
    and i.status in ('DRAFT', 'REVISION_REQUESTED')))
  with check (exists (select 1 from public.innovations i where i.id = innovation_id and i.leader_user_id = auth.uid()
    and i.status in ('DRAFT', 'REVISION_REQUESTED')));
create policy members_write_del on public.innovation_members for delete to authenticated
  using (exists (select 1 from public.innovations i where i.id = innovation_id and i.leader_user_id = auth.uid()
    and i.status in ('DRAFT', 'REVISION_REQUESTED')));
-- Logbook biasa (tanpa tahap) hanya saat membangun atau menyempurnakan; baris tahap hanya lewat RPC pencatatan transfer.
create policy logbook_insert on public.logbooks_and_funds for insert to authenticated
  with check (tahap is null and nominal_cair is null and dicatat_oleh = auth.uid()
    and exists (select 1 from public.innovations i where i.id = innovation_id and i.leader_user_id = auth.uid()
      and i.status in ('BUILDING_PHASE', 'RETEST_PENDING', 'REFINEMENT_AND_HANDOVER')));


-- ===== Penjaga isi pengajuan =====
-- Status tidak boleh diubah lewat UPDATE biasa; hanya fungsi transisi (yang menyalakan kl.rev4_transition) yang boleh.
create function private.rev4_innovation_guard() returns trigger language plpgsql set search_path = '' as $$
declare kecil numeric; terapan numeric;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'DRAFT' then raise exception 'Pengajuan baru harus berstatus DRAFT' using errcode = '42501'; end if;
    new.dispute_flag := false; new.dispute_reason := null; new.status_before_dispute := null; new.submitted_at := null;
  else
    if new.status is distinct from old.status or new.dispute_flag is distinct from old.dispute_flag
       or new.dispute_reason is distinct from old.dispute_reason
       or new.status_before_dispute is distinct from old.status_before_dispute
       or new.submitted_at is distinct from old.submitted_at or new.kode_unik is distinct from old.kode_unik
       or new.leader_user_id is distinct from old.leader_user_id then
      if coalesce(current_setting('kl.rev4_transition', true), '') <> 'on' then
        raise exception 'Status dan kolom kendali hanya dapat diubah lewat transisi resmi' using errcode = '42501';
      end if;
    end if;
    new.updated_at := now();
  end if;
  select (value #>> '{}')::numeric into kecil from public.system_parameters where key = 'plafon_skala_kecil';
  select (value #>> '{}')::numeric into terapan from public.system_parameters where key = 'plafon_skala_terapan';
  if new.skala_plafon = 'KECIL_5JT' and new.total_rab > coalesce(kecil, 5000000) then
    raise exception 'Total RAB melebihi plafon Skala Kecil' using errcode = '23514';
  elsif new.skala_plafon = 'TERAPAN_15JT' and new.total_rab > coalesce(terapan, 15000000) then
    raise exception 'Total RAB melebihi plafon Skala Terapan' using errcode = '23514';
  end if;
  return new;
end; $$;
revoke all on function private.rev4_innovation_guard() from public, anon, authenticated;
create trigger rev4_innovation_guard before insert or update on public.innovations
  for each row execute function private.rev4_innovation_guard();

-- Jenjang SMP/SD ke bawah tidak ada di daftar yang diizinkan (check kolom). Anggota hanya dapat dilampirkan sekali per akun.
create unique index innovation_members_user_once on public.innovation_members(innovation_id, user_id) where user_id is not null;

-- ===== Mesin status: aturan aktor =====
create table public.rev4_transition_actors (
  from_status public.rev4_innovation_status not null,
  to_status public.rev4_innovation_status not null,
  actor text not null check (actor in ('INNOVATOR', 'KELURAHAN', 'BRIDA_ADMIN', 'SYSTEM')),
  primary key (from_status, to_status, actor),
  foreign key (from_status, to_status) references public.rev4_status_transitions(from_status, to_status)
);
revoke all on public.rev4_transition_actors from public, anon, authenticated;
alter table public.rev4_transition_actors enable row level security;
grant select on public.rev4_transition_actors to authenticated;
create policy transition_actors_read on public.rev4_transition_actors for select to authenticated using (true);

insert into public.rev4_transition_actors(from_status, to_status, actor) values
  ('DRAFT','SUBMITTED_TO_KELURAHAN','INNOVATOR'),('DRAFT','WAITING_KELURAHAN_MANDATE','INNOVATOR'),
  ('WAITING_KELURAHAN_MANDATE','SUBMITTED_TO_KELURAHAN','SYSTEM'),
  ('SUBMITTED_TO_KELURAHAN','REVISION_REQUESTED','KELURAHAN'),('SUBMITTED_TO_KELURAHAN','REJECTED','KELURAHAN'),
  ('SUBMITTED_TO_KELURAHAN','APPROVED_WAITING_TERM_1','KELURAHAN'),
  ('REVISION_REQUESTED','SUBMITTED_TO_KELURAHAN','INNOVATOR'),('REVISION_REQUESTED','WAITING_KELURAHAN_MANDATE','INNOVATOR'),
  ('REJECTED','APPEALED','INNOVATOR'),('APPEALED','SUBMITTED_TO_KELURAHAN','BRIDA_ADMIN'),('APPEALED','REJECTED','BRIDA_ADMIN'),
  ('APPROVED_WAITING_TERM_1','BUILDING_PHASE','KELURAHAN'),
  ('BUILDING_PHASE','COMMUNITY_TESTING','INNOVATOR'),
  ('COMMUNITY_TESTING','EVALUATION_TERM_2','SYSTEM'),('COMMUNITY_TESTING','EVALUATION_TERM_2','KELURAHAN'),
  ('COMMUNITY_TESTING','EVALUATION_TERM_2','BRIDA_ADMIN'),
  ('EVALUATION_TERM_2','REFINEMENT_AND_HANDOVER','KELURAHAN'),('EVALUATION_TERM_2','RETEST_PENDING','KELURAHAN'),
  ('EVALUATION_TERM_2','STOPPED_AS_LEARNING','KELURAHAN'),
  ('RETEST_PENDING','COMMUNITY_TESTING','INNOVATOR'),
  ('REFINEMENT_AND_HANDOVER','COMPLETED_PUBLISHED','KELURAHAN'),
  ('APPROVED_WAITING_TERM_1','CANCELLED_BY_KELURAHAN','KELURAHAN'),('BUILDING_PHASE','CANCELLED_BY_KELURAHAN','KELURAHAN'),
  ('COMMUNITY_TESTING','CANCELLED_BY_KELURAHAN','KELURAHAN'),('EVALUATION_TERM_2','CANCELLED_BY_KELURAHAN','KELURAHAN'),
  ('RETEST_PENDING','CANCELLED_BY_KELURAHAN','KELURAHAN'),('REFINEMENT_AND_HANDOVER','CANCELLED_BY_KELURAHAN','KELURAHAN'),
  ('DISPUTED','CANCELLED_BY_KELURAHAN','BRIDA_ADMIN'),
  ('BUILDING_PHASE','TERMINATED_BLACKLISTED','BRIDA_ADMIN'),('COMMUNITY_TESTING','TERMINATED_BLACKLISTED','BRIDA_ADMIN'),
  ('EVALUATION_TERM_2','TERMINATED_BLACKLISTED','BRIDA_ADMIN'),('RETEST_PENDING','TERMINATED_BLACKLISTED','BRIDA_ADMIN'),
  ('REFINEMENT_AND_HANDOVER','TERMINATED_BLACKLISTED','BRIDA_ADMIN'),('DISPUTED','TERMINATED_BLACKLISTED','BRIDA_ADMIN');
-- Lapor Kendala: pihak yang terlibat atau Admin membuka sengketa; hanya Admin yang menutupnya.
insert into public.rev4_transition_actors(from_status, to_status, actor)
select t.from_status, t.to_status, a.actor from public.rev4_status_transitions t
cross join (values ('INNOVATOR'), ('KELURAHAN'), ('BRIDA_ADMIN')) a(actor)
where t.to_status = 'DISPUTED' on conflict do nothing;
insert into public.rev4_transition_actors(from_status, to_status, actor)
select t.from_status, t.to_status, 'BRIDA_ADMIN' from public.rev4_status_transitions t
where t.from_status = 'DISPUTED' and t.to_status not in ('CANCELLED_BY_KELURAHAN', 'TERMINATED_BLACKLISTED')
on conflict do nothing;

create table public.rev4_status_history (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations(id) on delete cascade,
  from_status public.rev4_innovation_status,
  to_status public.rev4_innovation_status not null,
  actor_id uuid,
  actor_role text not null,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default clock_timestamp()
);
create index rev4_status_history_innovation on public.rev4_status_history(innovation_id, created_at);
revoke all on public.rev4_status_history from public, anon, authenticated;
alter table public.rev4_status_history enable row level security;
grant select on public.rev4_status_history to authenticated;
create policy status_history_read on public.rev4_status_history for select to authenticated
  using (private.rev4_can_read_innovation(innovation_id));

-- Satu-satunya jalan mengubah status. p_system=true hanya untuk pemanggil internal (private), bukan klien.
create function private.rev4_apply_transition(p_innovation uuid, p_to public.rev4_innovation_status, p_note text,
  p_actor text, p_actor_id uuid) returns public.rev4_innovation_status
language plpgsql security definer set search_path = '' as $$
declare cur public.innovations%rowtype; reason text := nullif(btrim(coalesce(p_note, '')), '');
begin
  select * into cur from public.innovations where id = p_innovation for update;
  if not found then raise exception 'Pengajuan tidak ditemukan' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.rev4_transition_actors a
      where a.from_status = cur.status and a.to_status = p_to and a.actor = p_actor) then
    raise exception 'Transisi % -> % tidak diizinkan untuk peran %', cur.status, p_to, p_actor using errcode = '42501';
  end if;
  if p_to in ('REJECTED', 'REVISION_REQUESTED', 'CANCELLED_BY_KELURAHAN', 'TERMINATED_BLACKLISTED', 'DISPUTED', 'APPEALED',
              'STOPPED_AS_LEARNING', 'RETEST_PENDING') and reason is null then
    raise exception 'Alasan wajib diisi' using errcode = '22023';
  end if;
  perform set_config('kl.rev4_transition', 'on', true);
  if p_to = 'DISPUTED' then
    update public.innovations set status = 'DISPUTED', status_before_dispute = cur.status, dispute_flag = true,
      dispute_reason = reason where id = cur.id;
  elsif cur.status = 'DISPUTED' and p_to <> 'CANCELLED_BY_KELURAHAN' and p_to <> 'TERMINATED_BLACKLISTED' then
    if cur.status_before_dispute is distinct from p_to then
      raise exception 'Sengketa hanya dapat kembali ke status sebelumnya (%)', cur.status_before_dispute using errcode = '22023';
    end if;
    update public.innovations set status = p_to, status_before_dispute = null, dispute_flag = false, dispute_reason = null
      where id = cur.id;
  else
    update public.innovations set status = p_to,
      submitted_at = case when p_to in ('SUBMITTED_TO_KELURAHAN', 'WAITING_KELURAHAN_MANDATE') and submitted_at is null
        then clock_timestamp() else submitted_at end
      where id = cur.id;
  end if;
  perform set_config('kl.rev4_transition', 'off', true);
  insert into public.rev4_status_history(innovation_id, from_status, to_status, actor_id, actor_role, note)
  values (cur.id, cur.status, p_to, p_actor_id, p_actor, reason);
  insert into public.audit_logs(aktor_id, aksi, target, detail_json)
  values (p_actor_id, 'status_inovasi', 'innovation:' || cur.id::text,
    jsonb_build_object('dari', cur.status, 'ke', p_to, 'peran', p_actor, 'alasan', reason));
  return cur.status;
end; $$;
revoke all on function private.rev4_apply_transition(uuid, public.rev4_innovation_status, text, text, uuid) from public, anon, authenticated;

-- Prasyarat isi untuk pengiriman (Bab 3.3, 8.2): 2-6 anggota, 4 dokumen, RAB dalam plafon.
create function private.rev4_submission_problems(p_innovation uuid) returns text[]
language plpgsql stable security definer set search_path = '' as $$
declare i public.innovations%rowtype; n integer; problems text[] := '{}';
begin
  select * into i from public.innovations where id = p_innovation;
  select count(*) into n from public.innovation_members where innovation_id = p_innovation;
  if n < 2 then problems := array_append(problems, 'Anggota tim minimal 2 orang'::text); end if;
  if n > 6 then problems := array_append(problems, 'Anggota tim maksimal 6 orang'::text); end if;
  if i.prd_url is null then problems := array_append(problems, 'PRD belum diunggah'::text); end if;
  if i.rab_url is null then problems := array_append(problems, 'RAB belum diunggah'::text); end if;
  if i.surat_keaslian_url is null then problems := array_append(problems, 'Surat Keaslian belum diunggah'::text); end if;
  if i.surat_kesepakatan_url is null then problems := array_append(problems, 'Surat Kesepakatan Lokasi Uji belum diunggah'::text); end if;
  if i.total_rab <= 0 then problems := array_append(problems, 'Total RAB belum diisi'::text); end if;
  if char_length(btrim(i.target_rt_rw)) < 2 then problems := array_append(problems, 'Lokasi uji RT/RW belum diisi'::text); end if;
  return problems;
end; $$;
revoke all on function private.rev4_submission_problems(uuid) from public, anon, authenticated;

create function private.rev4_transition(p_innovation uuid, p_to public.rev4_innovation_status, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); cur public.innovations%rowtype; role_used text; problems text[];
        target_to public.rev4_innovation_status := p_to;
begin
  if actor is null then raise exception 'Perlu masuk' using errcode = '28000'; end if;
  select * into cur from public.innovations where id = p_innovation;
  if not found or not private.rev4_can_read_innovation(p_innovation) then
    raise exception 'Pengajuan tidak ditemukan' using errcode = 'P0002';
  end if;
  -- Pengiriman: sistem memilih antara SUBMITTED dan WAITING sesuai ada tidaknya mandat aktif.
  if cur.status in ('DRAFT', 'REVISION_REQUESTED') and p_to in ('SUBMITTED_TO_KELURAHAN', 'WAITING_KELURAHAN_MANDATE') then
    problems := private.rev4_submission_problems(p_innovation);
    if array_length(problems, 1) > 0 then
      raise exception 'Pengajuan belum lengkap: %', array_to_string(problems, '; ') using errcode = '22023';
    end if;
    target_to := case when private.rev4_has_active_mandate(cur.kelurahan_target_id)
      then 'SUBMITTED_TO_KELURAHAN' else 'WAITING_KELURAHAN_MANDATE' end;
  end if;
  role_used := case
    when exists (select 1 from public.rev4_transition_actors a where a.from_status = cur.status and a.to_status = target_to
        and a.actor = 'BRIDA_ADMIN') and private.rev4_is_admin() then 'BRIDA_ADMIN'
    when exists (select 1 from public.rev4_transition_actors a where a.from_status = cur.status and a.to_status = target_to
        and a.actor = 'KELURAHAN') and private.rev4_is_kelurahan_of(cur.kelurahan_target_id) then 'KELURAHAN'
    when exists (select 1 from public.rev4_transition_actors a where a.from_status = cur.status and a.to_status = target_to
        and a.actor = 'INNOVATOR') and cur.leader_user_id = actor and private.rev4_account_active('INNOVATOR') then 'INNOVATOR'
    else null end;
  if role_used is null then raise exception 'Kamu tidak berwenang melakukan perubahan status ini' using errcode = '42501'; end if;
  -- Prasyarat dana dan uji: dicatat lewat RPC tahap (d)-(f); di sini hanya dipastikan buktinya sudah ada.
  if target_to = 'BUILDING_PHASE' and not exists (select 1 from public.logbooks_and_funds f
      where f.innovation_id = cur.id and f.tahap = 'TAHAP_1_30' and f.bukti_transfer_url is not null) then
    raise exception 'Bukti transfer Tahap 1 belum dicatat' using errcode = '22023';
  end if;
  if cur.status = 'EVALUATION_TERM_2' and target_to = 'REFINEMENT_AND_HANDOVER' and not exists (
      select 1 from public.logbooks_and_funds f where f.innovation_id = cur.id and f.tahap = 'TAHAP_2_30'
        and f.bukti_transfer_url is not null) then
    raise exception 'Bukti transfer Tahap 2 belum dicatat' using errcode = '22023';
  end if;
  if target_to = 'COMPLETED_PUBLISHED' and not exists (
      select 1 from public.logbooks_and_funds f where f.innovation_id = cur.id and f.tahap = 'TAHAP_3_40'
        and f.bukti_transfer_url is not null and f.bast_url is not null and f.panduan_url is not null
        and f.lpj_akhir_url is not null and f.verified_by_lurah_at is not null) then
    raise exception 'Bukti transfer Tahap 3 dan validasi BAST, Panduan, serta LPJ belum lengkap' using errcode = '22023';
  end if;
  perform private.rev4_apply_transition(cur.id, target_to, p_note, role_used, actor);
  return jsonb_build_object('status', target_to, 'peran', role_used);
end; $$;
revoke all on function private.rev4_transition(uuid, public.rev4_innovation_status, text) from public, anon, authenticated;
grant execute on function private.rev4_transition(uuid, public.rev4_innovation_status, text) to authenticated;

create function public.rev4_transition(p_innovation uuid, p_to public.rev4_innovation_status, p_note text default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.rev4_transition(p_innovation, p_to, p_note);
$$;
revoke all on function public.rev4_transition(uuid, public.rev4_innovation_status, text) from public, anon, authenticated;
grant execute on function public.rev4_transition(uuid, public.rev4_innovation_status, text) to authenticated;

-- ===== Pendaftaran akun (Bab 3.1) =====
create table private.brida_invite (
  id boolean primary key default true check (id),
  code_hash text not null,
  updated_at timestamptz not null default now()
);
create table private.brida_invite_attempts (
  user_id uuid not null,
  attempted_at timestamptz not null default clock_timestamp(),
  success boolean not null
);
create index brida_invite_attempts_user on private.brida_invite_attempts(user_id, attempted_at);
revoke all on private.brida_invite, private.brida_invite_attempts from public, anon, authenticated;
alter table private.brida_invite enable row level security;
alter table private.brida_invite_attempts enable row level security;

-- Dipanggil operator (skrip seed) dengan kunci service role / owner; tidak diberikan ke klien.
create function private.rev4_set_brida_invite(p_code text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if char_length(coalesce(p_code, '')) < 12 then raise exception 'Kode undangan minimal 12 karakter' using errcode = '22023'; end if;
  insert into private.brida_invite(id, code_hash) values (true, extensions.crypt(p_code, extensions.gen_salt('bf', 10)))
  on conflict (id) do update set code_hash = excluded.code_hash, updated_at = now();
end; $$;
revoke all on function private.rev4_set_brida_invite(text) from public, anon, authenticated;

create function private.rev4_register(p_role public.rev4_account_role, p_phone text, p_institution text, p_city text,
  p_nip text, p_jabatan text, p_kelurahan uuid, p_sk_path text, p_invite text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); st public.rev4_account_status; ok boolean; fails integer;
begin
  if actor is null then raise exception 'Perlu masuk' using errcode = '28000'; end if;
  if exists (select 1 from public.account_registrations where user_id = actor) then
    raise exception 'Akun sudah terdaftar dengan peran lain atau ganda' using errcode = '23505';
  end if;
  if not exists (select 1 from auth.users u where u.id = actor and u.email_confirmed_at is not null) then
    raise exception 'Verifikasi email dulu sebelum melengkapi pendaftaran' using errcode = '42501';
  end if;
  if p_role = 'INNOVATOR' then
    st := 'AKTIF';
    insert into public.account_registrations(user_id, role, status, phone_wa, institution, city)
    values (actor, 'INNOVATOR', st, p_phone, btrim(p_institution), btrim(p_city));
  elsif p_role = 'KELURAHAN' then
    if p_sk_path is null or p_sk_path !~ ('^' || actor::text || '/') then
      raise exception 'SK/surat tugas wajib diunggah' using errcode = '22023';
    end if;
    st := 'MENUNGGU_MANDAT';
    insert into public.account_registrations(user_id, role, status, phone_wa, nip, jabatan, kelurahan_id, sk_path)
    values (actor, 'KELURAHAN', st, p_phone, p_nip, btrim(p_jabatan), p_kelurahan, p_sk_path);
    perform private.rev4_notify_admins('pendaftar_baru', 'Pendaftar Kelurahan baru menunggu mandat.', actor, '/admin/mandat-kelurahan');
  else
    select count(*) into fails from private.brida_invite_attempts
      where user_id = actor and not success and attempted_at > clock_timestamp() - interval '1 hour';
    if fails >= 5 then raise exception 'Terlalu banyak percobaan kode undangan, coba lagi nanti' using errcode = '42501'; end if;
    select exists (select 1 from private.brida_invite i where i.code_hash = extensions.crypt(coalesce(p_invite, ''), i.code_hash)) into ok;
    insert into private.brida_invite_attempts(user_id, success) values (actor, ok);
    if not ok then
      perform private.rev4_log('brida_undangan_gagal', 'user:' || actor::text, '{}'::jsonb);
      raise exception 'Kode undangan BRIDA tidak valid' using errcode = '42501';
    end if;
    st := 'AKTIF';
    insert into public.account_registrations(user_id, role, status, phone_wa, institution)
    values (actor, 'BRIDA_ADMIN', st, p_phone, 'BRIDA Kota Surabaya');
    insert into public.platform_role_grants(user_id, role, starts_at, appointment_reference, granted_by)
    values (actor, 'program_admin', clock_timestamp() - interval '1 second', 'Kode undangan staf BRIDA', null);
  end if;
  perform private.rev4_log('daftar_akun', 'user:' || actor::text, jsonb_build_object('peran', p_role, 'status', st));
  return jsonb_build_object('role', p_role, 'status', st);
end; $$;
revoke all on function private.rev4_register(public.rev4_account_role, text, text, text, text, text, uuid, text, text)
  from public, anon, authenticated;
grant execute on function private.rev4_register(public.rev4_account_role, text, text, text, text, text, uuid, text, text)
  to authenticated;

create function public.rev4_register(p_role public.rev4_account_role, p_phone text, p_institution text default null,
  p_city text default null, p_nip text default null, p_jabatan text default null, p_kelurahan uuid default null,
  p_sk_path text default null, p_invite text default null) returns jsonb
language sql security invoker set search_path = '' as $$
  select private.rev4_register(p_role, p_phone, p_institution, p_city, p_nip, p_jabatan, p_kelurahan, p_sk_path, p_invite);
$$;
revoke all on function public.rev4_register(public.rev4_account_role, text, text, text, text, text, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.rev4_register(public.rev4_account_role, text, text, text, text, text, uuid, text, text)
  to authenticated;

-- ===== Notifikasi dalam aplikasi =====
create function private.rev4_notify(p_user uuid, p_tipe text, p_pesan text, p_ref uuid, p_tautan text) returns void
language sql security definer set search_path = '' as $$
  insert into public.rev4_notifications(untuk_user_id, tipe, pesan, ref_id, tautan)
  values (p_user, p_tipe, left(p_pesan, 400), p_ref, p_tautan);
$$;
revoke all on function private.rev4_notify(uuid, text, text, uuid, text) from public, anon, authenticated;

create function private.rev4_notify_admins(p_tipe text, p_pesan text, p_ref uuid, p_tautan text) returns void
language sql security definer set search_path = '' as $$
  insert into public.rev4_notifications(untuk_user_id, untuk_role, tipe, pesan, ref_id, tautan)
  select g.user_id, 'BRIDA_ADMIN', p_tipe, left(p_pesan, 400), p_ref, p_tautan
  from public.platform_role_grants g
  join public.account_registrations r on r.user_id = g.user_id and r.role = 'BRIDA_ADMIN' and r.status = 'AKTIF'
  where g.role = 'program_admin' and g.status = 'active' and g.starts_at <= clock_timestamp()
    and (g.ends_at is null or g.ends_at > clock_timestamp());
$$;
revoke all on function private.rev4_notify_admins(text, text, uuid, text) from public, anon, authenticated;

alter table public.rev4_notifications drop constraint rev4_notifications_tipe_check;
alter table public.rev4_notifications add constraint rev4_notifications_tipe_check check (tipe in (
  'kelurahan_tanpa_mandat','mandat_kosong','pendaftar_baru','mandat_diberikan','mandat_ditolak','mandat_perbaikan',
  'mandat_dicabut','pengajuan_diteruskan','pengajuan_menunggu_mandat','pengajuan_baru','status_berubah'));

-- Notifikasi otomatis saat status berubah (inovator + kelurahan bermandat) dan saat pengajuan menunggu mandat.
create function private.rev4_status_notify() returns trigger language plpgsql security definer set search_path = '' as $$
declare kel text; kec text; n integer;
begin
  if new.status is not distinct from old.status then return new; end if;
  select m.kelurahan, m.kecamatan into kel, kec from public.master_kelurahan m where m.territory_id = new.kelurahan_target_id;
  perform private.rev4_notify(new.leader_user_id, 'status_berubah',
    'Status pengajuan "' || left(new.judul, 80) || '" berubah ke ' || new.status::text || '.', new.id, '/inovasi/' || new.id::text);
  if new.status = 'WAITING_KELURAHAN_MANDATE' then
    select count(*) into n from public.innovations where kelurahan_target_id = new.kelurahan_target_id
      and status = 'WAITING_KELURAHAN_MANDATE';
    perform private.rev4_notify_admins('kelurahan_tanpa_mandat',
      'Kelurahan ' || kel || ' (Kec. ' || kec || ') belum punya akun bermandat, ada ' || n || ' pengajuan menunggu.',
      new.kelurahan_target_id, '/admin/mandat-kelurahan');
  elsif new.status = 'SUBMITTED_TO_KELURAHAN' then
    insert into public.rev4_notifications(untuk_user_id, untuk_role, tipe, pesan, ref_id, tautan)
    select distinct o_m.user_id, 'KELURAHAN', 'pengajuan_baru',
      'Pengajuan baru "' || left(new.judul, 80) || '" menunggu pemeriksaan.', new.id, '/kelurahan/antrean'
    from public.office_mandates o_m join public.offices o on o.id = o_m.office_id and o.kind = 'kelurahan'
    where o.territory_id = new.kelurahan_target_id and o_m.status = 'active' and o_m.mandate_type in ('primary', 'backup');
  end if;
  return new;
end; $$;
revoke all on function private.rev4_status_notify() from public, anon, authenticated;
create trigger rev4_status_notify after update of status on public.innovations
  for each row execute function private.rev4_status_notify();

-- Setiap pengajuan baru dibuat DRAFT; pengajuan menunggu mandat dibuka otomatis saat mandat diberikan (lihat tahap c).

-- ===== Audit umum untuk tabel sensitif =====
create function private.rev4_audit_row() returns trigger language plpgsql security definer set search_path = '' as $$
declare rid text;
begin
  rid := case when tg_op = 'DELETE' then coalesce(to_jsonb(old)->>'id', to_jsonb(old)->>'key', to_jsonb(old)->>'user_id')
    else coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'key', to_jsonb(new)->>'user_id') end;
  insert into public.audit_logs(aktor_id, aksi, target, detail_json)
  values (auth.uid(), lower(tg_op) || ':' || tg_table_name, tg_table_name || ':' || coalesce(rid, '?'),
    case when tg_op = 'UPDATE' then jsonb_build_object('lama_status', to_jsonb(old)->>'status', 'baru_status', to_jsonb(new)->>'status')
         else '{}'::jsonb end);
  return null;
end; $$;
revoke all on function private.rev4_audit_row() from public, anon, authenticated;
create trigger rev4_audit_funds after insert or update or delete on public.logbooks_and_funds
  for each row execute function private.rev4_audit_row();
create trigger rev4_audit_params after insert or update or delete on public.system_parameters
  for each row execute function private.rev4_audit_row();
create trigger rev4_audit_registrations after update on public.account_registrations
  for each row execute function private.rev4_audit_row();
create trigger rev4_audit_testing after insert or update on public.testing_integrations
  for each row execute function private.rev4_audit_row();
