import "server-only";
import { requireUser } from "./session";
import { isCurrentGrant } from "./validation.mjs";
import type { SimulationCapabilities } from "@/lib/simulations/types";
import type { ReviewStage } from "@/lib/simulations/workflow";

export async function getAccountSnapshot() {
  const { supabase, user } = await requireUser();
  const [profile, mandates, roles, admin, simulation] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("office_mandates").select("id, mandate_type, starts_at, ends_at, status, offices(name, active)").eq("user_id", user.id),
    supabase.from("platform_role_grants").select("id, role, starts_at, ends_at, status").eq("user_id", user.id),
    supabase.rpc("is_program_admin"),
    supabase.rpc("simulation_workflow",{operation:"capabilities"}),
  ]);
  // Request-time snapshot for presentation. Future privileged writes must
  // recheck mandate scope and time inside the database transaction.
  const now = Date.now();
  const capabilities=simulation.data as SimulationCapabilities|null;
  return {
    user,
    profile: profile.data,
    currentMandates: (mandates.data ?? []).filter((item) => isCurrentGrant(item, now) && item.offices?.active),
    currentRoles: (roles.data ?? []).filter((item) => isCurrentGrant(item, now)),
    isAdmin: admin.data === true && !admin.error,
    reviewStages: simulation.error?[]:(["rt","rw","kelurahan"] as ReviewStage[]).filter(stage=>(capabilities?.territory_ids?.[stage]?.length??0)>0),
    error: Boolean(profile.error || mandates.error || roles.error || simulation.error || !profile.data),
  };
}
