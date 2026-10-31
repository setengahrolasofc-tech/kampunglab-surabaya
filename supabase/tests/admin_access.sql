-- Trusted SQL runner only. All users, sessions, grants, and audit are rolled back.
begin;
create temporary table admin_fixture as select gen_random_uuid() a,gen_random_uuid() b,gen_random_uuid() c,
  gen_random_uuid() sa,gen_random_uuid() sb;
grant select on admin_fixture to authenticated;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select a,'qa-'||a||'@example.invalid',now(),'{"display_name":"Synthetic admin"}'::jsonb from admin_fixture
union all select b,'qa-'||b||'@example.invalid',now(),'{"display_name":"Synthetic citizen","role":"program_admin"}'::jsonb from admin_fixture
union all select c,'qa-'||c||'@example.invalid',null,'{}'::jsonb from admin_fixture;
insert into auth.sessions(id,user_id,not_after)
select sa,a,now()+interval '1 hour' from admin_fixture union all select sb,b,now()+interval '1 hour' from admin_fixture;
insert into public.platform_role_grants(user_id,role,starts_at,appointment_reference)
select a,'program_admin',now()-interval '1 day','QA-ONLY' from admin_fixture;
set local role authenticated;
do $$
declare f record; r jsonb; kel uuid; rw uuid; rt uuid; office uuid; grant_id uuid; mandate_id uuid; admin_id uuid;
begin
  select * into f from admin_fixture;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',f.b,'session_id',f.sb,'role','authenticated')::text,true);
  if public.is_program_admin() then raise exception 'FAIL: metadata elevated citizen'; end if;
  begin perform public.admin_access('overview'); raise exception 'FAIL: citizen read admin data'; exception when insufficient_privilege then null; end;
  begin perform private.manage_access('overview','{}'); raise exception 'FAIL: private wrapper bypass'; exception when insufficient_privilege then null; end;
  begin perform public.admin_access('grant_role',jsonb_build_object('user_id',f.b,'role','program_admin')); raise exception 'FAIL: citizen promoted self'; exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',f.a,'session_id',f.sa,'role','authenticated')::text,true);
  if not public.is_program_admin() then raise exception 'FAIL: active admin rejected'; end if;
  r:=public.admin_access('lookup_user',jsonb_build_object('user_id',f.a));
  begin perform public.admin_access('revoke_role',jsonb_build_object('id',r->'roles'->0->>'id','reason','Self revoke')); raise exception 'FAIL: self admin revocation'; exception when invalid_parameter_value then null; end;
  if (select count(*) from public.profiles) <> 1 then raise exception 'FAIL: direct profile RLS widened'; end if;
  r:=public.admin_access('overview'); if not r ? 'audit' then raise exception 'FAIL: admin overview'; end if;
  r:=public.admin_access('lookup_user',jsonb_build_object('email','qa-'||f.b||'@example.invalid'));
  if r->'user'->>'id' <> f.b::text then raise exception 'FAIL: lookup'; end if;
  r:=public.admin_access('lookup_user',jsonb_build_object('user_id',f.c));
  if r->'user' <> 'null'::jsonb then raise exception 'FAIL: unconfirmed account disclosed'; end if;

  r:=public.admin_access('create_territory','{"kind":"kelurahan","code":"QA-ADMIN","name":"Synthetic admin test"}'); kel:=(r->>'id')::uuid;
  r:=public.admin_access('create_territory',jsonb_build_object('kind','rw','code','01','name','Synthetic RW','parent_id',kel)); rw:=(r->>'id')::uuid;
  begin perform public.admin_access('create_territory',jsonb_build_object('kind','rt','code','BAD','name','Wrong parent','parent_id',kel)); raise exception 'FAIL: wrong parent'; exception when foreign_key_violation then null; end;
  r:=public.admin_access('create_territory',jsonb_build_object('kind','rt','code','01','name','Synthetic RT','parent_id',rw)); rt:=(r->>'id')::uuid;
  r:=public.admin_access('create_office',jsonb_build_object('territory_id',rt,'name','Synthetic RT office')); office:=(r->>'id')::uuid;
  begin perform public.admin_access('grant_role',jsonb_build_object('user_id',f.c,'role','reviewer','starts_at',now(),'reference','QA','verified',true)); raise exception 'FAIL: unconfirmed grant'; exception when invalid_parameter_value then null; end;
  begin perform public.admin_access('grant_role',jsonb_build_object('user_id',f.b,'role','reviewer','starts_at',now(),'reference','QA','verified',false)); raise exception 'FAIL: verification bypass'; exception when invalid_parameter_value then null; end;
  r:=public.admin_access('grant_role',jsonb_build_object('user_id',f.b,'role','reviewer','starts_at',now(),'reference','QA-ONLY','verified',true,'granted_by',f.b)); grant_id:=(r->>'id')::uuid;
  begin perform public.admin_access('grant_role',jsonb_build_object('user_id',f.b,'role','reviewer','starts_at',now(),'reference','QA-ONLY','verified',true)); raise exception 'FAIL: overlap'; exception when exclusion_violation then null; end;
  begin perform public.admin_access('grant_role',jsonb_build_object('user_id',f.a,'role','program_admin','starts_at',now(),'reference','QA','verified',true)); raise exception 'FAIL: self admin change'; exception when invalid_parameter_value then null; end;
  begin perform public.admin_access('grant_mandate',jsonb_build_object('user_id',f.b,'office_id',office,'mandate_type','delegate','starts_at',now(),'reference','QA','verified',true)); raise exception 'FAIL: unbounded delegate'; exception when invalid_parameter_value then null; end;
  r:=public.admin_access('grant_mandate',jsonb_build_object('user_id',f.b,'office_id',office,'mandate_type','primary','starts_at',now(),'reference','QA-ONLY','verified',true)); mandate_id:=(r->>'id')::uuid;
  begin perform public.admin_access('revoke_role',jsonb_build_object('id',grant_id,'reason','')); raise exception 'FAIL: empty reason'; exception when invalid_parameter_value then null; end;
  perform public.admin_access('revoke_role',jsonb_build_object('id',grant_id,'reason','Synthetic revocation'));
  perform public.admin_access('revoke_mandate',jsonb_build_object('id',mandate_id,'reason','Synthetic revocation'));
  r:=public.admin_access('lookup_user',jsonb_build_object('user_id',f.b));
  if r->'roles'->0->>'status' <> 'revoked' or r->'roles'->0->>'granted_by' <> f.a::text then raise exception 'FAIL: attribution or revocation'; end if;
  r:=public.admin_access('grant_role',jsonb_build_object('user_id',f.b,'role','program_admin','starts_at',now(),'reference','QA-ONLY','verified',true)); admin_id:=(r->>'id')::uuid;
  perform public.admin_access('revoke_role',jsonb_build_object('id',admin_id,'reason','Synthetic admin revoked'));
  perform set_config('request.jwt.claims',jsonb_build_object('sub',f.b,'session_id',f.sb,'role','authenticated')::text,true);
  begin perform public.admin_access('overview'); raise exception 'FAIL: revoked admin retained access'; exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',f.a,'session_id',f.sb,'role','authenticated')::text,true);
  if public.is_program_admin() then raise exception 'FAIL: other user session accepted'; end if;
end $$;
reset role;
do $$ declare f record; begin
  select * into f from admin_fixture;
  if not exists(select 1 from private.identity_audit_events where actor_user_id=f.a and entity='public.platform_role_grants' and details->'after'->>'revocation_reason'='Synthetic revocation') then raise exception 'FAIL: audited revocation missing'; end if;
  update auth.sessions set not_after=now()-interval '1 minute' where id=f.sa;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',a,'session_id',sa,'role','authenticated')::text,true) from admin_fixture;
do $$ begin
  if public.is_program_admin() then raise exception 'FAIL: expired session accepted'; end if;
  begin perform public.admin_access('create_territory','{"kind":"kelurahan","code":"BAD","name":"Expired"}'); raise exception 'FAIL: expired session mutated'; exception when insufficient_privilege then null; end;
  begin perform * from private.identity_audit_events; raise exception 'FAIL: direct audit read'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin perform public.admin_access('overview'); raise exception 'FAIL: anon admin access'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'admin_access_checks_passed_and_rolled_back' as result;
