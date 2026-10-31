-- Only DEMO simulations and non-decision RT observations are supported.
create function private.simulation_document_ready(doc jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare key_name text; item jsonb;
begin
  if not private.valid_innovation_draft(doc) then return false; end if;
  foreach key_name in array array['title','theme_id','form','maturity','rt_id','summary'] loop
    if length(btrim(coalesce(doc->'innovation'->>key_name,'')))=0 then return false; end if;
  end loop;
  if jsonb_array_length(doc#>'{innovation,team}')=0 then return false; end if;
  for item in select value from jsonb_array_elements(doc#>'{innovation,team}') loop
    if length(btrim(coalesce(item->>'name','')))=0 or length(btrim(coalesce(item->>'role','')))=0 then return false; end if;
  end loop;
  foreach key_name in array array['problem','problem_evidence','beneficiaries','beneficiary_count','solution','features','success_indicator','success_threshold','test_method','test_plan','risks','mitigation'] loop
    if length(btrim(coalesce(doc->'prd'->>key_name,'')))=0 then return false; end if;
  end loop;
  if jsonb_array_length(doc#>'{budget,items}')=0 or coalesce(doc#>>'{budget,maintenance_months}','')='' then return false; end if;
  for item in select value from jsonb_array_elements(doc#>'{budget,items}') loop
    foreach key_name in array array['description','category','unit','usage_stage'] loop
      if length(btrim(coalesce(item->>key_name,'')))=0 then return false; end if;
    end loop;
    if coalesce(nullif(item->>'quantity','')::numeric,0)<=0 or coalesce(nullif(item->>'unit_price','')::numeric,0)<=0 then return false; end if;
  end loop;
  return (doc#>>'{declaration,own_work}')::boolean;
end;
$$;
revoke all on function private.simulation_document_ready(jsonb) from public,anon,authenticated;

create table public.innovation_simulations (
  id uuid primary key default gen_random_uuid(),
  reference text generated always as ('DEMO-'||upper(id::text)) stored unique,
  draft_id uuid not null unique references public.innovation_drafts(id),
  owner_id uuid not null references public.profiles(id),
  draft_revision integer not null check(draft_revision>=0),
  document jsonb not null check(private.simulation_document_ready(document)),
  title text generated always as (document#>>'{innovation,title}') stored,
  rt_id uuid not null references public.territories(id),
  rw_id uuid not null references public.territories(id),
  kelurahan_id uuid not null references public.territories(id),
  mode text not null default 'demo' check(mode='demo'),
  status text not null default 'waiting_rt' check(status='waiting_rt'),
  submitted_at timestamptz not null default now()
);
create index simulations_owner_time on public.innovation_simulations(owner_id,submitted_at desc,id);
create index simulations_rt_time on public.innovation_simulations(rt_id,submitted_at,id);
create index simulations_rw_fk on public.innovation_simulations(rw_id);
create index simulations_kel_fk on public.innovation_simulations(kelurahan_id);
alter table public.innovation_simulations enable row level security;
revoke all on public.innovation_simulations from public,anon,authenticated;
grant select on public.innovation_simulations to authenticated;

create function private.simulation_viewer_rt_ids() returns setof uuid
language sql security definer set search_path='' as $$
  select o.territory_id from public.office_mandates m join public.offices o on o.id=m.office_id
  where private.has_live_identity_session() and m.user_id=auth.uid() and m.mandate_type='primary'
    and m.status='active' and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp())
    and o.active and o.kind='rt';
$$;
revoke all on function private.simulation_viewer_rt_ids() from public,anon,authenticated;
grant execute on function private.simulation_viewer_rt_ids() to authenticated;
create function private.simulation_can_read(owner uuid,rt uuid) returns boolean
language sql security definer set search_path='' as $$
  select private.has_live_identity_session() and (owner=auth.uid() or
    (rt in(select private.simulation_viewer_rt_ids()) and exists(select 1 from auth.users u where u.id=owner
      and u.deleted_at is null and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=clock_timestamp()))));
$$;
revoke all on function private.simulation_can_read(uuid,uuid) from public,anon,authenticated;
grant execute on function private.simulation_can_read(uuid,uuid) to authenticated;
create policy simulations_read on public.innovation_simulations for select to authenticated
  using(private.simulation_can_read(owner_id,rt_id));

create table public.simulation_rt_notes (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.innovation_simulations(id),
  actor_id uuid not null references public.profiles(id),
  actor_name text not null,
  office_id uuid not null references public.offices(id),
  office_name text not null,
  mandate_id uuid not null references public.office_mandates(id),
  request_id uuid not null,
  body text not null check(length(btrim(body)) between 3 and 4000),
  domicile_checked boolean not null,
  problem_checked boolean not null,
  family_conflict boolean not null,
  created_at timestamptz not null default now(),
  unique(simulation_id,actor_id,request_id),
  check(not family_conflict or (not domicile_checked and not problem_checked))
);
create index rt_notes_actor_fk on public.simulation_rt_notes(actor_id);
create index rt_notes_office_fk on public.simulation_rt_notes(office_id);
create index rt_notes_mandate_fk on public.simulation_rt_notes(mandate_id);
create index rt_notes_simulation_time on public.simulation_rt_notes(simulation_id,created_at,id);
alter table public.simulation_rt_notes enable row level security;
revoke all on public.simulation_rt_notes from public,anon,authenticated;
grant select on public.simulation_rt_notes to authenticated;
create policy rt_notes_read on public.simulation_rt_notes for select to authenticated
  using(exists(select 1 from public.innovation_simulations s where s.id=simulation_id));

create table private.simulation_audit (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  actor_database_role text not null default session_user,
  entity text not null,
  entity_id uuid not null,
  action text not null
);
alter table private.simulation_audit enable row level security;
revoke all on private.simulation_audit from public,anon,authenticated;
create policy simulation_audit_deny on private.simulation_audit for all to anon,authenticated using(false) with check(false);
create function private.audit_simulation_insert() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into private.simulation_audit(actor_id,entity,entity_id,action) values(auth.uid(),tg_table_name,new.id,'insert');
  return null;
end;
$$;
revoke all on function private.audit_simulation_insert() from public,anon,authenticated;
create trigger audit_simulation after insert on public.innovation_simulations for each row execute function private.audit_simulation_insert();
create trigger audit_rt_note after insert on public.simulation_rt_notes for each row execute function private.audit_simulation_insert();

create function private.simulation_workflow(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid(); draft_row public.innovation_drafts%rowtype; sim public.innovation_simulations%rowtype;
  rt public.territories%rowtype; rw public.territories%rowtype; kel public.territories%rowtype;
  mandate record; note_id uuid; can_note boolean; route_ready boolean;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation='capabilities' then return jsonb_build_object('can_review_rt',exists(select 1 from private.simulation_viewer_rt_ids())); end if;
  if operation='submit' then
    if payload->'acknowledged' is distinct from 'true'::jsonb then raise exception using errcode='22023',message='ACK_REQUIRED'; end if;
    select * into draft_row from public.innovation_drafts where id=(payload->>'draft_id')::uuid and owner_id=actor for update;
    if not found then raise exception using errcode='22023',message='SIMULATION_UNAVAILABLE'; end if;
    select * into sim from public.innovation_simulations where draft_id=draft_row.id;
    if found then return jsonb_build_object('id',sim.id); end if;
    if (payload->>'revision')::integer is distinct from draft_row.revision then raise exception using errcode='PT409',message='DRAFT_CONFLICT'; end if;
    if not private.simulation_document_ready(draft_row.document) then raise exception using errcode='22023',message='INCOMPLETE_DRAFT'; end if;
    if not exists(select 1 from public.innovation_themes where id=draft_row.theme_id and active and is_demo) then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into rt from public.territories where id=draft_row.territory_rt_id and kind='rt' and code like 'DEMO%';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into rw from public.territories where id=rt.parent_id and kind='rw' and code like 'DEMO%';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into kel from public.territories where id=rw.parent_id and kind='kelurahan' and code like 'DEMO%';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    -- Recheck identity after acquiring the draft lock.
    if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
    insert into public.innovation_simulations(draft_id,owner_id,draft_revision,document,rt_id,rw_id,kelurahan_id)
      values(draft_row.id,actor,draft_row.revision,draft_row.document,rt.id,rw.id,kel.id) returning * into sim;
    return jsonb_build_object('id',sim.id);
  end if;

  if operation='note' then
    -- Shares the admin access-change lock; revalidate after any revocation waits.
    perform pg_advisory_xact_lock(184701,1);
    if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  end if;
  select * into sim from public.innovation_simulations where id=(payload->>'id')::uuid;
  if not found then raise exception using errcode='22023',message='SIMULATION_UNAVAILABLE'; end if;
  can_note:=sim.owner_id<>actor and private.simulation_can_read(sim.owner_id,sim.rt_id);
  if operation='details' then
    if not private.simulation_can_read(sim.owner_id,sim.rt_id) then raise exception using errcode='42501',message='SIMULATION_UNAVAILABLE'; end if;
    select exists(select 1 from public.office_mandates m join public.offices o on o.id=m.office_id join auth.users u on u.id=m.user_id
      where o.territory_id=sim.rt_id and o.kind='rt' and o.active and m.mandate_type='primary' and m.status='active'
        and m.user_id<>sim.owner_id and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp())
        and u.deleted_at is null and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=clock_timestamp())) into route_ready;
    return jsonb_build_object('simulation',to_jsonb(sim),'can_note',can_note,'route_ready',route_ready,
      'notes',(select coalesce(jsonb_agg(to_jsonb(n)),'[]') from
        (select id,actor_name,office_name,body,domicile_checked,problem_checked,family_conflict,created_at from public.simulation_rt_notes where simulation_id=sim.id order by created_at,id) n));
  elsif operation='note' then
    if not can_note then raise exception using errcode='42501',message='RT_MANDATE_REQUIRED'; end if;
    if jsonb_typeof(payload->'family_conflict') is distinct from 'boolean' or jsonb_typeof(payload->'domicile_checked') is distinct from 'boolean'
      or jsonb_typeof(payload->'problem_checked') is distinct from 'boolean' or jsonb_typeof(payload->'body') is distinct from 'string'
      or length(btrim(payload->>'body')) not between 3 and 4000 or nullif(payload->>'request_id','') is null then
      raise exception using errcode='22023',message='INVALID_NOTE';
    end if;
    if (payload->>'family_conflict')::boolean and ((payload->>'domicile_checked')::boolean or (payload->>'problem_checked')::boolean) then raise exception using errcode='22023',message='CONFLICT_NOTE_ONLY'; end if;
    select m.id,m.office_id,o.name into mandate from public.office_mandates m join public.offices o on o.id=m.office_id
      where m.user_id=actor and m.status='active' and m.mandate_type='primary' and o.active and o.kind='rt'
        and o.territory_id=sim.rt_id and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp());
    if not found then raise exception using errcode='42501',message='RT_MANDATE_REQUIRED'; end if;
    insert into public.simulation_rt_notes(simulation_id,actor_id,actor_name,office_id,office_name,mandate_id,request_id,body,domicile_checked,problem_checked,family_conflict)
    values(sim.id,actor,(select display_name from public.profiles where id=actor),mandate.office_id,mandate.name,mandate.id,
      (payload->>'request_id')::uuid,btrim(payload->>'body'),(payload->>'domicile_checked')::boolean,(payload->>'problem_checked')::boolean,(payload->>'family_conflict')::boolean)
    on conflict(simulation_id,actor_id,request_id) do nothing returning id into note_id;
    if note_id is null then select id into note_id from public.simulation_rt_notes where simulation_id=sim.id and actor_id=actor and request_id=(payload->>'request_id')::uuid; end if;
    return jsonb_build_object('id',note_id);
  end if;
  raise exception using errcode='22023',message='INVALID_OPERATION';
end;
$$;
revoke all on function private.simulation_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function private.simulation_workflow(text,jsonb) to authenticated;
create function public.simulation_workflow(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select private.simulation_workflow(operation,payload); $$;
revoke all on function public.simulation_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function public.simulation_workflow(text,jsonb) to authenticated;
