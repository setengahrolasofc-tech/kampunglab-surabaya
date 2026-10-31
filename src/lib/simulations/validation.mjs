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
export function validateReview(form) {
  const get=key=>typeof form.get(key)==="string"?form.get(key).trim():"";
  /** @type {Record<string,string>} */
  const errors={};
  const id=get("id"),requestId=get("request_id"),stage=get("stage"),version=get("version");
  const outcome=get("outcome"),body=get("body"),conflict=get("conflict");
  if(!isUuid(id)||!isUuid(requestId)||!["rt","rw","kelurahan"].includes(stage)||!/^(0|[1-9]\d{0,8})$/.test(version))errors.form="Muat ulang halaman sebelum mencatat keputusan simulasi.";
  if(!["forward","revise","reject","conflict"].includes(outcome))errors.outcome="Pilih tindakan simulasi.";
  if(body.length<3||body.length>4000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body))errors.body="Isi alasan atau catatan yang dapat ditindaklanjuti, 3–4.000 karakter.";
  if(!["none","reported"].includes(conflict))errors.conflict="Isi deklarasi konflik kepentingan.";
  if((outcome==="conflict")!==(conflict==="reported"))errors.conflict="Jika ada konflik, pilih tindakan Laporkan konflik. Keputusan substansi memerlukan petugas yang independen.";
  const keys=stage==="rt"?["domicile","problem"]:stage==="rw"?["feasibility","duplicates","budget"]:["recommendations","completeness"];
  const checks=Object.fromEntries(keys.map(key=>[key,outcome!=="conflict"&&get(`check_${key}`)==="on"]));
  if(outcome==="forward"&&Object.values(checks).some(value=>!value))errors.checks="Lengkapi seluruh pemeriksaan sebelum meneruskan rekomendasi.";
  const preparingEvaluation=stage==="kelurahan"&&outcome==="forward";
  const path=preparingEvaluation?get("evaluation_path"):null;
  const acknowledged=preparingEvaluation&&get("evaluation_acknowledged")==="on";
  if(preparingEvaluation&&!["demo_micro","demo_small"].includes(path??""))errors.evaluation_path="Pilih jalur Mikro atau Kecil untuk simulasi evaluasi.";
  if(preparingEvaluation&&!acknowledged)errors.evaluation_acknowledged="Konfirmasikan bahwa pilihan jalur hanya untuk simulasi, bukan persetujuan program atau dana.";
  return {errors,payload:{id,request_id:requestId,stage,version:Number(version),outcome,body,conflict,checks,evaluation_path:path,evaluation_acknowledged:acknowledged}};
}
