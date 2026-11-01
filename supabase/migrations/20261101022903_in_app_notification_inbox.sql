-- In-app notifications derived from existing records; no email delivery or backfill writes.
-- Depends only on the identity/review/physical/panel migrations from 30-31 October.
create table public.notification_receipts (
  user_id uuid not null references public.profiles(id),
  kind text not null check(kind in('queue_rt','queue_rw','queue_kelurahan','rt_note','review','physical_queue','physical_action',
    'panel_assignment','panel_result','panel_conflict','panel_coordination','panel_assignment_update','panel_revoked',
    'role_grant','role_revoked','mandate_grant','mandate_revoked')),
  source_id uuid not null,
  event_at timestamptz not null,
  read_at timestamptz not null default clock_timestamp(),
  primary key(user_id,kind,source_id)
);
alter table public.notification_receipts enable row level security;
revoke all on public.notification_receipts from public,anon,authenticated;
create policy notification_receipts_deny on public.notification_receipts for all to anon,authenticated using(false) with check(false);

create function private.notification_candidates()
returns table(kind text,source_id uuid,occurred_at timestamptz,label text,reference text,destination text)
language sql security definer set search_path='' as $$
  with me as (select auth.uid() as id where private.has_live_identity_session()),
  capabilities as (select me.id,private.has_program_admin() as admin,private.panel_reviewer_current(me.id) as reviewer,
    array(select private.simulation_viewer_territories('rt')) as rt_ids,
    array(select private.simulation_viewer_territories('rw')) as rw_ids,
    array(select private.simulation_viewer_territories('kelurahan')) as kel_ids from me),
  simulations as (select s.id,s.reference,s.owner_id,s.rt_id,s.rw_id,s.kelurahan_id,s.status,s.queue_entered_at,s.evaluation_path
    from public.innovation_simulations s where s.mode='demo' and private.panel_account_active(s.owner_id)),
  panel_context as (select c.id,c.state,s.id as simulation_id,s.reference,s.owner_id,s.kelurahan_id,
      (s.owner_id=cap.id or (s.kelurahan_id=any(cap.kel_ids) and not exists(
        select 1 from public.simulation_panel_assignments a where a.case_id=c.id and a.reviewer_id=cap.id))) as results_visible
    from public.simulation_panel_cases c join simulations s on s.id=c.simulation_id cross join capabilities cap
    where s.status='waiting_evaluation' and s.evaluation_path='demo_small')
  select 'queue_rt'::text,s.id,s.queue_entered_at,'Salinan DEMO menunggu pemeriksaan RT'::text,s.reference,'/simulasi/'||s.id::text
    from simulations s cross join capabilities cap where s.owner_id<>cap.id and s.status='waiting_rt' and s.rt_id=any(cap.rt_ids)
  union all
  select 'queue_rw',s.id,s.queue_entered_at,'Salinan DEMO menunggu pemeriksaan RW',s.reference,'/simulasi/'||s.id::text
    from simulations s cross join capabilities cap where s.owner_id<>cap.id and s.status='waiting_rw' and s.rw_id=any(cap.rw_ids)
  union all
  select 'queue_kelurahan',s.id,s.queue_entered_at,'Salinan DEMO menunggu tinjauan kelurahan',s.reference,'/simulasi/'||s.id::text
    from simulations s cross join capabilities cap where s.owner_id<>cap.id and s.status='waiting_kelurahan' and s.kelurahan_id=any(cap.kel_ids)
  union all
  select 'rt_note',n.id,n.created_at,'Catatan awal RT telah dicatat',s.reference,'/simulasi/'||s.id::text
    from public.simulation_rt_notes n join simulations s on s.id=n.simulation_id cross join capabilities cap
    where s.owner_id=cap.id and n.actor_id<>cap.id
  union all
  select 'review',e.id,e.created_at,
      case e.outcome when 'forward' then case e.stage when 'rt' then 'Rekomendasi RT diteruskan' when 'rw' then 'Rekomendasi RW diteruskan' else 'Jalur evaluasi DEMO disiapkan kelurahan' end
        when 'revise' then 'Pengaju diminta memperbaiki draf' when 'reject' then 'Salinan ditolak dalam simulasi' else 'Petugas melaporkan konflik kepentingan' end,
      s.reference,'/simulasi/'||s.id::text
    from public.simulation_review_events e join simulations s on s.id=e.simulation_id cross join capabilities cap
    where s.owner_id=cap.id and e.actor_id<>cap.id
  union all
  select 'physical_queue',p.id,p.created_at,'Dokumen fisik DEMO menunggu konfirmasi kelurahan',s.reference,'/dokumen-fisik/'||p.id::text
    from public.physical_recommendation_requests p join simulations s on s.id=p.simulation_id cross join capabilities cap
    where p.owner_id<>cap.id and p.status='pending' and p.kelurahan_id=any(cap.kel_ids) and private.physical_request_can_read(p.id)
  union all
  select 'physical_action',a.id,a.created_at,
      case a.action when 'accept' then 'Rekomendasi fisik DEMO dikonfirmasi' when 'reject' then 'Dokumen fisik ditolak dengan alasan'
        when 'conflict' then 'Pemeriksa dokumen fisik melaporkan konflik' else 'Permintaan dokumen fisik ditarik' end,
      s.reference,'/dokumen-fisik/'||p.id::text
    from public.physical_recommendation_actions a join public.physical_recommendation_requests p on p.id=a.physical_request_id
      join simulations s on s.id=p.simulation_id cross join capabilities cap where p.owner_id=cap.id and a.actor_id<>cap.id
  union all
  select 'panel_assignment',a.id,a.created_at,'Kamu ditugaskan sebagai reviewer panel Kecil DEMO',c.reference,'/panel/penugasan/'||a.id::text
    from public.simulation_panel_assignments a join panel_context c on c.id=a.case_id cross join capabilities cap
    where a.reviewer_id=cap.id and a.status='active' and cap.reviewer and private.panel_assignment_can_read(a.id)
  union all
  select 'panel_result',e.id,e.created_at,
      case e.kind when 'score' then 'Nilai individual panel DEMO telah dikirim' else 'Reviewer panel mundur karena konflik' end,
      c.reference,'/simulasi/'||c.simulation_id::text||'/panel'
    from public.simulation_panel_entries e join public.simulation_panel_assignments a on a.id=e.assignment_id
      join panel_context c on c.id=a.case_id cross join capabilities cap where c.results_visible and e.actor_id<>cap.id
  union all
  select 'panel_conflict',e.id,e.created_at,'Panel DEMO memerlukan penanganan pengganti reviewer',c.reference,'/admin/panel/'||c.id::text
    from public.simulation_panel_entries e join public.simulation_panel_assignments a on a.id=e.assignment_id
      join panel_context c on c.id=a.case_id cross join capabilities cap where cap.admin and e.kind='conflict' and e.actor_id<>cap.id
  union all
  select 'panel_coordination',e.id,e.created_at,
      case e.action when 'share' then 'Pengaju mengaktifkan pembagian ke panel DEMO' when 'pause' then 'Pengaju menjeda pembagian ke panel DEMO'
        when 'assign' then 'Susunan reviewer panel diperbarui pengelola' else 'Penugasan reviewer dicabut pengelola' end,
      c.reference,'/admin/panel/'||c.id::text
    from public.simulation_panel_events e join panel_context c on c.id=e.case_id cross join capabilities cap
    where cap.admin and e.actor_id<>cap.id
  union all
  select 'panel_assignment_update',e.id,e.created_at,
      case e.action when 'assign' then 'Reviewer ditetapkan untuk panel DEMO pengajuanmu' else 'Penugasan reviewer pengajuanmu dicabut' end,
      c.reference,'/simulasi/'||c.simulation_id::text||'/panel'
    from public.simulation_panel_events e join panel_context c on c.id=e.case_id cross join capabilities cap
    where c.owner_id=cap.id and e.action in('assign','revoke') and e.actor_id<>cap.id
  union all
  select 'panel_revoked',e.id,e.created_at,'Penugasan panel DEMO milikmu dicabut',c.reference,'/panel/penugasan/'||a.id::text
    from public.simulation_panel_events e join panel_context c on c.id=e.case_id
      join public.simulation_panel_assignments a on a.id=e.assignment_id cross join capabilities cap
    where e.action='revoke' and a.reviewer_id=cap.id and cap.reviewer and e.actor_id<>cap.id
  union all
  select 'role_grant',g.id,g.created_at,'Penetapan peran program untuk akunmu dicatat',null::text,'/dashboard'
    from public.platform_role_grants g cross join capabilities cap where g.user_id=cap.id and g.granted_by is distinct from cap.id
  union all
  select 'role_revoked',g.id,g.revoked_at,'Peran program untuk akunmu dicabut',null::text,'/dashboard'
    from public.platform_role_grants g cross join capabilities cap where g.user_id=cap.id and g.status='revoked' and g.revoked_at is not null
  union all
  select 'mandate_grant',m.id,m.created_at,'Penetapan mandat jabatan untuk akunmu dicatat',null::text,'/dashboard'
    from public.office_mandates m cross join capabilities cap where m.user_id=cap.id and m.granted_by is distinct from cap.id
  union all
  select 'mandate_revoked',m.id,m.revoked_at,'Mandat jabatan untuk akunmu dicabut',null::text,'/dashboard'
    from public.office_mandates m cross join capabilities cap where m.user_id=cap.id and m.status='revoked' and m.revoked_at is not null;
$$;
revoke all on function private.notification_candidates() from public,anon,authenticated;

create function private.notification_workflow(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); requested_kind text; requested_id uuid; expected_time timestamptz; selected record; p integer; view_name text;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation in('summary','list') then
    p:=coalesce((payload->>'page')::integer,0); view_name:=coalesce(payload->>'view','unread');
    if p not between 0 and 9999 or view_name not in('all','unread') then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    if operation='summary' then
      return (select jsonb_build_object('unread',count(*) filter(where r.user_id is null or r.event_at is distinct from n.occurred_at),'total',count(*))
        from private.notification_candidates() n left join public.notification_receipts r on r.user_id=actor and r.kind=n.kind and r.source_id=n.source_id);
    end if;
    return (with visible as (select n.*,r.read_at,(r.user_id is null or r.event_at is distinct from n.occurred_at) as unread
      from private.notification_candidates() n left join public.notification_receipts r on r.user_id=actor and r.kind=n.kind and r.source_id=n.source_id)
      select jsonb_build_object('unread',count(*) filter(where unread),'total',count(*),
        'count',count(*) filter(where view_name='all' or unread),
        'rows',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from
          (select kind,source_id,occurred_at,label,reference,unread from visible where view_name='all' or unread
            order by occurred_at desc,kind,source_id limit 20 offset p*20) q)) from visible);
  elsif operation='open' then
    perform pg_advisory_xact_lock(184701,1);
    if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
    requested_kind:=payload->>'kind';requested_id:=(payload->>'source_id')::uuid;expected_time:=(payload->>'occurred_at')::timestamptz;
    if requested_kind is null or requested_id is null or expected_time is null then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    select * into selected from private.notification_candidates() n where n.kind=requested_kind and n.source_id=requested_id;
    if not found then raise exception using errcode='42501',message='NOTIFICATION_UNAVAILABLE'; end if;
    if selected.occurred_at is distinct from expected_time then raise exception using errcode='PT409',message='NOTIFICATION_CHANGED'; end if;
    insert into public.notification_receipts(user_id,kind,source_id,event_at) values(actor,selected.kind,selected.source_id,selected.occurred_at)
      on conflict(user_id,kind,source_id) do update set event_at=excluded.event_at,read_at=clock_timestamp();
    return jsonb_build_object('destination',selected.destination);
  end if;
  raise exception using errcode='22023',message='INVALID_OPERATION';
end;
$$;
revoke all on function private.notification_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function private.notification_workflow(text,jsonb) to authenticated;
create function public.notification_workflow(operation text,payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select private.notification_workflow(operation,payload);$$;
revoke all on function public.notification_workflow(text,jsonb) from public,anon,authenticated;
grant execute on function public.notification_workflow(text,jsonb) to authenticated;
