import "server-only";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/session";
import type { SimulationDetails, SimulationCapabilities } from "./types";
import type { ReviewStage } from "./workflow";
import type {Attachment} from "@/lib/attachments/types";
export async function getSimulation(id:string) {
  const { supabase }=await requireUser();
  const [result,files]=await Promise.all([
    supabase.rpc("simulation_workflow",{operation:"details",payload:{id}}).abortSignal(AbortSignal.timeout(45000)),
    supabase.rpc("attachment_workflow",{operation:"list_simulation",payload:{simulation_id:id}}).abortSignal(AbortSignal.timeout(45000)),
  ]);
  if(result.error){
    if(result.error.message==="SIMULATION_UNAVAILABLE"||result.error.message==="SESSION_REQUIRED")return null;
    throw new Error("Salinan simulasi belum dapat dimuat.");
  }
  if(files.error)throw new Error("Lampiran salinan belum dapat dimuat.");
  return {...(result.data as unknown as SimulationDetails),files:(files.data as unknown as {files:Attachment[]}).files,requestId:randomUUID()};
}
export async function getReviewQueue(stage:ReviewStage,page:number,view:"pending"|"evaluation"="pending") {
  const { supabase,user }=await requireUser();
  const capabilities=await supabase.rpc("simulation_workflow",{operation:"capabilities"});
  const capability=capabilities.data as SimulationCapabilities|null;
  if(capabilities.error)throw new Error("Hak pemeriksaan belum dapat dimuat.");
  const ids=capability?.territory_ids?.[stage]??[];
  if(!ids.length)return {canReview:false,rows:[],count:0};
  const column=stage==="rt"?"rt_id":stage==="rw"?"rw_id":"kelurahan_id";
  const status=stage==="kelurahan"&&view==="evaluation"?"waiting_evaluation":`waiting_${stage}`;
  const result=await supabase.from("innovation_simulations").select("id,reference,title,rt_id,submitted_at,draft_revision,attempt,status,evaluation_path",{count:"exact"})
    .in(column,ids).eq("status",status).neq("owner_id",user.id).order("submitted_at").order("id").range(page*20,page*20+19);
  if(result.error)throw new Error("Antrean simulasi belum dapat dimuat.");
  return {canReview:true,rows:result.data??[],count:result.count??0};
}
