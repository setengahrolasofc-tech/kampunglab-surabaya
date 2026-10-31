-- Preserve maintenance attribution and reject changed-body request replay.
create or replace function private.audit_simulation_insert() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into private.simulation_audit(actor_id,entity,entity_id,action)
  values(auth.uid(),tg_table_name,case when tg_op='DELETE' then old.id else new.id end,lower(tg_op));
  return null;
end;
$$;
create trigger audit_simulation_mutation after update or delete on public.innovation_simulations for each row execute function private.audit_simulation_insert();
create trigger audit_rt_note_mutation after update or delete on public.simulation_rt_notes for each row execute function private.audit_simulation_insert();
create or replace function private.simulation_workflow(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid(); draft_row public.innovation_drafts%rowtype; sim public.innovation_simulations%rowtype;
  rt public.territories%rowtype; rw public.territories%rowtype; kel public.territories%rowtype;
  mandate record; existing_note public.simulation_rt_notes%rowtype; note_id uuid; can_note boolean; route_ready boolean;
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
    if not private.simulation_can_read(sim.owner_id,sim.rt_id) then raise exception using errcode='22023',message='SIMULATION_UNAVAILABLE'; end if;
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
    select * into existing_note from public.simulation_rt_notes where id=note_id;
    if existing_note.body is distinct from btrim(payload->>'body')
      or existing_note.family_conflict is distinct from (payload->>'family_conflict')::boolean
      or existing_note.domicile_checked is distinct from (payload->>'domicile_checked')::boolean
      or existing_note.problem_checked is distinct from (payload->>'problem_checked')::boolean then
      raise exception using errcode='PT409',message='NOTE_REQUEST_CONFLICT';
    end if;
    return jsonb_build_object('id',note_id);
  end if;
  raise exception using errcode='22023',message='INVALID_OPERATION';
end;
$$;
