import test from "node:test";
import assert from "node:assert/strict";
import {simulationMissing,validateRtNote} from "../src/lib/simulations/validation.mjs";
import {completeDemoDocument} from "./simulation-fixture.mjs";
const id="00000000-0000-4000-8000-000000000001";
const form=values=>{const f=new FormData();Object.entries(values).forEach(([k,v])=>f.set(k,v));return f;};
test("simulation readiness requires complete rows and declared originality",()=>{
 const doc=completeDemoDocument(id,id);assert.deepEqual(simulationMissing(doc),[]);
 doc.innovation.team.push({id:"another",name:"",role:""});assert.ok(simulationMissing(doc).includes("Data inovasi dan tim"));
 doc.innovation.team.pop();delete doc.documents.declaration;assert.ok(simulationMissing(doc).some(item=>item.startsWith("Surat pernyataan keaslian karya")));
});
test("simulation readiness requires all templated documents, matching title, and no blocking check",()=>{
 const doc=completeDemoDocument(id,id);
 doc.documents.rab.check.status="perlu_perbaikan";assert.ok(simulationMissing(doc).some(item=>item.startsWith("RAB:")));
 doc.documents.rab.check.status="perlu_dicek";assert.deepEqual(simulationMissing(doc),[]);
 doc.documents.prd.check.status="tidak_diperiksa";assert.deepEqual(simulationMissing(doc),[]);
 doc.innovation.title="Judul berubah";assert.equal(simulationMissing(doc).filter(item=>item.includes("judul inovasi")).length,3);
 const incomplete=completeDemoDocument(id,id);delete incomplete.documents.prd;incomplete.budget.subtotal="";incomplete.budget.maintenance_months="";
 const missing=simulationMissing(incomplete);assert.ok(missing.some(item=>item.startsWith("PRD inovasi")));assert.ok(missing.includes("Isi subtotal kebutuhan RAB"));assert.ok(missing.includes("Isi rencana masa perawatan (6–12 bulan)"));
});
test("invalid draft formats cannot pass simulation readiness",()=>{
 const doc=completeDemoDocument(id,id);doc.budget.subtotal="1e5";
 assert.deepEqual(simulationMissing(doc),["Format isian draf perlu diperbaiki"]);
});
test("RT note requires identity, body and explicit conflict declaration",()=>{
 const result=validateRtNote(form({id,request_id:id,body:" ",conflict:""}));
 assert.ok(result.errors.body);assert.ok(result.errors.conflict);
 assert.ok(validateRtNote(form({id:"forged",request_id:id,body:"DEMO note",conflict:"none"})).errors.form);
});
test("conflict reporting cannot assert positive verification checklists",()=>{
 const result=validateRtNote(form({id,request_id:id,body:"DEMO conflict",conflict:"family",domicile_checked:"on"}));
 assert.ok(result.errors.conflict);
 assert.deepEqual(validateRtNote(form({id,request_id:id,body:"DEMO conflict",conflict:"family"})).errors,{});
});
test("note payload ignores forged actor and mandate fields",()=>{
 const result=validateRtNote(form({id,request_id:id,body:"  DEMO note  ",conflict:"none",actor_id:id,office_id:id,mandate_id:id}));
 assert.deepEqual(result.errors,{});assert.equal(result.payload.body,"DEMO note");
 assert.equal("actor_id" in result.payload,false);assert.equal("mandate_id" in result.payload,false);
});
