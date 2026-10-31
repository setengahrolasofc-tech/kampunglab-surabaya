import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import type { Json } from "@/lib/supabase/database.types";
import type { AdminOverview, UserAccess } from "./types";

export async function requireProgramAdmin() {
  const session = await requireUser();
  const { data, error } = await session.supabase.rpc("is_program_admin");
  if (error || data !== true) redirect("/dashboard?status=akses-ditolak");
  return session;
}

export async function getAdminData(userId?: string) {
  const { supabase, user } = await requireProgramAdmin();
  const [overview, account] = await Promise.all([
    supabase.rpc("admin_access", { p_operation: "overview" }),
    userId ? supabase.rpc("admin_access", { p_operation: "lookup_user", p_payload: { user_id: userId } }) : Promise.resolve(null),
  ]);
  return { actorId: user.id, now: Date.now(), overview: overview.data as unknown as AdminOverview | null,
    account: account?.data as unknown as UserAccess | null, error: Boolean(overview.error || account?.error) };
}

export async function manageAccess(operation: string, payload: Json) {
  const { supabase } = await requireProgramAdmin();
  return supabase.rpc("admin_access", { p_operation: operation, p_payload: payload });
}
