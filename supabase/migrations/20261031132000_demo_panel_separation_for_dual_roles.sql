do $$ begin
  if (select md5(prosrc) from pg_proc where oid='private.panel_workflow(text,jsonb)'::regprocedure) is distinct from '9f1e7425e5ab53045d9a170786758a67'
  then raise exception 'PANEL_WORKFLOW_BASE_CHANGED'; end if;
end $$;

create or replace function private.panel_workflow(operation text,payload jsonb) returns jsonb
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
  -- Case-specific reviewer duties remain blind even when the account also holds a kelurahan mandate.
  if operation='details' and not is_owner and exists(select 1 from public.simulation_panel_assignments
    where case_id=c.id and reviewer_id=actor) then raise exception using errcode='42501',message='PANEL_REVIEWER_VIEW_ONLY'; end if;

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
