import {emptyDraftDocument,prdFields} from "../src/lib/drafts/schema.mjs";
export function completeDemoDocument(rtId,themeId){
 const doc=emptyDraftDocument(rtId);
 Object.assign(doc.innovation,{title:"DEMO Synthetic simulation",theme_id:themeId,form:"produk",maturity:"inisiatif",summary:"DEMO synthetic summary",team:[{id:"fixture",name:"DEMO Synthetic member",role:"Inovator"}]});
 for(const [key] of prdFields)doc.prd[key]=key==="beneficiary_count"?"10":"DEMO synthetic plan";
 doc.budget.items=[{id:"fixture",description:"DEMO bahan",category:"Bahan",unit:"pcs",quantity:"1",unit_price:"1000",usage_stage:"Pembuatan"}];
 doc.budget.maintenance_months="6";doc.declaration.own_work=true;
 return doc;
}
