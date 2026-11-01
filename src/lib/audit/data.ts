import "server-only";
import { redirect } from "next/navigation";
import { requireProgramAdmin } from "@/lib/admin/access";
import type { AuditFilters, AuditLog } from "./types";
export async function getAdminAudit(filters: AuditFilters) {
  const { supabase } = await requireProgramAdmin();
  const result = await supabase.rpc("admin_audit_log", { payload: filters }).abortSignal(AbortSignal.timeout(30000))
    .then(value => value, () => null);
  if (result?.error?.message === "ADMIN_REQUIRED") redirect("/dashboard?status=akses-ditolak");
  return { data: !result || result.error ? null : result.data as unknown as AuditLog | null,
    invalid: Boolean(result?.error && ["22023", "22007", "22008", "22P02"].includes(result.error.code)) };
}
