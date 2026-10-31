import { validateDraftDocument, draftChecklist } from "../drafts/schema.mjs";
import { isUuid } from "../admin/validation.mjs";
export function simulationMissing(document) {
  const result=validateDraftDocument(document);
  if(Object.keys(result.errors).length)return ["Format isian draf perlu diperbaiki"];
  const ready=draftChecklist(result.data);
  const labels=["Data inovasi dan tim","PRD inovasi","Rincian RAB dan masa perawatan","Pernyataan keaslian"];
  const missing=labels.filter((_,index)=>!ready[index]);
  if(result.data.innovation.team.some(member=>!member.name||!member.role)&&!missing.includes(labels[0]))missing.push(labels[0]);
  return missing;
}
export function validateRtNote(form) {
  const get=key=>typeof form.get(key)==="string"?form.get(key).trim():"";
  /** @type {Record<string,string>} */
  const errors={};
  const id=get("id"),requestId=get("request_id"),body=get("body"),conflict=get("conflict");
  if(!isUuid(id)||!isUuid(requestId))errors.form="Muat ulang halaman sebelum mengirim catatan.";
  if(body.length<3||body.length>4000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body))errors.body="Isi catatan 3–4.000 karakter.";
  if(!["none","family"].includes(conflict))errors.conflict="Isi deklarasi hubungan keluarga atau konflik kepentingan.";
  const domicileChecked=get("domicile_checked")==="on",problemChecked=get("problem_checked")==="on";
  if(conflict==="family"&&(domicileChecked||problemChecked))errors.conflict="Saat melaporkan konflik, simpan catatan tanpa checklist pemeriksaan.";
  return {errors,payload:{id,request_id:requestId,body,family_conflict:conflict==="family",domicile_checked:domicileChecked,problem_checked:problemChecked}};
}
