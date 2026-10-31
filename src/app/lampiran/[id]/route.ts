import {requireUser} from "@/lib/auth/session";
import {isUuid} from "@/lib/admin/validation.mjs";
import {edgeFileError,fileErrorMessage} from "@/lib/attachments/errors";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow"};
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params,simulationId=new URL(request.url).searchParams.get("simulasi"),physicalId=new URL(request.url).searchParams.get("fisik");
  if(!isUuid(id)||(simulationId!==null&&!isUuid(simulationId))||(physicalId!==null&&!isUuid(physicalId)))return Response.json({error:"Lampiran tidak tersedia."},{status:404,headers});
  const {supabase}=await requireUser();
  const result=await supabase.functions.invoke<Blob>("private-attachments",{body:{operation:"download",id,simulation_id:simulationId,physical_request_id:physicalId},timeout:60000});
  if(result.error){
    const code=await edgeFileError(result.error);
    return Response.json({error:fileErrorMessage(code)},{status:code==="ATTACHMENT_UNAVAILABLE"?404:code==="SESSION_REQUIRED"?401:503,headers});
  }
  if(!(result.data instanceof Blob))return Response.json({error:fileErrorMessage("UNKNOWN")},{status:503,headers});
  return new Response(result.data,{headers:{...headers,"Content-Type":"application/octet-stream","Content-Security-Policy":"sandbox","Content-Disposition":result.response?.headers.get("Content-Disposition")??'attachment; filename="lampiran"'}});
}
