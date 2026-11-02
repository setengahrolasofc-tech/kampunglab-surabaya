-- Metadata repair for two peer SQL files already applied outside migration history.
-- Never reruns their DDL or changes business records. Abort on any contract drift.
begin;
select pg_advisory_xact_lock(184701,1);
do $history_repair$
begin
  if exists(select 1 from (values
    ('private.required_document_keys(text)','588df3fb31c440c50190054ba219e9cc',false,'i',false),
    ('private.demo_document_manifest_ready(uuid,uuid,jsonb)','0a7866554dd9f7815dbdc30d658f21f7',true,'v',false),
    ('private.simulation_document_ready(jsonb)','792133cb111eac31534427b06a91107d',false,'i',false),
    ('private.notification_candidates()','0b4555b216c6bce8c3b32b7dbaf7109f',true,'v',false),
    ('private.delegated_mandate(text,jsonb)','f2e823af4d749beab98b9a0ad59a2f0b',true,'v',true),
    ('public.delegated_mandate(text,jsonb)','132c62b162bd106423ecf7fb9422c4de',false,'v',true)
    ) as expected(signature,source_md5,definer,volatility,authenticated_execute)
    left join pg_proc p on p.oid=to_regprocedure(expected.signature)
    where md5(regexp_replace(p.prosrc,'[[:space:]]','','g')) is distinct from expected.source_md5
      or p.prosecdef is distinct from expected.definer
      or p.provolatile::text is distinct from expected.volatility
      or p.proconfig is distinct from array['search_path=""']::text[]
      or pg_get_userbyid(p.proowner) is distinct from 'postgres'
      or has_function_privilege('anon',p.oid,'EXECUTE') is distinct from false
      or has_function_privilege('authenticated',p.oid,'EXECUTE') is distinct from expected.authenticated_execute)
  then raise exception 'PEER_MIGRATION_FUNCTION_DRIFT'; end if;

  if not exists(select 1 from pg_constraint c
    where c.conrelid='public.notification_receipts'::regclass
      and c.conname='notification_receipts_kind_check' and c.contype='c' and c.convalidated
      and (select array_agg(m[1] order by m[1]) from regexp_matches(pg_get_constraintdef(c.oid),'''([^'']+)''','g') as m)
        = (select array_agg(k order by k) from unnest(array[
          'queue_rt','queue_rw','queue_kelurahan','rt_note','review','physical_queue','physical_action',
          'panel_assignment','panel_result','panel_conflict','panel_coordination','panel_assignment_update','panel_revoked',
          'role_grant','role_revoked','mandate_grant','mandate_revoked','assign_rt','assign_rw','assign_kelurahan']) as k))
  then raise exception 'PEER_MIGRATION_RECEIPT_CONSTRAINT_DRIFT'; end if;

  if exists(select 1 from (values
    ('20261101040000','form_required_documents'),
    ('20261101050000','delegated_mandate_assignment')
    ) as expected(version,name) join supabase_migrations.schema_migrations m using(version)
    where m.name is distinct from expected.name)
  then raise exception 'PEER_MIGRATION_HISTORY_CONFLICT'; end if;

  insert into supabase_migrations.schema_migrations(version,name) values
    ('20261101040000','form_required_documents'),
    ('20261101050000','delegated_mandate_assignment')
  on conflict(version) do nothing;
end;
$history_repair$;
commit;
select version,name from supabase_migrations.schema_migrations
where version in('20261101040000','20261101050000') order by version;
