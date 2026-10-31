-- Narrow admin API. Public wrappers retain invoker privileges; the private
-- implementation performs fresh session + database authorization on every call.
alter table private.identity_audit_events add column details jsonb not null default '{}'::jsonb;

create or replace function private.audit_identity_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare before_row jsonb := '{}'; after_row jsonb := '{}'; fields text[];
begin
  fields := array['user_id','office_id','role','mandate_type','starts_at','ends_at',
    'status','granted_by','revoked_at','revocation_reason','appointment_reference',
    'kind','code','name','parent_id','territory_id','active'];
  if tg_op <> 'INSERT' then
    select coalesce(jsonb_object_agg(key,value),'{}') into before_row
    from jsonb_each(to_jsonb(old)) where key = any(fields);
  end if;
  if tg_op <> 'DELETE' then
    select coalesce(jsonb_object_agg(key,value),'{}') into after_row
    from jsonb_each(to_jsonb(new)) where key = any(fields);
  end if;
  insert into private.identity_audit_events(actor_user_id, actor_database_role, entity, entity_id, action, details)
  values (auth.uid(), session_user, tg_table_schema || '.' || tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end, lower(tg_op),
    jsonb_build_object('before',before_row,'after',after_row));
  return null;
end;
$$;

create function private.has_program_admin() returns boolean
language sql security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.platform_role_grants g
    join auth.users u on u.id = g.user_id
    join auth.sessions s on s.user_id = u.id
    where g.user_id = auth.uid() and g.role = 'program_admin'
      and g.status = 'active' and g.starts_at <= clock_timestamp()
      and (g.ends_at is null or g.ends_at > clock_timestamp())
      and u.email_confirmed_at is not null and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= clock_timestamp())
      and s.id::text = auth.jwt()->>'session_id'
      and (s.not_after is null or s.not_after > clock_timestamp())
  );
$$;
revoke all on function private.has_program_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.has_program_admin() to authenticated;

create function public.is_program_admin() returns boolean
language sql security invoker set search_path = '' as $$
  select private.has_program_admin();
$$;
revoke all on function public.is_program_admin() from public, anon, authenticated;
grant execute on function public.is_program_admin() to authenticated;

create function private.manage_access(p_operation text, p_payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid(); target uuid; new_id uuid; office_kind text;
  starts timestamptz; ends timestamptz; reference text; reason text;
  result jsonb; row_data record; target_row record;
begin
  if not private.has_program_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_INPUT';
  end if;

  if p_operation = 'overview' then
    return jsonb_build_object(
      'territories', (select coalesce(jsonb_agg(to_jsonb(t)),'[]') from
        (select id,kind,code,name,parent_id from public.territories order by name,id limit 500) t),
      'offices', (select coalesce(jsonb_agg(to_jsonb(o)),'[]') from
        (select o.id,o.name,o.kind,o.territory_id,o.active,t.name as territory_name
         from public.offices o join public.territories t on t.id=o.territory_id order by o.name,o.id limit 500) o),
      'territory_count', (select count(*) from public.territories),
      'office_count', (select count(*) from public.offices),
      'audit', (select coalesce(jsonb_agg(to_jsonb(a)),'[]') from
        (select a.id,a.occurred_at,a.actor_user_id,p.display_name as actor_name,a.entity,a.entity_id,a.action,a.details
         from private.identity_audit_events a left join public.profiles p on p.id=a.actor_user_id
         where a.entity <> 'public.profiles' order by a.occurred_at desc,a.id limit 30) a)
    );
  elsif p_operation = 'lookup_user' then
    if nullif(p_payload->>'user_id','') is null and length(coalesce(p_payload->>'email','')) not between 3 and 254 then
      raise exception using errcode = '22023', message = 'INVALID_INPUT';
    end if;
    select u.id,u.email,p.display_name into target_row from auth.users u
    join public.profiles p on p.id=u.id
    where ((nullif(p_payload->>'user_id','') is not null and u.id=(p_payload->>'user_id')::uuid)
      or (nullif(p_payload->>'user_id','') is null and lower(u.email)=lower(btrim(p_payload->>'email')))) and u.deleted_at is null
      and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=clock_timestamp());
    if not found then return jsonb_build_object('user',null); end if;
    return jsonb_build_object('user',to_jsonb(target_row),
      'roles',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from
        (select * from public.platform_role_grants where user_id=target_row.id order by created_at desc,id limit 100) r),
      'mandates',(select coalesce(jsonb_agg(to_jsonb(m)),'[]') from
        (select m.*,o.name as office_name,o.active as office_active from public.office_mandates m
         join public.offices o on o.id=m.office_id where user_id=target_row.id order by m.created_at desc,m.id limit 100) m));
  end if;

  -- Serialize access changes, then recheck after waiting: stale admin sessions
  -- cannot race a revocation, and two replacements cannot bypass slot checks.
  perform pg_advisory_xact_lock(184701,1);
  if not private.has_program_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  if p_operation = 'create_territory' then
    if coalesce(p_payload->>'kind','') not in ('kelurahan','rw','rt')
      or length(btrim(coalesce(p_payload->>'code',''))) not between 1 and 40
      or length(btrim(coalesce(p_payload->>'name',''))) not between 1 and 160 then
      raise exception using errcode='22023',message='INVALID_INPUT';
    end if;
    insert into public.territories(kind,code,name,parent_id)
    values(p_payload->>'kind',btrim(p_payload->>'code'),btrim(p_payload->>'name'),nullif(p_payload->>'parent_id','')::uuid)
    returning id into new_id;
  elsif p_operation = 'create_office' then
    select kind into office_kind from public.territories where id=(p_payload->>'territory_id')::uuid;
    if not found or length(btrim(coalesce(p_payload->>'name',''))) not between 1 and 160 then
      raise exception using errcode='22023',message='INVALID_INPUT';
    end if;
    insert into public.offices(territory_id,kind,name) values((p_payload->>'territory_id')::uuid,office_kind,btrim(p_payload->>'name')) returning id into new_id;
  elsif p_operation in ('grant_role','grant_mandate') then
    target := (p_payload->>'user_id')::uuid;
    if not exists(select 1 from auth.users where id=target and email_confirmed_at is not null
      and deleted_at is null and (banned_until is null or banned_until<=clock_timestamp())) then
      raise exception using errcode='22023',message='TARGET_UNAVAILABLE';
    end if;
    if coalesce(p_payload->>'verified','false') <> 'true' then
      raise exception using errcode='22023',message='VERIFICATION_REQUIRED';
    end if;
    reference := btrim(coalesce(p_payload->>'reference',''));
    starts := (p_payload->>'starts_at')::timestamptz;
    ends := nullif(p_payload->>'ends_at','')::timestamptz;
    if length(reference) not between 2 and 240 or starts is null or not isfinite(starts)
      or (ends is not null and (not isfinite(ends) or ends<=starts)) then
      raise exception using errcode='22023',message='INVALID_INPUT';
    end if;
    if p_operation='grant_role' then
      if coalesce(p_payload->>'role','') not in ('program_admin','reviewer','facilitator') then
        raise exception using errcode='22023',message='INVALID_INPUT';
      end if;
      if target=actor and p_payload->>'role'='program_admin' then
        raise exception using errcode='22023',message='SELF_ADMIN_CHANGE';
      end if;
      insert into public.platform_role_grants(user_id,role,starts_at,ends_at,appointment_reference,granted_by)
      values(target,p_payload->>'role',starts,ends,reference,actor) returning id into new_id;
    else
      if coalesce(p_payload->>'mandate_type','') not in ('primary','backup','delegate')
        or ((p_payload->>'mandate_type')='delegate' and ends is null)
        or not exists(select 1 from public.offices where id=(p_payload->>'office_id')::uuid and active) then
        raise exception using errcode='22023',message='INVALID_INPUT';
      end if;
      insert into public.office_mandates(user_id,office_id,mandate_type,starts_at,ends_at,appointment_reference,granted_by)
      values(target,(p_payload->>'office_id')::uuid,p_payload->>'mandate_type',starts,ends,reference,actor) returning id into new_id;
    end if;
  elsif p_operation in ('revoke_role','revoke_mandate') then
    reason := btrim(coalesce(p_payload->>'reason',''));
    if length(reason) not between 3 and 500 then
      raise exception using errcode='22023',message='INVALID_INPUT';
    end if;
    new_id := (p_payload->>'id')::uuid;
    if p_operation='revoke_role' then
      select * into row_data from public.platform_role_grants where id=new_id and status='active' for update;
      if not found then raise exception using errcode='22023',message='GRANT_UNAVAILABLE'; end if;
      if row_data.user_id=actor and row_data.role='program_admin' then
        raise exception using errcode='22023',message='SELF_ADMIN_CHANGE';
      end if;
      update public.platform_role_grants set status='revoked',revoked_at=clock_timestamp(),revocation_reason=reason where id=new_id;
    else
      update public.office_mandates set status='revoked',revoked_at=clock_timestamp(),revocation_reason=reason where id=new_id and status='active';
      if not found then raise exception using errcode='22023',message='GRANT_UNAVAILABLE'; end if;
    end if;
  else
    raise exception using errcode='22023',message='INVALID_OPERATION';
  end if;
  return jsonb_build_object('id',new_id);
end;
$$;
revoke all on function private.manage_access(text,jsonb) from public, anon, authenticated;
grant execute on function private.manage_access(text,jsonb) to authenticated;

create function public.admin_access(p_operation text, p_payload jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path = '' as $$
  select private.manage_access(p_operation,p_payload);
$$;
revoke all on function public.admin_access(text,jsonb) from public, anon, authenticated;
grant execute on function public.admin_access(text,jsonb) to authenticated;
-- No new direct table write or profile-directory privileges. Audit stays private.
