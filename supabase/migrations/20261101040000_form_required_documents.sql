-- Dokumen wajib kini bergantung pada jenis inovasi:
--   prototipe, produk, teknologi -> PRD, RAB, surat pernyataan keaslian dan pertanggungjawaban
--   program                      -> RAB, surat pernyataan keaslian dan pertanggungjawaban (tanpa PRD)
-- Jenis "gagasan" dihapus: draf baru tidak dapat memakainya dan simulasi menolaknya.
-- Kunci dokumen di draf tetap prd/rab/declaration; "declaration" kini berarti surat gabungan bermeterai Rp10.000.
-- Hasil pemeriksaan dokumen boleh memuat kunci opsional "stamp" (validator draf mengizinkan kunci tambahan pada check).
-- Tidak mengubah tabel, RLS, atau grant. Dijalankan setelah 20261101030001_prototype_territory_and_legacy_budget_integration.sql.
do $$ begin
  if (select md5(regexp_replace(prosrc,'[[:space:]]','','g')) from pg_proc where oid='private.simulation_document_ready(jsonb)'::regprocedure) is distinct from 'da5791d313b5bfc6dbd3859f02d3f0a0'
    or (select md5(regexp_replace(prosrc,'[[:space:]]','','g')) from pg_proc where oid='private.demo_document_manifest_ready(uuid,uuid,jsonb)'::regprocedure) is distinct from 'ef05ba29b1880a7cd62bf2f07b7dd18b'
  then raise exception 'FORM_DOCUMENTS_BASE_CHANGED'; end if;
end $$;

create or replace function private.required_document_keys(form_name text) returns text[]
language sql immutable security invoker set search_path='' as $$
  select case form_name
    when 'prototipe' then array['prd','rab','declaration']
    when 'produk' then array['prd','rab','declaration']
    when 'teknologi' then array['prd','rab','declaration']
    when 'program' then array['rab','declaration']
    else null::text[] end;
$$;
revoke all on function private.required_document_keys(text) from public,anon,authenticated;

create or replace function private.demo_document_manifest_ready(draft uuid,owner uuid,doc jsonb) returns boolean
language sql security definer set search_path='' as $$
  with req as (select private.required_document_keys(doc#>>'{innovation,form}') as keys)
  select coalesce(cardinality(req.keys),0)>0 and (
    select count(distinct f.id) from jsonb_each(doc->'documents') slot
      join public.draft_attachments f on f.id=(slot.value->>'attachment_id')::uuid
        and f.draft_id=draft and f.owner_id=owner and f.purpose='supporting' and f.storage_state='ready' and f.removed_at is null
      where slot.key=any(req.keys))=cardinality(req.keys)
  from req;
$$;
revoke all on function private.demo_document_manifest_ready(uuid,uuid,jsonb) from public,anon,authenticated;

create or replace function private.simulation_document_ready(doc jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare key_name text; item jsonb; subtotal_value numeric:=0; required_keys text[];
begin
  if not private.valid_innovation_draft(doc) then return false; end if;
  foreach key_name in array array['title','theme_id','form','rt_id','summary'] loop
    if length(btrim(coalesce(doc->'innovation'->>key_name,'')))=0 then return false; end if;
  end loop;
  required_keys:=private.required_document_keys(doc#>>'{innovation,form}');
  if required_keys is null then return false; end if;
  if jsonb_array_length(doc#>'{innovation,team}')=0 then return false; end if;
  for item in select value from jsonb_array_elements(doc#>'{innovation,team}') loop
    if length(btrim(coalesce(item->>'name','')))=0 or length(btrim(coalesce(item->>'role','')))=0 then return false; end if;
  end loop;
  if jsonb_array_length(doc#>'{budget,items}')>0 then
    for item in select value from jsonb_array_elements(doc#>'{budget,items}') loop
      foreach key_name in array array['description','category','unit','usage_stage'] loop
        if length(btrim(coalesce(item->>key_name,'')))=0 then return false; end if;
      end loop;
      if coalesce(nullif(item->>'quantity','')::numeric,0)<=0 or coalesce(nullif(item->>'unit_price','')::numeric,0)<=0 then return false; end if;
      subtotal_value:=subtotal_value+(item->>'quantity')::numeric*(item->>'unit_price')::numeric;
    end loop;
  else subtotal_value:=coalesce(nullif(doc#>>'{budget,subtotal}','')::numeric,0); end if;
  if coalesce(doc#>>'{budget,maintenance_months}','')='' or subtotal_value<=0 then return false; end if;
  foreach key_name in array required_keys loop
    if doc#>>array['documents',key_name,'attachment_id'] is null
      or coalesce(doc#>>array['documents',key_name,'check','status'],'perlu_perbaikan')='perlu_perbaikan'
      or coalesce(doc#>>array['documents',key_name,'check','checked_title'],'') is distinct from btrim(doc#>>'{innovation,title}') then return false; end if;
  end loop;
  return coalesce((doc#>>'{declaration,own_work}')::boolean,false);
end;
$$;
