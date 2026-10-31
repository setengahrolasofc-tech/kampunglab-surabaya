"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireUser} from "@/lib/auth/session";
import {isUuid} from "@/lib/admin/validation.mjs";
import {edgeFileError,fileErrorMessage} from "@/lib/attachments/errors";
import type {FileActionState} from "@/lib/attachments/types";
const refresh=(id:string)=>{revalidatePath(`/pengajuan/${id}`);revalidatePath(`/pengajuan/${id}/lampiran`);revalidatePath("/pengajuan");};
export async function uploadAttachment(_state:FileActionState,form:FormData):Promise<FileActionState>{
  const {supabase}=await requireUser();
  const draftId=form.get("draft_id"),requestId=form.get("request_id"),file=form.get("file");
  if(!isUuid(draftId)||!isUuid(requestId)||!(file instanceof File)||file.size===0)return {error:"Pilih berkas dan muat ulang halaman bila isian tidak tersedia."};
  if(file.size>3*1024*1024)return {error:fileErrorMessage("FILE_TOO_LARGE")};
  const body=new FormData();body.set("operation","upload");body.set("draft_id",String(draftId));body.set("request_id",String(requestId));body.set("file",file);
  const result=await supabase.functions.invoke<{id:string}>("private-attachments",{body,timeout:60000});
  if(result.error)return {error:fileErrorMessage(await edgeFileError(result.error))};
  if(!isUuid(result.data?.id))return {error:fileErrorMessage("UNKNOWN")};
  refresh(String(draftId));
  return {message:"Lampiran berhasil diunggah dan dicatat pada draf. Salinan yang sudah dikirim tetap memakai lampiran sebelumnya.",nextRequestId:randomUUID()};
}
export async function archiveAttachment(_state:FileActionState,form:FormData):Promise<FileActionState>{
  const {supabase}=await requireUser();
  const id=form.get("id"),draftId=form.get("draft_id");
  if(!isUuid(id)||!isUuid(draftId))return {error:"Muat ulang daftar lampiran sebelum melanjutkan."};
  const result=await supabase.rpc("attachment_workflow",{operation:"archive",payload:{id:String(id),draft_id:String(draftId)}}).abortSignal(AbortSignal.timeout(45000));
  if(result.error)return {error:fileErrorMessage(result.error.message)};
  refresh(String(draftId));redirect(`/pengajuan/${draftId}/lampiran?status=dilepas`);
}
export async function restoreAttachment(_state:FileActionState,form:FormData):Promise<FileActionState>{
  const {supabase}=await requireUser();
  const id=form.get("id"),draftId=form.get("draft_id");
  if(!isUuid(id)||!isUuid(draftId))return {error:"Muat ulang daftar lampiran sebelum melanjutkan."};
  const result=await supabase.rpc("attachment_workflow",{operation:"restore",payload:{id:String(id),draft_id:String(draftId)}}).abortSignal(AbortSignal.timeout(45000));
  if(result.error)return {error:fileErrorMessage(result.error.message)};
  refresh(String(draftId));redirect(`/pengajuan/${draftId}/lampiran?status=dipulihkan`);
}
