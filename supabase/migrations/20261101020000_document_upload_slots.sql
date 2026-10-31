-- Dokumen bertemplate (PRD, RAB, surat keaslian) menggantikan isian teks PRD/RAB sebagai syarat kirim simulasi DEMO.
-- Lampiran tetap disimpan lewat jalur lampiran privat (purpose 'supporting'); draf hanya menyimpan penunjuk dan hasil pemeriksaan.
-- Hasil pemeriksaan AI bersifat bantuan, bukan keputusan: hanya 'perlu_perbaikan' yang menahan pengiriman.
-- Draf lama tetap valid; kolom baru bersifat opsional. Tidak mengubah RLS, grant, atau tabel.

create or replace function private.valid_innovation_draft(doc jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare part jsonb; item jsonb; key_name text;
begin
  if jsonb_typeof(doc) is distinct from 'object' or
    octet_length(doc::text)>131072 or doc - array['innovation','prd','budget','declaration','documents'] <> '{}'::jsonb then return false; end if;
  foreach key_name in array array['innovation','prd','budget','declaration'] loop
    if jsonb_typeof(doc->key_name) is distinct from 'object' then return false; end if;
  end loop;
  part:=doc->'innovation';
  if part-array['title','theme_id','form','maturity','rt_id','summary','team'] <> '{}'::jsonb
    or not private.draft_text_valid(part,'title',160) or not private.draft_text_valid(part,'summary',3000)
    or not private.draft_text_valid(part,'theme_id',36) or not private.draft_text_valid(part,'rt_id',36)
    or not private.draft_text_valid(part,'form',24) or not private.draft_text_valid(part,'maturity',24)
    or coalesce(part->>'form','') not in ('','gagasan','produk','prototipe','program','teknologi')
    or coalesce(part->>'maturity','') not in ('','inisiatif','uji coba','penerapan') then return false; end if;
  if jsonb_typeof(part->'team') is distinct from 'array' or jsonb_array_length(part->'team')>20 then return false; end if;
  for item in select value from jsonb_array_elements(part->'team') loop
    if jsonb_typeof(item) is distinct from 'object' or item-array['id','name','role']<>'{}'::jsonb
      or not private.draft_text_valid(item,'id',36) or not private.draft_text_valid(item,'name',160)
      or not private.draft_text_valid(item,'role',160) then return false; end if;
  end loop;
  part:=doc->'prd';
  if part-array['problem','problem_evidence','beneficiaries','beneficiary_count','solution','features',
    'success_indicator','success_threshold','test_method','test_plan','risks','mitigation'] <> '{}'::jsonb then return false; end if;
  for key_name in select jsonb_object_keys(part) loop
    if not private.draft_text_valid(part,key_name,4000) then return false; end if;
  end loop;
  if coalesce(part->>'beneficiary_count','') !~ '^(|[1-9][0-9]{0,8})$' then return false; end if;
  part:=doc->'budget';
  if part-array['items','subtotal','contingency','honor','maintenance_cost','maintenance_months'] <> '{}'::jsonb
    or jsonb_typeof(part->'items') is distinct from 'array' or jsonb_array_length(part->'items')>50 then return false; end if;
  foreach key_name in array array['subtotal','contingency','honor','maintenance_cost'] loop
    if not private.draft_text_valid(part,key_name,13) or coalesce(part->>key_name,'') !~ '^(|[0-9]{1,13})$' then return false; end if;
  end loop;
  if not private.draft_text_valid(part,'maintenance_months',2) or coalesce(part->>'maintenance_months','') !~ '^(|6|7|8|9|10|11|12)$' then return false; end if;
  for item in select value from jsonb_array_elements(part->'items') loop
    if jsonb_typeof(item) is distinct from 'object' or item-array['id','description','category','unit','quantity','unit_price','usage_stage'] <> '{}'::jsonb
      or not private.draft_text_valid(item,'id',36) or not private.draft_text_valid(item,'description',240)
      or not private.draft_text_valid(item,'category',80) or not private.draft_text_valid(item,'unit',40)
      or not private.draft_text_valid(item,'usage_stage',80) or not private.draft_text_valid(item,'quantity',16)
      or not private.draft_text_valid(item,'unit_price',13)
      or coalesce(item->>'quantity','') !~ '^(|(0|[1-9][0-9]{0,8})(\.[0-9]{1,3})?)$'
      or coalesce(item->>'unit_price','') !~ '^(|[0-9]{1,13})$' then return false; end if;
  end loop;
  part:=doc->'declaration';
  if part-array['own_work','notes'] <> '{}'::jsonb or jsonb_typeof(part->'own_work') is distinct from 'boolean'
    or not private.draft_text_valid(part,'notes',3000) then return false; end if;
  if doc ? 'documents' then
    part:=doc->'documents';
    if jsonb_typeof(part) is distinct from 'object' or part-array['prd','rab','declaration'] <> '{}'::jsonb then return false; end if;
    for key_name in select jsonb_object_keys(part) loop
      item:=part->key_name;
      if jsonb_typeof(item) is distinct from 'object' or item-array['attachment_id','file_name','check'] <> '{}'::jsonb
        or not (item ? 'attachment_id') or not (item ? 'check')
        or coalesce(item->>'attachment_id','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or not private.draft_text_valid(item,'file_name',160)
        or jsonb_typeof(item->'check') is distinct from 'object'
        or coalesce(item#>>'{check,status}','') not in ('lulus','perlu_dicek','perlu_perbaikan','tidak_diperiksa')
        or jsonb_typeof(item#>'{check,issues}') is distinct from 'array' or jsonb_array_length(item#>'{check,issues}')>12
        or char_length(coalesce(item#>>'{check,summary}',''))>1200
        or char_length(coalesce(item#>>'{check,checked_title}',''))>160 then return false; end if;
    end loop;
  end if;
  return true;
end;
$$;

create or replace function private.simulation_document_ready(doc jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare key_name text; item jsonb;
begin
  if not private.valid_innovation_draft(doc) then return false; end if;
  foreach key_name in array array['title','theme_id','form','maturity','rt_id','summary'] loop
    if length(btrim(coalesce(doc->'innovation'->>key_name,'')))=0 then return false; end if;
  end loop;
  if jsonb_array_length(doc#>'{innovation,team}')=0 then return false; end if;
  for item in select value from jsonb_array_elements(doc#>'{innovation,team}') loop
    if length(btrim(coalesce(item->>'name','')))=0 or length(btrim(coalesce(item->>'role','')))=0 then return false; end if;
  end loop;
  if coalesce(doc#>>'{budget,maintenance_months}','')='' or coalesce(nullif(doc#>>'{budget,subtotal}','')::numeric,0)<=0 then return false; end if;
  -- Tiga dokumen bertemplate wajib terunggah, tidak ditandai perlu perbaikan, dan diperiksa terhadap judul inovasi yang sama.
  foreach key_name in array array['prd','rab','declaration'] loop
    if doc#>>array['documents',key_name,'attachment_id'] is null
      or coalesce(doc#>>array['documents',key_name,'check','status'],'perlu_perbaikan')='perlu_perbaikan'
      or coalesce(doc#>>array['documents',key_name,'check','checked_title'],'') is distinct from btrim(doc#>>'{innovation,title}') then return false; end if;
  end loop;
  return coalesce((doc#>>'{declaration,own_work}')::boolean,false);
end;
$$;
