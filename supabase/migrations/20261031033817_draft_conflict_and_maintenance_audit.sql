-- Business conflicts are HTTP 409, not retryable transaction failures.
-- Trusted maintenance keeps a database-role actor without impersonating a user.
alter table private.innovation_draft_audit alter column actor_user_id drop not null;
alter table private.innovation_draft_audit add column actor_database_role text not null default session_user;
create or replace function private.audit_draft_change() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into private.innovation_draft_audit(actor_user_id,actor_database_role,draft_id,action,revision,step)
  values(auth.uid(),session_user,new.id,lower(tg_op),new.revision,new.current_step);
  return null;
end;
$$;
create or replace function private.write_innovation_draft(operation text,payload jsonb) returns jsonb
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
        raise exception using errcode='PT409',message='DRAFT_CONFLICT';
      end if;
      raise exception using errcode='22023',message='DRAFT_UNAVAILABLE';
    end if;
  else raise exception using errcode='22023',message='INVALID_OPERATION'; end if;
  return jsonb_build_object('id',result.id,'revision',result.revision,'updated_at',result.updated_at);
end;
$$;
