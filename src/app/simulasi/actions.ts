"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/admin/validation.mjs";
import { validateRtNote } from "@/lib/simulations/validation.mjs";
import type { SimulationFormState } from "@/lib/simulations/types";
const errors:Record<string,string>={
  INCOMPLETE_DRAFT:"Lengkapi seluruh isian pokok dan simpan draf sebelum mengirim simulasi.",
  DEMO_ONLY:"Simulasi hanya tersedia untuk tema DEMO aktif dan hierarki wilayah berkode DEMO.",
  ACK_REQUIRED:"Konfirmasikan bahwa kamu memahami pembagian salinan DEMO kepada petugas RT yang berwenang.",
  DRAFT_CONFLICT:"Draf sudah berubah. Muat ulang setelah menyimpan salinan perubahanmu, lalu periksa versi yang akan dikirim.",
  SESSION_REQUIRED:"Sesi sudah tidak berlaku. Masuk kembali sebelum melanjutkan.",
  RT_MANDATE_REQUIRED:"Catatan memerlukan mandat utama RT yang aktif pada wilayah ini. Pengaju tidak dapat memeriksa simulasinya sendiri.",
  CONFLICT_NOTE_ONLY:"Saat melaporkan konflik, catatan dapat disimpan tanpa checklist pemeriksaan.",
  NOTE_REQUEST_CONFLICT:"Catatan sebelumnya sudah diterima dengan isi berbeda. Teks ini tetap ada. Muat ulang di tab baru untuk melihat riwayat dan membuat catatan baru.",
  SIMULATION_UNAVAILABLE:"Simulasi tidak tersedia untuk akunmu.",
};
const failure=(message:string)=>({error:errors[message]??"Penyimpanan belum dapat dikonfirmasi. Periksa riwayat di tab baru sebelum mencoba kembali."});
export async function submitSimulation(_state:SimulationFormState,form:FormData):Promise<SimulationFormState>{
  const {supabase}=await requireUser();
  const id=form.get("draft_id"),revision=String(form.get("revision")??"");
  if(!isUuid(id)||!/^(0|[1-9]\d{0,8})$/.test(revision))return {error:"Muat ulang draf sebelum mengirim simulasi."};
  if(form.get("acknowledged")!=="on")return failure("ACK_REQUIRED");
  const result=await supabase.rpc("simulation_workflow",{operation:"submit",payload:{draft_id:String(id),revision:Number(revision),acknowledged:true}}).abortSignal(AbortSignal.timeout(45000));
  if(result.error)return failure(result.error.message);
  const simulation=result.data as {id:string};
  if(!isUuid(simulation?.id))return failure("UNKNOWN");
  revalidatePath("/pengajuan");revalidatePath(`/pengajuan/${id}`);revalidatePath("/antrean/rt");
  redirect(`/simulasi/${simulation.id}`);
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
