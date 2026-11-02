-- Tahap (a), bagian 3: hak akses tabel, kebijakan RLS, tampilan publik/terbatas, dan penyimpanan berkas.
-- Prinsip: tolak secara bawaan. Klien (anon/authenticated) hanya mendapat hak kolom yang memang boleh ia ubah.
-- Perubahan lain (status, mandat, pencairan, keputusan) hanya lewat fungsi alur kerja (tahap c-g) milik owner.
-- CATATAN untuk migrasi berikutnya: Supabase memberi hak default ke anon/authenticated pada tabel baru di schema public;
-- setiap tabel/view/fungsi baru harus mencabut lalu memberi hak secara eksplisit seperti di bawah.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

alter table public.master_kelurahan enable row level security;
alter table public.users enable row level security;
alter table public.mandate_requests enable row level security;
alter table public.kelurahan_mandates enable row level security;
alter table public.kelurahan_profiles enable row level security;
alter table public.problem_boards enable row level security;
alter table public.innovations enable row level security;
alter table public.innovation_members enable row level security;
alter table public.fund_disbursements enable row level security;
alter table public.logbook_entries enable row level security;
alter table public.handover_documents enable row level security;
alter table public.testing_integrations enable row level security;
alter table public.survey_responses enable row level security;
alter table public.evidence_passports enable row level security;
alter table public.pilot_interests enable row level security;
alter table public.submission_reviews enable row level security;
alter table public.innovation_status_history enable row level security;
alter table public.innovation_transitions enable row level security;
alter table public.disputes enable row level security;
alter table public.blacklist_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_parameters enable row level security;

-- ---------------------------------------------------------------- master wilayah & parameter (baca publik)
grant select on public.master_kelurahan, public.system_parameters to anon, authenticated;
grant insert, update, delete on public.master_kelurahan to authenticated;
grant update (value) on public.system_parameters to authenticated;
create policy master_kelurahan_read on public.master_kelurahan for select to anon, authenticated using (true);
create policy master_kelurahan_admin_write on public.master_kelurahan for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy system_parameters_read on public.system_parameters for select to anon, authenticated using (true);
create policy system_parameters_admin_update on public.system_parameters for update to authenticated using (private.is_admin()) with check (private.is_admin());

-- ---------------------------------------------------------------- akun & mandat
grant select on public.users, public.mandate_requests, public.kelurahan_mandates, public.kelurahan_profiles to authenticated;
grant update (name, phone_wa, institusi, kota_domisili, nip, jabatan) on public.users to authenticated;
grant update (kelurahan_id, sk_document_url) on public.mandate_requests to authenticated;
grant update (nama_lurah, nip_lurah, kontak_wa_resmi) on public.kelurahan_profiles to authenticated;

create policy users_select on public.users for select to authenticated
  using (id = auth.uid() or private.is_admin() or private.kelurahan_sees_user(id));
create policy users_update_self on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy mandate_requests_select on public.mandate_requests for select to authenticated using (user_id = auth.uid() or private.is_admin());
create policy mandate_requests_update_self on public.mandate_requests for update to authenticated
  using (user_id = auth.uid() and status in ('MENUNGGU', 'PERLU_PERBAIKAN'))
  with check (user_id = auth.uid() and status in ('MENUNGGU', 'PERLU_PERBAIKAN'));

create policy kelurahan_mandates_select on public.kelurahan_mandates for select to authenticated using (user_id = auth.uid() or private.is_admin());

create policy kelurahan_profiles_select on public.kelurahan_profiles for select to authenticated using (true);
create policy kelurahan_profiles_update on public.kelurahan_profiles for update to authenticated
  using (private.has_mandate(kelurahan_id) or private.is_admin()) with check (private.has_mandate(kelurahan_id) or private.is_admin());
create or replace function private.kelurahan_profiles_touch() returns trigger
language plpgsql as $$ begin new.updated_by := auth.uid(); new.updated_at := now(); return new; end $$;
create trigger kelurahan_profiles_touch before update on public.kelurahan_profiles for each row execute function private.kelurahan_profiles_touch();

-- ---------------------------------------------------------------- papan masalah (baca publik)
grant select on public.problem_boards to anon, authenticated;
grant insert (kelurahan_id, judul_masalah, kategori_tema, deskripsi, deskripsi_lokasi_rt_rw, kontak_wa_narahubung) on public.problem_boards to authenticated;
grant update (judul_masalah, kategori_tema, deskripsi, deskripsi_lokasi_rt_rw, kontak_wa_narahubung) on public.problem_boards to authenticated;
grant delete on public.problem_boards to authenticated;
create policy problem_boards_read on public.problem_boards for select to anon, authenticated using (true);
create policy problem_boards_insert on public.problem_boards for insert to authenticated with check (private.has_mandate(kelurahan_id));
create policy problem_boards_update on public.problem_boards for update to authenticated
  using ((private.has_mandate(kelurahan_id) and status = 'OPEN') or private.is_admin())
  with check ((private.has_mandate(kelurahan_id) and status = 'OPEN') or private.is_admin());
create policy problem_boards_delete on public.problem_boards for delete to authenticated
  using ((private.has_mandate(kelurahan_id) and status = 'OPEN') or private.is_admin());

-- ---------------------------------------------------------------- inovasi & tim
grant select on public.innovations, public.innovation_members to authenticated;
grant insert (kelurahan_target_id, problem_board_id, judul, masalah, tujuan, target_pengguna, deskripsi, tipe_inovasi,
  total_rab, rab_tak_terduga, rab_honor, rencana_perawatan_bulan, target_rt_rw, prd_url, rab_url, surat_keaslian_url, surat_kesepakatan_url)
  on public.innovations to authenticated;
grant update (kelurahan_target_id, problem_board_id, judul, masalah, tujuan, target_pengguna, deskripsi, tipe_inovasi,
  total_rab, rab_tak_terduga, rab_honor, rencana_perawatan_bulan, target_rt_rw, prd_url, rab_url, surat_keaslian_url, surat_kesepakatan_url)
  on public.innovations to authenticated;
grant delete on public.innovations to authenticated;
grant insert (innovation_id, nama_anggota, peran_dalam_tim, institusi_asal, kota_domisili, jenjang_pendidikan, is_leader) on public.innovation_members to authenticated;
grant update (nama_anggota, peran_dalam_tim, institusi_asal, kota_domisili, jenjang_pendidikan, is_leader) on public.innovation_members to authenticated;
grant delete on public.innovation_members to authenticated;

create policy innovations_select on public.innovations for select to authenticated
  using (leader_user_id = auth.uid() or (status <> 'DRAFT' and (private.has_mandate(kelurahan_target_id) or private.is_admin())));
create policy innovations_insert on public.innovations for insert to authenticated
  with check (private.is_active_innovator() and leader_user_id = auth.uid() and status = 'DRAFT');
create policy innovations_update on public.innovations for update to authenticated
  using (leader_user_id = auth.uid() and status in ('DRAFT', 'REVISION_REQUESTED') and private.is_active_innovator())
  with check (leader_user_id = auth.uid() and status in ('DRAFT', 'REVISION_REQUESTED'));
create policy innovations_delete on public.innovations for delete to authenticated
  using (leader_user_id = auth.uid() and status = 'DRAFT');

create policy innovation_members_select on public.innovation_members for select to authenticated using (private.can_view_innovation(innovation_id));
create policy innovation_members_write on public.innovation_members for all to authenticated
  using (private.is_leader(innovation_id) and private.innovation_status_of(innovation_id) in ('DRAFT', 'REVISION_REQUESTED'))
  with check (private.is_leader(innovation_id) and private.innovation_status_of(innovation_id) in ('DRAFT', 'REVISION_REQUESTED'));

-- ---------------------------------------------------------------- dana, logbook, serah terima
grant select on public.fund_disbursements, public.testing_integrations, public.evidence_passports, public.pilot_interests,
  public.submission_reviews, public.innovation_status_history to authenticated;
create policy fund_disbursements_select on public.fund_disbursements for select to authenticated using (private.can_view_innovation(innovation_id));
create policy testing_integrations_select on public.testing_integrations for select to authenticated using (private.can_view_innovation(innovation_id));
create policy evidence_passports_select on public.evidence_passports for select to authenticated using (private.can_view_innovation(innovation_id));
create policy pilot_interests_select on public.pilot_interests for select to authenticated using (private.can_view_innovation(innovation_id));
create policy submission_reviews_select on public.submission_reviews for select to authenticated using (private.can_view_innovation(innovation_id));
create policy innovation_status_history_select on public.innovation_status_history for select to authenticated using (private.can_view_innovation(innovation_id));

grant select on public.logbook_entries, public.handover_documents to authenticated;
grant insert (innovation_id, tanggal, deskripsi_progres, foto_url, nota_belanja_url, nominal_nota, uraian_nota) on public.logbook_entries to authenticated;
grant update (tanggal, deskripsi_progres, foto_url, nota_belanja_url, nominal_nota, uraian_nota, verified_by_lurah_at) on public.logbook_entries to authenticated;
create policy logbook_entries_select on public.logbook_entries for select to authenticated using (private.can_view_innovation(innovation_id));
create policy logbook_entries_insert on public.logbook_entries for insert to authenticated
  with check (private.is_leader(innovation_id) and private.innovation_status_of(innovation_id) in ('BUILDING_PHASE', 'COMMUNITY_TESTING', 'RETEST_PENDING', 'REFINEMENT_AND_HANDOVER'));
create policy logbook_entries_update on public.logbook_entries for update to authenticated
  using (private.is_leader(innovation_id) or private.is_kelurahan_of(innovation_id))
  with check (private.is_leader(innovation_id) or private.is_kelurahan_of(innovation_id));

grant insert (innovation_id, bast_url, bast_foto_url, panduan_url, pelatihan_bukti_url, lpj_akhir_url) on public.handover_documents to authenticated;
grant update (bast_url, bast_foto_url, panduan_url, pelatihan_bukti_url, lpj_akhir_url, bast_verified_at, panduan_verified_at, lpj_verified_at) on public.handover_documents to authenticated;
create policy handover_documents_select on public.handover_documents for select to authenticated using (private.can_view_innovation(innovation_id));
create policy handover_documents_insert on public.handover_documents for insert to authenticated
  with check (private.is_leader(innovation_id) and private.innovation_status_of(innovation_id) = 'REFINEMENT_AND_HANDOVER');
create policy handover_documents_update on public.handover_documents for update to authenticated
  using (private.is_kelurahan_of(innovation_id) or (private.is_leader(innovation_id) and private.innovation_status_of(innovation_id) = 'REFINEMENT_AND_HANDOVER'))
  with check (private.is_kelurahan_of(innovation_id) or (private.is_leader(innovation_id) and private.innovation_status_of(innovation_id) = 'REFINEMENT_AND_HANDOVER'));

-- ---------------------------------------------------------------- survei (data pribadi penguji: hanya Kelurahan terkait dan Admin)
grant select on public.survey_responses to authenticated;
create policy survey_responses_select on public.survey_responses for select to authenticated using (private.is_admin() or private.is_kelurahan_of(innovation_id));

-- ---------------------------------------------------------------- sengketa, blacklist, notifikasi, audit
grant select on public.disputes, public.blacklist_entries, public.audit_logs, public.innovation_transitions to authenticated;
grant insert (innovation_id, tipe, alasan, lampiran_url) on public.disputes to authenticated;
create policy disputes_select on public.disputes for select to authenticated
  using (pelapor_id = auth.uid() or private.can_view_innovation(innovation_id) or private.is_admin());
create policy disputes_insert on public.disputes for insert to authenticated
  with check (pelapor_id = auth.uid() and (private.is_leader(innovation_id) or private.is_kelurahan_of(innovation_id)));
create policy blacklist_entries_select on public.blacklist_entries for select to authenticated using (private.is_admin());
create policy audit_logs_select on public.audit_logs for select to authenticated using (private.is_admin());
create policy innovation_transitions_select on public.innovation_transitions for select to authenticated using (true);

grant select on public.notifications to authenticated;
grant update (dibaca) on public.notifications to authenticated;
create policy notifications_select on public.notifications for select to authenticated using (untuk_user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated using (untuk_user_id = auth.uid()) with check (untuk_user_id = auth.uid());
create or replace function private.notifications_touch() returns trigger
language plpgsql as $$ begin if new.dibaca and not old.dibaca then new.dibaca_pada := now(); end if; return new; end $$;
create trigger notifications_touch before update on public.notifications for each row execute function private.notifications_touch();

-- ---------------------------------------------------------------- tampilan (berjalan dengan hak owner; baris dibatasi di dalamnya)
create or replace view public.public_stats as
select
  (select count(*) from public.innovations where status = 'COMPLETED_PUBLISHED')::int as inovasi_selesai,
  (select count(*) from public.innovations where status in ('APPROVED_WAITING_TERM_1','BUILDING_PHASE','COMMUNITY_TESTING','EVALUATION_TERM_2','RETEST_PENDING','REFINEMENT_AND_HANDOVER'))::int as inovasi_berjalan,
  (select coalesce(sum(nominal_cair), 0) from public.fund_disbursements)::bigint as total_dana_tercatat,
  (select count(*) from public.survey_responses)::int as total_responden,
  (select count(*) from public.problem_boards where status = 'OPEN')::int as masalah_terbuka,
  (select count(*) from public.master_kelurahan mk where private.active_mandate_count(mk.id) > 0)::int as kelurahan_bermandat;

create or replace view public.public_innovations as
select i.id, i.kode_unik, i.judul, i.masalah, i.tujuan, i.target_pengguna, i.tipe_inovasi, i.skala_plafon,
       mk.kelurahan, mk.kecamatan, i.completed_at,
       p.id as rapor_id, p.passport_code, p.sha256_hash as rapor_hash, p.pilot_interest_count,
       t.total_valid_respondents, t.avg_rating, t.helpful_percentage, t.photo_valid_percentage,
       (select coalesce(sum(f.nominal_cair), 0) from public.fund_disbursements f where f.innovation_id = i.id)::bigint as total_dana_cair
from public.innovations i
join public.master_kelurahan mk on mk.id = i.kelurahan_target_id
join public.evidence_passports p on p.innovation_id = i.id
left join lateral (select * from public.testing_integrations x where x.innovation_id = i.id order by x.ronde desc limit 1) t on true
where i.status = 'COMPLETED_PUBLISHED';

-- Formulir survei publik per inovasi (hanya saat masa uji berjalan).
create or replace view public.public_survey_forms as
select i.kode_unik, i.judul, i.masalah, i.tujuan, i.target_pengguna, t.pertanyaan_kontekstual, t.ronde, t.test_end_date,
       mk.kelurahan, mk.kecamatan
from public.innovations i
join public.testing_integrations t on t.innovation_id = i.id
  and t.ronde = (select max(x.ronde) from public.testing_integrations x where x.innovation_id = i.id)
join public.master_kelurahan mk on mk.id = i.kelurahan_target_id
where i.status = 'COMMUNITY_TESTING' and t.closed_at is null
  and private.today_wib() between t.test_start_date and t.test_end_date;

-- Ulasan publik: nama disamarkan, lokasi hanya RT/RW + kelurahan, tanpa foto dan tanpa tempat tinggal rinci.
create or replace view public.public_survey_reviews as
select i.kode_unik, r.rating, r.membantu, r.komentar,
       private.mask_name(r.nama) as nama_samar,
       'RT ' || r.rt || '/RW ' || r.rw || ', ' || r.kelurahan as lokasi_samar, r.dibuat_pada
from public.survey_responses r
join public.innovations i on i.id = r.innovation_id
where i.status = 'COMPLETED_PUBLISHED';

-- Respons survei untuk dashboard: Kelurahan terkait dan Admin melihat data lengkap + foto; ketua tim hanya versi samar tanpa foto.
create or replace view public.survey_responses_view as
select r.id, r.innovation_id, r.ronde,
       case when full_access then r.nama else private.mask_name(r.nama) end as nama,
       r.usia,
       case when full_access then r.tempat_tinggal else 'RT ' || r.rt || '/RW ' || r.rw end as tempat_tinggal,
       r.kecamatan, r.kelurahan, r.rt, r.rw,
       case when full_access then r.foto_url end as foto_url,
       r.rating, r.membantu, r.komentar, r.jawaban_kontekstual, r.dibuat_pada
from public.survey_responses r
cross join lateral (select (private.is_admin() or private.is_kelurahan_of(r.innovation_id)) as full_access) a
where private.can_view_innovation(r.innovation_id);

-- Widget Admin BRIDA: kelurahan tanpa akun bermandat + pengajuan yang menunggu (kosong bagi non-admin).
create or replace view public.admin_kelurahan_tanpa_mandat as
with waiting as (
  select i.kelurahan_target_id as kelurahan_id, i.id,
         (select max(h.waktu) from public.innovation_status_history h where h.innovation_id = i.id and h.ke = 'WAITING_KELURAHAN_MANDATE') as sejak
  from public.innovations i where i.status = 'WAITING_KELURAHAN_MANDATE')
select mk.id as kelurahan_id, mk.kelurahan, mk.kecamatan,
       count(w.id)::int as pengajuan_menunggu,
       coalesce(floor(extract(epoch from (now() - min(w.sejak))) / 86400)::int, 0) as lama_menunggu_hari
from public.master_kelurahan mk
left join waiting w on w.kelurahan_id = mk.id
where private.is_admin() and private.active_mandate_count(mk.id) = 0
group by mk.id, mk.kelurahan, mk.kecamatan;

revoke all on public.public_stats, public.public_innovations, public.public_survey_forms, public.public_survey_reviews,
  public.survey_responses_view, public.admin_kelurahan_tanpa_mandat from anon, authenticated;
grant select on public.public_stats, public.public_innovations, public.public_survey_forms, public.public_survey_reviews to anon, authenticated;
grant select on public.survey_responses_view, public.admin_kelurahan_tanpa_mandat to authenticated;

-- ---------------------------------------------------------------- penyimpanan berkas (privat)
-- documents: {uid_pengunggah}/{innovation_id | 'sk'}/{nama_berkas}. survey-photos: hanya ditulis server (service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('documents', 'documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('survey-photos', 'survey-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy documents_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text and private.is_live_user());
create policy documents_update_own on storage.objects for update to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy documents_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy documents_select on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or private.is_admin()
    or case when (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
            then private.can_view_innovation(((storage.foldername(name))[2])::uuid) else false end));
