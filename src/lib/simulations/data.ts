import "server-only";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/session";
import type { SimulationDetails } from "./types";
export async function getSimulation(id:string) {
  const { supabase }=await requireUser();
  const result=await supabase.rpc("simulation_workflow",{operation:"details",payload:{id}}).abortSignal(AbortSignal.timeout(45000));
  if(result.error){
    if(result.error.message==="SIMULATION_UNAVAILABLE"||result.error.message==="SESSION_REQUIRED")return null;
    throw new Error("Salinan simulasi belum dapat dimuat.");
  }
  return {...(result.data as unknown as SimulationDetails),requestId:randomUUID()};
}
export async function getRtQueue(page:number) {
  const { supabase,user }=await requireUser();
  const capabilities=await supabase.rpc("simulation_workflow",{operation:"capabilities"});
  const capability=capabilities.data as {can_review_rt?:boolean}|null;
  if(capabilities.error||!capability?.can_review_rt)return {canReview:false,rows:[],count:0};
  const result=await supabase.from("innovation_simulations").select("id,reference,title,rt_id,submitted_at,draft_revision",{count:"exact"})
    .neq("owner_id",user.id).order("submitted_at").order("id").range(page*20,page*20+19);
  if(result.error)throw new Error("Antrean RT belum dapat dimuat.");
  return {canReview:true,rows:result.data??[],count:result.count??0};
}
