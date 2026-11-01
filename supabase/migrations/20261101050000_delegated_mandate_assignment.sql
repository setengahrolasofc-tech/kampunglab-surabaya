-- Penetapan admin berjenjang. Admin RW menetapkan admin RT, admin kelurahan menetapkan admin RW, admin program menetapkan admin kelurahan.
-- Notifikasi dihitung dari data (domisili warga + mandat utama aktif), jadi hilang sendiri setelah admin wilayah ditetapkan.

alter table public.notification_receipts drop constraint notification_receipts_kind_check;
alter table public.notification_receipts add constraint notification_receipts_kind_check check(kind in('queue_rt','queue_rw','queue_kelurahan','rt_note','review','physical_queue','physical_action',
  'panel_assignment','panel_result','panel_conflict','panel_coordination','panel_assignment_update','panel_revoked',
  'role_grant','role_revoked','mandate_grant','mandate_revoked','assign_rt','assign_rw','assign_kelurahan'));

create or replace function private.notification_candidates()
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
    from public.office_mandates m cross join capabilities cap where m.user_id=cap.id and m.status='revoked' and m.revoked_at is not null
  union all
  -- Tugas penetapan admin: muncul selama wilayah berpenduduk (domisili terdaftar) belum punya mandat utama aktif, lalu hilang sendiri.
  select 'assign_rt'::text,t.id,r.first_at,
      format('Tentukan admin untuk %s: %s warga terdaftar, belum ada admin RT',t.name,r.n),p.name,'/mandat/'||t.id::text
    from public.territories t join public.territories p on p.id=t.parent_id
      cross join lateral (select count(*) as n,min(x.created_at) as first_at from public.profiles x where x.domicile_rt_id=t.id) r
      cross join capabilities cap
    where t.kind='rt' and r.n>0 and t.parent_id=any(cap.rw_ids) and not exists(select 1 from public.office_mandates m join public.offices o on o.id=m.office_id
      where o.territory_id=t.id and o.active and m.mandate_type='primary' and m.status='active'
        and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp()))
  union all
  select 'assign_rw'::text,t.id,r.first_at,
      format('Tentukan admin untuk %s: %s warga terdaftar, belum ada admin RW',t.name,r.n),p.name,'/mandat/'||t.id::text
    from public.territories t join public.territories p on p.id=t.parent_id
      cross join lateral (select count(*) as n,min(x.created_at) as first_at from public.profiles x
        join public.territories rt on rt.id=x.domicile_rt_id where rt.parent_id=t.id) r
      cross join capabilities cap
    where t.kind='rw' and r.n>0 and t.parent_id=any(cap.kel_ids) and not exists(select 1 from public.office_mandates m join public.offices o on o.id=m.office_id
      where o.territory_id=t.id and o.active and m.mandate_type='primary' and m.status='active'
        and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp()))
  union all
  select 'assign_kelurahan'::text,t.id,r.first_at,
      format('Tentukan admin untuk kelurahan %s: %s warga terdaftar, belum ada admin kelurahan',t.name,r.n),null::text,'/mandat/'||t.id::text
    from public.territories t
      cross join lateral (select count(*) as n,min(x.created_at) as first_at from public.profiles x
        join public.territories rt on rt.id=x.domicile_rt_id join public.territories rw on rw.id=rt.parent_id where rw.parent_id=t.id) r
      cross join capabilities cap
    where t.kind='kelurahan' and r.n>0 and cap.admin and not exists(select 1 from public.office_mandates m join public.offices o on o.id=m.office_id
      where o.territory_id=t.id and o.active and m.mandate_type='primary' and m.status='active'
        and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp()));
$$;

create function private.delegated_mandate(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); tid uuid; tr record; allowed boolean; residents bigint; target record; ref text; office uuid; new_id uuid; has_active boolean;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' or nullif(payload->>'territory_id','') is null then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation not in('overview','assign') then raise exception using errcode='22023',message='INVALID_OPERATION'; end if;
  if operation='assign' then
    -- Serialisasi yang sama dengan administrasi mandat: pencabutan bersamaan tidak dapat terlewati.
    perform pg_advisory_xact_lock(184701,1);
    if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  end if;
  tid:=(payload->>'territory_id')::uuid;
  select t.id,t.kind,t.name,t.parent_id,p.name as parent_name into tr from public.territories t left join public.territories p on p.id=t.parent_id where t.id=tid;
  if not found then raise exception using errcode='42501',message='DELEGATION_UNAVAILABLE'; end if;
  allowed:=case tr.kind
    when 'rt' then tr.parent_id in(select private.simulation_viewer_territories('rw'))
    when 'rw' then tr.parent_id in(select private.simulation_viewer_territories('kelurahan'))
    when 'kelurahan' then private.has_program_admin()
    else false end;
  if not coalesce(allowed,false) then raise exception using errcode='42501',message='DELEGATION_UNAVAILABLE'; end if;
  select exists(select 1 from public.office_mandates m join public.offices o on o.id=m.office_id
    where o.territory_id=tid and o.active and m.mandate_type='primary' and m.status='active'
      and m.starts_at<=clock_timestamp() and (m.ends_at is null or m.ends_at>clock_timestamp())) into has_active;
  if operation='overview' then
    select count(*) into residents from public.profiles x where case tr.kind
      when 'rt' then x.domicile_rt_id=tid
      when 'rw' then x.domicile_rt_id in(select id from public.territories where parent_id=tid)
      else x.domicile_rt_id in(select rt.id from public.territories rt join public.territories rw on rw.id=rt.parent_id where rw.parent_id=tid) end;
    return jsonb_build_object('territory',jsonb_build_object('id',tr.id,'kind',tr.kind,'name',tr.name,'parent_name',tr.parent_name),
      'residents',residents,'assigned',has_active);
  end if;
  if has_active then raise exception using errcode='22023',message='ALREADY_ASSIGNED'; end if;
  if coalesce(payload->>'verified','false')<>'true' then raise exception using errcode='22023',message='VERIFICATION_REQUIRED'; end if;
  ref:=btrim(coalesce(payload->>'reference',''));
  if length(ref) not between 2 and 240 or length(coalesce(payload->>'email','')) not between 3 and 254 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  select u.id into target from auth.users u join public.profiles p on p.id=u.id
    where lower(u.email)=lower(btrim(payload->>'email')) and u.deleted_at is null and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until<=clock_timestamp());
  if not found then raise exception using errcode='22023',message='TARGET_UNAVAILABLE'; end if;
  if target.id=actor then raise exception using errcode='22023',message='SELF_ASSIGN'; end if;
  select id into office from public.offices where territory_id=tid and kind=tr.kind;
  if office is null then
    insert into public.offices(territory_id,kind,name) values(tid,tr.kind,left('Admin '||upper(tr.kind)||' '||tr.name,160)) returning id into office;
  else
    update public.offices set active=true where id=office and not active;
  end if;
  insert into public.office_mandates(user_id,office_id,mandate_type,starts_at,ends_at,appointment_reference,granted_by)
    values(target.id,office,'primary',clock_timestamp(),null,ref,actor) returning id into new_id;
  return jsonb_build_object('id',new_id);
end;
$$;
revoke all on function private.delegated_mandate(text,jsonb) from public,anon,authenticated;
grant execute on function private.delegated_mandate(text,jsonb) to authenticated;
create function public.delegated_mandate(operation text,payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select private.delegated_mandate(operation,payload);$$;
revoke all on function public.delegated_mandate(text,jsonb) from public,anon,authenticated;
grant execute on function public.delegated_mandate(text,jsonb) to authenticated;
