-- One-time history ordering repair. The platform assigned 02:04:43 UTC while an
-- uploaded predecessor already used 03:00:00 UTC. Preserve the applied SQL and
-- place this dependent migration one second after that verified predecessor.
begin;
select pg_advisory_xact_lock(184701,1);
do $order_repair$
begin
  if not exists(select 1 from supabase_migrations.schema_migrations
      where version='20261101030000' and name='draft_limit_and_remove_maturity')
    or (select md5(prosrc) from pg_proc where oid='private.simulation_workflow(text,jsonb)'::regprocedure)
      is distinct from '80b8c7bb41a98d10d35788d5dec5915a'
    or (select md5(prosrc) from pg_proc where oid='private.write_innovation_draft(text,jsonb)'::regprocedure)
      is distinct from '2101e0e54614388c0c5d73d0ed8b72fd'
  then raise exception 'INTEGRATION_HISTORY_ORDER_PRECONDITION'; end if;
  if exists(select 1 from supabase_migrations.schema_migrations where version='20261101020443') then
    if not exists(select 1 from supabase_migrations.schema_migrations where version='20261101020443'
        and name='prototype_territory_and_legacy_budget_integration')
      or exists(select 1 from supabase_migrations.schema_migrations where version='20261101030001')
    then raise exception 'INTEGRATION_HISTORY_ORDER_CONFLICT'; end if;
    update supabase_migrations.schema_migrations set version='20261101030001'
      where version='20261101020443' and name='prototype_territory_and_legacy_budget_integration';
  elsif not exists(select 1 from supabase_migrations.schema_migrations where version='20261101030001'
      and name='prototype_territory_and_legacy_budget_integration') then
    raise exception 'INTEGRATION_HISTORY_ORDER_MISSING';
  end if;
end;
$order_repair$;
commit;
select version,name from supabase_migrations.schema_migrations
where name='prototype_territory_and_legacy_budget_integration';
