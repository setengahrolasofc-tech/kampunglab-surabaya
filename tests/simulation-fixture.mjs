import {emptyDraftDocument,documentSlots} from "../src/lib/drafts/schema.mjs";
export function completeDemoDocument(rtId,themeId){
 const doc=emptyDraftDocument(rtId);
 Object.assign(doc.innovation,{title:"DEMO Synthetic simulation",theme_id:themeId,form:"produk",summary:"DEMO synthetic summary",team:[{id:"fixture",name:"DEMO Synthetic member",role:"Inovator"}]});
 // PRD, RAB, dan surat keaslian kini berupa dokumen bertemplate; fixture hanya memuat penunjuk dan hasil pemeriksaan sintetis.
 documentSlots.forEach((slot,index)=>{doc.documents[slot.key]={attachment_id:`00000000-0000-4000-8000-00000000010${index}`,file_name:`[${slot.tag}] demo.pdf`,check:{status:"lulus",summary:"",issues:[],checked_title:doc.innovation.title,checked_at:"2026-11-01T00:00:00.000Z",signature:slot.signature?"ada":"tidak_perlu",stamp:slot.stamp?"ada":"tidak_perlu",title_match:"ya",ai:true,extracted:{}}};});
 doc.budget.subtotal="1000";doc.budget.maintenance_months="6";doc.declaration.own_work=true;
 return doc;
}
