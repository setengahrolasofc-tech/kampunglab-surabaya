-- Read-only internal DEMO reporting, limited to aggregate metadata.
-- Depends on the identity/review/physical/panel schema from 30-31 October.
create function private.program_monitoring(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  as_of timestamptz := statement_timestamp();
  selected_territory uuid; selected_theme uuid; selected_status text; page_number integer;
begin
  if not private.has_live_identity_session() then
    raise exception using errcode='42501',message='SESSION_REQUIRED';
  end if;
  if not private.has_program_admin() then
    raise exception using errcode='42501',message='ADMIN_REQUIRED';
  end if;
  if operation not in('report','export') or operation is null
    or jsonb_typeof(payload) is distinct from 'object' then
    raise exception using errcode='22023',message='INVALID_INPUT';
  end if;
  selected_territory := nullif(payload->>'kelurahan_id','')::uuid;
  selected_theme := nullif(payload->>'theme_id','')::uuid;
  selected_status := nullif(payload->>'status','');
  page_number := coalesce((payload->>'page')::integer,0);
  if page_number not between 0 and 9999
    or (selected_status is not null and selected_status not in
      ('waiting_rt','waiting_rw','waiting_kelurahan','waiting_evaluation','revision_requested','rejected'))
    or (selected_territory is not null and not exists
      (select 1 from public.territories where id=selected_territory and kind='kelurahan'))
    or (selected_theme is not null and not exists
      (select 1 from public.innovation_themes where id=selected_theme)) then
    raise exception using errcode='22023',message='INVALID_FILTER';
  end if;

  return (
    with base as materialized (
      select s.id,s.draft_id,s.owner_id,s.rt_id,s.rw_id,s.kelurahan_id,s.status,s.attempt,
        s.submitted_at,s.queue_entered_at,s.evaluation_path,s.document#>>'{innovation,theme_id}' as theme_key
      from public.innovation_simulations s
      where s.mode='demo' and private.panel_account_active(s.owner_id)
    ), latest as (
      select distinct on(draft_id) * from base order by draft_id,attempt desc,submitted_at desc,id desc
    ), filtered as materialized (
      select l.*,t.id as theme_id,t.name as theme_name,k.name as territory_name,k.code as territory_code,
        case l.status when 'waiting_rt' then 'rt' when 'waiting_rw' then 'rw'
          when 'waiting_kelurahan' then 'kelurahan' end as stage
      from latest l left join public.innovation_themes t on t.id::text=l.theme_key
        join public.territories k on k.id=l.kelurahan_id and k.kind='kelurahan'
      where (selected_territory is null or l.kelurahan_id=selected_territory)
        and (selected_theme is null or t.id=selected_theme)
        and (selected_status is null or l.status=selected_status)
    ), active_primary as materialized (
      select o.kind,o.territory_id,m.user_id
      from public.office_mandates m join public.offices o on o.id=m.office_id
      where o.active and m.status='active' and m.mandate_type='primary'
        and m.starts_at<=as_of and (m.ends_at is null or m.ends_at>as_of)
        and private.panel_account_active(m.user_id)
    ), enriched as materialized (
      select f.*,(f.stage is not null and not exists (
        select 1 from active_primary p where p.kind=f.stage and p.user_id<>f.owner_id
          and p.territory_id=case f.stage when 'rt' then f.rt_id when 'rw' then f.rw_id else f.kelurahan_id end
          and not private.simulation_actor_cannot_review(f.id,p.user_id)
      )) as needs_primary
      from filtered f
    ), status_groups as (
      select s.status,count(e.id) as count,
        count(e.id) filter(where e.stage is not null and e.queue_entered_at<=as_of-interval '24 hours') as waiting_24h,
        count(e.id) filter(where e.needs_primary) as needs_primary,
        min(e.queue_entered_at) filter(where e.stage is not null) as oldest_queue_at
      from (values('waiting_rt'),('waiting_rw'),('waiting_kelurahan'),('waiting_evaluation'),('revision_requested'),('rejected')) s(status)
        left join enriched e on e.status=s.status group by s.status
    ), theme_groups as (
      select theme_id as id,coalesce(theme_name,'Tema tidak tersedia') as name,count(*) as count,
        count(*) filter(where stage is not null) as waiting,
        count(*) filter(where status='waiting_evaluation') as evaluation,
        count(*) filter(where status='revision_requested') as revision,
        count(*) filter(where status='rejected') as rejected
      from enriched group by theme_id,theme_name
    ), territory_groups as materialized (
      select kelurahan_id as id,territory_code as code,territory_name as name,count(*) as count,
        count(*) filter(where stage is not null) as waiting,
        count(*) filter(where status='waiting_evaluation') as evaluation,
        count(*) filter(where status='revision_requested') as revision,
        count(*) filter(where status='rejected') as rejected
      from enriched group by kelurahan_id,territory_code,territory_name
    )
    select jsonb_build_object(
      'generated_at',as_of,'mode','demo',
      'filters',jsonb_build_object('kelurahan_id',selected_territory,'theme_id',selected_theme,'status',selected_status),
      'options',jsonb_build_object(
        'territories',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
          (select id,name,code from public.territories where kind='kelurahan' order by name,code,id) q),
        'themes',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
          (select id,name,code from public.innovation_themes order by name,code,id) q)),
      'summary',jsonb_build_object(
        'drafts',(select count(*) from enriched),
        'rounds',(select count(*) from base b where exists(select 1 from enriched e where e.draft_id=b.draft_id)),
        'waiting',(select count(*) from enriched where stage is not null),
        'waiting_24h',(select count(*) from enriched where stage is not null and queue_entered_at<=as_of-interval '24 hours'),
        'needs_primary',(select count(*) from enriched where needs_primary),
        'physical_pending',(select count(*) from public.physical_recommendation_requests p join enriched e on e.id=p.simulation_id where p.status='pending'),
        'small_unshared',(select count(*) from enriched e where e.status='waiting_evaluation' and e.evaluation_path='demo_small'
          and not exists(select 1 from public.simulation_panel_cases c where c.simulation_id=e.id)),
        'small_open',(select count(*) from public.simulation_panel_cases c join enriched e on e.id=c.simulation_id
          where e.status='waiting_evaluation' and e.evaluation_path='demo_small' and c.state='open'),
        'small_paused',(select count(*) from public.simulation_panel_cases c join enriched e on e.id=c.simulation_id
          where e.status='waiting_evaluation' and e.evaluation_path='demo_small' and c.state='paused')),
      'statuses',(select jsonb_agg(to_jsonb(s) order by s.status) from status_groups s),
      'themes',(select coalesce(jsonb_agg(to_jsonb(t) order by t.name,t.id),'[]') from theme_groups t),
      'territory_count',(select count(*) from territory_groups),
      'territories',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
        (select * from territory_groups order by name,code,id
          limit case when operation='export' then null::integer else 20 end
          offset case when operation='export' then 0 else page_number*20 end) q)
    )
  );
end;
$$;
revoke all on function private.program_monitoring(text,jsonb) from public,anon,authenticated;
grant execute on function private.program_monitoring(text,jsonb) to authenticated;
create function public.program_monitoring(operation text,payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select private.program_monitoring(operation,payload);$$;
revoke all on function public.program_monitoring(text,jsonb) from public,anon,authenticated;
grant execute on function public.program_monitoring(text,jsonb) to authenticated;
