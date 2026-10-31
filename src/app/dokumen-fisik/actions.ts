"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {requireUser} from "@/lib/auth/session";
import {isUuid} from "@/lib/admin/validation.mjs";
import {validatePhysical} from "@/lib/physical/validation.mjs";
import type {PhysicalFormState} from "@/lib/physical/types";
const messages:Record<string,string>={
  PHYSICAL_TOO_EARLY:"Batas waktu belum tercapai. Periksa tanggal pembukaan terbaru.",PHYSICAL_PENDING:"Masih ada permintaan yang menunggu konfirmasi untuk tahap ini.",PHYSICAL_FILE_REQUIRED:"Pilih surat fisik siap yang sesuai dengan putaran dan antrean tahap ini.",PHYSICAL_RATE_LIMIT:"Batas DEMO 5 permintaan baru per salinan dalam 24 jam telah tercapai.",PHYSICAL_ACK_REQUIRED:"Konfirmasikan pembagian salinan dan berkas kepada pemeriksa kelurahan.",PHYSICAL_MANDATE_REQUIRED:"Diperlukan mandat utama kelurahan yang aktif pada wilayah ini.",PHYSICAL_UNAVAILABLE:"Permintaan tidak tersedia untuk akunmu.",PHYSICAL_OWNER_REQUIRED:"Tindakan ini hanya tersedia bagi pengaju.",PHYSICAL_CHECKS_REQUIRED:"Lengkapi pemeriksaan tanda tangan, konfirmasi ke RT/RW, dan isi rekomendasi.",INDEPENDENT_REVIEWER_REQUIRED:"Diperlukan petugas independen lain karena riwayat rekomendasi atau konflik pada putaran ini.",CONFLICT_REVIEW_ONLY:"Petugas yang memiliki konflik hanya dapat melaporkan konflik.",SESSION_REQUIRED:"Sesi berakhir. Masuk kembali sebelum melanjutkan.",PROGRAM_ADMIN_REQUIRED:"Pengaturan memerlukan admin program aktif.",WORKFLOW_CONFLICT:"Tahap atau versi alur telah berubah. Periksa riwayat di tab baru.",PHYSICAL_SETTINGS_CONFLICT:"Pengaturan batas hari telah berubah. Periksa halaman terbaru sebelum mencoba kembali.",PHYSICAL_REQUEST_CONFLICT:"Permintaan dengan kode yang sama sudah diterima dengan isi berbeda. Periksa riwayat sebelum membuat permintaan baru.",PHYSICAL_ACTION_CONFLICT:"Tindakan dengan kode yang sama sudah tercatat dengan isi berbeda. Periksa riwayat sebelum mencoba kembali.",SETTING_REQUEST_CONFLICT:"Pengaturan sebelumnya tercatat dengan isi berbeda. Periksa riwayat terbaru."
};
async function save(operation:"create"|"review"|"withdraw"|"save_settings",form:FormData):Promise<PhysicalFormState>{
  const {supabase}=await requireUser(),input=validatePhysical(form,operation);
  if(Object.keys(input.errors).length)return {errors:input.errors};
  const result=await supabase.rpc("physical_workflow",{operation,payload:input.payload}).abortSignal(AbortSignal.timeout(45000));
  if(result.error)return {error:messages[result.error.message]??"Penyimpanan belum dapat dikonfirmasi. Input tetap ada; periksa riwayat di tab baru sebelum mencoba kembali."};
  revalidatePath("/admin/jalur-fisik");revalidatePath("/antrean/dokumen-fisik");revalidatePath("/simulasi/[id]","page");revalidatePath("/simulasi/[id]/dokumen-fisik","page");revalidatePath("/dokumen-fisik/[id]","page");revalidatePath("/pengajuan");revalidatePath("/pengajuan/[id]","page");
  for(const stage of ["rt","rw","kelurahan"])revalidatePath(`/antrean/${stage}`);
  if(operation==="save_settings")redirect("/admin/jalur-fisik?status=disimpan");
  const data=result.data as {id?:string};if(!isUuid(data?.id))return {error:"Hasil belum dapat dikonfirmasi. Periksa riwayat di tab baru."};
  redirect(`/dokumen-fisik/${data.id}?status=disimpan`);
}
export async function createPhysical(_state:PhysicalFormState,form:FormData){return save("create",form);}
export async function reviewPhysical(_state:PhysicalFormState,form:FormData){return save("review",form);}
export async function withdrawPhysical(_state:PhysicalFormState,form:FormData){return save("withdraw",form);}
export async function savePhysicalSettings(_state:PhysicalFormState,form:FormData){return save("save_settings",form);}
