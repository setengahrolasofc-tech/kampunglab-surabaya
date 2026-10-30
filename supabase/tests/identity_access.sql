-- Run as a trusted database administrator. Fixtures are synthetic and rolled back.
begin;
create temporary table identity_fixture as
select gen_random_uuid() a, gen_random_uuid() b, gen_random_uuid() kel,
  gen_random_uuid() rw, gen_random_uuid() rt, gen_random_uuid() office;
grant select on identity_fixture to authenticated, anon;

insert into auth.users(id, email, raw_user_meta_data)
select a, 'qa-' || a::text || '@example.invalid', '{"display_name":"QA A","role":"program_admin"}'::jsonb from identity_fixture
union all
select b, 'qa-' || b::text || '@example.invalid', '{"display_name":"QA B"}'::jsonb from identity_fixture;
insert into public.territories(id,kind,code,name,parent_id)
select kel,'kelurahan','QA-KEL','Synthetic test',null::uuid from identity_fixture;
insert into public.territories(id,kind,code,name,parent_id)
select rw,'rw','01','Synthetic RW',kel from identity_fixture;
insert into public.territories(id,kind,code,name,parent_id)
select rt,'rt','01','Synthetic RT',rw from identity_fixture;
insert into public.offices(id,territory_id,kind,name)
select office,rt,'rt','Synthetic RT office' from identity_fixture;
insert into public.office_mandates(office_id,user_id,mandate_type,starts_at,ends_at,appointment_reference)
select office,a,'primary',now()-interval '1 day',now()+interval '1 day','QA-ONLY' from identity_fixture;
insert into public.platform_role_grants(user_id,role,starts_at,appointment_reference)
select b,'reviewer',now()-interval '1 day','QA-ONLY' from identity_fixture;

do $$ begin
  begin
    insert into public.office_mandates(office_id,user_id,mandate_type,starts_at,ends_at,appointment_reference)
    select office,b,'primary',now(),now()+interval '2 days','QA-ONLY' from identity_fixture;
    raise exception 'FAIL: overlapping primary mandate accepted';
  exception when exclusion_violation then null; end;
  begin
    insert into public.office_mandates(office_id,user_id,mandate_type,starts_at,ends_at,appointment_reference)
    select office,a,'backup',now(),now()+interval '1 day','QA-ONLY' from identity_fixture;
    raise exception 'FAIL: same person became simultaneous primary and backup';
  exception when exclusion_violation then null; end;
  -- A nonoverlapping replacement must remain possible.
  insert into public.office_mandates(office_id,user_id,mandate_type,starts_at,ends_at,appointment_reference)
  select office,b,'primary',now()+interval '1 day',now()+interval '2 days','QA-ONLY' from identity_fixture;
  begin
    insert into public.office_mandates(office_id,user_id,mandate_type,starts_at,appointment_reference)
    select office,b,'delegate',now()+interval '3 days','QA-ONLY' from identity_fixture;
    raise exception 'FAIL: delegated mandate without expiry accepted';
  exception when check_violation then null; end;
  begin
    update public.office_mandates set status='revoked',revoked_at=now(),revocation_reason=null;
    raise exception 'FAIL: revocation without reason accepted';
  exception when check_violation then null; end;
  begin
    insert into public.territories(kind,code,name,parent_id)
    select 'rt','BAD','Wrong parent',kel from identity_fixture;
    raise exception 'FAIL: RT accepted a kelurahan parent';
  exception when foreign_key_violation then null; end;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated')::text, true) from identity_fixture;
do $$ declare affected integer; begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'FAIL: profile isolation'; end if;
  if (select count(*) from public.office_mandates) <> 1 then raise exception 'FAIL: mandate isolation'; end if;
  if exists(select 1 from public.platform_role_grants) then raise exception 'FAIL: forged metadata gained a role or other grant leaked'; end if;
  update public.profiles set display_name='Allowed own edit' where id=(select a from identity_fixture);
  get diagnostics affected = row_count;
  if affected<>1 then raise exception 'FAIL: own profile update blocked'; end if;
  update public.profiles set display_name='Cross-user edit' where id=(select b from identity_fixture);
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'FAIL: cross-user profile write'; end if;
  begin
    update public.profiles set id=(select b from identity_fixture) where id=(select a from identity_fixture);
    raise exception 'FAIL: profile ownership changed';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set created_at=now();
    raise exception 'FAIL: protected timestamp changed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.platform_role_grants(user_id,role,starts_at,appointment_reference)
    select a,'program_admin',now(),'SELF-ASSIGNED' from identity_fixture;
    raise exception 'FAIL: self promotion accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.office_mandates(office_id,user_id,mandate_type,starts_at,ends_at,appointment_reference)
    select office,a,'delegate',now(),now()+interval '1 hour','SELF-ASSIGNED' from identity_fixture;
    raise exception 'FAIL: self mandate accepted';
  exception when insufficient_privilege then null; end;
  begin
    delete from private.identity_audit_events;
    raise exception 'FAIL: audit deletion allowed';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
do $$ begin
  if not exists(select 1 from private.identity_audit_events where actor_user_id=(select a from identity_fixture) and action='update') then
    raise exception 'FAIL: own edit did not record actor';
  end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform * from public.profiles;
    raise exception 'FAIL: public visitor can read profiles';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'identity_access_checks_passed_and_rolled_back' as result;
