-- DEMO physical recommendations. Real confirmer authority remains a product decision.
do $$ begin
  if (select md5(prosrc) from pg_proc where oid='private.simulation_workflow(text,jsonb)'::regprocedure) is distinct from 'f87279c684886ccfe368b24ad347f00d'
    or (select md5(prosrc) from pg_proc where oid='private.attachment_workflow(text,jsonb)'::regprocedure) is distinct from 'd0c14309fcafd2ac3000842378998ef6'
    or (select md5(prosrc) from pg_proc where oid='private.attachment_service(text,jsonb)'::regprocedure) is distinct from '3beb5323da9e035df89ffc4c7dbb31ed'
    or (select md5(prosrc) from pg_proc where oid='private.snapshot_simulation_attachments()'::regprocedure) is distinct from 'a2990ce0298854ad0eb49f5386a59f0f'
  then raise exception 'PHYSICAL_WORKFLOW_BASE_CHANGED'; end if;
end $$;

alter table public.innovation_simulations add column queue_entered_at timestamptz not null default clock_timestamp();
-- Recover the current stage's actual entry, never the time a conflict note was added.
update public.innovation_simulations s set queue_entered_at=coalesce(
  (select max(e.created_at) from public.simulation_review_events e where e.simulation_id=s.id and e.outcome='forward' and e.to_status=s.status),s.submitted_at);

create table public.physical_route_settings (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique check(version>=0),
  base_version integer not null check(base_version>=0),
  delay_days integer not null check(delay_days between 1 and 30),
  reason text not null check(length(btrim(reason,E' \n\r\t')) between 3 and 1000 and translate(reason,E'\n\r\t','') !~ '[[:cntrl:]]'),
  actor_id uuid references public.profiles(id),
  actor_name text not null,
  request_id uuid unique,
  created_at timestamptz not null default clock_timestamp(),
  check((version=0 and base_version=0 and actor_id is null and request_id is null)
    or (version>0 and base_version=version-1 and actor_id is not null and request_id is not null))
);
create index physical_settings_actor_fk on public.physical_route_settings(actor_id);
alter table public.physical_route_settings enable row level security;
revoke all on public.physical_route_settings from public,anon,authenticated;
create policy physical_settings_deny on public.physical_route_settings for all to anon,authenticated using(false) with check(false);
insert into public.physical_route_settings(version,base_version,delay_days,reason,actor_name)
  values(0,0,7,'Nilai awal jalur dokumen fisik DEMO.','Konfigurasi awal DEMO');

alter table public.draft_attachments
  add column purpose text not null default 'supporting' check(purpose in('supporting','physical_rt','physical_rw')),
  add column physical_simulation_id uuid references public.innovation_simulations(id),
  add column physical_queue_entered_at timestamptz,
  add constraint attachment_physical_context_check check(
    (purpose='supporting' and physical_simulation_id is null and physical_queue_entered_at is null)
    or (purpose<>'supporting' and physical_simulation_id is not null and physical_queue_entered_at is not null));
create index attachments_physical_sim_fk on public.draft_attachments(physical_simulation_id);

create table public.physical_recommendation_requests (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.innovation_simulations(id),
  owner_id uuid not null references public.profiles(id),
  kelurahan_id uuid not null references public.territories(id),
  attachment_id uuid not null references public.draft_attachments(id),
  stage text not null check(stage in('rt','rw')),
  status text not null default 'pending' check(status in('pending','accepted','rejected','withdrawn','obsolete')),
  body text not null check(length(btrim(body,E' \n\r\t')) between 3 and 4000 and translate(body,E'\n\r\t','') !~ '[[:cntrl:]]'),
  acknowledged boolean not null check(acknowledged),
  request_id uuid not null,
  submitted_workflow_version integer not null check(submitted_workflow_version>=0),
  settings_version integer not null references public.physical_route_settings(version),
  delay_days integer not null check(delay_days between 1 and 30),
  queue_entered_at timestamptz not null,
  eligible_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  closed_at timestamptz,
  unique(owner_id,request_id),
  check(eligible_at=queue_entered_at+delay_days*interval '24 hours'),
  check((status='pending')=(closed_at is null))
);
create unique index physical_one_pending_stage on public.physical_recommendation_requests(simulation_id,stage) where status='pending';
create index physical_requests_owner_time on public.physical_recommendation_requests(owner_id,created_at);
create index physical_requests_kel_time on public.physical_recommendation_requests(kelurahan_id,created_at);
create index physical_requests_file_fk on public.physical_recommendation_requests(attachment_id);
create index physical_requests_settings_fk on public.physical_recommendation_requests(settings_version);
create index physical_requests_sim_time on public.physical_recommendation_requests(simulation_id,created_at);
alter table public.physical_recommendation_requests enable row level security;
revoke all on public.physical_recommendation_requests from public,anon,authenticated;
create policy physical_requests_deny on public.physical_recommendation_requests for all to anon,authenticated using(false) with check(false);

create table public.physical_recommendation_actions (
  id uuid primary key default gen_random_uuid(),
  physical_request_id uuid not null references public.physical_recommendation_requests(id),
  actor_id uuid not null references public.profiles(id),
  actor_name text not null,
  office_id uuid references public.offices(id),
  office_name text,
  mandate_id uuid references public.office_mandates(id),
  action text not null check(action in('accept','reject','conflict','withdraw')),
  body text not null check(length(btrim(body,E' \n\r\t')) between 3 and 4000 and translate(body,E'\n\r\t','') !~ '[[:cntrl:]]'),
  signature_checked boolean not null default false,
  contact_checked boolean not null default false,
  content_checked boolean not null default false,
  workflow_version integer not null check(workflow_version>=0),
  request_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(actor_id,request_id),
  check((action='withdraw' and office_id is null and office_name is null and mandate_id is null)
    or (action<>'withdraw' and office_id is not null and office_name is not null and mandate_id is not null)),
  check(action<>'accept' or (signature_checked and contact_checked and content_checked)),
  check(action not in('conflict','withdraw') or (not signature_checked and not contact_checked and not content_checked))
);
create unique index physical_one_terminal_action on public.physical_recommendation_actions(physical_request_id) where action in('accept','reject','withdraw');
create index physical_actions_actor_fk on public.physical_recommendation_actions(actor_id);
create index physical_actions_office_fk on public.physical_recommendation_actions(office_id);
create index physical_actions_mandate_fk on public.physical_recommendation_actions(mandate_id);
create index physical_actions_request_time on public.physical_recommendation_actions(physical_request_id,created_at);
alter table public.physical_recommendation_actions enable row level security;
revoke all on public.physical_recommendation_actions from public,anon,authenticated;
create policy physical_actions_deny on public.physical_recommendation_actions for all to anon,authenticated using(false) with check(false);

alter table public.simulation_review_events
  add column decision_method text not null default 'digital' check(decision_method in('digital','physical')),
  add column physical_request_id uuid unique references public.physical_recommendation_requests(id),
  add constraint review_physical_method_check check(
    (decision_method='digital' and physical_request_id is null)
    or (decision_method='physical' and physical_request_id is not null and stage in('rt','rw') and outcome='forward'));

create trigger audit_physical_settings after insert or update or delete on public.physical_route_settings for each row execute function private.audit_simulation_insert();
create trigger audit_physical_requests after insert or update or delete on public.physical_recommendation_requests for each row execute function private.audit_simulation_insert();
create trigger audit_physical_actions after insert or update or delete on public.physical_recommendation_actions for each row execute function private.audit_simulation_insert();

create function private.track_simulation_queue_clock() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then new.queue_entered_at:=clock_timestamp();
  elsif new.status is distinct from old.status then new.queue_entered_at:=clock_timestamp(); end if;
  return new;
end;
$$;
revoke all on function private.track_simulation_queue_clock() from public,anon,authenticated;
create trigger track_simulation_queue_clock before insert or update on public.innovation_simulations for each row execute function private.track_simulation_queue_clock();
create function private.close_obsolete_physical_requests() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.status is distinct from old.status then
    update public.physical_recommendation_requests set status='obsolete',closed_at=clock_timestamp()
      where simulation_id=new.id and status='pending';
  end if;
  return null;
end;
$$;
revoke all on function private.close_obsolete_physical_requests() from public,anon,authenticated;
create trigger close_obsolete_physical_requests after update on public.innovation_simulations for each row execute function private.close_obsolete_physical_requests();

create function private.physical_request_can_read(request uuid) returns boolean
language sql security definer set search_path='' as $$
  select private.has_live_identity_session() and exists(select 1 from public.physical_recommendation_requests p
    join public.innovation_simulations s on s.id=p.simulation_id join auth.users u on u.id=s.owner_id
    where p.id=request and s.mode='demo' and (s.owner_id=auth.uid() or
      (p.status in('pending','accepted','rejected') and p.kelurahan_id in(select private.simulation_viewer_territories('kelurahan'))
       and u.email_confirmed_at is not null and u.deleted_at is null and (u.banned_until is null or u.banned_until<=clock_timestamp()))));
$$;
revoke all on function private.physical_request_can_read(uuid) from public,anon,authenticated;
create function private.simulation_actor_cannot_review(simulation uuid,actor uuid) returns boolean
language sql security definer set search_path='' as $$
  select exists(select 1 from public.simulation_rt_notes n where n.simulation_id=simulation and n.actor_id=actor and n.family_conflict)
    or exists(select 1 from public.simulation_review_events e where e.simulation_id=simulation and e.actor_id=actor and e.outcome in('conflict','forward'))
    or exists(select 1 from public.physical_recommendation_actions a join public.physical_recommendation_requests p on p.id=a.physical_request_id
      where p.simulation_id=simulation and a.actor_id=actor and a.action='conflict');
$$;
revoke all on function private.simulation_actor_cannot_review(uuid,uuid) from public,anon,authenticated;
create function private.physical_upload_allowed(simulation uuid,owner uuid,draft uuid,purpose text) returns boolean
language sql security definer set search_path='' as $$
  select exists(select 1 from public.innovation_simulations s where s.id=simulation and s.owner_id=owner and s.draft_id=draft and s.mode='demo'
    and ((purpose='physical_rt' and s.status='waiting_rt') or (purpose='physical_rw' and s.status='waiting_rw'))
    and clock_timestamp()>=s.queue_entered_at+(select delay_days from public.physical_route_settings order by version desc limit 1)*interval '24 hours');
$$;
revoke all on function private.physical_upload_allowed(uuid,uuid,uuid,text) from public,anon,authenticated;

create function private.physical_workflow(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid(); s public.innovation_simulations%rowtype; p public.physical_recommendation_requests%rowtype;
  f public.draft_attachments%rowtype; c public.physical_route_settings%rowtype; old_setting public.physical_route_settings%rowtype;
  old_action public.physical_recommendation_actions%rowtype; mandate record; current_stage text; deadline timestamptz;
  pending_id uuid; action_kind text; action_body text; signature_ok boolean; contact_ok boolean; content_ok boolean;
  can_review boolean; can_decide boolean; page integer; view_kind text; final_status text; new_status text; normalized_checks jsonb;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation in('save_settings','create','review','withdraw') then
    perform pg_advisory_xact_lock(184701,1);
    if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  end if;
  select * into c from public.physical_route_settings order by version desc limit 1;
  if operation in('settings','save_settings') then
    if not private.has_program_admin() then raise exception using errcode='42501',message='PROGRAM_ADMIN_REQUIRED'; end if;
    if operation='settings' then
      return jsonb_build_object('current',jsonb_build_object('version',c.version,'delay_days',c.delay_days),
        'history',(select coalesce(jsonb_agg(to_jsonb(h)),'[]') from
          (select version,delay_days,reason,actor_name,created_at from public.physical_route_settings order by version desc limit 20) h));
    end if;
    if jsonb_typeof(payload->'delay_days') is distinct from 'number' or (payload->>'delay_days')::integer not between 1 and 30
      or jsonb_typeof(payload->'version') is distinct from 'number' or jsonb_typeof(payload->'reason') is distinct from 'string'
      or length(btrim(payload->>'reason',E' \n\r\t')) not between 3 and 1000 or nullif(payload->>'request_id','') is null then
      raise exception using errcode='22023',message='INVALID_PHYSICAL_SETTING';
    end if;
    select * into old_setting from public.physical_route_settings where request_id=(payload->>'request_id')::uuid;
    if found then
      if old_setting.actor_id is distinct from actor or old_setting.base_version is distinct from (payload->>'version')::integer
        or old_setting.delay_days is distinct from (payload->>'delay_days')::integer or old_setting.reason is distinct from btrim(payload->>'reason',E' \n\r\t') then
        raise exception using errcode='PT409',message='SETTING_REQUEST_CONFLICT';
      end if;
      return jsonb_build_object('version',old_setting.version);
    end if;
    if c.version is distinct from (payload->>'version')::integer then raise exception using errcode='PT409',message='PHYSICAL_SETTINGS_CONFLICT'; end if;
    insert into public.physical_route_settings(version,base_version,delay_days,reason,actor_id,actor_name,request_id)
      values(c.version+1,c.version,(payload->>'delay_days')::integer,btrim(payload->>'reason',E' \n\r\t'),actor,
        (select display_name from public.profiles where id=actor),(payload->>'request_id')::uuid);
    return jsonb_build_object('version',c.version+1);
  end if;

  page:=coalesce((payload->>'page')::integer,0);
  if page not between 0 and 9999 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation='queue' then
    can_review:=exists(select 1 from private.simulation_viewer_territories('kelurahan'));
    view_kind:=coalesce(payload->>'view','pending');
    if view_kind not in('pending','history') then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    return jsonb_build_object('can_review',can_review,
      'count',(select count(*) from public.physical_recommendation_requests p2 where p2.owner_id<>actor
        and ((view_kind='pending' and p2.status='pending') or (view_kind='history' and p2.status in('accepted','rejected')))
        and private.physical_request_can_read(p2.id)),
      'rows',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
        (select p2.id,p2.stage,p2.status,p2.created_at,p2.delay_days,s2.reference,s2.title from public.physical_recommendation_requests p2
          join public.innovation_simulations s2 on s2.id=p2.simulation_id where p2.owner_id<>actor
          and ((view_kind='pending' and p2.status='pending') or (view_kind='history' and p2.status in('accepted','rejected')))
          and private.physical_request_can_read(p2.id)
          order by case when view_kind='pending' then p2.created_at end asc,case when view_kind='history' then p2.created_at end desc,p2.id
          limit 20 offset page*20) q));
  end if;

  if operation in('details','review','withdraw') then
    select * into p from public.physical_recommendation_requests where id=(payload->>'id')::uuid;
    if not found or not private.physical_request_can_read(p.id) then raise exception using errcode='22023',message='PHYSICAL_UNAVAILABLE'; end if;
    if operation in('review','withdraw') then
      select * into s from public.innovation_simulations where id=p.simulation_id for update;
      select * into p from public.physical_recommendation_requests where id=p.id for update;
    else select * into s from public.innovation_simulations where id=p.simulation_id; end if;
  else
    if operation='create' then select * into s from public.innovation_simulations where id=(payload->>'simulation_id')::uuid for update;
    else select * into s from public.innovation_simulations where id=(payload->>'simulation_id')::uuid; end if;
    if not found or not private.simulation_can_access(s.owner_id,s.rt_id,s.rw_id,s.kelurahan_id,s.reached_stage) then
      raise exception using errcode='22023',message='PHYSICAL_UNAVAILABLE';
    end if;
  end if;
  if s.mode<>'demo' or not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  current_stage:=case s.status when 'waiting_rt' then 'rt' when 'waiting_rw' then 'rw' end;
  deadline:=s.queue_entered_at+c.delay_days*interval '24 hours';

  if operation='context' then
    select id into pending_id from public.physical_recommendation_requests where simulation_id=s.id and status='pending';
    return jsonb_build_object('is_owner',s.owner_id=actor,'stage',current_stage,'queue_entered_at',s.queue_entered_at,
      'delay_days',c.delay_days,'settings_version',c.version,'eligible_at',deadline,'server_now',clock_timestamp(),
      'eligible',current_stage is not null and clock_timestamp()>=deadline,'pending_id',case when s.owner_id=actor then pending_id end,
      'simulation',jsonb_build_object('id',s.id,'draft_id',s.draft_id,'reference',s.reference,'title',s.title,'workflow_version',s.workflow_version),
      'files',case when s.owner_id=actor then (select coalesce(jsonb_agg(to_jsonb(a)),'[]') from
        (select id,original_name,mime_type,byte_size,sha256,created_at from public.draft_attachments
          where draft_id=s.draft_id and owner_id=actor and storage_state='ready' and removed_at is null
            and purpose='physical_'||current_stage and physical_simulation_id=s.id and physical_queue_entered_at=s.queue_entered_at order by created_at,id) a) else '[]'::jsonb end,
      'request_count',case when s.owner_id=actor then (select count(*) from public.physical_recommendation_requests where simulation_id=s.id) else 0 end,
      'requests',case when s.owner_id=actor then (select coalesce(jsonb_agg(to_jsonb(h)),'[]') from
        (select id,stage,status,created_at,delay_days from public.physical_recommendation_requests where simulation_id=s.id order by created_at desc,id limit 20 offset page*20) h) else '[]'::jsonb end);
  elsif operation='create' then
    if s.owner_id<>actor then raise exception using errcode='42501',message='PHYSICAL_OWNER_REQUIRED'; end if;
    if payload->'acknowledged' is distinct from 'true'::jsonb then raise exception using errcode='22023',message='PHYSICAL_ACK_REQUIRED'; end if;
    if jsonb_typeof(payload->'body') is distinct from 'string' or length(btrim(payload->>'body',E' \n\r\t')) not between 3 and 4000
      or nullif(payload->>'request_id','') is null then raise exception using errcode='22023',message='INVALID_PHYSICAL_REQUEST'; end if;
    select * into p from public.physical_recommendation_requests where owner_id=actor and request_id=(payload->>'request_id')::uuid;
    if found then
      if p.simulation_id is distinct from s.id or p.attachment_id is distinct from (payload->>'attachment_id')::uuid
        or p.body is distinct from btrim(payload->>'body',E' \n\r\t') or p.submitted_workflow_version is distinct from (payload->>'version')::integer
        or p.settings_version is distinct from (payload->>'settings_version')::integer then
        raise exception using errcode='PT409',message='PHYSICAL_REQUEST_CONFLICT';
      end if;
      return jsonb_build_object('id',p.id);
    end if;
    if current_stage is null or s.workflow_version is distinct from (payload->>'version')::integer then raise exception using errcode='PT409',message='WORKFLOW_CONFLICT'; end if;
    if c.version is distinct from (payload->>'settings_version')::integer then raise exception using errcode='PT409',message='PHYSICAL_SETTINGS_CONFLICT'; end if;
    if clock_timestamp()<deadline then raise exception using errcode='22023',message='PHYSICAL_TOO_EARLY'; end if;
    if exists(select 1 from public.physical_recommendation_requests where simulation_id=s.id and stage=current_stage and status='pending') then
      raise exception using errcode='PT409',message='PHYSICAL_PENDING';
    end if;
    if (select count(*) from public.physical_recommendation_requests where simulation_id=s.id and created_at>clock_timestamp()-interval '24 hours')>=5 then
      raise exception using errcode='22023',message='PHYSICAL_RATE_LIMIT';
    end if;
    select * into f from public.draft_attachments where id=(payload->>'attachment_id')::uuid and owner_id=actor and draft_id=s.draft_id
      and purpose='physical_'||current_stage and physical_simulation_id=s.id and physical_queue_entered_at=s.queue_entered_at
      and storage_state='ready' and removed_at is null for share;
    if not found then raise exception using errcode='22023',message='PHYSICAL_FILE_REQUIRED'; end if;
    insert into public.physical_recommendation_requests(simulation_id,owner_id,kelurahan_id,attachment_id,stage,body,acknowledged,request_id,
      submitted_workflow_version,settings_version,delay_days,queue_entered_at,eligible_at)
      values(s.id,actor,s.kelurahan_id,f.id,current_stage,btrim(payload->>'body',E' \n\r\t'),true,(payload->>'request_id')::uuid,
        s.workflow_version,c.version,c.delay_days,s.queue_entered_at,deadline) returning * into p;
    return jsonb_build_object('id',p.id);
  end if;

  can_review:=s.kelurahan_id in(select private.simulation_viewer_territories('kelurahan')) and actor<>s.owner_id;
  can_decide:=can_review and not private.simulation_actor_cannot_review(s.id,actor) and p.status='pending'
    and s.status='waiting_'||p.stage and s.queue_entered_at=p.queue_entered_at;
  if operation='details' then
    select * into f from public.draft_attachments where id=p.attachment_id;
    return jsonb_build_object('request',to_jsonb(p),'simulation',to_jsonb(s),'is_owner',s.owner_id=actor,'can_review',can_review,
      'can_decide',can_decide,'decision_blocked',private.simulation_actor_cannot_review(s.id,actor),
      'file',jsonb_build_object('id',f.id,'original_name',f.original_name,'mime_type',f.mime_type,'byte_size',f.byte_size,'sha256',f.sha256,'created_at',f.created_at),
      'supporting_files',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from
        (select f2.id,f2.original_name,f2.mime_type,f2.byte_size,f2.sha256,f2.created_at from public.simulation_attachment_links l
          join public.draft_attachments f2 on f2.id=l.attachment_id where l.simulation_id=s.id and f2.purpose='supporting' order by l.created_at,l.id) a),
      'actions',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from
        (select id,actor_name,office_name,action,body,signature_checked,contact_checked,content_checked,created_at from public.physical_recommendation_actions
          where physical_request_id=p.id order by created_at,id) a),
      'notes',(select coalesce(jsonb_agg(to_jsonb(n)),'[]') from
        (select id,actor_name,office_name,body,family_conflict,created_at from public.simulation_rt_notes where simulation_id=s.id order by created_at,id) n),
      'events',(select coalesce(jsonb_agg(to_jsonb(e)),'[]') from
        (select id,actor_name,office_name,stage,outcome,body,decision_method,created_at from public.simulation_review_events where simulation_id=s.id order by created_at,id) e));
  end if;
  if operation not in('review','withdraw') then raise exception using errcode='22023',message='INVALID_OPERATION'; end if;

  if operation='withdraw' then
    if actor<>s.owner_id then raise exception using errcode='42501',message='PHYSICAL_OWNER_REQUIRED'; end if;
    select null::uuid as id,null::uuid as office_id,null::text as name into mandate;
    action_kind:='withdraw'; action_body:='Ditarik oleh pengaju.'; signature_ok:=false; contact_ok:=false; content_ok:=false;
  else
    if not can_review then raise exception using errcode='42501',message='PHYSICAL_MANDATE_REQUIRED'; end if;
    action_kind:=payload->>'decision'; action_body:=btrim(payload->>'body',E' \n\r\t');
    if coalesce(action_kind,'') not in('accept','reject','conflict') or jsonb_typeof(payload->'body') is distinct from 'string'
      or length(action_body) not between 3 and 4000 or jsonb_typeof(payload->'signature_checked') is distinct from 'boolean'
      or jsonb_typeof(payload->'contact_checked') is distinct from 'boolean' or jsonb_typeof(payload->'content_checked') is distinct from 'boolean'
      or coalesce(payload->>'conflict','') not in('none','reported') then raise exception using errcode='22023',message='INVALID_PHYSICAL_REVIEW'; end if;
    if (action_kind='conflict') is distinct from (payload->>'conflict'='reported') then raise exception using errcode='22023',message='CONFLICT_REVIEW_ONLY'; end if;
    signature_ok:=(payload->>'signature_checked')::boolean; contact_ok:=(payload->>'contact_checked')::boolean; content_ok:=(payload->>'content_checked')::boolean;
    if action_kind='conflict' and (signature_ok or contact_ok or content_ok) then raise exception using errcode='22023',message='CONFLICT_REVIEW_ONLY'; end if;
    if action_kind='accept' and not(signature_ok and contact_ok and content_ok) then raise exception using errcode='22023',message='PHYSICAL_CHECKS_REQUIRED'; end if;
  end if;
  if nullif(payload->>'request_id','') is null then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  select * into old_action from public.physical_recommendation_actions where actor_id=actor and request_id=(payload->>'request_id')::uuid;
  if found then
    if old_action.physical_request_id is distinct from p.id or old_action.action is distinct from action_kind or old_action.body is distinct from action_body
      or old_action.signature_checked is distinct from signature_ok or old_action.contact_checked is distinct from contact_ok or old_action.content_checked is distinct from content_ok
      or (operation='review' and old_action.workflow_version is distinct from (payload->>'version')::integer) then
      raise exception using errcode='PT409',message='PHYSICAL_ACTION_CONFLICT';
    end if;
    return jsonb_build_object('id',p.id);
  end if;
  if p.status<>'pending' or s.status<>'waiting_'||p.stage or s.queue_entered_at is distinct from p.queue_entered_at
    or (operation='review' and s.workflow_version is distinct from (payload->>'version')::integer) then
    raise exception using errcode='PT409',message='WORKFLOW_CONFLICT';
  end if;
  if operation='review' then
    if private.simulation_actor_cannot_review(s.id,actor) and action_kind<>'conflict' then raise exception using errcode='42501',message='INDEPENDENT_REVIEWER_REQUIRED'; end if;
    select m.id,m.office_id,o.name into mandate from public.office_mandates m join public.offices o on o.id=m.office_id
      where m.user_id=actor and m.status='active' and m.mandate_type='primary' and o.active and o.kind='kelurahan' and o.territory_id=s.kelurahan_id
        and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp());
    if not found then raise exception using errcode='42501',message='PHYSICAL_MANDATE_REQUIRED'; end if;
  end if;
  insert into public.physical_recommendation_actions(physical_request_id,actor_id,actor_name,office_id,office_name,mandate_id,action,body,
    signature_checked,contact_checked,content_checked,workflow_version,request_id)
    values(p.id,actor,(select display_name from public.profiles where id=actor),case when operation='review' then mandate.office_id end,
      case when operation='review' then mandate.name end,case when operation='review' then mandate.id end,action_kind,action_body,
      signature_ok,contact_ok,content_ok,s.workflow_version,(payload->>'request_id')::uuid);
  if action_kind='conflict' then return jsonb_build_object('id',p.id); end if;
  final_status:=case action_kind when 'accept' then 'accepted' when 'reject' then 'rejected' else 'withdrawn' end;
  update public.physical_recommendation_requests set status=final_status,closed_at=clock_timestamp() where id=p.id;
  if action_kind='accept' then
    if clock_timestamp()<p.eligible_at then raise exception using errcode='22023',message='PHYSICAL_TOO_EARLY'; end if;
    new_status:=case p.stage when 'rt' then 'waiting_rw' else 'waiting_kelurahan' end;
    normalized_checks:=case p.stage when 'rt' then jsonb_build_object('domicile',true,'problem',true)
      else jsonb_build_object('feasibility',true,'duplicates',true,'budget',true) end;
    insert into public.simulation_review_events(simulation_id,actor_id,actor_name,office_id,office_name,mandate_id,request_id,stage,outcome,body,checks,
      expected_version,from_status,to_status,decision_method,physical_request_id)
      values(s.id,actor,(select display_name from public.profiles where id=actor),mandate.office_id,mandate.name,mandate.id,(payload->>'request_id')::uuid,
        p.stage,'forward',action_body,normalized_checks,s.workflow_version,s.status,new_status,'physical',p.id);
    update public.innovation_simulations set status=new_status,workflow_version=workflow_version+1,
      reached_stage=case p.stage when 'rt' then 2 else 3 end where id=s.id;
  end if;
  return jsonb_build_object('id',p.id);
end;
$$;
revoke all on function private.physical_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function private.physical_workflow(text,jsonb) to authenticated;
create function public.physical_workflow(operation text,payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select private.physical_workflow(operation,payload);$$;
revoke all on function public.physical_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function public.physical_workflow(text,jsonb) to authenticated;

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
      if nullif(payload->>'physical_request_id','') is not null then
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

create or replace function private.attachment_service(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; session uuid; f public.draft_attachments%rowtype; target_draft uuid;
begin
  if coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb->>'role' is distinct from 'service_role'
    or jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='42501',message='SERVICE_REQUIRED'; end if;
  actor:=(payload->>'actor_id')::uuid; session:=(payload->>'session_id')::uuid;
  if not private.attachment_actor_live(actor,session) then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  select draft_id into target_draft from public.draft_attachments where id=(payload->>'id')::uuid and owner_id=actor;
  if not found then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
  perform 1 from public.innovation_drafts where id=target_draft and owner_id=actor for update;
  if not found then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
  select * into f from public.draft_attachments where id=(payload->>'id')::uuid and owner_id=actor for update;
  if not found or not private.attachment_actor_live(actor,session) then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if operation='complete' then
    if f.removed_at is not null or not private.attachment_draft_is_demo(f.draft_id) then raise exception using errcode='22023',message='ATTACHMENT_ARCHIVED'; end if;
    if f.storage_state='ready' then return jsonb_build_object('id',f.id); end if;
    if f.purpose<>'supporting' and not exists(select 1 from public.innovation_simulations s
      where s.id=f.physical_simulation_id and s.owner_id=actor and s.draft_id=f.draft_id and s.mode='demo'
        and s.queue_entered_at=f.physical_queue_entered_at and s.status='waiting_'||substring(f.purpose from 10)) then
      raise exception using errcode='22023',message='PHYSICAL_UPLOAD_NOT_AVAILABLE';
    end if;
    if not exists(select 1 from storage.objects o where o.bucket_id='kampunglab-private-demo' and o.name=f.object_path
      and coalesce(o.metadata->>'size',o.metadata->>'contentLength','0')::bigint=f.byte_size
      and o.metadata->>'mimetype'=f.mime_type and o.user_metadata->>'sha256'=f.sha256) then
      raise exception using errcode='22023',message='UPLOAD_NOT_CONFIRMED';
    end if;
    update public.draft_attachments set storage_state='ready' where id=f.id;
    if f.purpose='supporting' then update public.innovation_drafts set attachment_revision=attachment_revision+1 where id=f.draft_id; end if;
    insert into private.simulation_audit(actor_id,entity,entity_id,action) values(actor,'draft_attachments',f.id,'validated_upload');
  else raise exception using errcode='22023',message='INVALID_OPERATION'; end if;
  return jsonb_build_object('id',f.id);
end;
$$;

create or replace function private.snapshot_simulation_attachments() returns trigger
language plpgsql security definer set search_path='' as $$
declare d public.innovation_drafts%rowtype;
begin
  select * into d from public.innovation_drafts where id=new.draft_id for update;
  if not found or d.owner_id is distinct from new.owner_id or d.attachment_revision is distinct from new.attachment_revision then
    raise exception using errcode='PT409',message='ATTACHMENT_CONFLICT';
  end if;
  if exists(select 1 from public.draft_attachments where draft_id=d.id and removed_at is null and storage_state='pending' and purpose='supporting') then
    raise exception using errcode='22023',message='ATTACHMENTS_PENDING';
  end if;
  insert into public.simulation_attachment_links(simulation_id,attachment_id)
    select new.id,id from public.draft_attachments where draft_id=d.id and removed_at is null and storage_state='ready' and purpose='supporting';
  return null;
end;
$$;

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
  normalized_path text; evaluation_ack boolean:=false;
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
      if (draft_row.revision<=previous_sim.draft_revision and draft_row.attachment_revision<=previous_sim.attachment_revision)
        or (draft_row.document=previous_sim.document and not exists(
          (select id from public.draft_attachments where draft_id=draft_row.id and removed_at is null and storage_state='ready' and purpose='supporting')
          except (select attachment_id from public.simulation_attachment_links where simulation_id=previous_sim.id)) and not exists(
          (select attachment_id from public.simulation_attachment_links where simulation_id=previous_sim.id)
          except (select id from public.draft_attachments where draft_id=draft_row.id and removed_at is null and storage_state='ready' and purpose='supporting'))) then raise exception using errcode='22023',message='REVISION_REQUIRED'; end if;
    end if;
    if (payload->>'revision')::integer is distinct from draft_row.revision then raise exception using errcode='PT409',message='DRAFT_CONFLICT'; end if;
    if coalesce((payload->>'attachment_revision')::integer,0) is distinct from draft_row.attachment_revision then raise exception using errcode='PT409',message='ATTACHMENT_CONFLICT'; end if;
    if not private.simulation_document_ready(draft_row.document) then raise exception using errcode='22023',message='INCOMPLETE_DRAFT'; end if;
    if not exists(select 1 from public.innovation_themes where id=draft_row.theme_id and active and is_demo) then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into rt from public.territories where id=draft_row.territory_rt_id and kind='rt' and code like 'DEMO%';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into rw from public.territories where id=rt.parent_id and kind='rw' and code like 'DEMO%';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into kel from public.territories where id=rw.parent_id and kind='kelurahan' and code like 'DEMO%';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
    insert into public.innovation_simulations(draft_id,owner_id,draft_revision,document,rt_id,rw_id,kelurahan_id,attempt,previous_simulation_id,attachment_revision)
      values(draft_row.id,actor,draft_row.revision,draft_row.document,rt.id,rw.id,kel.id,coalesce(previous_sim.attempt,0)+1,previous_sim.id,draft_row.attachment_revision) returning * into sim;
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
  if current_stage in('rt','rw','kelurahan') and sim.owner_id<>actor and territory in(select private.simulation_viewer_territories(current_stage)) then
    action_stage:=current_stage;
    blocked:=private.simulation_actor_cannot_review(sim.id,actor);
  end if;

  if operation='details' then
    if current_stage is not null then
      select exists(select 1 from public.office_mandates m join public.offices o on o.id=m.office_id join auth.users u on u.id=m.user_id
        where o.territory_id=territory and o.kind=current_stage and o.active and m.mandate_type='primary' and m.status='active'
          and m.user_id<>sim.owner_id and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp())
          and u.deleted_at is null and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=clock_timestamp())
          and not private.simulation_actor_cannot_review(sim.id,m.user_id)) into route_ready;
    end if;
    select s.id into next_id from public.innovation_simulations s where s.previous_simulation_id=sim.id
      and private.simulation_can_access(s.owner_id,s.rt_id,s.rw_id,s.kelurahan_id,s.reached_stage);
    return jsonb_build_object('simulation',to_jsonb(sim),'is_owner',sim.owner_id=actor,'can_note',can_note,
      'action_stage',action_stage,'decision_blocked',blocked,'route_ready',route_ready,'next_id',next_id,
      'notes',(select coalesce(jsonb_agg(to_jsonb(n)),'[]') from
        (select id,actor_name,office_name,body,domicile_checked,problem_checked,family_conflict,created_at
          from public.simulation_rt_notes where simulation_id=sim.id order by created_at,id) n),
      'events',(select coalesce(jsonb_agg(to_jsonb(e)),'[]') from
        (select id,actor_name,office_name,stage,outcome,body,checks,evaluation_path,evaluation_acknowledged,from_status,to_status,created_at,decision_method,physical_request_id
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
    if sim.owner_id=actor or coalesce(payload->>'stage','') not in('rt','rw','kelurahan') then raise exception using errcode='42501',message='REVIEW_MANDATE_REQUIRED'; end if;
    territory:=case payload->>'stage' when 'rt' then sim.rt_id when 'rw' then sim.rw_id else sim.kelurahan_id end;
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
    foreach field_name in array case payload->>'stage' when 'rt' then array['domicile','problem']
      when 'rw' then array['feasibility','duplicates','budget'] else array['recommendations','completeness'] end loop
      if jsonb_typeof(payload->'checks'->field_name) is distinct from 'boolean' then raise exception using errcode='22023',message='INVALID_REVIEW'; end if;
      if outcome='forward' and payload->'checks'->field_name is distinct from 'true'::jsonb then raise exception using errcode='22023',message='REVIEW_CHECKS_REQUIRED'; end if;
      normalized_checks:=normalized_checks||jsonb_build_object(field_name,case when outcome='conflict' then false else (payload->'checks'->>field_name)::boolean end);
    end loop;
    if payload->>'stage'='kelurahan' and outcome='forward' then
      if coalesce(payload->>'evaluation_path','') not in('demo_micro','demo_small')
        or payload->'evaluation_acknowledged' is distinct from 'true'::jsonb then
        raise exception using errcode='22023',message='EVALUATION_PATH_REQUIRED';
      end if;
      normalized_path:=payload->>'evaluation_path'; evaluation_ack:=true;
    end if;
    -- Exact retry may return an earlier success after the queue has moved. Never retry changed content silently.
    select * into replay from public.simulation_review_events where simulation_id=sim.id and actor_id=actor and request_id=(payload->>'request_id')::uuid;
    if found then
      if replay.stage is distinct from payload->>'stage' or replay.outcome is distinct from outcome
        or replay.body is distinct from btrim(payload->>'body') or replay.checks is distinct from normalized_checks
        or replay.expected_version is distinct from (payload->>'version')::integer
        or replay.evaluation_path is distinct from normalized_path
        or replay.evaluation_acknowledged is distinct from evaluation_ack then
        raise exception using errcode='PT409',message='REVIEW_REQUEST_CONFLICT';
      end if;
      return jsonb_build_object('id',replay.id);
    end if;
    if action_stage is distinct from payload->>'stage' or (payload->>'version')::integer is distinct from sim.workflow_version then raise exception using errcode='PT409',message='WORKFLOW_CONFLICT'; end if;
    if blocked and outcome<>'conflict' then raise exception using errcode='42501',message='INDEPENDENT_REVIEWER_REQUIRED'; end if;
    if current_stage='kelurahan' and not (
      exists(select 1 from public.simulation_review_events e where e.simulation_id=sim.id and e.stage='rt' and e.outcome='forward')
      and exists(select 1 from public.simulation_review_events e where e.simulation_id=sim.id and e.stage='rw' and e.outcome='forward')) then
      raise exception using errcode='22023',message='PREVIOUS_RECOMMENDATIONS_REQUIRED';
    end if;
    next_status:=case outcome when 'forward' then case current_stage when 'rt' then 'waiting_rw'
      when 'rw' then 'waiting_kelurahan' else 'waiting_evaluation' end
      when 'revise' then 'revision_requested' when 'reject' then 'rejected' else sim.status end;
    insert into public.simulation_review_events(simulation_id,actor_id,actor_name,office_id,office_name,mandate_id,request_id,
      stage,outcome,body,checks,expected_version,from_status,to_status,evaluation_path,evaluation_acknowledged)
    values(sim.id,actor,(select display_name from public.profiles where id=actor),mandate.office_id,mandate.name,mandate.id,
      (payload->>'request_id')::uuid,current_stage,outcome,btrim(payload->>'body'),normalized_checks,sim.workflow_version,sim.status,next_status,normalized_path,evaluation_ack)
      returning id into event_id;
    update public.innovation_simulations set status=next_status,workflow_version=workflow_version+1,evaluation_path=normalized_path,
      reached_stage=case when next_status='waiting_rw' then 2 when next_status='waiting_kelurahan' then 3 else reached_stage end where id=sim.id;
    return jsonb_build_object('id',event_id);
  end if;
  raise exception using errcode='22023',message='INVALID_OPERATION';
end;
$$;
