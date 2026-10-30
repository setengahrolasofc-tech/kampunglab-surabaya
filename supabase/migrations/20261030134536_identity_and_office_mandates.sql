-- Identity foundation only. No real officials, territories, or admin are seeded.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create extension if not exists btree_gist with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.territories (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('kelurahan', 'rw', 'rt')),
  code text not null check (char_length(btrim(code)) between 1 and 40),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  parent_id uuid,
  parent_kind text generated always as
    (case kind when 'rw' then 'kelurahan' when 'rt' then 'rw' else null end) stored,
  unique (id, kind),
  foreign key (parent_id, parent_kind) references public.territories(id, kind),
  check ((kind = 'kelurahan' and parent_id is null) or (kind in ('rw','rt') and parent_id is not null))
);
create unique index territories_root_code on public.territories(kind, code) where parent_id is null;
create unique index territories_child_code on public.territories(parent_id, kind, code) where parent_id is not null;

create table public.offices (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null,
  kind text not null check (kind in ('rt','rw','kelurahan')),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (territory_id, kind) references public.territories(id, kind),
  unique (territory_id, kind)
);

create table public.office_mandates (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id),
  user_id uuid not null references public.profiles(id),
  mandate_type text not null check (mandate_type in ('primary','backup','delegate')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'active' check (status in ('active','revoked')),
  appointment_reference text not null check (char_length(btrim(appointment_reference)) between 2 and 240),
  granted_by uuid references public.profiles(id),
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (mandate_type <> 'delegate' or ends_at is not null),
  check ((status = 'active' and revoked_at is null) or
    (status = 'revoked' and revoked_at is not null and coalesce(char_length(btrim(revocation_reason)),0) > 0)),
  exclude using gist (
    office_id with =, mandate_type with =, tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'active' and mandate_type in ('primary','backup')),
  exclude using gist (
    office_id with =, user_id with =, tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'active')
);
create index office_mandates_user on public.office_mandates(user_id);
create index office_mandates_granter on public.office_mandates(granted_by);

create table public.platform_role_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  role text not null check (role in ('program_admin','reviewer','facilitator')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'active' check (status in ('active','revoked')),
  appointment_reference text not null check (char_length(btrim(appointment_reference)) between 2 and 240),
  granted_by uuid references public.profiles(id),
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check ((status = 'active' and revoked_at is null) or
    (status = 'revoked' and revoked_at is not null and coalesce(char_length(btrim(revocation_reason)),0) > 0)),
  exclude using gist (
    user_id with =, role with =, tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'active')
);
create index platform_role_grants_granter on public.platform_role_grants(granted_by);

create table private.identity_audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid,
  actor_database_role text not null,
  entity text not null,
  entity_id uuid not null,
  action text not null
);
alter table private.identity_audit_events enable row level security;
revoke all on private.identity_audit_events from public, anon, authenticated;

-- Trigger-only definer: profile initialization must work before the new user has a session.
-- No authorization decision is taken from raw_user_meta_data.
create function private.initialize_user_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, left(btrim(coalesce(new.raw_user_meta_data->>'display_name', '')),80));
  return new;
end;
$$;
revoke all on function private.initialize_user_profile() from public, anon, authenticated;
create trigger initialize_user_profile after insert on auth.users
for each row execute function private.initialize_user_profile();

create function private.touch_profile() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.touch_profile() from public, anon, authenticated;
create trigger touch_profile before update on public.profiles
for each row execute function private.touch_profile();

-- Trigger-only definer: write minimal audit facts without exposing audit privileges.
create function private.audit_identity_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into private.identity_audit_events(actor_user_id, actor_database_role, entity, entity_id, action)
  values (auth.uid(), session_user, tg_table_schema || '.' || tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end, lower(tg_op));
  return null;
end;
$$;
revoke all on function private.audit_identity_change() from public, anon, authenticated;
create trigger audit_profile after insert or update or delete on public.profiles
for each row execute function private.audit_identity_change();
create trigger audit_office after insert or update or delete on public.offices
for each row execute function private.audit_identity_change();
create trigger audit_territory after insert or update or delete on public.territories
for each row execute function private.audit_identity_change();
create trigger audit_mandate after insert or update or delete on public.office_mandates
for each row execute function private.audit_identity_change();
create trigger audit_role_grant after insert or update or delete on public.platform_role_grants
for each row execute function private.audit_identity_change();

-- Do not expose personal profiles or appointments to unauthenticated visitors.
grant usage on schema public to authenticated;
revoke all on public.profiles, public.territories, public.offices,
  public.office_mandates, public.platform_role_grants from public, anon, authenticated;
grant select on public.profiles, public.territories, public.offices,
  public.office_mandates, public.platform_role_grants to authenticated;
grant update(display_name) on public.profiles to authenticated;

alter table public.profiles enable row level security;
alter table public.territories enable row level security;
alter table public.offices enable row level security;
alter table public.office_mandates enable row level security;
alter table public.platform_role_grants enable row level security;

create policy profiles_select_self on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_update_self on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy territories_read on public.territories for select to authenticated using (true);
create policy offices_read on public.offices for select to authenticated using (true);
create policy mandates_select_self on public.office_mandates for select to authenticated
  using ((select auth.uid()) = user_id);
create policy roles_select_self on public.platform_role_grants for select to authenticated
  using ((select auth.uid()) = user_id);
