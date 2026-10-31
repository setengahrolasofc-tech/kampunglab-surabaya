import "server-only";
import {requireUser} from "@/lib/auth/session";
import {redirect} from "next/navigation";
import type {PhysicalContext,PhysicalDetails,PhysicalQueue,PhysicalSettings} from "./types";
async function read(operation:string,payload:Record<string,string|number>={}){
  const {supabase}=await requireUser();
  return supabase.rpc("physical_workflow",{operation,payload}).abortSignal(AbortSignal.timeout(45000));
}
export async function getPhysicalContext(id:string,page=0){
  const result=await read("context",{simulation_id:id,page});
  if(result.error){if(["PHYSICAL_UNAVAILABLE","SESSION_REQUIRED"].includes(result.error.message))return null;throw new Error("Batas waktu dan jalur fisik belum dapat dimuat.");}
  return result.data as unknown as PhysicalContext;
}
export async function getPhysicalDetails(id:string){
  const result=await read("details",{id});
  if(result.error){if(["PHYSICAL_UNAVAILABLE","SESSION_REQUIRED"].includes(result.error.message))return null;throw new Error("Permintaan dokumen fisik belum dapat dimuat.");}
  return result.data as unknown as PhysicalDetails;
}
export async function getPhysicalQueue(page:number,view:"pending"|"history"){
  const result=await read("queue",{page,view});
  if(result.error)throw new Error("Antrean dokumen fisik belum dapat dimuat.");
  return result.data as unknown as PhysicalQueue;
}
export async function getPhysicalSettings(){
  const result=await read("settings");
  if(result.error){if(["PROGRAM_ADMIN_REQUIRED","SESSION_REQUIRED"].includes(result.error.message))redirect("/dashboard?status=akses-ditolak");throw new Error("Pengaturan jalur fisik belum dapat dimuat.");}
  return result.data as unknown as PhysicalSettings;
}
