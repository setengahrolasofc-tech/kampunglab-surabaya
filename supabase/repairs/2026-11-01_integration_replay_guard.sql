-- Reconcile precondition formatting with manually applied predecessor SQL.
-- Only the four precondition checksum expressions change; function bodies remain byte-identical.
begin;
select pg_advisory_xact_lock(184701,1);
do $guard_repair$
begin
  if not exists(select 1 from supabase_migrations.schema_migrations where version='20261101030001'
      and name='prototype_territory_and_legacy_budget_integration' and cardinality(statements)=1
      and md5(statements[1]) in('75e1d97da320d3a3f5943f8f42b2223d','fd8488f825ecc42fb8aa8a5461388843'))
  then raise exception 'INTEGRATION_RECORDED_SQL_DRIFT'; end if;
  update supabase_migrations.schema_migrations set statements=array[replace(replace(replace(replace(replace(statements[1],'md5(prosrc)','md5(regexp_replace(prosrc,''[[:space:]]'','''',''g''))'),'a7fcc139eaaceb9aa778f54732066ad6','f099bc3a2e327cf6e163215bbce08584'),'16617522484175851d9ef2b93045796f','9d47cd69e3d8fe16b5dcda7ede1714a3'),'300a0af124949d507d0147cf1a88591c','a49310d8a363ba34ce8cbb5db3ef486b'),'4e2b4504940ad4c388cc2849a119fd41','0a28fe0cc3c8aa41f06ae4f64053fec1')]
    where version='20261101030001' and md5(statements[1])='75e1d97da320d3a3f5943f8f42b2223d';
  if not exists(select 1 from supabase_migrations.schema_migrations where version='20261101030001' and md5(statements[1])='fd8488f825ecc42fb8aa8a5461388843')
  then raise exception 'INTEGRATION_REPLAY_GUARD_MISMATCH'; end if;
end;
$guard_repair$;
commit;
select version,name,md5(statements[1]) as source_md5 from supabase_migrations.schema_migrations where version='20261101030001';
