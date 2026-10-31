-- Refuse to overwrite a concurrently modified workflow.
do $$ begin
  if (select md5(prosrc) from pg_proc where oid='private.simulation_workflow(text,jsonb)'::regprocedure)
    is distinct from 'def31d9d442184346f9fd17de65298df' then raise exception 'SIMULATION_WORKFLOW_BASE_CHANGED'; end if;
end $$;
-- Private DEMO attachments. Only the authenticated Edge Function handles blob access.
alter table public.innovation_drafts add column attachment_revision integer not null default 0 check(attachment_revision>=0);
alter table public.innovation_simulations add column attachment_revision integer not null default 0 check(attachment_revision>=0);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('kampunglab-private-demo','kampunglab-private-demo',false,3145728,array['application/pdf','image/jpeg','image/png','image/webp']);
-- Future permissive policies must not accidentally open this bucket to app roles.
create policy kampunglab_demo_blobs_locked on storage.objects as restrictive for all to anon,authenticated
using(bucket_id<>'kampunglab-private-demo') with check(bucket_id<>'kampunglab-private-demo');

create table public.draft_attachments (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.innovation_drafts(id),
  owner_id uuid not null references public.profiles(id),
  request_id uuid not null,
  original_name text not null check(length(original_name) between 1 and 160 and original_name !~ '[[:cntrl:]]'
    and position('/' in original_name)=0 and position(chr(92) in original_name)=0),
  mime_type text not null check(mime_type in('application/pdf','image/jpeg','image/png','image/webp')),
  byte_size integer not null check(byte_size between 1 and 3145728),
  sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
  object_path text generated always as(owner_id::text||'/'||id::text||'/blob') stored unique,
  storage_state text not null default 'pending' check(storage_state in('pending','ready')),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(owner_id,request_id)
);
create index draft_attachments_owner_time on public.draft_attachments(owner_id,created_at);
create index draft_attachments_draft_time on public.draft_attachments(draft_id,created_at);
alter table public.draft_attachments enable row level security;
revoke all on public.draft_attachments from public,anon,authenticated;
create policy draft_attachments_deny on public.draft_attachments for all to anon,authenticated using(false) with check(false);

create table public.simulation_attachment_links (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.innovation_simulations(id),
  attachment_id uuid not null references public.draft_attachments(id),
  created_at timestamptz not null default now(),
  unique(simulation_id,attachment_id)
);
create index simulation_attachment_file_fk on public.simulation_attachment_links(attachment_id);
alter table public.simulation_attachment_links enable row level security;
revoke all on public.simulation_attachment_links from public,anon,authenticated;
create policy simulation_attachment_links_deny on public.simulation_attachment_links for all to anon,authenticated using(false) with check(false);
create trigger audit_attachment_changes after insert or update or delete on public.draft_attachments
  for each row execute function private.audit_simulation_insert();
create trigger audit_attachment_links after insert or update or delete on public.simulation_attachment_links
  for each row execute function private.audit_simulation_insert();

create function private.attachment_draft_is_demo(draft uuid) returns boolean
language sql security definer set search_path='' as $$
  select exists(select 1 from public.innovation_drafts d
    join public.innovation_themes t on t.id=d.theme_id and t.active and t.is_demo
    join public.territories rt on rt.id=d.territory_rt_id and rt.kind='rt' and rt.code like 'DEMO%'
    join public.territories rw on rw.id=rt.parent_id and rw.kind='rw' and rw.code like 'DEMO%'
    join public.territories kel on kel.id=rw.parent_id and kel.kind='kelurahan' and kel.code like 'DEMO%'
    where d.id=draft);
$$;
revoke all on function private.attachment_draft_is_demo(uuid) from public,anon,authenticated;

create function private.attachment_actor_live(actor uuid,session uuid) returns boolean
language sql security definer set search_path='' as $$
  select actor is not null and session is not null and exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id
    where u.id=actor and s.id=session and u.email_confirmed_at is not null and u.deleted_at is null
      and (u.banned_until is null or u.banned_until<=clock_timestamp()) and (s.not_after is null or s.not_after>clock_timestamp()));
$$;
revoke all on function private.attachment_actor_live(uuid,uuid) from public,anon,authenticated;

create function private.attachment_workflow(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid(); d public.innovation_drafts%rowtype; f public.draft_attachments%rowtype;
  s public.innovation_simulations%rowtype; target_draft uuid; archive_page integer;
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
        join public.draft_attachments f on f.id=l.attachment_id where l.simulation_id=s.id and f.storage_state='ready'
        order by l.created_at,l.id) a));
  elsif operation='read' then
    select * into f from public.draft_attachments where id=(payload->>'id')::uuid;
    if not found or f.storage_state<>'ready' then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
    if f.owner_id<>actor then
      select s2.* into s from public.innovation_simulations s2 join public.simulation_attachment_links l on l.simulation_id=s2.id
        where s2.id=(payload->>'simulation_id')::uuid and l.attachment_id=f.id;
      if not found or not private.simulation_can_access(s.owner_id,s.rt_id,s.rw_id,s.kelurahan_id,s.reached_stage) then
        raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE';
      end if;
    end if;
    return jsonb_build_object('id',f.id,'original_name',f.original_name,'mime_type',f.mime_type,'byte_size',f.byte_size,'sha256',f.sha256,'object_path',f.object_path);
  end if;

  if operation='reserve' then
    -- Serialize this actor's quotas across multiple drafts.
    perform pg_advisory_xact_lock(hashtextextended(actor::text,184702));
  end if;
  if operation='archive' then
    select draft_id into target_draft from public.draft_attachments where id=(payload->>'id')::uuid and owner_id=actor;
  else target_draft:=(payload->>'draft_id')::uuid; end if;
  if operation in('reserve','archive') then
    select * into d from public.innovation_drafts where id=target_draft and owner_id=actor for update;
  else select * into d from public.innovation_drafts where id=target_draft and owner_id=actor; end if;
  if not found then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
  if operation='archive' and d.id is distinct from (payload->>'draft_id')::uuid then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if operation='list_draft' then
    archive_page:=coalesce((payload->>'page')::integer,0);
    if archive_page not between 0 and 9999 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    return jsonb_build_object('draft',jsonb_build_object('id',d.id,'title',d.title,'attachment_revision',d.attachment_revision),
      'files',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from
        (select id,request_id,original_name,mime_type,byte_size,sha256,storage_state,created_at,removed_at,false as has_snapshots
          from public.draft_attachments where draft_id=d.id and removed_at is null order by created_at,id) a),
      'archived',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from
        (select f.id,f.original_name,f.mime_type,f.byte_size,f.sha256,f.storage_state,f.created_at,f.removed_at,
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
    select * into f from public.draft_attachments where owner_id=actor and request_id=(payload->>'request_id')::uuid;
    if found then
      if f.draft_id is distinct from d.id or f.original_name is distinct from payload->>'name' or f.mime_type is distinct from payload->>'mime_type'
        or f.sha256 is distinct from payload->>'sha256' or f.byte_size is distinct from (payload->>'byte_size')::integer then
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
    insert into public.draft_attachments(draft_id,owner_id,request_id,original_name,mime_type,byte_size,sha256)
      values(d.id,actor,(payload->>'request_id')::uuid,payload->>'name',payload->>'mime_type',(payload->>'byte_size')::integer,payload->>'sha256') returning * into f;
    return to_jsonb(f);
  elsif operation='archive' then
    select * into f from public.draft_attachments where id=(payload->>'id')::uuid and owner_id=actor and draft_id=d.id for update;
    if not found then raise exception using errcode='22023',message='ATTACHMENT_UNAVAILABLE'; end if;
    if f.removed_at is null then
      update public.draft_attachments set removed_at=clock_timestamp() where id=f.id returning * into f;
      update public.innovation_drafts set attachment_revision=attachment_revision+1 where id=d.id;
    end if;
    return jsonb_build_object('id',f.id,'has_snapshots',exists(select 1 from public.simulation_attachment_links where attachment_id=f.id));
  end if;
  raise exception using errcode='22023',message='INVALID_OPERATION';
end;
$$;
revoke all on function private.attachment_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function private.attachment_workflow(text,jsonb) to authenticated;
create function public.attachment_workflow(operation text,payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select private.attachment_workflow(operation,payload);$$;
revoke all on function public.attachment_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function public.attachment_workflow(text,jsonb) to authenticated;

create function private.attachment_service(operation text,payload jsonb) returns jsonb
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
    if not exists(select 1 from storage.objects o where o.bucket_id='kampunglab-private-demo' and o.name=f.object_path
      and coalesce(o.metadata->>'size',o.metadata->>'contentLength','0')::bigint=f.byte_size
      and o.metadata->>'mimetype'=f.mime_type and o.user_metadata->>'sha256'=f.sha256) then
      raise exception using errcode='22023',message='UPLOAD_NOT_CONFIRMED';
    end if;
    update public.draft_attachments set storage_state='ready' where id=f.id;
    update public.innovation_drafts set attachment_revision=attachment_revision+1 where id=f.draft_id;
    insert into private.simulation_audit(actor_id,entity,entity_id,action) values(actor,'draft_attachments',f.id,'validated_upload');
  else raise exception using errcode='22023',message='INVALID_OPERATION'; end if;
  return jsonb_build_object('id',f.id);
end;
$$;
revoke all on function private.attachment_service(text,jsonb) from public,anon,authenticated;
grant execute on function private.attachment_service(text,jsonb) to service_role;
create function public.attachment_service(operation text,payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select private.attachment_service(operation,payload);$$;
revoke all on function public.attachment_service(text,jsonb) from public,anon,authenticated;
grant execute on function public.attachment_service(text,jsonb) to service_role;

create function private.snapshot_simulation_attachments() returns trigger
language plpgsql security definer set search_path='' as $$
declare d public.innovation_drafts%rowtype;
begin
  select * into d from public.innovation_drafts where id=new.draft_id for update;
  if not found or d.owner_id is distinct from new.owner_id or d.attachment_revision is distinct from new.attachment_revision then
    raise exception using errcode='PT409',message='ATTACHMENT_CONFLICT';
  end if;
  if exists(select 1 from public.draft_attachments where draft_id=d.id and removed_at is null and storage_state='pending') then
    raise exception using errcode='22023',message='ATTACHMENTS_PENDING';
  end if;
  insert into public.simulation_attachment_links(simulation_id,attachment_id)
    select new.id,id from public.draft_attachments where draft_id=d.id and removed_at is null and storage_state='ready';
  return null;
end;
$$;
revoke all on function private.snapshot_simulation_attachments() from public,anon,authenticated;
create trigger freeze_simulation_attachments after insert on public.innovation_simulations for each row execute function private.snapshot_simulation_attachments();

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
          (select id from public.draft_attachments where draft_id=draft_row.id and removed_at is null and storage_state='ready')
          except (select attachment_id from public.simulation_attachment_links where simulation_id=previous_sim.id)) and not exists(
          (select attachment_id from public.simulation_attachment_links where simulation_id=previous_sim.id)
          except (select id from public.draft_attachments where draft_id=draft_row.id and removed_at is null and storage_state='ready'))) then raise exception using errcode='22023',message='REVISION_REQUIRED'; end if;
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
        (select id,actor_name,office_name,stage,outcome,body,checks,evaluation_path,evaluation_acknowledged,from_status,to_status,created_at
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
