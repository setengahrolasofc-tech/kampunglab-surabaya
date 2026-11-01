-- Read-only administration audit viewer. Proposal/score/evidence audit tables are excluded.
create index admin_identity_audit_timeline on private.identity_audit_events(occurred_at desc,id desc)
  where entity in('public.office_mandates','public.platform_role_grants','public.territories','public.offices');
create index admin_workflow_audit_timeline on private.simulation_audit(occurred_at desc,id desc)
  where entity in('physical_route_settings','simulation_panel_cases','simulation_panel_assignments','simulation_panel_events');

create function private.admin_audit_snapshot(input jsonb) returns jsonb
language sql immutable security invoker set search_path='' as $$
  select coalesce(jsonb_object_agg(key,value),'{}'::jsonb)
  from jsonb_each(case when jsonb_typeof(input)='object' then input else '{}'::jsonb end)
  where key in('user_id','office_id','role','mandate_type','starts_at','ends_at','status','granted_by',
    'revoked_at','kind','code','name','parent_id','territory_id','active')
    and jsonb_typeof(value) in('string','number','boolean','null');
$$;
revoke all on function private.admin_audit_snapshot(jsonb) from public,anon,authenticated;

create function private.admin_audit_log(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  module_filter text; action_filter text; actor_filter uuid; from_date date; to_date date;
  cursor_time timestamptz; cursor_source text; cursor_id uuid;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if not private.has_program_admin() then raise exception using errcode='42501',message='ADMIN_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='INVALID_FILTER'; end if;
  module_filter:=coalesce(nullif(payload->>'module',''),'all');
  action_filter:=coalesce(nullif(payload->>'action',''),'all');
  actor_filter:=nullif(payload->>'actor_id','')::uuid;
  if module_filter not in('all','access','master','physical','panel') or action_filter not in('all','insert','update','delete') then
    raise exception using errcode='22023',message='INVALID_FILTER';
  end if;
  if nullif(payload->>'from','') is not null then
    if payload->>'from' !~ '^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$' then raise exception using errcode='22023',message='INVALID_FILTER'; end if;
    from_date:=(payload->>'from')::date;
  end if;
  if nullif(payload->>'to','') is not null then
    if payload->>'to' !~ '^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$' then raise exception using errcode='22023',message='INVALID_FILTER'; end if;
    to_date:=(payload->>'to')::date;
  end if;
  if from_date>to_date then raise exception using errcode='22023',message='INVALID_FILTER'; end if;
  if payload ? 'cursor' and payload->'cursor' <> 'null'::jsonb then
    if jsonb_typeof(payload->'cursor') is distinct from 'object' then raise exception using errcode='22023',message='INVALID_FILTER'; end if;
    cursor_time:=(payload#>>'{cursor,occurred_at}')::timestamptz;
    cursor_source:=payload#>>'{cursor,source}'; cursor_id:=(payload#>>'{cursor,id}')::uuid;
    if cursor_time is null or not isfinite(cursor_time) or cursor_source is null or cursor_source not in('identity','workflow') or cursor_id is null then
      raise exception using errcode='22023',message='INVALID_FILTER';
    end if;
  end if;
  return (
    with candidates as (
      select 'identity'::text as source,a.id,a.occurred_at,a.actor_user_id as actor_id,a.actor_database_role,
        case when a.entity in('public.office_mandates','public.platform_role_grants') then 'access' else 'master' end as module,
        a.entity,a.entity_id,a.action,
        private.admin_audit_snapshot(a.details->'before') as before_data,
        private.admin_audit_snapshot(a.details->'after') as after_data,
        coalesce(jsonb_typeof(a.details->'before')='object' and jsonb_typeof(a.details->'after')='object',false) as has_snapshot
      from private.identity_audit_events a
      where a.entity in('public.office_mandates','public.platform_role_grants','public.territories','public.offices')
      union all
      select 'workflow',a.id,a.occurred_at,a.actor_id,a.actor_database_role,
        case when a.entity='physical_route_settings' then 'physical' else 'panel' end,
        'public.'||a.entity,a.entity_id,a.action,'{}'::jsonb,'{}'::jsonb,false
      from private.simulation_audit a
      where a.entity in('physical_route_settings','simulation_panel_cases','simulation_panel_assignments','simulation_panel_events')
    ), limited as materialized (
      select * from candidates a
      where (module_filter='all' or a.module=module_filter)
        and (action_filter='all' or a.action=action_filter)
        and (actor_filter is null or a.actor_id=actor_filter)
        and (from_date is null or a.occurred_at >= (from_date::timestamp at time zone 'Asia/Jakarta'))
        and (to_date is null or a.occurred_at < ((to_date+1)::timestamp at time zone 'Asia/Jakarta'))
        and (cursor_time is null or (a.occurred_at,a.source,a.id)<(cursor_time,cursor_source,cursor_id))
      order by a.occurred_at desc,a.source desc,a.id desc limit 21
    ), page_rows as materialized (
      select * from limited order by occurred_at desc,source desc,id desc limit 20
    )
    select jsonb_build_object('generated_at',statement_timestamp(),
      'rows',(select coalesce(jsonb_agg(to_jsonb(q) order by q.occurred_at desc,q.source desc,q.id desc),'[]') from
        (select a.*,p.display_name as actor_name from page_rows a left join public.profiles p on p.id=a.actor_id) q),
      'next_cursor',case when (select count(*) from limited)>20 then
        (select jsonb_build_object('source',source,'id',id,'occurred_at',occurred_at) from page_rows order by occurred_at,source,id limit 1)
        else null end)
  );
end;
$$;
revoke all on function private.admin_audit_log(jsonb) from public,anon,authenticated;
grant execute on function private.admin_audit_log(jsonb) to authenticated;
create function public.admin_audit_log(payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select private.admin_audit_log(payload);$$;
revoke all on function public.admin_audit_log(jsonb) from public,anon,authenticated;
grant execute on function public.admin_audit_log(jsonb) to authenticated;
