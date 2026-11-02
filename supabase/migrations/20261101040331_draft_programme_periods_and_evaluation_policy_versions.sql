-- FR-19: draft-only programme/period/evaluation proposals. No runtime policy consumer or activation.
create function private.valid_program_proposal(doc jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare key text; value_number numeric; period_start date; period_end date; raw_date text;
  allowed text[]:=array['schema_version','code','name','summary','period_start','period_end','micro_evaluator','aggregation','minimum_score','minimum_agree','require_three','agree_requires_minimum'];
begin
  if jsonb_typeof(doc) is distinct from 'object' then return false; end if;
  if not(doc ?& allowed) or doc-allowed<>'{}'::jsonb then return false; end if;
  foreach key in array array['schema_version','code','name','summary','micro_evaluator'] loop
    if jsonb_typeof(doc->key) is distinct from 'string' or translate(doc->>key,E'\n\r\t','') ~ '[[:cntrl:]]' then return false; end if;
  end loop;
  if doc->>'schema_version'<>'program-proposal-v1' or doc->>'code' !~ '^[A-Z0-9][A-Z0-9_-]{2,47}$'
    or length(btrim(doc->>'name',E' \n\r\t')) not between 3 and 160 or length(doc->>'summary')>2000 or length(doc->>'micro_evaluator')>1000 then return false; end if;
  foreach key in array array['period_start','period_end'] loop
    if jsonb_typeof(doc->key)='null' then continue; end if;
    if jsonb_typeof(doc->key) is distinct from 'string' then return false; end if;
    raw_date:=doc->>key;
    if raw_date !~ '^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$' then return false; end if;
    if key='period_start' then period_start:=make_date(substring(raw_date,1,4)::integer,substring(raw_date,6,2)::integer,substring(raw_date,9,2)::integer);
    else period_end:=make_date(substring(raw_date,1,4)::integer,substring(raw_date,6,2)::integer,substring(raw_date,9,2)::integer); end if;
  end loop;
  if period_start>period_end then return false; end if;
  if jsonb_typeof(doc->'aggregation')<>'null' and (jsonb_typeof(doc->'aggregation')<>'string' or doc->>'aggregation' not in('mean','median','consensus')) then return false; end if;
  foreach key in array array['minimum_score','minimum_agree'] loop
    if jsonb_typeof(doc->key)='null' then continue; end if;
    if jsonb_typeof(doc->key) is distinct from 'number' then return false; end if;
    value_number:=(doc->>key)::numeric;
    if value_number<>trunc(value_number) or (key='minimum_score' and value_number not between 0 and 100)
      or (key='minimum_agree' and value_number not between 1 and 3) then return false; end if;
  end loop;
  foreach key in array array['require_three','agree_requires_minimum'] loop
    if jsonb_typeof(doc->key) not in('boolean','null') then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;
revoke all on function private.valid_program_proposal(jsonb) from public,anon,authenticated;

create table public.program_drafts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check(code ~ '^[A-Z0-9][A-Z0-9_-]{2,47}$'),
  state text not null default 'draft' check(state='draft'),
  version integer not null check(version>=1),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);
create index program_drafts_creator_fk on public.program_drafts(created_by);
create index program_drafts_updated on public.program_drafts(updated_at desc,id desc);
create table public.program_draft_versions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.program_drafts(id),
  version integer not null check(version>=1),
  expected_version integer not null check(expected_version>=0 and version=expected_version+1),
  operation text not null check(operation in('create','revise')),
  document jsonb not null check(private.valid_program_proposal(document)),
  reason text not null check(length(btrim(reason,E' \n\r\t')) between 3 and 1000 and translate(reason,E'\n\r\t','') !~ '[[:cntrl:]]'),
  actor_id uuid not null references public.profiles(id),
  actor_name text not null,
  request_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(program_id,version),unique(actor_id,request_id),
  check((operation='create')=(version=1))
);
create index program_draft_versions_actor_fk on public.program_draft_versions(actor_id);
alter table public.program_drafts add constraint program_draft_current_version
  foreign key(id,version) references public.program_draft_versions(program_id,version) deferrable initially deferred;
alter table public.program_drafts enable row level security;
alter table public.program_draft_versions enable row level security;
revoke all on public.program_drafts,public.program_draft_versions from public,anon,authenticated;
create policy program_drafts_deny on public.program_drafts for all to anon,authenticated using(false) with check(false);
create policy program_draft_versions_deny on public.program_draft_versions for all to anon,authenticated using(false) with check(false);
create trigger audit_program_drafts after insert or update or delete on public.program_drafts for each row execute function private.audit_simulation_insert();
create trigger audit_program_draft_versions after insert or update or delete on public.program_draft_versions for each row execute function private.audit_simulation_insert();

create function private.program_draft_workflow(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); actor_label text; page_number integer; selected_version integer;
  root public.program_drafts%rowtype; previous public.program_draft_versions%rowtype;
  doc jsonb; explanation text; nonce uuid; expected integer; result jsonb;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if not private.has_program_admin() then raise exception using errcode='42501',message='ADMIN_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation in('list','details') then
    page_number:=coalesce((payload->>'page')::integer,0);
    if page_number not between 0 and 9999 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    if operation='list' then
      return jsonb_build_object('count',(select count(*) from public.program_drafts),
        'rows',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
          (select r.id,r.code,r.state,r.version,r.updated_at,v.document->>'name' as name,v.document->>'period_start' as period_start,v.document->>'period_end' as period_end
            from public.program_drafts r join public.program_draft_versions v on v.program_id=r.id and v.version=r.version
            order by r.updated_at desc,r.id desc limit 20 offset page_number*20) q));
    end if;
    selected_version:=(payload->>'selected_version')::integer;
    if selected_version is not null and selected_version<1 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    select jsonb_build_object('program',to_jsonb(r),'current',to_jsonb(c),'selected',to_jsonb(v),'history_count',r.version,
      'history',(select coalesce(jsonb_agg(to_jsonb(h)),'[]') from
        (select version,actor_id,actor_name,reason,created_at from public.program_draft_versions where program_id=r.id
          and version<=r.version order by version desc limit 20 offset page_number*20) h)) into result
    from public.program_drafts r join public.program_draft_versions c on c.program_id=r.id and c.version=r.version
      join public.program_draft_versions v on v.program_id=r.id and v.version=coalesce(selected_version,r.version) and v.version<=r.version
    where r.id=(payload->>'id')::uuid;
    if result is null then raise exception using errcode='22023',message='PROGRAM_DRAFT_UNAVAILABLE'; end if;
    return result;
  end if;
  if operation is null or operation not in('create','revise') then raise exception using errcode='22023',message='INVALID_OPERATION'; end if;
  perform pg_advisory_xact_lock(184701,1);
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if not private.has_program_admin() then raise exception using errcode='42501',message='ADMIN_REQUIRED'; end if;
  doc:=payload->'document'; explanation:=btrim(payload->>'reason',E' \n\r\t'); nonce:=(payload->>'request_id')::uuid; expected:=(payload->>'version')::integer;
  if not private.valid_program_proposal(doc) or nonce is null or expected is null or expected<0
    or explanation is null or length(explanation) not between 3 and 1000 or translate(explanation,E'\n\r\t','') ~ '[[:cntrl:]]' then
    raise exception using errcode='22023',message='INVALID_PROGRAM_PROPOSAL';
  end if;
  doc:=doc||jsonb_build_object('name',btrim(doc->>'name',E' \n\r\t'),'summary',btrim(doc->>'summary',E' \n\r\t'),'micro_evaluator',btrim(doc->>'micro_evaluator',E' \n\r\t'));
  if (operation='create' and expected<>0) or (operation='revise' and (expected<1 or nullif(payload->>'id','') is null)) then
    raise exception using errcode='22023',message='INVALID_INPUT';
  end if;
  select * into previous from public.program_draft_versions where actor_id=actor and request_id=nonce;
  if found then
    if previous.operation is distinct from operation or previous.document is distinct from doc or previous.reason is distinct from explanation
      or previous.expected_version is distinct from expected or (operation='revise' and previous.program_id is distinct from (payload->>'id')::uuid) then
      raise exception using errcode='PT409',message='PROGRAM_REQUEST_CONFLICT';
    end if;
    return jsonb_build_object('id',previous.program_id,'version',previous.version,'replayed',true);
  end if;
  if operation='create' then
    if exists(select 1 from public.program_drafts where code=doc->>'code') then raise exception using errcode='PT409',message='PROGRAM_CODE_EXISTS'; end if;
    insert into public.program_drafts(code,version,created_by) values(doc->>'code',1,actor) returning * into root;
  else
    select * into root from public.program_drafts where id=(payload->>'id')::uuid for update;
    if not found then raise exception using errcode='22023',message='PROGRAM_DRAFT_UNAVAILABLE'; end if;
    if root.version<>expected then raise exception using errcode='PT409',message='PROGRAM_VERSION_CONFLICT'; end if;
    if root.code<>doc->>'code' then raise exception using errcode='22023',message='PROGRAM_CODE_IMMUTABLE'; end if;
    if exists(select 1 from public.program_draft_versions where program_id=root.id and version=root.version and document=doc) then
      raise exception using errcode='22023',message='NO_PROGRAM_CHANGE';
    end if;
  end if;
  select coalesce(nullif(btrim(display_name),''),'Akun tanpa nama tampilan') into actor_label from public.profiles where id=actor;
  insert into public.program_draft_versions(program_id,version,expected_version,operation,document,reason,actor_id,actor_name,request_id)
    values(root.id,expected+1,expected,operation,doc,explanation,actor,actor_label,nonce);
  if operation='revise' then update public.program_drafts set version=expected+1,updated_at=clock_timestamp() where id=root.id; end if;
  return jsonb_build_object('id',root.id,'version',expected+1,'replayed',false);
end;
$$;
revoke all on function private.program_draft_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function private.program_draft_workflow(text,jsonb) to authenticated;
create function public.program_draft_workflow(operation text,payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select private.program_draft_workflow(operation,payload);$$;
revoke all on function public.program_draft_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function public.program_draft_workflow(text,jsonb) to authenticated;
