"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/admin/validation.mjs";
import { validateRtNote,validateReview } from "@/lib/simulations/validation.mjs";
import { validateDraftDocument, documentSlots } from "@/lib/drafts/schema.mjs";
import type { DraftAttachmentData } from "@/lib/attachments/types";
import type { SimulationFormState } from "@/lib/simulations/types";
const errors:Record<string,string>={
  INCOMPLETE_DRAFT:"Lengkapi seluruh isian pokok dan simpan draf sebelum mengirim simulasi.",
  DEMO_ONLY:"Simulasi hanya tersedia untuk tema dan wilayah yang sudah disiapkan pengelola.",
  ACK_REQUIRED:"Konfirmasikan pembagian salinan kepada petugas berwenang sesuai tahap pemeriksaan.",
  DRAFT_CONFLICT:"Draf sudah berubah. Muat ulang setelah menyimpan salinan perubahanmu, lalu periksa versi yang akan dikirim.",
  SESSION_REQUIRED:"Sesi sudah tidak berlaku. Masuk kembali sebelum melanjutkan.",
  RT_MANDATE_REQUIRED:"Catatan memerlukan mandat utama RT yang aktif pada wilayah ini. Pengaju tidak dapat memeriksa simulasinya sendiri.",
  CONFLICT_NOTE_ONLY:"Saat melaporkan konflik, catatan dapat disimpan tanpa checklist pemeriksaan.",
  NOTE_REQUEST_CONFLICT:"Catatan sebelumnya sudah diterima dengan isi berbeda. Teks ini tetap ada. Muat ulang di tab baru untuk melihat riwayat dan membuat catatan baru.",
  SIMULATION_UNAVAILABLE:"Simulasi tidak tersedia untuk akunmu.",
  RESUBMIT_NOT_AVAILABLE:"Salinan ini tidak sedang meminta revisi. Periksa status terbaru sebelum kirim ulang.",
  REVISION_REQUIRED:"Ubah dan simpan isi draf atau daftar lampiran terlebih dahulu sebelum mengirim salinan revisi.",
  REVIEW_MANDATE_REQUIRED:"Tindakan memerlukan mandat utama aktif pada tingkat dan wilayah yang sesuai. Pengaju tidak dapat memeriksa simulasinya sendiri.",
  REVIEW_CHECKS_REQUIRED:"Lengkapi seluruh pemeriksaan sebelum meneruskan rekomendasi.",
  CONFLICT_REVIEW_ONLY:"Petugas yang memiliki konflik hanya dapat melaporkan konflik, tanpa mengambil keputusan substansi.",
  INDEPENDENT_REVIEWER_REQUIRED:"Diperlukan petugas lain yang independen. Akun ini pernah melaporkan konflik atau memberi rekomendasi pada tahap sebelumnya.",
  WORKFLOW_CONFLICT:"Tahap atau versi alur sudah berubah. Input tetap ada; buka riwayat di tab baru sebelum mencoba kembali.",
  REVIEW_REQUEST_CONFLICT:"Tindakan sebelumnya sudah diterima dengan isi berbeda. Buka riwayat di tab baru untuk melihat hasil dan memulai tindakan baru.",
  INVALID_REVIEW:"Periksa tindakan, deklarasi, alasan, dan daftar periksa sebelum menyimpan.",
  EVALUATION_PATH_REQUIRED:"Pilih jalur Mikro/Kecil dan konfirmasikan bahwa ini belum menjadi persetujuan program atau dana.",
  PREVIOUS_RECOMMENDATIONS_REQUIRED:"Rekomendasi RT dan RW pada putaran ini belum lengkap. Pengelola perlu memeriksa riwayat sebelum tindakan kelurahan.",
  ATTACHMENT_CONFLICT:"Daftar lampiran sudah berubah. Muat ulang setelah menyimpan perubahan draf, lalu tinjau berkas yang akan dikirim.",
  DOCUMENT_FILE_MISSING:"Salah satu dokumen PRD, RAB, atau surat keaslian sudah dilepas dari draf atau belum siap. Unggah ulang dokumennya pada langkah terkait, simpan, lalu kirim.",
  ATTACHMENTS_PENDING:"Masih ada unggahan yang belum terkonfirmasi. Selesaikan atau lepas reservasinya pada halaman lampiran sebelum mengirim simulasi.",
};
const failure=(message:string)=>({error:errors[message]??"Penyimpanan belum dapat dikonfirmasi. Periksa riwayat di tab baru sebelum mencoba kembali."});
export async function submitSimulation(_state:SimulationFormState,form:FormData):Promise<SimulationFormState>{
  const {supabase}=await requireUser();
  const id=form.get("draft_id"),revision=String(form.get("revision")??""),attachmentRevision=String(form.get("attachment_revision")??"0");
  if(!isUuid(id)||!/^(0|[1-9]\d{0,8})$/.test(revision)||!/^(0|[1-9]\d{0,8})$/.test(attachmentRevision))return {error:"Muat ulang draf sebelum mengirim simulasi."};
  if(form.get("acknowledged")!=="on")return failure("ACK_REQUIRED");
  const previous=form.get("previous_id");
  if(previous&&!isUuid(previous))return {error:"Muat ulang draf sebelum mengirim revisi."};
  // Database memeriksa penunjuk dokumen pada draf; keberadaan berkasnya diperiksa di sini agar dokumen yang dilepas tidak ikut lolos.
  const [draft,files]=await Promise.all([
    supabase.from("innovation_drafts").select("document").eq("id",String(id)).maybeSingle(),
    supabase.rpc("attachment_workflow",{operation:"list_draft",payload:{draft_id:String(id)}}),
  ]);
  if(draft.data&&!files.error){
    const documents=validateDraftDocument(draft.data.document).data.documents;
    const ready=new Set(((files.data as unknown as DraftAttachmentData|null)?.files??[]).filter(f=>f.purpose==="supporting"&&f.storage_state==="ready").map(f=>f.id));
    if(documentSlots.some(slot=>documents[slot.key]&&!ready.has(documents[slot.key]!.attachment_id)))return failure("DOCUMENT_FILE_MISSING");
  }
  const result=await supabase.rpc("simulation_workflow",{operation:"submit",payload:{draft_id:String(id),revision:Number(revision),attachment_revision:Number(attachmentRevision),acknowledged:true,previous_id:previous?String(previous):null}}).abortSignal(AbortSignal.timeout(45000));
  if(result.error)return failure(result.error.message);
  const simulation=result.data as {id:string};
  if(!isUuid(simulation?.id))return failure("UNKNOWN");
  revalidatePath("/pengajuan");revalidatePath(`/pengajuan/${id}`);revalidatePath("/antrean/rt");
  if(previous)revalidatePath(`/simulasi/${previous}`);
  redirect(`/simulasi/${simulation.id}`);
}
export async function saveReview(_state:SimulationFormState,form:FormData):Promise<SimulationFormState>{
  const {supabase}=await requireUser();
  const input=validateReview(form);
  if(Object.keys(input.errors).length)return {errors:input.errors};
  const result=await supabase.rpc("simulation_workflow",{operation:"review",payload:input.payload}).abortSignal(AbortSignal.timeout(45000));
  if(result.error)return failure(result.error.message);
  revalidatePath(`/simulasi/${input.payload.id}`);revalidatePath("/pengajuan");revalidatePath("/pengajuan/[id]","page");
  for(const stage of ["rt","rw","kelurahan"])revalidatePath(`/antrean/${stage}`);
  redirect(`/simulasi/${input.payload.id}?status=tindakan-disimpan`);
}
export async function saveRtNote(_state:SimulationFormState,form:FormData):Promise<SimulationFormState>{
  const {supabase}=await requireUser();
  const input=validateRtNote(form);
  if(Object.keys(input.errors).length)return {errors:input.errors};
  const result=await supabase.rpc("simulation_workflow",{operation:"note",payload:input.payload}).abortSignal(AbortSignal.timeout(45000));
  if(result.error)return failure(result.error.message);
  revalidatePath(`/simulasi/${input.payload.id}`);revalidatePath("/antrean/rt");
  redirect(`/simulasi/${input.payload.id}?status=catatan-disimpan`);
}
