-- Panel Kecil DEMO: raw individual scores and votes, no final aggregation.
do $$ begin
  if (select md5(prosrc) from pg_proc where oid='private.attachment_workflow(text,jsonb)'::regprocedure) is distinct from '26e6691635f5ef6abee1abc27bbba0fc'
    or (select md5(prosrc) from pg_proc where oid='private.simulation_actor_cannot_review(uuid,uuid)'::regprocedure) is distinct from '65adccf862dd977fb43855d59aa4cc30'
  then raise exception 'PANEL_WORKFLOW_BASE_CHANGED'; end if;
end $$;

create table public.simulation_panel_cases (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null unique references public.innovation_simulations(id),
  owner_id uuid not null references public.profiles(id),
  state text not null check(state in('open','paused')),
  version integer not null default 0 check(version>=0),
  consent_version text not null default 'demo-panel-v1' check(consent_version='demo-panel-v1'),
  shared_at timestamptz not null default clock_timestamp(),
  created_at timestamptz not null default clock_timestamp()
);
create index panel_cases_owner_fk on public.simulation_panel_cases(owner_id);
create table public.simulation_panel_assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.simulation_panel_cases(id),
  reviewer_id uuid not null references public.profiles(id),
  reviewer_name text not null,
  seat text not null check(seat in('brida_opd','academic','practitioner')),
  status text not null default 'active' check(status in('active','revoked','conflict')),
  appointment_reference text not null check(length(btrim(appointment_reference,E' \n\r\t')) between 3 and 240),
  reason text not null check(length(btrim(reason,E' \n\r\t')) between 3 and 1000),
  assigned_by uuid not null references public.profiles(id),
  assigned_by_name text not null,
  created_at timestamptz not null default clock_timestamp(),
  closed_at timestamptz,
  unique(case_id,reviewer_id),
  check((status='active')=(closed_at is null))
);
create unique index panel_one_active_seat on public.simulation_panel_assignments(case_id,seat) where status='active';
create index panel_assignments_reviewer_time on public.simulation_panel_assignments(reviewer_id,created_at);
create index panel_assignments_case_time on public.simulation_panel_assignments(case_id,created_at);
create index panel_assignments_actor_fk on public.simulation_panel_assignments(assigned_by);
create table public.simulation_panel_entries (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.simulation_panel_assignments(id),
  actor_id uuid not null references public.profiles(id),
  actor_name text not null,
  kind text not null check(kind in('score','conflict')),
  rubric_version text not null default 'demo-panel-v1' check(rubric_version='demo-panel-v1'),
  problem_score integer check(problem_score between 0 and 25),
  beneficiaries_score integer check(beneficiaries_score between 0 and 25),
  feasibility_score integer check(feasibility_score between 0 and 20),
  evidence_score integer check(evidence_score between 0 and 15),
  budget_score integer check(budget_score between 0 and 15),
  total integer generated always as (problem_score+beneficiaries_score+feasibility_score+evidence_score+budget_score) stored,
  vote text check(vote in('agree','disagree')),
  body text not null check(length(btrim(body,E' \n\r\t')) between 3 and 4000 and translate(body,E'\n\r\t','') !~ '[[:cntrl:]]'),
  expected_workflow_version integer not null check(expected_workflow_version>=0),
  request_id uuid not null,
  acknowledged boolean not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(actor_id,request_id),
  check((kind='score' and problem_score is not null and beneficiaries_score is not null and feasibility_score is not null
      and evidence_score is not null and budget_score is not null and vote is not null and acknowledged)
    or (kind='conflict' and problem_score is null and beneficiaries_score is null and feasibility_score is null
      and evidence_score is null and budget_score is null and vote is null and not acknowledged))
);
create index panel_entries_actor_fk on public.simulation_panel_entries(actor_id);
create table public.simulation_panel_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.simulation_panel_cases(id),
  assignment_id uuid references public.simulation_panel_assignments(id),
  actor_id uuid not null references public.profiles(id),
  actor_name text not null,
  action text not null check(action in('share','pause','assign','revoke')),
  expected_version integer not null check(expected_version>=0),
  data jsonb not null check(jsonb_typeof(data)='object'),
  request_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(actor_id,request_id)
);
create index panel_events_case_time on public.simulation_panel_events(case_id,created_at);
create index panel_events_assignment_fk on public.simulation_panel_events(assignment_id);
create index panel_events_actor_fk on public.simulation_panel_events(actor_id);
alter table public.simulation_panel_cases enable row level security;
alter table public.simulation_panel_assignments enable row level security;
alter table public.simulation_panel_entries enable row level security;
alter table public.simulation_panel_events enable row level security;
revoke all on public.simulation_panel_cases,public.simulation_panel_assignments,public.simulation_panel_entries,public.simulation_panel_events from public,anon,authenticated;
create policy panel_cases_deny on public.simulation_panel_cases for all to anon,authenticated using(false) with check(false);
create policy panel_assignments_deny on public.simulation_panel_assignments for all to anon,authenticated using(false) with check(false);
create policy panel_entries_deny on public.simulation_panel_entries for all to anon,authenticated using(false) with check(false);
create policy panel_events_deny on public.simulation_panel_events for all to anon,authenticated using(false) with check(false);
create trigger audit_panel_cases after insert or update or delete on public.simulation_panel_cases for each row execute function private.audit_simulation_insert();
create trigger audit_panel_assignments after insert or update or delete on public.simulation_panel_assignments for each row execute function private.audit_simulation_insert();
create trigger audit_panel_entries after insert or update or delete on public.simulation_panel_entries for each row execute function private.audit_simulation_insert();
create trigger audit_panel_events after insert or update or delete on public.simulation_panel_events for each row execute function private.audit_simulation_insert();

create function private.panel_account_active(target uuid) returns boolean
language sql security definer set search_path='' as $$
  select exists(select 1 from auth.users u where u.id=target and u.email_confirmed_at is not null and u.deleted_at is null
    and (u.banned_until is null or u.banned_until<=clock_timestamp()));
$$;
revoke all on function private.panel_account_active(uuid) from public,anon,authenticated;
create function private.panel_reviewer_current(target uuid) returns boolean
language sql security definer set search_path='' as $$
  select private.panel_account_active(target) and exists(select 1 from public.platform_role_grants g where g.user_id=target and g.role='reviewer'
    and g.status='active' and g.starts_at<=clock_timestamp() and (g.ends_at is null or g.ends_at>clock_timestamp()));
$$;
revoke all on function private.panel_reviewer_current(uuid) from public,anon,authenticated;
create function private.panel_assignment_can_read(assignment uuid) returns boolean
language sql security definer set search_path='' as $$
  select private.has_live_identity_session() and private.panel_reviewer_current(auth.uid()) and exists(
    select 1 from public.simulation_panel_assignments a join public.simulation_panel_cases c on c.id=a.case_id
      join public.innovation_simulations s on s.id=c.simulation_id
    where a.id=assignment and a.reviewer_id=auth.uid() and a.status='active' and c.state='open' and s.owner_id<>auth.uid()
      and s.mode='demo' and s.status='waiting_evaluation' and s.evaluation_path='demo_small' and private.panel_account_active(s.owner_id));
$$;
revoke all on function private.panel_assignment_can_read(uuid) from public,anon,authenticated;

create or replace function private.simulation_actor_cannot_review(simulation uuid,actor uuid) returns boolean
language sql security definer set search_path='' as $$
  select exists(select 1 from public.simulation_rt_notes n where n.simulation_id=simulation and n.actor_id=actor and n.family_conflict)
    or exists(select 1 from public.simulation_review_events e where e.simulation_id=simulation and e.actor_id=actor and e.outcome in('conflict','forward'))
    or exists(select 1 from public.physical_recommendation_actions a join public.physical_recommendation_requests p on p.id=a.physical_request_id
      where p.simulation_id=simulation and a.actor_id=actor and a.action='conflict')
    or exists(select 1 from public.simulation_panel_entries e join public.simulation_panel_assignments a on a.id=e.assignment_id
      join public.simulation_panel_cases c on c.id=a.case_id where c.simulation_id=simulation and e.actor_id=actor);
$$;

create function private.panel_workflow(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid(); s public.innovation_simulations%rowtype; c public.simulation_panel_cases%rowtype;
  a public.simulation_panel_assignments%rowtype; old_event public.simulation_panel_events%rowtype; e public.simulation_panel_entries%rowtype;
  target record; normalized jsonb; action_kind text; explanation text; slot text; selected uuid; nonce uuid; expected integer;
  p integer; enabled boolean; is_owner boolean; is_kel boolean; can_read boolean; score_kind text; scores integer[]; maxima integer[]:=array[25,25,20,15,15];
  field_names text[]:=array['problem_score','beneficiaries_score','feasibility_score','evidence_score','budget_score']; i integer; choice text; ack boolean;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation in('sharing','assign','revoke','entry') then
    perform pg_advisory_xact_lock(184701,1);
    if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  end if;
  p:=coalesce((payload->>'page')::integer,0);
  if p not between 0 and 9999 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation in('admin_list','admin_details','candidate','assign','revoke') and not private.has_program_admin() then
    raise exception using errcode='42501',message='ADMIN_REQUIRED';
  end if;
  if operation='admin_list' then
    return jsonb_build_object('count',(select count(*) from public.simulation_panel_cases c2 join public.innovation_simulations s2 on s2.id=c2.simulation_id where private.panel_account_active(s2.owner_id)),
      'rows',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
        (select c2.id,c2.state,c2.version,c2.created_at,s2.reference,t.name as territory_name,
          (select count(*) from public.simulation_panel_assignments a2 where a2.case_id=c2.id and a2.status='active') as assigned
        from public.simulation_panel_cases c2 join public.innovation_simulations s2 on s2.id=c2.simulation_id join public.territories t on t.id=s2.kelurahan_id
        where private.panel_account_active(s2.owner_id) order by c2.created_at,c2.id limit 20 offset p*20) q));
  elsif operation='my_queue' then
    can_read:=private.panel_reviewer_current(actor);
    return jsonb_build_object('can_review',can_read,'count',case when can_read then (select count(*) from public.simulation_panel_assignments where reviewer_id=actor) else 0 end,
      'rows',case when can_read then (select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
        (select a2.id,a2.seat,a2.status,a2.created_at,c2.state,s2.reference,
          exists(select 1 from public.simulation_panel_entries e2 where e2.assignment_id=a2.id) as submitted
        from public.simulation_panel_assignments a2 join public.simulation_panel_cases c2 on c2.id=a2.case_id join public.innovation_simulations s2 on s2.id=c2.simulation_id
        where a2.reviewer_id=actor order by a2.created_at desc,a2.id limit 20 offset p*20) q) else '[]'::jsonb end);
  end if;

  if operation in('assignment','entry') then
    select * into a from public.simulation_panel_assignments where id=(payload->>'assignment_id')::uuid and reviewer_id=actor;
    if not found or not private.panel_reviewer_current(actor) then raise exception using errcode='22023',message='PANEL_UNAVAILABLE'; end if;
    select * into c from public.simulation_panel_cases where id=a.case_id;
    select * into s from public.innovation_simulations where id=c.simulation_id;
  elsif operation in('admin_details','candidate','assign','revoke') then
    select * into c from public.simulation_panel_cases where id=(payload->>'case_id')::uuid;
    if not found then raise exception using errcode='22023',message='PANEL_UNAVAILABLE'; end if;
    select * into s from public.innovation_simulations where id=c.simulation_id;
  else
    select * into s from public.innovation_simulations where id=(payload->>'simulation_id')::uuid;
    if not found then raise exception using errcode='22023',message='PANEL_UNAVAILABLE'; end if;
    select * into c from public.simulation_panel_cases where simulation_id=s.id;
  end if;
  if s.mode<>'demo' or s.status<>'waiting_evaluation' or s.evaluation_path is distinct from 'demo_small'
    or not private.panel_account_active(s.owner_id) then raise exception using errcode='22023',message='PANEL_UNAVAILABLE'; end if;
  if operation in('sharing','assign','revoke','entry') then
    perform 1 from public.innovation_simulations where id=s.id for update;
    if c.id is not null then select * into c from public.simulation_panel_cases where id=c.id for update; end if;
    if a.id is not null then select * into a from public.simulation_panel_assignments where id=a.id for update; end if;
  end if;
  is_owner:=s.owner_id=actor;
  is_kel:=s.kelurahan_id in(select private.simulation_viewer_territories('kelurahan'));
  if operation in('details','sharing') and not(is_owner or is_kel) then raise exception using errcode='22023',message='PANEL_UNAVAILABLE'; end if;

  if operation='candidate' then
    if length(coalesce(payload->>'email','')) not between 3 and 254 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    select u.id,u.email,p2.display_name into target from auth.users u join public.profiles p2 on p2.id=u.id
      where lower(u.email)=lower(btrim(payload->>'email')) and private.panel_account_active(u.id);
    if not found then return jsonb_build_object('user',null); end if;
    return jsonb_build_object('user',to_jsonb(target),'reviewer_active',private.panel_reviewer_current(target.id),
      'independent',target.id<>s.owner_id and not private.simulation_actor_cannot_review(s.id,target.id),
      'previously_assigned',exists(select 1 from public.simulation_panel_assignments where case_id=c.id and reviewer_id=target.id));
  elsif operation in('details','admin_details') then
    return jsonb_build_object('is_owner',is_owner,'simulation',jsonb_build_object('id',s.id,'reference',s.reference,'title',case when operation='details' then s.title end),
      'case',case when c.id is not null then to_jsonb(c) end,
      'assignments',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
        (select a2.id,a2.seat,a2.reviewer_name,a2.status,a2.appointment_reference,a2.reason,a2.assigned_by_name,a2.created_at,a2.closed_at,
          private.panel_reviewer_current(a2.reviewer_id) as role_current,
          exists(select 1 from public.simulation_panel_entries where assignment_id=a2.id) as submitted
        from public.simulation_panel_assignments a2 where a2.case_id=c.id and a2.status='active' order by a2.seat) q),
      'assignment_history_count',(select count(*) from public.simulation_panel_assignments where case_id=c.id and status<>'active'),
      'assignment_history',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
        (select a2.id,a2.seat,a2.reviewer_name,a2.status,a2.appointment_reference,a2.reason,a2.assigned_by_name,a2.created_at,a2.closed_at,
          false as role_current,exists(select 1 from public.simulation_panel_entries where assignment_id=a2.id) as submitted
        from public.simulation_panel_assignments a2 where a2.case_id=c.id and a2.status<>'active' order by a2.closed_at desc,a2.id limit 20 offset p*20) q),
      'entries',case when operation='details' then (select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
        (select e2.*,a2.seat,a2.status as assignment_status,a2.reviewer_name from public.simulation_panel_entries e2
          join public.simulation_panel_assignments a2 on a2.id=e2.assignment_id where a2.case_id=c.id order by e2.created_at desc,e2.id limit 20 offset p*20) q) else '[]'::jsonb end,
      'entry_count',case when operation='details' then (select count(*) from public.simulation_panel_entries e2 join public.simulation_panel_assignments a2 on a2.id=e2.assignment_id where a2.case_id=c.id) else 0 end,
      'events',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
        (select actor_name,action,data,created_at,id from public.simulation_panel_events where case_id=c.id order by created_at desc,id limit 20 offset p*20) q),
      'event_count',(select count(*) from public.simulation_panel_events where case_id=c.id));
  elsif operation='assignment' then
    can_read:=private.panel_assignment_can_read(a.id);
    select * into e from public.simulation_panel_entries where assignment_id=a.id;
    return jsonb_build_object('assignment',jsonb_build_object('id',a.id,'seat',a.seat,'status',a.status,'reviewer_name',a.reviewer_name,'appointment_reference',a.appointment_reference),
      'case_state',c.state,'reference',s.reference,'can_read',can_read,
      'can_score',can_read and e.id is null and not private.simulation_actor_cannot_review(s.id,actor),
      'simulation',case when can_read then to_jsonb(s) end,'entry',case when e.id is not null then to_jsonb(e) end,
      'files',case when can_read then (select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
        (select f.id,f.original_name,f.mime_type,f.byte_size,f.sha256,f.created_at from public.simulation_attachment_links l join public.draft_attachments f on f.id=l.attachment_id
          where l.simulation_id=s.id and f.purpose='supporting' and f.storage_state='ready' order by l.created_at,l.id) q) else '[]'::jsonb end,
      'events',case when can_read then (select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
        (select actor_name,office_name,stage,outcome,body,decision_method,created_at,id from public.simulation_review_events where simulation_id=s.id order by created_at,id) q) else '[]'::jsonb end);
  end if;

  nonce:=(payload->>'request_id')::uuid;
  if nonce is null then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation in('sharing','assign','revoke') then
    expected:=(payload->>'version')::integer;
    if expected is null or expected<0 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    explanation:=btrim(payload->>'reason',E' \n\r\t');
    if jsonb_typeof(payload->'reason') is distinct from 'string' or length(explanation) not between 3 and 1000
      or translate(explanation,E'\n\r\t','') ~ '[[:cntrl:]]' then raise exception using errcode='22023',message='PANEL_REASON_REQUIRED'; end if;
    if operation='sharing' then
      if not is_owner then raise exception using errcode='42501',message='PANEL_OWNER_REQUIRED'; end if;
      if jsonb_typeof(payload->'enabled') is distinct from 'boolean' then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
      enabled:=(payload->>'enabled')::boolean;
      if enabled and payload->'acknowledged' is distinct from 'true'::jsonb then raise exception using errcode='22023',message='PANEL_ACK_REQUIRED'; end if;
      action_kind:=case when enabled then 'share' else 'pause' end;
      normalized:=jsonb_build_object('reason',explanation,'consent_version','demo-panel-v1','simulation_id',s.id);
    elsif operation='assign' then
      selected:=(payload->>'reviewer_id')::uuid; slot:=payload->>'seat'; action_kind:='assign';
      if selected is null or coalesce(slot,'') not in('brida_opd','academic','practitioner') or payload->'verified' is distinct from 'true'::jsonb
        or jsonb_typeof(payload->'reference') is distinct from 'string' or length(btrim(payload->>'reference',E' \n\r\t')) not between 3 and 240
        or translate(payload->>'reference',E'\n\r\t','') ~ '[[:cntrl:]]' then raise exception using errcode='22023',message='INVALID_PANEL_ASSIGNMENT'; end if;
      normalized:=jsonb_build_object('reviewer_id',selected,'seat',slot,'reference',btrim(payload->>'reference',E' \n\r\t'),'reason',explanation,'verified',true);
    else
      selected:=(payload->>'assignment_id')::uuid;action_kind:='revoke';
      if selected is null then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
      normalized:=jsonb_build_object('assignment_id',selected,'reason',explanation);
    end if;
    select * into old_event from public.simulation_panel_events where actor_id=actor and request_id=nonce;
    if found then
      if old_event.action is distinct from action_kind or old_event.expected_version is distinct from expected or old_event.data is distinct from normalized
        or (c.id is not null and old_event.case_id<>c.id) then raise exception using errcode='PT409',message='PANEL_REQUEST_CONFLICT'; end if;
      return jsonb_build_object('case_id',old_event.case_id,'simulation_id',s.id);
    end if;
    if expected<>coalesce(c.version,0) then raise exception using errcode='PT409',message='PANEL_VERSION_CONFLICT'; end if;
    if operation='sharing' then
      if c.id is null then
        if not enabled then raise exception using errcode='22023',message='PANEL_UNAVAILABLE'; end if;
        insert into public.simulation_panel_cases(simulation_id,owner_id,state) values(s.id,actor,'open') returning * into c;
      end if;
      update public.simulation_panel_cases set state=case when enabled then 'open' else 'paused' end,version=version+1,
        shared_at=case when enabled then clock_timestamp() else shared_at end where id=c.id;
    elsif operation='assign' then
      if c.state<>'open' then raise exception using errcode='22023',message='PANEL_SHARING_PAUSED'; end if;
      if not private.panel_reviewer_current(selected) then raise exception using errcode='22023',message='PANEL_REVIEWER_REQUIRED'; end if;
      if selected=s.owner_id or private.simulation_actor_cannot_review(s.id,selected) then raise exception using errcode='42501',message='INDEPENDENT_REVIEWER_REQUIRED'; end if;
      if exists(select 1 from public.simulation_panel_assignments where case_id=c.id and (reviewer_id=selected or (seat=slot and status='active'))) then
        raise exception using errcode='PT409',message='PANEL_SEAT_CONFLICT'; end if;
      insert into public.simulation_panel_assignments(case_id,reviewer_id,reviewer_name,seat,appointment_reference,reason,assigned_by,assigned_by_name)
        values(c.id,selected,(select display_name from public.profiles where id=selected),slot,normalized->>'reference',explanation,actor,
          (select display_name from public.profiles where id=actor)) returning * into a;
      update public.simulation_panel_cases set version=version+1 where id=c.id;
    else
      select * into a from public.simulation_panel_assignments where id=selected and case_id=c.id for update;
      if not found or a.status<>'active' then raise exception using errcode='PT409',message='PANEL_VERSION_CONFLICT'; end if;
      update public.simulation_panel_assignments set status='revoked',closed_at=clock_timestamp() where id=a.id;
      update public.simulation_panel_cases set version=version+1 where id=c.id;
    end if;
    insert into public.simulation_panel_events(case_id,assignment_id,actor_id,actor_name,action,expected_version,data,request_id)
      values(c.id,case when operation in('assign','revoke') then a.id end,actor,(select display_name from public.profiles where id=actor),action_kind,expected,normalized,nonce);
    return jsonb_build_object('case_id',c.id,'simulation_id',s.id);
  elsif operation='entry' then
    score_kind:=payload->>'kind';explanation:=btrim(payload->>'body',E' \n\r\t');
    if coalesce(score_kind,'') not in('score','conflict') or jsonb_typeof(payload->'body') is distinct from 'string'
      or length(explanation) not between 3 and 4000 or translate(explanation,E'\n\r\t','') ~ '[[:cntrl:]]'
      or payload->>'rubric_version' is distinct from 'demo-panel-v1' then raise exception using errcode='22023',message='INVALID_PANEL_ENTRY'; end if;
    if coalesce(payload->>'conflict','')<>(case when score_kind='score' then 'none' else 'reported' end) then raise exception using errcode='22023',message='CONFLICT_REVIEW_ONLY'; end if;
    scores:=array[null::integer,null::integer,null::integer,null::integer,null::integer];choice:=null;ack:=false;
    if score_kind='score' then
      for i in 1..5 loop
        if jsonb_typeof(payload->field_names[i]) is distinct from 'number' or payload->>field_names[i] !~ '^(0|[1-9][0-9]?)$' then
          raise exception using errcode='22023',message='PANEL_SCORES_REQUIRED'; end if;
        scores[i]:=(payload->>field_names[i])::integer;
        if scores[i] not between 0 and maxima[i] then raise exception using errcode='22023',message='PANEL_SCORES_REQUIRED'; end if;
      end loop;
      choice:=payload->>'vote';ack:=payload->'acknowledged'='true'::jsonb;
      if coalesce(choice,'') not in('agree','disagree') or not coalesce(ack,false) then raise exception using errcode='22023',message='PANEL_ACK_REQUIRED'; end if;
    else
      if payload->>'vote' is not null or payload->'acknowledged' is distinct from 'false'::jsonb then raise exception using errcode='22023',message='CONFLICT_REVIEW_ONLY'; end if;
      for i in 1..5 loop if payload->>field_names[i] is not null then raise exception using errcode='22023',message='CONFLICT_REVIEW_ONLY'; end if; end loop;
    end if;
    select * into e from public.simulation_panel_entries where actor_id=actor and request_id=nonce;
    if found then
      if e.assignment_id is distinct from a.id or e.kind is distinct from score_kind or e.body is distinct from explanation or e.vote is distinct from choice
        or array[e.problem_score,e.beneficiaries_score,e.feasibility_score,e.evidence_score,e.budget_score] is distinct from scores
        or e.acknowledged is distinct from ack or e.expected_workflow_version is distinct from (payload->>'workflow_version')::integer then
        raise exception using errcode='PT409',message='PANEL_REQUEST_CONFLICT'; end if;
      return jsonb_build_object('assignment_id',a.id);
    end if;
    if not private.panel_assignment_can_read(a.id) then raise exception using errcode='42501',message='PANEL_UNAVAILABLE'; end if;
    if s.workflow_version is distinct from (payload->>'workflow_version')::integer then raise exception using errcode='PT409',message='WORKFLOW_CONFLICT'; end if;
    if exists(select 1 from public.simulation_panel_entries where assignment_id=a.id) then raise exception using errcode='PT409',message='PANEL_ENTRY_LOCKED'; end if;
    if private.simulation_actor_cannot_review(s.id,actor) and score_kind='score' then raise exception using errcode='42501',message='INDEPENDENT_REVIEWER_REQUIRED'; end if;
    insert into public.simulation_panel_entries(assignment_id,actor_id,actor_name,kind,problem_score,beneficiaries_score,feasibility_score,evidence_score,budget_score,
      vote,body,expected_workflow_version,request_id,acknowledged)
      values(a.id,actor,(select display_name from public.profiles where id=actor),score_kind,scores[1],scores[2],scores[3],scores[4],scores[5],choice,explanation,s.workflow_version,nonce,ack);
    if score_kind='conflict' then
      update public.simulation_panel_assignments set status='conflict',closed_at=clock_timestamp() where id=a.id;
      update public.simulation_panel_cases set version=version+1 where id=c.id;
    end if;
    return jsonb_build_object('assignment_id',a.id);
  end if;
  raise exception using errcode='22023',message='INVALID_OPERATION';
end;
$$;
revoke all on function private.panel_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function private.panel_workflow(text,jsonb) to authenticated;
create function public.panel_workflow(operation text,payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select private.panel_workflow(operation,payload);$$;
revoke all on function public.panel_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function public.panel_workflow(text,jsonb) to authenticated;

create or replace function private.attachment_workflow(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid(); d public.innovation_drafts%rowtype; f public.draft_attachments%rowtype;
  s public.innovation_simulations%rowtype; target_draft uuid; archive_page integer; file_purpose text; physical_sim uuid; physical_started timestamptz; physical_ok boolean:=false;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation='list_simulation' then
    select * into s from public.innovation_simulations where id=(payload->>'simulation_id')::uuid;
    if not found or not private.simulation_can_access(s.owner_id,s.rt_id,s.rw_id,s.kelurahan_id,s.reached_stage) then
      raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE';
    end if;
    return jsonb_build_object('revision',s.attachment_revision,'files',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from
      (select f.id,f.original_name,f.mime_type,f.byte_size,f.sha256,f.created_at from public.simulation_attachment_links l
        join public.draft_attachments f on f.id=l.attachment_id where l.simulation_id=s.id and f.storage_state='ready' and f.purpose='supporting'
        order by l.created_at,l.id) a));
  elsif operation='read' then
    select * into f from public.draft_attachments where id=(payload->>'id')::uuid;
    if not found or f.storage_state<>'ready' then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
    if f.owner_id<>actor then
      if nullif(payload->>'panel_assignment_id','') is not null then
        physical_ok:=f.purpose='supporting' and exists(select 1 from public.simulation_panel_assignments a
          join public.simulation_panel_cases c on c.id=a.case_id
          where a.id=(payload->>'panel_assignment_id')::uuid and private.panel_assignment_can_read(a.id)
            and exists(select 1 from public.simulation_attachment_links l where l.simulation_id=c.simulation_id and l.attachment_id=f.id));
      end if;
      if not physical_ok and nullif(payload->>'physical_request_id','') is not null then
        physical_ok:=exists(select 1 from public.physical_recommendation_requests p
          where p.id=(payload->>'physical_request_id')::uuid and private.physical_request_can_read(p.id)
            and (p.attachment_id=f.id or (f.purpose='supporting' and exists(select 1 from public.simulation_attachment_links l
              where l.simulation_id=p.simulation_id and l.attachment_id=f.id))));
      end if;
      if not physical_ok then
        if f.purpose<>'supporting' then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
        select s2.* into s from public.innovation_simulations s2 join public.simulation_attachment_links l on l.simulation_id=s2.id
          where s2.id=(payload->>'simulation_id')::uuid and l.attachment_id=f.id;
        if not found or not private.simulation_can_access(s.owner_id,s.rt_id,s.rw_id,s.kelurahan_id,s.reached_stage) then
          raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE';
        end if;
      end if;
    end if;
    return jsonb_build_object('id',f.id,'original_name',f.original_name,'mime_type',f.mime_type,'byte_size',f.byte_size,'sha256',f.sha256,'object_path',f.object_path);
  end if;

  if operation in('reserve','restore') then
    -- Serialize this actor's quotas across multiple drafts.
    perform pg_advisory_xact_lock(hashtextextended(actor::text,184702));
  end if;
  if operation in('archive','restore') then
    select draft_id into target_draft from public.draft_attachments where id=(payload->>'id')::uuid and owner_id=actor;
  else target_draft:=(payload->>'draft_id')::uuid; end if;
  if operation in('reserve','archive','restore') then
    select * into d from public.innovation_drafts where id=target_draft and owner_id=actor for update;
  else select * into d from public.innovation_drafts where id=target_draft and owner_id=actor; end if;
  if not found then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
  if operation in('archive','restore') and d.id is distinct from (payload->>'draft_id')::uuid then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if operation='list_draft' then
    archive_page:=coalesce((payload->>'page')::integer,0);
    if archive_page not between 0 and 9999 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    return jsonb_build_object('draft',jsonb_build_object('id',d.id,'title',d.title,'attachment_revision',d.attachment_revision),
      'files',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from
        (select id,request_id,original_name,mime_type,byte_size,sha256,storage_state,created_at,removed_at,purpose,physical_simulation_id,false as has_snapshots
          from public.draft_attachments where draft_id=d.id and removed_at is null order by created_at,id) a),
      'archived',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from
        (select f.id,f.original_name,f.mime_type,f.byte_size,f.sha256,f.storage_state,f.created_at,f.removed_at,f.purpose,f.physical_simulation_id,
          exists(select 1 from public.simulation_attachment_links l where l.attachment_id=f.id) as has_snapshots
          from public.draft_attachments f where f.draft_id=d.id and f.removed_at is not null
          order by f.removed_at desc,f.id limit 20 offset archive_page*20) a),
      'archived_count',(select count(*) from public.draft_attachments where draft_id=d.id and removed_at is not null),
      'can_upload',private.attachment_draft_is_demo(d.id));
  elsif operation='reserve' then
    if not private.attachment_draft_is_demo(d.id) then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    if jsonb_typeof(payload->'name') is distinct from 'string' or jsonb_typeof(payload->'mime_type') is distinct from 'string'
      or jsonb_typeof(payload->'sha256') is distinct from 'string' or jsonb_typeof(payload->'byte_size') is distinct from 'number'
      or nullif(payload->>'request_id','') is null then raise exception using errcode='22023',message='INVALID_FILE'; end if;
    file_purpose:=coalesce(payload->>'purpose','supporting'); physical_sim:=nullif(payload->>'physical_simulation_id','')::uuid;
    if file_purpose not in('supporting','physical_rt','physical_rw') or ((file_purpose='supporting') is distinct from (physical_sim is null)) then
      raise exception using errcode='22023',message='INVALID_FILE';
    end if;
    select * into f from public.draft_attachments where owner_id=actor and request_id=(payload->>'request_id')::uuid;
    if found then
      if f.draft_id is distinct from d.id or f.original_name is distinct from payload->>'name' or f.mime_type is distinct from payload->>'mime_type'
        or f.sha256 is distinct from payload->>'sha256' or f.byte_size is distinct from (payload->>'byte_size')::integer
        or f.purpose is distinct from file_purpose or f.physical_simulation_id is distinct from physical_sim then
        raise exception using errcode='PT409',message='UPLOAD_REQUEST_CONFLICT';
      end if;
      if f.removed_at is not null then raise exception using errcode='PT409',message='ATTACHMENT_ARCHIVED'; end if;
      return to_jsonb(f);
    end if;
    if (select count(*) from public.draft_attachments where draft_id=d.id and removed_at is null)>=10
      or (select count(*) from public.draft_attachments where owner_id=actor and removed_at is null)>=50 then
      raise exception using errcode='22023',message='ATTACHMENT_LIMIT';
    end if;
    if (select count(*) from public.draft_attachments where owner_id=actor and created_at>clock_timestamp()-interval '24 hours')>=30 then
      raise exception using errcode='22023',message='UPLOAD_RATE_LIMIT';
    end if;
    if file_purpose<>'supporting' then
      if not private.physical_upload_allowed(physical_sim,actor,d.id,file_purpose) then raise exception using errcode='22023',message='PHYSICAL_UPLOAD_NOT_AVAILABLE'; end if;
      select queue_entered_at into physical_started from public.innovation_simulations where id=physical_sim;
    end if;
    insert into public.draft_attachments(draft_id,owner_id,request_id,original_name,mime_type,byte_size,sha256,purpose,physical_simulation_id,physical_queue_entered_at)
      values(d.id,actor,(payload->>'request_id')::uuid,payload->>'name',payload->>'mime_type',(payload->>'byte_size')::integer,payload->>'sha256',file_purpose,physical_sim,physical_started) returning * into f;
    return to_jsonb(f);
  elsif operation='restore' then
    if not private.attachment_draft_is_demo(d.id) then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into f from public.draft_attachments where id=(payload->>'id')::uuid and owner_id=actor and draft_id=d.id for update;
    if not found or f.storage_state<>'ready' then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
    if f.removed_at is null then return jsonb_build_object('id',f.id); end if;
    if (select count(*) from public.draft_attachments where draft_id=d.id and removed_at is null)>=10
      or (select count(*) from public.draft_attachments where owner_id=actor and removed_at is null)>=50 then
      raise exception using errcode='22023',message='ATTACHMENT_LIMIT';
    end if;
    update public.draft_attachments set removed_at=null where id=f.id;
    if f.purpose='supporting' then update public.innovation_drafts set attachment_revision=attachment_revision+1 where id=d.id; end if;
    return jsonb_build_object('id',f.id);
  elsif operation='archive' then
    select * into f from public.draft_attachments where id=(payload->>'id')::uuid and owner_id=actor and draft_id=d.id for update;
    if not found then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
    if f.removed_at is null then
      update public.draft_attachments set removed_at=clock_timestamp() where id=f.id returning * into f;
      if f.purpose='supporting' then update public.innovation_drafts set attachment_revision=attachment_revision+1 where id=d.id; end if;
    end if;
    return jsonb_build_object('id',f.id,'has_snapshots',exists(select 1 from public.simulation_attachment_links where attachment_id=f.id));
  end if;
  raise exception using errcode='22023',message='INVALID_OPERATION';
end;
$$;

