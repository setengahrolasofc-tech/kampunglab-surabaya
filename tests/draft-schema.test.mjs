import test from "node:test";
import assert from "node:assert/strict";
import { emptyDraftDocument, validateDraftDocument, budgetTotals, budgetLineTotal, formatRupiahMilli, draftChecklist, MAX_DRAFTS } from "../src/lib/drafts/schema.mjs";
import { buildDocumentCheck, uncheckedDocument } from "../src/lib/ai/document-check-result.mjs";
test("empty draft is saveable without implying submission readiness",()=>{
  const document=emptyDraftDocument();
  assert.deepEqual(validateDraftDocument(document).errors,{});
  assert.deepEqual(draftChecklist(document),[false,false,false,false]);
  const another=emptyDraftDocument();document.innovation.title="changed";
  assert.equal(another.innovation.title,"");
});
test("draft picks allowed fields and rejects malformed numeric or enum fields",()=>{
  const document=emptyDraftDocument();
  document.innovation.role="program_admin";document.owner_id="forged";
  document.innovation.form="approved";document.prd.beneficiary_count="-2";
  const result=validateDraftDocument(document);
  assert.equal("owner_id" in result.data,false);assert.equal("role" in result.data.innovation,false);
  assert.ok(result.errors["innovation.form"]);assert.ok(result.errors["prd.beneficiary_count"]);
});
test("decimal volume and rupiah arithmetic stay exact without maintenance double counting",()=>{
  const document=emptyDraftDocument();
  document.budget.items=[{id:"",description:"Bahan",category:"Bahan",unit:"kg",quantity:"0,125",unit_price:"1001",usage_stage:"Pembuatan"}];
  document.budget.contingency="10";document.budget.honor="20";document.budget.maintenance_cost="999";
  const result=validateDraftDocument(document);assert.deepEqual(result.errors,{});
  assert.equal(result.data.budget.items[0].quantity,"0.125");
  assert.equal(budgetLineTotal(result.data.budget.items[0]),125125n);
  const totals=budgetTotals(result.data.budget);
  assert.equal(totals.total,155125n);assert.equal(totals.maintenance,999000n);
  assert.equal(formatRupiahMilli(totals.total),"Rp155,125");
});
test("large allowed values are formatted exactly and invalid values are flagged",()=>{
  const b=emptyDraftDocument().budget;
  b.items=[{id:"",description:"",category:"",unit:"",quantity:"999999999.999",unit_price:"9999999999999",usage_stage:""}];
  assert.equal(budgetTotals(b).invalid,false);
  assert.equal(formatRupiahMilli(budgetTotals(b).total),"Rp9.999.999.999.989.000.000.000,001");
  b.items[0].unit_price="1e10";assert.equal(budgetTotals(b).invalid,true);
});
test("bounds and declaration types are validated while incomplete rows remain saveable",()=>{
  const d=emptyDraftDocument();d.declaration.own_work="true";
  d.budget.maintenance_months="13";d.innovation.team=Array.from({length:21},()=>({id:"",name:"",role:""}));
  const result=validateDraftDocument(d);
  assert.ok(result.errors["declaration.own_work"]);assert.ok(result.errors["budget.maintenance_months"]);assert.ok(result.errors["innovation.team"]);
});
const slotRow=(title,status="lulus")=>({attachment_id:"AAAAAAAA-0000-4000-8000-000000000001",file_name:"[PRD] x.pdf",check:{status,summary:"ok",issues:["a"],checked_title:title,checked_at:"2026-11-01T00:00:00Z",signature:"tidak_perlu",title_match:"ya",ai:true,extracted:{ordinary:10,bogus:5}}});
test("template document pointers are normalized and unknown slots are dropped",()=>{
  const d=emptyDraftDocument();d.innovation.title="Pompa";d.documents={prd:slotRow("Pompa"),hack:slotRow("Pompa")};
  const result=validateDraftDocument(d);assert.deepEqual(result.errors,{});
  assert.deepEqual(Object.keys(result.data.documents),["prd"]);
  assert.equal(result.data.documents.prd.attachment_id,"aaaaaaaa-0000-4000-8000-000000000001");
  assert.deepEqual(result.data.documents.prd.check.extracted,{ordinary:10});
  d.documents.prd.attachment_id="not-a-uuid";assert.ok(validateDraftDocument(d).errors["documents.prd"]);
  d.documents.prd=slotRow("Pompa","approved");assert.equal(validateDraftDocument(d).data.documents.prd.check.status,"tidak_diperiksa");
});
test("legacy declaration remains intact while checklist still requires the uploaded letter",()=>{
  const d=emptyDraftDocument();d.innovation.title="Pompa";d.innovation.form="produk";d.declaration.own_work=true;
  assert.equal(validateDraftDocument(d).data.declaration.own_work,true);
  assert.equal(draftChecklist(validateDraftDocument(d).data)[3],false);
  d.documents={prd:slotRow("Pompa"),declaration:slotRow("Pompa")};
  const data=validateDraftDocument(d).data;assert.equal(data.declaration.own_work,true);
  assert.deepEqual(draftChecklist(data).slice(1),[true,false,true]);
  data.innovation.title="Lain";assert.equal(draftChecklist(data)[1],false);
  data.innovation.title="Pompa";data.documents.prd.check.status="perlu_perbaikan";assert.equal(draftChecklist(data)[1],false);
});
test("subtotal field drives new totals while validation preserves legacy line items",()=>{
  const d=emptyDraftDocument();d.budget.subtotal="1000";d.budget.contingency="10";d.budget.honor="20";d.budget.maintenance_cost="5";
  const t=budgetTotals(validateDraftDocument(d).data.budget);
  assert.equal(t.subtotal,1000000n);assert.equal(t.total,1030000n);assert.equal(t.maintenance,5000n);
  d.budget.subtotal="1e3";assert.equal(budgetTotals(d.budget).invalid,true);
  const legacy=emptyDraftDocument();legacy.budget.items=[{id:"",description:"x",category:"x",unit:"x",quantity:"2",unit_price:"1500",usage_stage:"x"}];
  const validated=validateDraftDocument(legacy).data;
  assert.deepEqual(validated.budget.items,legacy.budget.items);
  assert.equal(validated.budget.subtotal,"");
  assert.equal(budgetTotals(validated.budget).subtotal,3000000n);
});
test("AI report becomes a status where only definite problems block submission",()=>{
  const now="2026-11-01T00:00:00Z",good={document_type_ok:true,title_match:"ya",signature:"ada",completeness:"lengkap",issues:[],summary:"Baik"};
  assert.equal(buildDocumentCheck("rab",good,"Pompa",now).status,"lulus");
  assert.equal(buildDocumentCheck("rab",{...good,signature:"tidak_ada"},"Pompa",now).status,"perlu_perbaikan");
  assert.equal(buildDocumentCheck("prd",{...good,signature:"tidak_ada"},"Pompa",now).status,"lulus");
  assert.equal(buildDocumentCheck("prd",{...good,title_match:"tidak"},"Pompa",now).status,"perlu_perbaikan");
  assert.equal(buildDocumentCheck("prd",{...good,document_type_ok:false},"Pompa",now).status,"perlu_perbaikan");
  assert.equal(buildDocumentCheck("declaration",{...good,signature:"tidak_jelas"},"Pompa",now).status,"perlu_dicek");
  assert.equal(buildDocumentCheck("prd",{...good,completeness:"sebagian"},"Pompa",now).status,"perlu_dicek");
  assert.equal(buildDocumentCheck("prd",{...good,issues:["Angka berbeda"]},"Pompa",now).status,"perlu_dicek");
  assert.equal(buildDocumentCheck("prd",null,"Pompa",now).status,"perlu_perbaikan");
  assert.deepEqual(buildDocumentCheck("rab",{...good,extracted:{ordinary:5,honor:-1,contingency:1.5,maintenance:"9"}},"Pompa",now).extracted,{ordinary:5});
  assert.equal(buildDocumentCheck("prd",{...good,summary:"x"},"  Pompa ",now).checked_title,"Pompa");
  const skipped=uncheckedDocument("rab","AI mati"," Pompa ",now);assert.equal(skipped.status,"tidak_diperiksa");assert.equal(skipped.checked_title,"Pompa");
});

test("draf tidak lagi memuat tahap inovasi dan draf lama tetap terbaca", () => {
  assert.equal("maturity" in emptyDraftDocument("x").innovation, false);
  const legacy = emptyDraftDocument("");
  legacy.innovation.maturity = "inisiatif";
  const result = validateDraftDocument(legacy);
  assert.deepEqual(result.errors, {});
  assert.equal("maturity" in result.data.innovation, false);
  assert.equal(MAX_DRAFTS, 3);
});


test("saving legacy budget data preserves fractional rupiah and component detail",()=>{
  const legacy=emptyDraftDocument();
  legacy.budget.items=[{id:"legacy-line",description:"Bahan",category:"Material",unit:"kg",quantity:"0.125",unit_price:"1001",usage_stage:"Pembuatan"}];
  legacy.declaration.own_work=true;
  const result=validateDraftDocument(JSON.parse(JSON.stringify(validateDraftDocument(legacy).data)));
  assert.deepEqual(result.errors,{});
  assert.deepEqual(result.data.budget.items,legacy.budget.items);
  assert.equal(budgetTotals(result.data.budget).subtotal,125125n);
  assert.equal(result.data.declaration.own_work,true);
});
