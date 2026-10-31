-- 1) Setiap akun maksimal 3 draf pengajuan. Dihitung di database dengan kunci per akun agar dua permintaan serentak
--    tidak dapat melewati batas. Permintaan ulang dengan request_id yang sama tetap mengembalikan draf yang sudah ada.
-- 2) Isian "tahap inovasi" (maturity) dihapus: draf baru tidak memuatnya dan tidak lagi menjadi syarat kirim.
--    Draf lama yang masih memuat kunci itu tetap valid (validator mengizinkan kunci opsional).
-- Dijalankan setelah 20261101020000_document_upload_slots.sql.

create or replace function private.write_innovation_draft(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); rt uuid; doc jsonb; result public.innovation_drafts%rowtype; theme uuid;
begin
  if not private.has_live_identity_session() then raise exception using errcode='42501',message='SESSION_REQUIRED'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
  if operation='domicile' then
    rt:=(payload->>'rt_id')::uuid;
    if rt is null or not exists(select 1 from public.territories where id=rt and kind='rt') then raise exception using errcode='22023',message='INVALID_TERRITORY'; end if;
    update public.profiles set domicile_rt_id=rt where id=actor;
    return jsonb_build_object('saved',true);
  elsif operation='create' then
    if nullif(payload->>'request_id','') is null then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    select * into result from public.innovation_drafts where owner_id=actor and create_request_id=(payload->>'request_id')::uuid;
    if found then return jsonb_build_object('id',result.id,'revision',result.revision,'updated_at',result.updated_at); end if;
    select domicile_rt_id into rt from public.profiles where id=actor;
    if rt is null then raise exception using errcode='22023',message='DOMICILE_REQUIRED'; end if;
    perform pg_advisory_xact_lock(hashtextextended('innovation_draft_limit:'||actor::text,0));
    if (select count(*) from public.innovation_drafts where owner_id=actor)>=3 then raise exception using errcode='22023',message='DRAFT_LIMIT'; end if;
    doc:=jsonb_build_object('innovation',jsonb_build_object('title','','theme_id','','form','','rt_id',rt,'summary','','team','[]'::jsonb),
      'prd','{}'::jsonb,'budget','{"items":[],"contingency":"","honor":"","maintenance_cost":"","maintenance_months":""}'::jsonb,
      'declaration','{"own_work":false,"notes":""}'::jsonb);
    insert into public.innovation_drafts(owner_id,create_request_id,document) values(actor,(payload->>'request_id')::uuid,doc)
      on conflict(owner_id,create_request_id) do nothing returning * into result;
    if not found then select * into result from public.innovation_drafts where owner_id=actor and create_request_id=(payload->>'request_id')::uuid; end if;
  elsif operation='save' then
    doc:=payload->'document';
    if doc is null or not private.valid_innovation_draft(doc) or coalesce((payload->>'step')::integer,0) not between 1 and 4
      or coalesce((payload->>'revision')::integer,-1)<0 then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
    theme:=nullif(doc#>>'{innovation,theme_id}','')::uuid;
    if theme is not null and not exists(select 1 from public.innovation_themes where id=theme and active) then raise exception using errcode='22023',message='INVALID_THEME'; end if;
    update public.innovation_drafts set document=doc,current_step=(payload->>'step')::integer,
      revision=revision+1,updated_at=clock_timestamp()
      where id=(payload->>'id')::uuid and owner_id=actor and status='draft' and revision=(payload->>'revision')::integer returning * into result;
    if not found then
      if exists(select 1 from public.innovation_drafts where id=(payload->>'id')::uuid and owner_id=actor) then
        raise exception using errcode='PT409',message='DRAFT_CONFLICT';
      end if;
      raise exception using errcode='22023',message='DRAFT_UNAVAILABLE';
    end if;
  else raise exception using errcode='22023',message='INVALID_OPERATION'; end if;
  return jsonb_build_object('id',result.id,'revision',result.revision,'updated_at',result.updated_at);
end;
$$;

create or replace function private.simulation_document_ready(doc jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare key_name text; item jsonb;
begin
  if not private.valid_innovation_draft(doc) then return false; end if;
  foreach key_name in array array['title','theme_id','form','rt_id','summary'] loop
    if length(btrim(coalesce(doc->'innovation'->>key_name,'')))=0 then return false; end if;
  end loop;
  if jsonb_array_length(doc#>'{innovation,team}')=0 then return false; end if;
  for item in select value from jsonb_array_elements(doc#>'{innovation,team}') loop
    if length(btrim(coalesce(item->>'name','')))=0 or length(btrim(coalesce(item->>'role','')))=0 then return false; end if;
  end loop;
  if coalesce(doc#>>'{budget,maintenance_months}','')='' or coalesce(nullif(doc#>>'{budget,subtotal}','')::numeric,0)<=0 then return false; end if;
  foreach key_name in array array['prd','rab','declaration'] loop
    if doc#>>array['documents',key_name,'attachment_id'] is null
      or coalesce(doc#>>array['documents',key_name,'check','status'],'perlu_perbaikan')='perlu_perbaikan'
      or coalesce(doc#>>array['documents',key_name,'check','checked_title'],'') is distinct from btrim(doc#>>'{innovation,title}') then return false; end if;
  end loop;
  return coalesce((doc#>>'{declaration,own_work}')::boolean,false);
end;
$$;

-- Nama (bukan kode) data wilayah dan tema bawaan tidak lagi berawalan "DEMO". Kode tetap, karena dipakai validasi hierarki.
update public.innovation_themes set name=regexp_replace(name,'^DEMO\s*[—-]\s*','') where name ~ '^DEMO\s*[—-]\s*';
update public.territories set name=regexp_replace(name,'^DEMO\s+','') where name ~ '^DEMO\s+';
