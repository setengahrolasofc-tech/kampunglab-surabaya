import "server-only";
import {requireUser} from "@/lib/auth/session";
import {redirect} from "next/navigation";
import type {Json} from "@/lib/supabase/database.types";
import type {PanelDetails,PanelAdminList,PanelQueue,PanelAssignedCase} from "./types";
async function read(operation:string,payload:Json={}){const {supabase}=await requireUser();return supabase.rpc("panel_workflow",{operation,payload}).abortSignal(AbortSignal.timeout(45000));}
export async function getPanelDetails(id:string,page=0,admin=false){
  const r=await read(admin?"admin_details":"details",{[admin?"case_id":"simulation_id"]:id,page});
  if(r.error){if(r.error.message==="ADMIN_REQUIRED")redirect("/dashboard?status=akses-ditolak");if(["PANEL_UNAVAILABLE","PANEL_REVIEWER_VIEW_ONLY","SESSION_REQUIRED"].includes(r.error.message))return null;throw new Error("Rincian panel belum dapat dimuat.");}
  return r.data as unknown as PanelDetails;
}
export async function getPanelAdminList(page:number){
  const r=await read("admin_list",{page});if(r.error){if(r.error.message==="ADMIN_REQUIRED")redirect("/dashboard?status=akses-ditolak");throw new Error("Daftar penyiapan panel belum dapat dimuat.");}return r.data as unknown as PanelAdminList;
}
export async function getPanelQueue(page:number){const r=await read("my_queue",{page});if(r.error)throw new Error("Daftar penugasan reviewer belum dapat dimuat.");return r.data as unknown as PanelQueue;}
export async function getPanelAssignment(id:string){const r=await read("assignment",{assignment_id:id});if(r.error){if(["PANEL_UNAVAILABLE","PANEL_REVIEWER_VIEW_ONLY","SESSION_REQUIRED"].includes(r.error.message))return null;throw new Error("Penugasan panel belum dapat dimuat.");}return r.data as unknown as PanelAssignedCase;}
