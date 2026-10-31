"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {requireUser} from "@/lib/auth/session";
import {isUuid} from "@/lib/admin/validation.mjs";
import {validatePanel,type PanelOperation} from "@/lib/panel/validation";
import type {PanelFormState,PanelCandidate} from "@/lib/panel/types";
const messages:Record<string,string>={SESSION_REQUIRED:"Sesi sudah berakhir. Masuk kembali.",ADMIN_REQUIRED:"Pengelolaan panel memerlukan admin program aktif.",PANEL_UNAVAILABLE:"Panel atau penugasan tidak tersedia untuk akunmu.",PANEL_OWNER_REQUIRED:"Hanya pengaju dapat mengatur pembagian berkasnya ke panel.",PANEL_REASON_REQUIRED:"Lengkapi alasan perubahan.",PANEL_ACK_REQUIRED:"Lengkapi persetujuan atau deklarasi simulasi yang diwajibkan.",PANEL_SHARING_PAUSED:"Pengaju sedang menjeda pembagian. Penugasan baru belum tersedia.",PANEL_REVIEWER_REQUIRED:"Akun harus terkonfirmasi dan mempunyai peran reviewer yang masih berlaku.",INDEPENDENT_REVIEWER_REQUIRED:"Diperlukan reviewer independen lain; pengaju, pemberi rekomendasi sebelumnya, atau pelapor konflik tidak dapat menilai.",PANEL_SEAT_CONFLICT:"Kursi telah terisi atau akun pernah ditugaskan pada panel ini. Periksa daftar terbaru dan pilih pengganti lain.",PANEL_VERSION_CONFLICT:"Susunan atau pembagian panel telah berubah. Buka riwayat di tab baru sebelum mencoba kembali.",WORKFLOW_CONFLICT:"Versi alur telah berubah. Periksa salinan terbaru.",PANEL_REQUEST_CONFLICT:"Permintaan dengan kode yang sama tercatat dengan isi berbeda. Periksa riwayat sebelum memulai permintaan baru.",PANEL_ENTRY_LOCKED:"Penugasan ini sudah memiliki nilai atau laporan konflik yang terkunci.",PANEL_SCORES_REQUIRED:"Periksa kelima skor dan batas maksimum setiap aspek.",CONFLICT_REVIEW_ONLY:"Laporan konflik tidak dapat berisi nilai atau suara substansi."};
const failure=(code:string):PanelFormState=>({error:messages[code]??"Hasil penyimpanan belum dapat dikonfirmasi. Input tetap ada; periksa riwayat di tab baru sebelum mencoba kembali."});
async function mutate(operation:PanelOperation,form:FormData):Promise<PanelFormState>{
  const {supabase}=await requireUser(),input=validatePanel(form,operation);if(Object.keys(input.errors).length)return {errors:input.errors};
  const result=await supabase.rpc("panel_workflow",{operation,payload:input.payload}).abortSignal(AbortSignal.timeout(45000));
  if(result.error)return failure(result.error.message);
  revalidatePath("/panel");revalidatePath("/panel/penugasan/[id]","page");revalidatePath("/simulasi/[id]/panel","page");revalidatePath("/admin/panel");revalidatePath("/admin/panel/[id]","page");
  const data=result.data as {assignment_id?:string;case_id?:string;simulation_id?:string};
  if(operation==="entry"&&isUuid(data.assignment_id))redirect(`/panel/penugasan/${data.assignment_id}?status=disimpan`);
  if(operation==="sharing"&&isUuid(data.simulation_id))redirect(`/simulasi/${data.simulation_id}/panel?status=disimpan`);
  if(isUuid(data.case_id))redirect(`/admin/panel/${data.case_id}?status=disimpan`);
  return failure("UNKNOWN");
}
export async function sharePanel(_state:PanelFormState,form:FormData){return mutate("sharing",form);}
export async function assignPanel(_state:PanelFormState,form:FormData){return mutate("assign",form);}
export async function revokePanel(_state:PanelFormState,form:FormData){return mutate("revoke",form);}
export async function submitPanelEntry(_state:PanelFormState,form:FormData){return mutate("entry",form);}
export async function findPanelCandidate(_state:PanelFormState,form:FormData):Promise<PanelFormState>{
  const {supabase}=await requireUser(),caseId=form.get("case_id"),email=String(form.get("email")??"").trim();
  if(!isUuid(caseId)||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:"Isi email lengkap akun terkonfirmasi yang ingin ditugaskan."};
  const r=await supabase.rpc("panel_workflow",{operation:"candidate",payload:{case_id:String(caseId),email}}).abortSignal(AbortSignal.timeout(45000));
  if(r.error)return failure(r.error.message);return {candidate:r.data as unknown as PanelCandidate};
}
