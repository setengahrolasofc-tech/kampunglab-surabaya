-- Draft-only milestone; no submission, approval, publication, or fund transfer.
alter table public.profiles add column domicile_rt_id uuid;
alter table public.profiles add column domicile_kind text generated always as
  (case when domicile_rt_id is not null then 'rt'::text end) stored;
alter table public.profiles add constraint profiles_domicile_rt_fk
  foreign key (domicile_rt_id,domicile_kind) references public.territories(id,kind);
create index profiles_domicile_fk on public.profiles(domicile_rt_id,domicile_kind);

create table public.innovation_themes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check(length(code) between 1 and 40),
  name text not null check(length(name) between 1 and 160),
  active boolean not null default true,
  is_demo boolean not null default false
);
alter table public.innovation_themes enable row level security;
revoke all on public.innovation_themes from public,anon,authenticated;
grant select on public.innovation_themes to authenticated;
create policy themes_read on public.innovation_themes for select to authenticated using(true);

create function private.draft_text_valid(doc jsonb,key_name text,max_length integer) returns boolean
language sql immutable security invoker set search_path='' as $$
  select not (doc ? key_name) or
    (jsonb_typeof(doc->key_name)='string' and char_length(doc->>key_name)<=max_length);
$$;
revoke all on function private.draft_text_valid(jsonb,text,integer) from public,anon,authenticated;

create function private.valid_innovation_draft(doc jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare part jsonb; item jsonb; key_name text;
begin
  if jsonb_typeof(doc) is distinct from 'object' or
    octet_length(doc::text)>131072 or doc - array['innovation','prd','budget','declaration'] <> '{}'::jsonb then return false; end if;
  foreach key_name in array array['innovation','prd','budget','declaration'] loop
    if jsonb_typeof(doc->key_name) is distinct from 'object' then return false; end if;
  end loop;
  part:=doc->'innovation';
  if part-array['title','theme_id','form','maturity','rt_id','summary','team'] <> '{}'::jsonb
    or not private.draft_text_valid(part,'title',160) or not private.draft_text_valid(part,'summary',3000)
    or not private.draft_text_valid(part,'theme_id',36) or not private.draft_text_valid(part,'rt_id',36)
    or not private.draft_text_valid(part,'form',24) or not private.draft_text_valid(part,'maturity',24)
    or coalesce(part->>'form','') not in ('','gagasan','produk','prototipe','program','teknologi')
    or coalesce(part->>'maturity','') not in ('','inisiatif','uji coba','penerapan') then return false; end if;
  if jsonb_typeof(part->'team') is distinct from 'array' or jsonb_array_length(part->'team')>20 then return false; end if;
  for item in select value from jsonb_array_elements(part->'team') loop
    if jsonb_typeof(item) is distinct from 'object' or item-array['id','name','role']<>'{}'::jsonb
      or not private.draft_text_valid(item,'id',36) or not private.draft_text_valid(item,'name',160)
      or not private.draft_text_valid(item,'role',160) then return false; end if;
  end loop;
  part:=doc->'prd';
  if part-array['problem','problem_evidence','beneficiaries','beneficiary_count','solution','features',
    'success_indicator','success_threshold','test_method','test_plan','risks','mitigation'] <> '{}'::jsonb then return false; end if;
  for key_name in select jsonb_object_keys(part) loop
    if not private.draft_text_valid(part,key_name,4000) then return false; end if;
  end loop;
  if coalesce(part->>'beneficiary_count','') !~ '^(|[1-9][0-9]{0,8})$' then return false; end if;
  part:=doc->'budget';
  if part-array['items','contingency','honor','maintenance_cost','maintenance_months'] <> '{}'::jsonb
    or jsonb_typeof(part->'items') is distinct from 'array' or jsonb_array_length(part->'items')>50 then return false; end if;
  foreach key_name in array array['contingency','honor','maintenance_cost'] loop
    if not private.draft_text_valid(part,key_name,13) or coalesce(part->>key_name,'') !~ '^(|[0-9]{1,13})$' then return false; end if;
  end loop;
  if not private.draft_text_valid(part,'maintenance_months',2) or coalesce(part->>'maintenance_months','') !~ '^(|6|7|8|9|10|11|12)$' then return false; end if;
  for item in select value from jsonb_array_elements(part->'items') loop
    if jsonb_typeof(item) is distinct from 'object' or item-array['id','description','category','unit','quantity','unit_price','usage_stage'] <> '{}'::jsonb
      or not private.draft_text_valid(item,'id',36) or not private.draft_text_valid(item,'description',240)
      or not private.draft_text_valid(item,'category',80) or not private.draft_text_valid(item,'unit',40)
      or not private.draft_text_valid(item,'usage_stage',80) or not private.draft_text_valid(item,'quantity',16)
      or not private.draft_text_valid(item,'unit_price',13)
      or coalesce(item->>'quantity','') !~ '^(|(0|[1-9][0-9]{0,8})(\.[0-9]{1,3})?)$'
      or coalesce(item->>'unit_price','') !~ '^(|[0-9]{1,13})$' then return false; end if;
  end loop;
  part:=doc->'declaration';
  if part-array['own_work','notes'] <> '{}'::jsonb or jsonb_typeof(part->'own_work') is distinct from 'boolean'
    or not private.draft_text_valid(part,'notes',3000) then return false; end if;
  return true;
end;
$$;
revoke all on function private.valid_innovation_draft(jsonb) from public,anon,authenticated;

create table public.innovation_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  create_request_id uuid not null,
  status text not null default 'draft' check(status='draft'),
  document jsonb not null check(private.valid_innovation_draft(document)),
  title text generated always as (coalesce(document#>>'{innovation,title}','')) stored,
  theme_id uuid generated always as (nullif(document#>>'{innovation,theme_id}','')::uuid) stored references public.innovation_themes(id),
  territory_rt_id uuid generated always as (nullif(document#>>'{innovation,rt_id}','')::uuid) stored,
  territory_kind text generated always as (case when nullif(document#>>'{innovation,rt_id}','') is not null then 'rt'::text end) stored,
  revision integer not null default 0 check(revision>=0),
  current_step integer not null default 1 check(current_step between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,create_request_id),
  foreign key(territory_rt_id,territory_kind) references public.territories(id,kind)
);
create index drafts_owner_updated on public.innovation_drafts(owner_id,updated_at desc,id);
create index drafts_theme_fk on public.innovation_drafts(theme_id);
create index drafts_territory_fk on public.innovation_drafts(territory_rt_id,territory_kind);
alter table public.innovation_drafts enable row level security;
revoke all on public.innovation_drafts from public,anon,authenticated;
grant select on public.innovation_drafts to authenticated;

create function private.has_live_identity_session() returns boolean
language sql security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id
    where u.id=auth.uid() and u.email_confirmed_at is not null and u.deleted_at is null
      and (u.banned_until is null or u.banned_until<=clock_timestamp())
      and s.id::text=auth.jwt()->>'session_id' and (s.not_after is null or s.not_after>clock_timestamp()));
$$;
revoke all on function private.has_live_identity_session() from public,anon,authenticated;
grant execute on function private.has_live_identity_session() to authenticated;
create policy drafts_read_owner on public.innovation_drafts for select to authenticated
  using((select auth.uid())=owner_id and (select private.has_live_identity_session()));

-- Minimal private audit: no draft content, budget lines, team names, or domicile.
create table private.innovation_draft_audit (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid not null,
  draft_id uuid not null,
  action text not null,
  revision integer not null,
  step integer not null
);
alter table private.innovation_draft_audit enable row level security;
revoke all on private.innovation_draft_audit from public,anon,authenticated;
create policy draft_audit_deny on private.innovation_draft_audit for all to anon,authenticated using(false) with check(false);
create function private.audit_draft_change() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into private.innovation_draft_audit(actor_user_id,draft_id,action,revision,step)
  values(auth.uid(),new.id,lower(tg_op),new.revision,new.current_step);
  return null;
end;
$$;
revoke all on function private.audit_draft_change() from public,anon,authenticated;
create trigger audit_draft after insert or update on public.innovation_drafts for each row execute function private.audit_draft_change();

create function private.write_innovation_draft(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); rt uuid; doc jsonb; result public.innovation_drafts%rowtype; theme uuid;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation='domicile' then
    rt:=(payload->>'rt_id')::uuid;
    if rt is null or not exists(select 1 from public.territories where id=rt and kind='rt') then raise exception using errcode='22023',message='INVALID_TERRITORY'; end if;
    update public.profiles set domicile_rt_id=rt where id=actor;
    return jsonb_build_object('saved',true);
  elsif operation='create' then
    if nullif(payload->>'request_id','') is null then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    select * into result from public.innovation_drafts where owner_id=actor and create_request_id=(payload->>'request_id')::uuid;
    if found then return jsonb_build_object('id',result.id,'revision',result.revision,'updated_at',result.updated_at); end if;
    select domicile_rt_id into rt from public.profiles where id=actor;
    if rt is null then raise exception using errcode='22023',message='DOMICILE_REQUIRED'; end if;
    doc:=jsonb_build_object('innovation',jsonb_build_object('title','','theme_id','','form','','maturity','','rt_id',rt,'summary','','team','[]'::jsonb),
      'prd','{}'::jsonb,'budget','{"items":[],"contingency":"","honor":"","maintenance_cost":"","maintenance_months":""}'::jsonb,
      'declaration','{"own_work":false,"notes":""}'::jsonb);
    insert into public.innovation_drafts(owner_id,create_request_id,document) values(actor,(payload->>'request_id')::uuid,doc)
      on conflict(owner_id,create_request_id) do nothing returning * into result;
    if not found then select * into result from public.innovation_drafts where owner_id=actor and create_request_id=(payload->>'request_id')::uuid; end if;
  elsif operation='save' then
    doc:=payload->'document';
    if doc is null or not private.valid_innovation_draft(doc) or coalesce((payload->>'step')::integer,0) not between 1 and 4
      or coalesce((payload->>'revision')::integer,-1)<0 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    theme:=nullif(doc#>>'{innovation,theme_id}','')::uuid;
    if theme is not null and not exists(select 1 from public.innovation_themes where id=theme and active) then raise exception using errcode='22023',message='INVALID_THEME'; end if;
    update public.innovation_drafts set document=doc,current_step=(payload->>'step')::integer,
      revision=revision+1,updated_at=clock_timestamp()
      where id=(payload->>'id')::uuid and owner_id=actor and status='draft' and revision=(payload->>'revision')::integer returning * into result;
    if not found then
      if exists(select 1 from public.innovation_drafts where id=(payload->>'id')::uuid and owner_id=actor) then
        raise exception using errcode='40001',message='DRAFT_CONFLICT';
      end if;
      raise exception using errcode='22023',message='DRAFT_UNAVAILABLE';
    end if;
  else raise exception using errcode='22023',message='INVALID_OPERATION'; end if;
  return jsonb_build_object('id',result.id,'revision',result.revision,'updated_at',result.updated_at);
end;
$$;
revoke all on function private.write_innovation_draft(text,jsonb) from public,anon,authenticated;
grant execute on function private.write_innovation_draft(text,jsonb) to authenticated;
create function public.write_innovation_draft(operation text,payload jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select private.write_innovation_draft(operation,payload); $$;
revoke all on function public.write_innovation_draft(text,jsonb) from public,anon,authenticated;
grant execute on function public.write_innovation_draft(text,jsonb) to authenticated;

-- Explicit prototype placeholders; these are not the four official themes.
insert into public.innovation_themes(code,name,is_demo) values
  ('DEMO-1','DEMO — Tema 1',true),('DEMO-2','DEMO — Tema 2',true),
  ('DEMO-3','DEMO — Tema 3',true),('DEMO-4','DEMO — Tema 4',true);
with kel as (
  insert into public.territories(kind,code,name) values('kelurahan','DEMO-KL','DEMO Kelurahan KampungLab') returning id
), rw as (
  insert into public.territories(kind,code,name,parent_id) select 'rw','DEMO-RW-01','DEMO RW 01',id from kel returning id
)
insert into public.territories(kind,code,name,parent_id) select 'rt','DEMO-RT-01','DEMO RT 01',id from rw;
