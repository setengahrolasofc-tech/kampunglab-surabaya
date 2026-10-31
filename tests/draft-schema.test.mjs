import test from "node:test";
import assert from "node:assert/strict";
import { emptyDraftDocument, validateDraftDocument, budgetTotals, budgetLineTotal, formatRupiahMilli, draftChecklist } from "../src/lib/drafts/schema.mjs";
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
