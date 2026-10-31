import "server-only";
import {randomUUID} from "node:crypto";
import {requireUser} from "@/lib/auth/session";
import type {DraftAttachmentData} from "./types";
export async function getDraftAttachments(id:string,page:number){
  const {supabase}=await requireUser();
  const result=await supabase.rpc("attachment_workflow",{operation:"list_draft",payload:{draft_id:id,page}}).abortSignal(AbortSignal.timeout(45000));
  if(result.error){
    if(["ATTACHMENT_UNAVAILABLE","SESSION_REQUIRED"].includes(result.error.message))return null;
    throw new Error("Daftar lampiran belum dapat dimuat.");
  }
  return {...(result.data as unknown as DraftAttachmentData),requestId:randomUUID()};
}
