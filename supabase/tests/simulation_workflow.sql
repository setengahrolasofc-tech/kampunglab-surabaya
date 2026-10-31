-- Trusted runner; all identities, mandates, snapshots and notes roll back.
begin;
create temporary table sim_fixture as select gen_random_uuid() a,gen_random_uuid() b,gen_random_uuid() c,gen_random_uuid() d,gen_random_uuid() e,
 gen_random_uuid() sa,gen_random_uuid() sb,gen_random_uuid() sc,gen_random_uuid() sd,gen_random_uuid() se,
 gen_random_uuid() kel,gen_random_uuid() rw,gen_random_uuid() rt,gen_random_uuid() rt2,
 gen_random_uuid() office,gen_random_uuid() office2,gen_random_uuid() theme,gen_random_uuid() real_theme;
grant select on sim_fixture to authenticated;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select u,'qa-'||u||'@example.invalid',now(),jsonb_build_object('display_name','Synthetic '||label) from sim_fixture f
cross join lateral(values(f.a,'Owner'),(f.b,'RT'),(f.c,'Other RT'),(f.d,'Admin'),(f.e,'Backup')) v(u,label);
insert into auth.sessions(id,user_id,not_after) select s,u,now()+interval '1 hour' from sim_fixture f
cross join lateral(values(f.sa,f.a),(f.sb,f.b),(f.sc,f.c),(f.sd,f.d),(f.se,f.e)) v(s,u);
insert into public.territories(id,kind,code,name) select kel,'kelurahan','DEMO-SQL-KEL','DEMO SQL Kel' from sim_fixture;
insert into public.territories(id,kind,code,name,parent_id) select rw,'rw','DEMO-SQL-RW','DEMO SQL RW',kel from sim_fixture;
insert into public.territories(id,kind,code,name,parent_id) select rt,'rt','DEMO-SQL-RT','DEMO SQL RT',rw from sim_fixture union all select rt2,'rt','DEMO-SQL-RT2','DEMO SQL RT2',rw from sim_fixture;
insert into public.offices(id,kind,territory_id,name) select office,'rt',rt,'DEMO SQL RT office' from sim_fixture union all select office2,'rt',rt2,'DEMO Other RT office' from sim_fixture;
insert into public.office_mandates(office_id,user_id,mandate_type,starts_at,appointment_reference)
select office,b,'primary',now()-interval '1 day','QA-ONLY' from sim_fixture union all
select office2,c,'primary',now()-interval '1 day','QA-ONLY' from sim_fixture union all
select office,e,'backup',now()-interval '1 day','QA-ONLY' from sim_fixture;
insert into public.platform_role_grants(user_id,role,starts_at,appointment_reference) select d,'program_admin',now()-interval '1 day','QA-ONLY' from sim_fixture;
insert into public.innovation_themes(id,code,name,is_demo) select theme,'DEMO-SQL-THEME','DEMO SQL theme',true from sim_fixture union all select real_theme,'SQL-REAL-THEME','SQL non-demo fixture',false from sim_fixture;
create temporary table sim_test_state(draft_id uuid,simulation_id uuid);
grant select,insert on sim_test_state to authenticated;
set local role authenticated;
do $$ declare f record; draft_id uuid; sid uuid; doc jsonb; r jsonb; repeated jsonb; key_name text;
begin
 select * into f from sim_fixture;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',f.a,'session_id',f.sa,'role','authenticated')::text,true);
 perform public.write_innovation_draft('domicile',jsonb_build_object('rt_id',f.rt));
 r:=public.write_innovation_draft('create',jsonb_build_object('request_id',gen_random_uuid()));draft_id:=(r->>'id')::uuid;
 begin perform public.simulation_workflow('submit',jsonb_build_object('draft_id',draft_id,'revision',0,'acknowledged',false));raise exception 'FAIL: missing acknowledgement';exception when invalid_parameter_value then null;end;
 begin perform public.simulation_workflow('submit',jsonb_build_object('draft_id',draft_id,'revision',0,'acknowledged',true));raise exception 'FAIL: incomplete snapshot';exception when invalid_parameter_value then if sqlerrm<>'INCOMPLETE_DRAFT' then raise;end if;end;
 select document into doc from public.innovation_drafts x where x.id=draft_id;
 doc:=jsonb_set(doc,'{innovation}',jsonb_build_object('title','DEMO original snapshot','theme_id',f.theme,'rt_id',f.rt,'form','produk','maturity','inisiatif','summary','DEMO summary','team','[{"id":"fixture","name":"DEMO member","role":"Inovator"}]'::jsonb));
 foreach key_name in array array['problem','problem_evidence','beneficiaries','solution','features','success_indicator','success_threshold','test_method','test_plan','risks','mitigation'] loop
  doc:=jsonb_set(doc,array['prd',key_name],to_jsonb('DEMO plan'::text));
 end loop;
 doc:=jsonb_set(doc,'{prd,beneficiary_count}','"10"');
 doc:=jsonb_set(doc,'{budget,items}','[{"id":"fixture","description":"DEMO material","category":"Bahan","unit":"pcs","quantity":"1","unit_price":"1000","usage_stage":"Build"}]');
 doc:=jsonb_set(doc,'{budget,maintenance_months}','"6"');doc:=jsonb_set(doc,'{declaration,own_work}','true');
 perform public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',0,'step',4,'document',doc));
 begin perform public.simulation_workflow('submit',jsonb_build_object('draft_id',draft_id,'revision',0,'acknowledged',true));raise exception 'FAIL: stale submit';exception when sqlstate 'PT409' then null;end;
 doc:=jsonb_set(doc,'{innovation,theme_id}',to_jsonb(f.real_theme::text));
 perform public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',1,'step',4,'document',doc));
 begin perform public.simulation_workflow('submit',jsonb_build_object('draft_id',draft_id,'revision',2,'acknowledged',true));raise exception 'FAIL: real theme submitted';exception when invalid_parameter_value then if sqlerrm<>'DEMO_ONLY' then raise;end if;end;
 doc:=jsonb_set(doc,'{innovation,theme_id}',to_jsonb(f.theme::text));
 perform public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',2,'step',4,'document',doc));
 r:=public.simulation_workflow('submit',jsonb_build_object('draft_id',draft_id,'revision',3,'acknowledged',true,'owner_id',f.b));sid:=(r->>'id')::uuid;
 repeated:=public.simulation_workflow('submit',jsonb_build_object('draft_id',draft_id,'revision',3,'acknowledged',true));
 if repeated->>'id'<>sid::text or (select count(*) from public.innovation_simulations)<>1 then raise exception 'FAIL: idempotent submit';end if;
 if not exists(select 1 from public.innovation_simulations where id=sid and owner_id=f.a and reference like 'DEMO-%' and draft_revision=3) then raise exception 'FAIL: owner/snapshot attribution';end if;
 doc:=jsonb_set(doc,'{innovation,title}','"DEMO changed draft"');
 perform public.write_innovation_draft('save',jsonb_build_object('id',draft_id,'revision',3,'step',4,'document',doc));
 if (select title from public.innovation_simulations where id=sid)<>'DEMO original snapshot' then raise exception 'FAIL: source edit changed snapshot';end if;
 begin update public.innovation_simulations set status='approved' where id=sid;raise exception 'FAIL: direct approval';exception when insufficient_privilege then null;end;
 begin perform public.simulation_workflow('note',jsonb_build_object('id',sid));raise exception 'FAIL: owner note';exception when insufficient_privilege then null;end;
 insert into sim_test_state values(draft_id,sid);
end $$;
do $$ declare f record; sid uuid; r jsonb; note_id uuid; request_id uuid:=gen_random_uuid(); note jsonb;
begin
 select * into f from sim_fixture;select simulation_id into sid from sim_test_state;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',f.c,'session_id',f.sc,'role','authenticated')::text,true);
 if exists(select 1 from public.innovation_simulations) then raise exception 'FAIL: other RT read';end if;
 begin perform public.simulation_workflow('details',jsonb_build_object('id',sid));raise exception 'FAIL: other RT RPC';exception when invalid_parameter_value then null;end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',f.d,'session_id',f.sd,'role','authenticated')::text,true);
 if not public.is_program_admin() then raise exception 'FAIL: admin fixture';end if;
 if exists(select 1 from public.innovation_simulations) then raise exception 'FAIL: global admin read';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',f.e,'session_id',f.se,'role','authenticated')::text,true);
 if exists(select 1 from public.innovation_simulations) then raise exception 'FAIL: backup active without activation policy';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',f.b,'session_id',f.sb,'role','authenticated')::text,true);
 if (select count(*) from public.innovation_simulations)<>1 then raise exception 'FAIL: scoped primary denied';end if;
 if exists(select 1 from public.innovation_drafts) then raise exception 'FAIL: staff accessed live draft';end if;
 r:=public.simulation_workflow('details',jsonb_build_object('id',sid));
 if r->>'can_note'<>'true' or r->>'route_ready'<>'true' then raise exception 'FAIL: scoped detail';end if;
 note:=jsonb_build_object('id',sid,'request_id',request_id,'body','DEMO initial note','family_conflict',false,'domicile_checked',true,'problem_checked',false,'actor_id',f.c,'office_id',f.office2);
 r:=public.simulation_workflow('note',note);note_id:=(r->>'id')::uuid;
 r:=public.simulation_workflow('note',note);
 if r->>'id'<>note_id::text or (select count(*) from public.simulation_rt_notes)<>1 then raise exception 'FAIL: note idempotency';end if;
 if not exists(select 1 from public.simulation_rt_notes where id=note_id and actor_id=f.b and office_id=f.office) then raise exception 'FAIL: forged actor accepted';end if;
 begin perform public.simulation_workflow('note',jsonb_set(note,'{body}','"Changed replay"'));raise exception 'FAIL: changed replay lost body';exception when sqlstate 'PT409' then null;end;
 begin perform public.simulation_workflow('note',jsonb_set(note,'{family_conflict}','true'));raise exception 'FAIL: conflict and positive check';exception when invalid_parameter_value then null;end;
 perform public.simulation_workflow('note',jsonb_build_object('id',sid,'request_id',gen_random_uuid(),'body','DEMO family conflict','family_conflict',true,'domicile_checked',false,'problem_checked',false));
 if (select status from public.innovation_simulations where id=sid)<>'waiting_rt' then raise exception 'FAIL: note approved/advanced request';end if;
 begin update public.simulation_rt_notes set body='overwrite' where id=note_id;raise exception 'FAIL: note mutable';exception when insufficient_privilege then null;end;
 begin perform * from private.simulation_audit;raise exception 'FAIL: audit exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims','{}',true);
update auth.users set deleted_at=now() where id=(select a from sim_fixture);
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',b,'session_id',sb,'role','authenticated')::text,true) from sim_fixture;
do $$ begin if exists(select 1 from public.innovation_simulations) or exists(select 1 from public.simulation_rt_notes) then raise exception 'FAIL: inactive owner data exposed to staff';end if;end $$;
reset role;
select set_config('request.jwt.claims','{}',true);
update auth.users set deleted_at=null where id=(select a from sim_fixture);
update public.office_mandates set ends_at=now()-interval '1 second' where user_id=(select b from sim_fixture);
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',b,'session_id',sb,'role','authenticated')::text,true) from sim_fixture;
do $$ begin if exists(select 1 from public.innovation_simulations) then raise exception 'FAIL: expired mandate read';end if;end $$;
reset role;
select set_config('request.jwt.claims','{}',true);
update public.office_mandates set ends_at=null,status='revoked',revoked_at=now(),revocation_reason='QA revoke' where user_id=(select b from sim_fixture);
insert into public.office_mandates(office_id,user_id,mandate_type,starts_at,appointment_reference) select office,a,'primary',now(),'QA-SELF' from sim_fixture;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',a,'session_id',sa,'role','authenticated')::text,true) from sim_fixture;
do $$ declare sid uuid; begin
 select simulation_id into sid from sim_test_state;
 if (public.simulation_workflow('details',jsonb_build_object('id',sid))->>'can_note')<>'false' then raise exception 'FAIL: self review allowed with primary role';end if;
 if (select count(*) from public.simulation_rt_notes)<>2 then raise exception 'FAIL: owner cannot read notes';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',b,'session_id',sb,'role','authenticated')::text,true) from sim_fixture;
do $$ begin
 if exists(select 1 from public.innovation_simulations) then raise exception 'FAIL: revoked mandate retained read';end if;
 begin perform public.simulation_workflow('note',jsonb_build_object('id',(select simulation_id from sim_test_state)));raise exception 'FAIL: revoked note';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform * from public.innovation_simulations;raise exception 'FAIL: anon read';exception when insufficient_privilege then null;end;
 begin perform public.simulation_workflow('capabilities');raise exception 'FAIL: anon RPC';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'simulation_checks_passed_and_rolled_back' as result;
