-- DEMO-only review rounds. Operational revision/conflict/funding policy remains unresolved.
alter table public.innovation_simulations drop constraint innovation_simulations_draft_id_key;
alter table public.innovation_simulations drop constraint innovation_simulations_status_check;
alter table public.innovation_simulations
  add column attempt integer not null default 1 check(attempt>0),
  add column previous_simulation_id uuid unique references public.innovation_simulations(id),
  add column reached_stage integer not null default 1 check(reached_stage between 1 and 3),
  add column workflow_version integer not null default 0 check(workflow_version>=0),
  add constraint simulations_draft_attempt_key unique(draft_id,attempt),
  add constraint simulations_status_check check(status in('waiting_rt','waiting_rw','waiting_kelurahan','revision_requested','rejected')),
  add constraint simulations_stage_check check(
    (status='waiting_rt' and reached_stage=1) or (status='waiting_rw' and reached_stage=2)
    or (status='waiting_kelurahan' and reached_stage=3) or status in('revision_requested','rejected'));

create table public.simulation_review_events (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.innovation_simulations(id),
  actor_id uuid not null references public.profiles(id),
  actor_name text not null,
  office_id uuid not null references public.offices(id),
  office_name text not null,
  mandate_id uuid not null references public.office_mandates(id),
  request_id uuid not null,
  stage text not null check(stage in('rt','rw')),
  outcome text not null check(outcome in('forward','revise','reject','conflict')),
  body text not null check(length(btrim(body)) between 3 and 4000),
  checks jsonb not null check(jsonb_typeof(checks)='object'),
  expected_version integer not null check(expected_version>=0),
  from_status text not null check(from_status in('waiting_rt','waiting_rw')),
  to_status text not null check(to_status in('waiting_rt','waiting_rw','waiting_kelurahan','revision_requested','rejected')),
  created_at timestamptz not null default now(),
  unique(simulation_id,actor_id,request_id)
);
create unique index review_one_decision_per_stage on public.simulation_review_events(simulation_id,stage) where outcome<>'conflict';
create index review_events_actor_fk on public.simulation_review_events(actor_id);
create index review_events_office_fk on public.simulation_review_events(office_id);
create index review_events_mandate_fk on public.simulation_review_events(mandate_id);
create index review_events_simulation_time on public.simulation_review_events(simulation_id,created_at,id);
alter table public.simulation_review_events enable row level security;
-- No direct Data API access, including SELECT. The guarded details RPC returns
-- a field whitelist only after checking the parent simulation's live scope.
revoke all on public.simulation_review_events from public,anon,authenticated;
create policy review_events_deny on public.simulation_review_events for all to anon,authenticated
  using(false) with check(false);
create trigger audit_review_event after insert or update or delete on public.simulation_review_events
  for each row execute function private.audit_simulation_insert();

create function private.simulation_viewer_territories(stage text) returns setof uuid
language sql security definer set search_path='' as $$
  select o.territory_id from public.office_mandates m join public.offices o on o.id=m.office_id
  where private.has_live_identity_session() and m.user_id=auth.uid() and m.mandate_type='primary'
    and m.status='active' and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp())
    and o.active and o.kind=stage and stage in('rt','rw','kelurahan');
$$;
revoke all on function private.simulation_viewer_territories(text) from public,anon,authenticated;
grant execute on function private.simulation_viewer_territories(text) to authenticated;

create function private.simulation_can_access(owner uuid,rt uuid,rw uuid,kel uuid,reached integer) returns boolean
language sql security definer set search_path='' as $$
  select private.has_live_identity_session() and (owner=auth.uid() or (
    exists(select 1 from auth.users u where u.id=owner and u.deleted_at is null and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until<=clock_timestamp())) and
    (rt in(select private.simulation_viewer_territories('rt'))
      or (reached>=2 and rw in(select private.simulation_viewer_territories('rw')))
      or (reached>=3 and kel in(select private.simulation_viewer_territories('kelurahan'))))));
$$;
revoke all on function private.simulation_can_access(uuid,uuid,uuid,uuid,integer) from public,anon,authenticated;
grant execute on function private.simulation_can_access(uuid,uuid,uuid,uuid,integer) to authenticated;
alter policy simulations_read on public.innovation_simulations to authenticated
  using(private.simulation_can_access(owner_id,rt_id,rw_id,kelurahan_id,reached_stage));

create or replace function private.simulation_workflow(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid(); draft_row public.innovation_drafts%rowtype; sim public.innovation_simulations%rowtype;
  previous_sim public.innovation_simulations%rowtype; existing_note public.simulation_rt_notes%rowtype;
  replay public.simulation_review_events%rowtype;
  rt public.territories%rowtype; rw public.territories%rowtype; kel public.territories%rowtype;
  mandate record; note_id uuid; event_id uuid; can_note boolean; route_ready boolean:=true;
  current_stage text; action_stage text; blocked boolean:=false; territory uuid;
  next_status text; outcome text; normalized_checks jsonb; field_name text; next_id uuid;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation='capabilities' then return jsonb_build_object(
    'can_review_rt',exists(select 1 from private.simulation_viewer_territories('rt')),
    'can_review_rw',exists(select 1 from private.simulation_viewer_territories('rw')),
    'can_review_kelurahan',exists(select 1 from private.simulation_viewer_territories('kelurahan')),
    'territory_ids',jsonb_build_object(
      'rt',(select coalesce(jsonb_agg(v),'[]') from private.simulation_viewer_territories('rt') v),
      'rw',(select coalesce(jsonb_agg(v),'[]') from private.simulation_viewer_territories('rw') v),
      'kelurahan',(select coalesce(jsonb_agg(v),'[]') from private.simulation_viewer_territories('kelurahan') v)));
  end if;

  if operation='submit' then
    if payload->'acknowledged' is distinct from 'true'::jsonb then raise exception using errcode='22023',message='ACK_REQUIRED'; end if;
    select * into draft_row from public.innovation_drafts where id=(payload->>'draft_id')::uuid and owner_id=actor for update;
    if not found then raise exception using errcode='22023',message='SIMULATION_UNAVAILABLE'; end if;
    if nullif(payload->>'previous_id','') is null then
      -- Replaying the initial send returns the initial copy, even after later rounds exist.
      select * into sim from public.innovation_simulations where draft_id=draft_row.id and attempt=1;
      if found then return jsonb_build_object('id',sim.id); end if;
    else
      select * into previous_sim from public.innovation_simulations
        where id=(payload->>'previous_id')::uuid and draft_id=draft_row.id and owner_id=actor for update;
      if not found then raise exception using errcode='22023',message='SIMULATION_UNAVAILABLE'; end if;
      select * into sim from public.innovation_simulations where previous_simulation_id=previous_sim.id;
      if found then return jsonb_build_object('id',sim.id); end if;
      if previous_sim.status<>'revision_requested' then raise exception using errcode='PT409',message='RESUBMIT_NOT_AVAILABLE'; end if;
      if draft_row.revision<=previous_sim.draft_revision or draft_row.document=previous_sim.document then raise exception using errcode='22023',message='REVISION_REQUIRED'; end if;
    end if;
    if (payload->>'revision')::integer is distinct from draft_row.revision then raise exception using errcode='PT409',message='DRAFT_CONFLICT'; end if;
    if not private.simulation_document_ready(draft_row.document) then raise exception using errcode='22023',message='INCOMPLETE_DRAFT'; end if;
    if not exists(select 1 from public.innovation_themes where id=draft_row.theme_id and active and is_demo) then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into rt from public.territories where id=draft_row.territory_rt_id and kind='rt' and code like 'DEMO%';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into rw from public.territories where id=rt.parent_id and kind='rw' and code like 'DEMO%';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into kel from public.territories where id=rw.parent_id and kind='kelurahan' and code like 'DEMO%';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
    insert into public.innovation_simulations(draft_id,owner_id,draft_revision,document,rt_id,rw_id,kelurahan_id,attempt,previous_simulation_id)
      values(draft_row.id,actor,draft_row.revision,draft_row.document,rt.id,rw.id,kel.id,coalesce(previous_sim.attempt,0)+1,previous_sim.id) returning * into sim;
    return jsonb_build_object('id',sim.id);
  end if;

  if operation in('note','review') then
    -- Same lock order as admin mandate changes. Check live permissions after waiting.
    perform pg_advisory_xact_lock(184701,1);
    select * into sim from public.innovation_simulations where id=(payload->>'id')::uuid for update;
  else
    select * into sim from public.innovation_simulations where id=(payload->>'id')::uuid;
  end if;
  if not found or not private.simulation_can_access(sim.owner_id,sim.rt_id,sim.rw_id,sim.kelurahan_id,sim.reached_stage) then
    raise exception using errcode='22023',message='SIMULATION_UNAVAILABLE';
  end if;
  current_stage:=case sim.status when 'waiting_rt' then 'rt' when 'waiting_rw' then 'rw' when 'waiting_kelurahan' then 'kelurahan' end;
  territory:=case current_stage when 'rt' then sim.rt_id when 'rw' then sim.rw_id when 'kelurahan' then sim.kelurahan_id end;
  can_note:=sim.status='waiting_rt' and sim.owner_id<>actor and sim.rt_id in(select private.simulation_viewer_territories('rt'));
  if current_stage in('rt','rw') and sim.owner_id<>actor and territory in(select private.simulation_viewer_territories(current_stage)) then
    action_stage:=current_stage;
    blocked:=exists(select 1 from public.simulation_rt_notes n where n.simulation_id=sim.id and n.actor_id=actor and n.family_conflict)
      or exists(select 1 from public.simulation_review_events e where e.simulation_id=sim.id and e.actor_id=actor and e.outcome in('conflict','forward'));
  end if;

  if operation='details' then
    if current_stage is not null then
      select exists(select 1 from public.office_mandates m join public.offices o on o.id=m.office_id join auth.users u on u.id=m.user_id
        where o.territory_id=territory and o.kind=current_stage and o.active and m.mandate_type='primary' and m.status='active'
          and m.user_id<>sim.owner_id and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp())
          and u.deleted_at is null and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=clock_timestamp())
          and not exists(select 1 from public.simulation_rt_notes n where n.simulation_id=sim.id and n.actor_id=m.user_id and n.family_conflict)
          and not exists(select 1 from public.simulation_review_events e where e.simulation_id=sim.id and e.actor_id=m.user_id and e.outcome in('conflict','forward'))) into route_ready;
    end if;
    select s.id into next_id from public.innovation_simulations s where s.previous_simulation_id=sim.id
      and private.simulation_can_access(s.owner_id,s.rt_id,s.rw_id,s.kelurahan_id,s.reached_stage);
    return jsonb_build_object('simulation',to_jsonb(sim),'is_owner',sim.owner_id=actor,'can_note',can_note,
      'action_stage',action_stage,'decision_blocked',blocked,'route_ready',route_ready,'next_id',next_id,
      'notes',(select coalesce(jsonb_agg(to_jsonb(n)),'[]') from
        (select id,actor_name,office_name,body,domicile_checked,problem_checked,family_conflict,created_at
          from public.simulation_rt_notes where simulation_id=sim.id order by created_at,id) n),
      'events',(select coalesce(jsonb_agg(to_jsonb(e)),'[]') from
        (select id,actor_name,office_name,stage,outcome,body,checks,from_status,to_status,created_at
          from public.simulation_review_events where simulation_id=sim.id order by created_at,id) e));
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
    select * into existing_note from public.simulation_rt_notes where id=note_id;
    if existing_note.body is distinct from btrim(payload->>'body')
      or existing_note.family_conflict is distinct from (payload->>'family_conflict')::boolean
      or existing_note.domicile_checked is distinct from (payload->>'domicile_checked')::boolean
      or existing_note.problem_checked is distinct from (payload->>'problem_checked')::boolean then
      raise exception using errcode='PT409',message='NOTE_REQUEST_CONFLICT';
    end if;
    return jsonb_build_object('id',note_id);
  elsif operation='review' then
    if sim.owner_id=actor or coalesce(payload->>'stage','') not in('rt','rw') then raise exception using errcode='42501',message='REVIEW_MANDATE_REQUIRED'; end if;
    territory:=case payload->>'stage' when 'rt' then sim.rt_id else sim.rw_id end;
    select m.id,m.office_id,o.name into mandate from public.office_mandates m join public.offices o on o.id=m.office_id
      where m.user_id=actor and m.status='active' and m.mandate_type='primary' and o.active and o.kind=payload->>'stage'
        and o.territory_id=territory and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp());
    if not found then raise exception using errcode='42501',message='REVIEW_MANDATE_REQUIRED'; end if;
    outcome:=payload->>'outcome';
    if outcome is null or outcome not in('forward','revise','reject','conflict')
      or jsonb_typeof(payload->'body') is distinct from 'string' or length(btrim(payload->>'body')) not between 3 and 4000
      or nullif(payload->>'request_id','') is null or jsonb_typeof(payload->'version') is distinct from 'number'
      or coalesce(payload->>'conflict','') not in('none','reported') then raise exception using errcode='22023',message='INVALID_REVIEW'; end if;
    if (outcome='conflict') is distinct from (payload->>'conflict'='reported') then raise exception using errcode='22023',message='CONFLICT_REVIEW_ONLY'; end if;
    normalized_checks:='{}'::jsonb;
    foreach field_name in array case payload->>'stage' when 'rt' then array['domicile','problem'] else array['feasibility','duplicates','budget'] end loop
      if jsonb_typeof(payload->'checks'->field_name) is distinct from 'boolean' then raise exception using errcode='22023',message='INVALID_REVIEW'; end if;
      if outcome='forward' and payload->'checks'->field_name is distinct from 'true'::jsonb then raise exception using errcode='22023',message='REVIEW_CHECKS_REQUIRED'; end if;
      normalized_checks:=normalized_checks||jsonb_build_object(field_name,case when outcome='conflict' then false else (payload->'checks'->>field_name)::boolean end);
    end loop;
    -- Exact retry may return an earlier success after the queue has moved. Never retry changed content silently.
    select * into replay from public.simulation_review_events where simulation_id=sim.id and actor_id=actor and request_id=(payload->>'request_id')::uuid;
    if found then
      if replay.stage is distinct from payload->>'stage' or replay.outcome is distinct from outcome
        or replay.body is distinct from btrim(payload->>'body') or replay.checks is distinct from normalized_checks
        or replay.expected_version is distinct from (payload->>'version')::integer then
        raise exception using errcode='PT409',message='REVIEW_REQUEST_CONFLICT';
      end if;
      return jsonb_build_object('id',replay.id);
    end if;
    if action_stage is distinct from payload->>'stage' or (payload->>'version')::integer is distinct from sim.workflow_version then raise exception using errcode='PT409',message='WORKFLOW_CONFLICT'; end if;
    if blocked and outcome<>'conflict' then raise exception using errcode='42501',message='INDEPENDENT_REVIEWER_REQUIRED'; end if;
    next_status:=case outcome when 'forward' then case current_stage when 'rt' then 'waiting_rw' else 'waiting_kelurahan' end
      when 'revise' then 'revision_requested' when 'reject' then 'rejected' else sim.status end;
    insert into public.simulation_review_events(simulation_id,actor_id,actor_name,office_id,office_name,mandate_id,request_id,
      stage,outcome,body,checks,expected_version,from_status,to_status)
    values(sim.id,actor,(select display_name from public.profiles where id=actor),mandate.office_id,mandate.name,mandate.id,
      (payload->>'request_id')::uuid,current_stage,outcome,btrim(payload->>'body'),normalized_checks,sim.workflow_version,sim.status,next_status)
      returning id into event_id;
    update public.innovation_simulations set status=next_status,workflow_version=workflow_version+1,
      reached_stage=case when next_status='waiting_rw' then 2 when next_status='waiting_kelurahan' then 3 else reached_stage end where id=sim.id;
    return jsonb_build_object('id',event_id);
  end if;
  raise exception using errcode='22023',message='INVALID_OPERATION';
end;
$$;
