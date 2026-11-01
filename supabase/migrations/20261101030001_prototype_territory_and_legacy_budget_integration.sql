-- Integrate configured territories with DEMO submissions and preserve legacy RAB line items.
-- Does not enable operational submissions, widen document readers, or change mandate/RLS rules.
do $$ begin
  if (select md5(regexp_replace(prosrc,'[[:space:]]','','g')) from pg_proc where oid='private.simulation_workflow(text,jsonb)'::regprocedure) is distinct from 'f099bc3a2e327cf6e163215bbce08584'
    or (select md5(regexp_replace(prosrc,'[[:space:]]','','g')) from pg_proc where oid='private.attachment_draft_is_demo(uuid)'::regprocedure) is distinct from '9d47cd69e3d8fe16b5dcda7ede1714a3'
    or (select md5(regexp_replace(prosrc,'[[:space:]]','','g')) from pg_proc where oid='private.write_innovation_draft(text,jsonb)'::regprocedure) is distinct from 'a49310d8a363ba34ce8cbb5db3ef486b'
    or (select md5(regexp_replace(prosrc,'[[:space:]]','','g')) from pg_proc where oid='private.simulation_document_ready(jsonb)'::regprocedure) is distinct from '0a28fe0cc3c8aa41f06ae4f64053fec1'
  then raise exception 'PROTOTYPE_INTEGRATION_BASE_CHANGED'; end if;
end $$;

create function private.demo_territory_hierarchy_valid(target_rt uuid) returns boolean
language sql security definer set search_path='' as $$
  select exists(select 1 from public.territories rt join public.territories rw on rw.id=rt.parent_id and rw.kind='rw'
    join public.territories kel on kel.id=rw.parent_id and kel.kind='kelurahan' and kel.parent_id is null
    where rt.id=target_rt and rt.kind='rt');
$$;
revoke all on function private.demo_territory_hierarchy_valid(uuid) from public,anon,authenticated;

create or replace function private.attachment_draft_is_demo(draft uuid) returns boolean
language sql security definer set search_path='' as $$
  select exists(select 1 from public.innovation_drafts d join public.innovation_themes t on t.id=d.theme_id and t.active and t.is_demo
    where d.id=draft and private.demo_territory_hierarchy_valid(d.territory_rt_id));
$$;

create function private.demo_document_manifest_ready(draft uuid,owner uuid,doc jsonb) returns boolean
language sql security definer set search_path='' as $$
  select count(distinct f.id)=3 from jsonb_each(doc->'documents') slot
    join public.draft_attachments f on f.id=(slot.value->>'attachment_id')::uuid
      and f.draft_id=draft and f.owner_id=owner and f.purpose='supporting' and f.storage_state='ready' and f.removed_at is null
    where slot.key in('prd','rab','declaration');
$$;
revoke all on function private.demo_document_manifest_ready(uuid,uuid,jsonb) from public,anon,authenticated;

create or replace function private.simulation_document_ready(doc jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare key_name text; item jsonb; subtotal_value numeric:=0;
begin
  if not private.valid_innovation_draft(doc) then return false; end if;
  foreach key_name in array array['title','theme_id','form','rt_id','summary'] loop
    if length(btrim(coalesce(doc->'innovation'->>key_name,'')))=0 then return false; end if;
  end loop;
  if jsonb_array_length(doc#>'{innovation,team}')=0 then return false; end if;
  for item in select value from jsonb_array_elements(doc#>'{innovation,team}') loop
    if length(btrim(coalesce(item->>'name','')))=0 or length(btrim(coalesce(item->>'role','')))=0 then return false; end if;
  end loop;
  if jsonb_array_length(doc#>'{budget,items}')>0 then
    for item in select value from jsonb_array_elements(doc#>'{budget,items}') loop
      foreach key_name in array array['description','category','unit','usage_stage'] loop
        if length(btrim(coalesce(item->>key_name,'')))=0 then return false; end if;
      end loop;
      if coalesce(nullif(item->>'quantity','')::numeric,0)<=0 or coalesce(nullif(item->>'unit_price','')::numeric,0)<=0 then return false; end if;
      subtotal_value:=subtotal_value+(item->>'quantity')::numeric*(item->>'unit_price')::numeric;
    end loop;
  else subtotal_value:=coalesce(nullif(doc#>>'{budget,subtotal}','')::numeric,0); end if;
  if coalesce(doc#>>'{budget,maintenance_months}','')='' or subtotal_value<=0 then return false; end if;
  foreach key_name in array array['prd','rab','declaration'] loop
    if doc#>>array['documents',key_name,'attachment_id'] is null
      or coalesce(doc#>>array['documents',key_name,'check','status'],'perlu_perbaikan')='perlu_perbaikan'
      or coalesce(doc#>>array['documents',key_name,'check','checked_title'],'') is distinct from btrim(doc#>>'{innovation,title}') then return false; end if;
  end loop;
  return coalesce((doc#>>'{declaration,own_work}')::boolean,false);
end;
$$;

create or replace function private.write_innovation_draft(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); rt uuid; doc jsonb; result public.innovation_drafts%rowtype; theme uuid; previous_document jsonb;
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
    perform pg_advisory_xact_lock(hashtextextended('innovation_draft_limit:'||actor::text,0));
    if (select count(*) from public.innovation_drafts where owner_id=actor)>=3 then raise exception using errcode='22023',message='DRAFT_LIMIT'; end if;
    doc:=jsonb_build_object('innovation',jsonb_build_object('title','','theme_id','','form','','rt_id',rt,'summary','','team','[]'::jsonb),
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
    -- Guard old tabs/clients that silently discard existing RAB line items.
    select document into previous_document from public.innovation_drafts
      where id=(payload->>'id')::uuid and owner_id=actor and status='draft' and revision=(payload->>'revision')::integer for update;
    if found and jsonb_array_length(previous_document#>'{budget,items}')>0 and jsonb_array_length(doc#>'{budget,items}')=0 then
      raise exception using errcode='PT409',message='BUDGET_DETAILS_REQUIRED';
    end if;
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
    if not private.demo_territory_hierarchy_valid(draft_row.territory_rt_id) then raise exception using errcode='22023',message='INVALID_TERRITORY'; end if;
    if not private.demo_document_manifest_ready(draft_row.id,actor,draft_row.document) then raise exception using errcode='22023',message='DOCUMENT_FILE_MISSING'; end if;
    select * into rt from public.territories where id=draft_row.territory_rt_id and kind='rt';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into rw from public.territories where id=rt.parent_id and kind='rw';
    if not found then raise exception using errcode='22023',message='DEMO_ONLY'; end if;
    select * into kel from public.territories where id=rw.parent_id and kind='kelurahan';
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
