import {isUuid} from "@/lib/admin/validation.mjs";
import type {Json} from "@/lib/supabase/database.types";
import {panelRubric,panelSeats} from "./display";
export type PanelOperation="sharing"|"assign"|"revoke"|"entry";
const str=(form:FormData,key:string)=>typeof form.get(key)==="string"?String(form.get(key)):"";
const integer=(value:string)=>/^(0|[1-9]\d{0,8})$/.test(value);
const text=(value:string,max:number)=>value.trim().length>=3&&value.trim().length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
export function validatePanel(form:FormData,operation:PanelOperation){
  const errors:Record<string,string>={},payload:Record<string,Json>={request_id:str(form,"request_id")};
  if(!isUuid(payload.request_id))errors.form="Muat ulang halaman sebelum melanjutkan.";
  const idKey=operation==="sharing"?"simulation_id":operation==="entry"?"assignment_id":"case_id";
  payload[idKey]=str(form,idKey);if(!isUuid(payload[idKey]))errors.form="Referensi halaman tidak tersedia. Muat ulang halaman.";
  const versionKey=operation==="entry"?"workflow_version":"version",version=str(form,versionKey);payload[versionKey]=Number(version);
  if(!integer(version))errors.form="Versi halaman tidak tersedia. Muat ulang halaman.";
  const reasonKey=operation==="entry"?"body":"reason",reason=str(form,reasonKey),max=operation==="entry"?4000:1000;
  payload[reasonKey]=reason.trim();if(!text(reason,max))errors[reasonKey]=`Isi alasan 3–${max} karakter tanpa karakter kontrol.`;
  if(operation==="sharing"){
    const enabled=str(form,"enabled");if(!["true","false"].includes(enabled))errors.form="Pilih tindakan pembagian yang sesuai.";
    payload.enabled=enabled==="true";payload.acknowledged=form.get("acknowledged")==="on";
    if(payload.enabled&&!payload.acknowledged)errors.acknowledged="Setujui pembagian salinan dan berkas kepada reviewer panel yang ditugaskan.";
  }else if(operation==="assign"){
    payload.reviewer_id=str(form,"reviewer_id");payload.seat=str(form,"seat");payload.reference=str(form,"reference").trim();payload.verified=form.get("verified")==="on";
    if(!isUuid(payload.reviewer_id))errors.form="Cari dan periksa akun reviewer dahulu.";
    if(!Object.hasOwn(panelSeats,String(payload.seat)))errors.seat="Pilih kursi reviewer.";
    if(!text(String(payload.reference),240))errors.reference="Isi referensi dasar penugasan 3–240 karakter.";
    if(!payload.verified)errors.verified="Konfirmasikan identitas, unsur kursi, independensi, dan dasar penugasan.";
  }else if(operation==="revoke"){
    payload.assignment_id=str(form,"assignment_id");if(!isUuid(payload.assignment_id))errors.form="Muat ulang daftar penugasan.";
  }else{
    const conflict=str(form,"conflict"),score=conflict==="none";
    if(!["none","reported"].includes(conflict))errors.conflict="Isi deklarasi konflik sebelum menilai.";
    payload.kind=score?"score":"conflict";payload.conflict=conflict;payload.rubric_version="demo-panel-v1";
    payload.acknowledged=score&&form.get("acknowledged")==="on";payload.vote=score?str(form,"vote"):null;
    for(const field of panelRubric){const value=str(form,field.key);payload[field.key]=score?Number(value):null;if(score&&(!integer(value)||Number(value)>field.max))errors[field.key]=`${field.label}: gunakan bilangan bulat 0–${field.max}.`;}
    if(score&&!payload.acknowledged)errors.acknowledged="Konfirmasikan pengiriman nilai individual yang terkunci.";
    if(score&&!["agree","disagree"].includes(String(payload.vote)))errors.vote="Pilih suara secara manual.";
  }
  return {errors,payload};
}
