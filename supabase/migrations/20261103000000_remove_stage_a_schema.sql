-- Membersihkan skema "tahap (a)" lama (20261102000001-04) agar 20261103090000_rev4_core.sql dapat diterapkan.
--
-- MASALAH YANG DIPERBAIKI: kedua skema membuat 23 objek bernama sama (public.users, public.innovations, enum mandate_type, dst.)
-- sehingga rev4_core gagal seluruhnya. Selain itu trigger pendaftaran tahap (a) (on_auth_user_created) mewajibkan metadata
-- "name" padahal aplikasi mengirim "display_name": setiap signUp gagal dengan "Database error saving new user" dan email OTP
-- tidak pernah dikirim.
--
-- Aman dijalankan ulang dan aman bila tahap (a) tidak pernah diterapkan: tidak berbuat apa pun jika penanda skema lama tidak ada
-- atau bila skema Rev. 4 sudah terpasang (agar tabel Rev. 4 yang bernama sama tidak ikut terhapus).
do $$
declare r record;
begin
  if to_regprocedure('private.handle_new_auth_user()') is null then
    raise notice 'Skema tahap (a) tidak ditemukan: tidak ada yang dihapus.'; return;
  end if;
  if to_regprocedure('app.on_auth_user_created()') is not null then
    raise notice 'Skema Rev. 4 sudah terpasang: skema tahap (a) dibiarkan agar data Rev. 4 tidak terhapus. Periksa manual.'; return;
  end if;

  drop trigger if exists on_auth_user_created on auth.users;
  drop trigger if exists on_auth_user_email_changed on auth.users;

  begin
    drop policy if exists documents_insert on storage.objects;
    drop policy if exists documents_update_own on storage.objects;
    drop policy if exists documents_delete_own on storage.objects;
    drop policy if exists documents_select on storage.objects;
  exception when others then raise notice 'Kebijakan storage tahap (a) tidak dapat dihapus otomatis: %', sqlerrm;
  end;

  drop view if exists public.public_stats, public.public_innovations, public.public_survey_forms, public.public_survey_reviews,
    public.survey_responses_view, public.admin_kelurahan_tanpa_mandat;

  drop table if exists public.audit_logs, public.blacklist_entries, public.disputes, public.evidence_passports, public.fund_disbursements,
    public.handover_documents, public.innovation_members, public.innovation_status_history, public.innovation_transitions,
    public.kelurahan_mandates, public.kelurahan_profiles, public.logbook_entries, public.mandate_requests, public.notifications,
    public.pilot_interests, public.problem_boards, public.submission_reviews, public.survey_responses, public.system_parameters,
    public.testing_integrations, public.innovations, public.users, public.master_kelurahan cascade;

  drop type if exists public.user_role, public.user_status, public.mandate_type, public.mandate_request_status, public.innovation_type,
    public.plafon_scale, public.innovation_status, public.problem_status, public.funding_stage, public.lurah_decision,
    public.education_level, public.review_action, public.dispute_type, public.dispute_status;

  -- Fungsi tahap (a) di schema private (tidak ada yang bernama sama dengan fungsi migrasi lama).
  for r in select p.oid::regprocedure as sig from pg_proc p
           where p.pronamespace = 'private'::regnamespace and p.proname = any(array[
             'param','param_int','param_num','is_admin','is_super_admin','is_active_innovator','has_mandate','is_leader',
             'innovation_status_of','innovation_kelurahan','is_kelurahan_of','can_view_innovation','kelurahan_sees_user',
             'active_mandate_count','today_wib','is_live_user','mask_name','audit','notify_user','notify_admins','notify_kelurahan',
             'handle_new_auth_user','sync_auth_email','touch_updated_at','mandate_requests_guard','innovations_guard',
             'innovations_after_insert','set_status','members_guard','set_actor_columns','logbook_guard','handover_guard',
             'system_parameters_guard','audit_row_change','kelurahan_profiles_touch','notifications_touch'])
  loop execute 'drop function if exists ' || r.sig || ' cascade'; end loop;

  raise notice 'Skema tahap (a) dihapus. Lanjutkan dengan migrasi 20261103090000_rev4_core.sql.';
end $$;
