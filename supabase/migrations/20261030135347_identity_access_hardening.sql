-- Cover the complete composite FK and make the audit deny policy explicit.
create index territories_parent_fk on public.territories(parent_id, parent_kind);
create policy audit_deny_app_access on private.identity_audit_events
for all to anon, authenticated using (false) with check (false);
