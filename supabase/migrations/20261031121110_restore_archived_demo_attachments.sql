-- Restore immutable archived uploads to the owner's DEMO draft; no blob rewrite.
do $$ begin
  if (select md5(prosrc) from pg_proc where oid='private.attachment_workflow(text,jsonb)'::regprocedure)
    is distinct from 'e7e5e525cd1cb754ddb026ea7ebb94e5' then raise exception 'ATTACHMENT_WORKFLOW_BASE_CHANGED'; end if;
end $$;
create or replace function private.attachment_workflow(operation text,payload jsonb) returns jsonb
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
    update public.innovation_drafts set attachment_revision=attachment_revision+1 where id=d.id;
    return jsonb_build_object('id',f.id);
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
