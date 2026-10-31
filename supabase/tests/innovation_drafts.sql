-- Trusted runner only. All test accounts, drafts, audit, and catalogs roll back.
begin;
create temporary table draft_fixture as select gen_random_uuid() a,gen_random_uuid() b,gen_random_uuid() c,
  gen_random_uuid() sa,gen_random_uuid() sb,gen_random_uuid() sc,
  gen_random_uuid() kel,gen_random_uuid() rw,gen_random_uuid() rt,gen_random_uuid() theme,gen_random_uuid() request_id;
grant select on draft_fixture to authenticated;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select a,'qa-'||a||'@example.invalid',now(),'{"display_name":"Synthetic draft A"}'::jsonb from draft_fixture
union all select b,'qa-'||b||'@example.invalid',now(),'{"display_name":"Synthetic draft B","role":"program_admin"}'::jsonb from draft_fixture
union all select c,'qa-'||c||'@example.invalid',now(),'{"display_name":"Synthetic admin C"}'::jsonb from draft_fixture;
insert into auth.sessions(id,user_id,not_after)
select sa,a,now()+interval '1 hour' from draft_fixture union all select sb,b,now()+interval '1 hour' from draft_fixture union all select sc,c,now()+interval '1 hour' from draft_fixture;
insert into public.territories(id,kind,code,name) select kel,'kelurahan','QA-DRAFT','Synthetic Kel' from draft_fixture;
insert into public.territories(id,kind,code,name,parent_id) select rw,'rw','QA-DRAFT','Synthetic RW',kel from draft_fixture;
insert into public.territories(id,kind,code,name,parent_id) select rt,'rt','QA-DRAFT','Synthetic RT',rw from draft_fixture;
insert into public.innovation_themes(id,code,name,is_demo) select theme,'QA-DRAFT','Synthetic theme',true from draft_fixture;
insert into public.platform_role_grants(user_id,role,starts_at,appointment_reference) select c,'program_admin',now()-interval '1 day','QA-ONLY' from draft_fixture;
set local role authenticated;
do $$ declare f record; r jsonb; repeated jsonb; doc jsonb; bad jsonb; draft_id uuid;
begin
  select * into f from draft_fixture;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',f.a,'session_id',f.sa,'role','authenticated')::text,true);
  begin perform public.write_innovation_draft('create',jsonb_build_object('request_id',f.request_id)); raise exception 'FAIL: domicile gate'; exception when invalid_parameter_value then if sqlerrm<>'DOMICILE_REQUIRED' then raise; end if; end;
  begin perform public.write_innovation_draft('domicile',jsonb_build_object('rt_id',f.kel)); raise exception 'FAIL: domicile accepted kelurahan'; exception when invalid_parameter_value then null; end;
  perform public.write_innovation_draft('domicile',jsonb_build_object('rt_id',f.rt));
  if (select domicile_rt_id from public.profiles where id=f.a)<>f.rt then raise exception 'FAIL: domicile persisted'; end if;
  begin update public.profiles set domicile_rt_id=f.rt where id=f.a; raise exception 'FAIL: direct domicile update'; exception when insufficient_privilege then null; end;
  r:=public.write_innovation_draft('create',jsonb_build_object('request_id',f.request_id,'owner_id',f.b,'status','approved')); draft_id:=(r->>'id')::uuid;
  repeated:=public.write_innovation_draft('create',jsonb_build_object('request_id',f.request_id));
  if repeated->>'id'<>r->>'id' or (select count(*) from public.innovation_drafts)<>1 then raise exception 'FAIL: idempotent creation'; end if;
  select document into doc from public.innovation_drafts where innovation_drafts.id=draft_id;
  doc:=jsonb_set(doc,'{innovation,title}','"Synthetic private draft"');
  doc:=jsonb_set(doc,'{innovation,theme_id}',to_jsonb(f.theme::text));
  r:=public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',0,'step',2,'document',doc));
  if r->>'revision'<>'1' then raise exception 'FAIL: revision increment'; end if;
  begin perform public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',0,'step',2,'document',doc)); raise exception 'FAIL: stale revision overwrite'; exception when sqlstate 'PT409' then null; end;
  bad:=jsonb_set(doc,'{budget,items}','[{"quantity":"-1","unit_price":"20"}]');
  begin perform public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',1,'step',3,'document',bad)); raise exception 'FAIL: invalid budget'; exception when invalid_parameter_value then null; end;
  bad:=jsonb_set(doc,'{innovation,owner_id}',to_jsonb(f.b));
  begin perform public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',1,'step',1,'document',bad)); raise exception 'FAIL: injected document key'; exception when invalid_parameter_value then null; end;
  bad:=jsonb_set(doc,'{innovation,title}','null');
  begin perform public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',1,'step',1,'document',bad)); raise exception 'FAIL: null text'; exception when invalid_parameter_value then null; end;
  bad:=jsonb_set(doc,'{innovation,rt_id}',to_jsonb(f.kel::text));
  begin perform public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',1,'step',1,'document',bad)); raise exception 'FAIL: invalid territory kind'; exception when foreign_key_violation then null; end;
  begin update public.innovation_drafts set status='approved' where innovation_drafts.id=draft_id; raise exception 'FAIL: direct status update'; exception when insufficient_privilege then null; end;
  begin delete from public.innovation_drafts where innovation_drafts.id=draft_id; raise exception 'FAIL: direct deletion'; exception when insufficient_privilege then null; end;
  begin perform public.write_innovation_draft('submit',jsonb_build_object('id',draft_id)); raise exception 'FAIL: submission enabled'; exception when invalid_parameter_value then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',f.b,'session_id',f.sb,'role','authenticated')::text,true);
  if exists(select 1 from public.innovation_drafts) then raise exception 'FAIL: cross-user read'; end if;
  begin perform public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',1,'step',1,'document',doc)); raise exception 'FAIL: cross-user write'; exception when invalid_parameter_value then if sqlerrm<>'DRAFT_UNAVAILABLE' then raise; end if; end;
  perform public.write_innovation_draft('domicile',jsonb_build_object('rt_id',f.rt));
  r:=public.write_innovation_draft('create',jsonb_build_object('request_id',f.request_id));
  if r->>'id'=draft_id::text then raise exception 'FAIL: request ID crossed users'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',f.c,'session_id',f.sc,'role','authenticated')::text,true);
  if not public.is_program_admin() then raise exception 'FAIL: admin fixture invalid'; end if;
  if exists(select 1 from public.innovation_drafts) then raise exception 'FAIL: admin reads private citizen draft'; end if;
  begin perform private.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',1,'step',1,'document',doc)); raise exception 'FAIL: private wrapper ownership bypass'; exception when invalid_parameter_value then null; end;
  begin perform * from private.innovation_draft_audit; raise exception 'FAIL: private audit exposed'; exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',f.a,'session_id',f.sb,'role','authenticated')::text,true);
  if exists(select 1 from public.innovation_drafts) then raise exception 'FAIL: mismatched session reads'; end if;
  begin perform public.write_innovation_draft('domicile',jsonb_build_object('rt_id',f.rt)); raise exception 'FAIL: mismatched session writes'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ declare f record; begin
  select * into f from draft_fixture;
  if not exists(select 1 from private.innovation_draft_audit where actor_user_id=f.a and revision=1 and step=2) then raise exception 'FAIL: minimal audit'; end if;
  update auth.sessions set not_after=now()-interval '1 minute' where id=f.sa;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',a,'session_id',sa,'role','authenticated')::text,true) from draft_fixture;
do $$ begin if exists(select 1 from public.innovation_drafts) then raise exception 'FAIL: expired session reads'; end if; end $$;
reset role;
set local role anon;
do $$ begin
  begin perform * from public.innovation_drafts; raise exception 'FAIL: anon read'; exception when insufficient_privilege then null; end;
  begin perform public.write_innovation_draft('create','{}'); raise exception 'FAIL: anon RPC'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'innovation_draft_checks_passed_and_rolled_back' as result;
