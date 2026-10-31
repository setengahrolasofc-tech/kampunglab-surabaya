import {isUuid} from "../admin/validation.mjs";
const integer=value=>typeof value==="string"&&/^(0|[1-9]\d{0,8})$/.test(value);
const text=(value,max)=>typeof value==="string"&&value.trim().length>=3&&value.trim().length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
export function validatePhysical(form,operation){
  /** @type {Record<string,string>} */
  const errors={};
  /** @type {Record<string,string|number|boolean>} */
  const payload={request_id:String(form.get("request_id")??"")};
  if(!isUuid(payload.request_id))errors.form="Muat ulang halaman sebelum melanjutkan.";
  if(operation==="create"){
    payload.simulation_id=String(form.get("simulation_id")??"");payload.attachment_id=String(form.get("attachment_id")??"");
    if(!isUuid(payload.simulation_id))errors.form="Muat ulang salinan simulasi.";
    if(!isUuid(payload.attachment_id))errors.attachment_id="Pilih surat rekomendasi fisik yang sudah siap.";
    payload.acknowledged=form.get("acknowledged")==="on";
    if(!payload.acknowledged)errors.acknowledged="Konfirmasikan pembagian salinan dan berkas kepada pemeriksa kelurahan.";
  }else if(operation!=="save_settings"){
    payload.id=String(form.get("id")??"");if(!isUuid(payload.id))errors.form="Muat ulang permintaan dokumen fisik.";
  }
  if(operation!=="withdraw"){
    const version=form.get("version");if(!integer(version))errors.form="Versi halaman tidak tersedia. Muat ulang halaman.";
    payload.version=Number(version);
    const key=operation==="save_settings"?"reason":"body",max=operation==="save_settings"?1000:4000,value=form.get(key);
    if(!text(value,max))errors[key]=`Isi alasan 3–${max} karakter tanpa karakter kontrol.`;
    payload[key]=String(value??"").trim();
  }
  if(operation==="create"){
    const version=form.get("settings_version");if(!integer(version))errors.form="Versi pengaturan berubah atau tidak tersedia. Muat ulang halaman.";
    payload.settings_version=Number(version);
  }
  if(operation==="review"){
    payload.decision=String(form.get("decision")??"");payload.conflict=String(form.get("conflict")??"");
    if(!["accept","reject","conflict"].includes(payload.decision))errors.decision="Pilih tindakan.";
    if(!["none","reported"].includes(payload.conflict)||(payload.decision==="conflict")!==(payload.conflict==="reported"))errors.conflict="Sesuaikan tindakan dengan deklarasi konflik.";
    for(const key of ["signature_checked","contact_checked","content_checked"])payload[key]=form.get(key)==="on";
    if(payload.decision==="accept"&&![payload.signature_checked,payload.contact_checked,payload.content_checked].every(Boolean))errors.checks="Lengkapi ketiga pemeriksaan sebelum mengonfirmasi.";
    if(payload.decision==="conflict"&&[payload.signature_checked,payload.contact_checked,payload.content_checked].some(Boolean))errors.checks="Laporan konflik disimpan tanpa checklist substansi.";
  }
  if(operation==="save_settings"){
    const days=form.get("delay_days");if(!integer(days)||Number(days)<1||Number(days)>30)errors.delay_days="Gunakan 1–30 hari untuk konfigurasi DEMO.";
    payload.delay_days=Number(days);
  }
  return {errors,payload};
}
