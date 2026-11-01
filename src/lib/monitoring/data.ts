import "server-only";
import { redirect } from "next/navigation";
import { requireProgramAdmin } from "@/lib/admin/access";
import type { MonitoringFilters, MonitoringReport } from "./types";

export async function getMonitoringReport(filters: MonitoringFilters) {
  const { supabase } = await requireProgramAdmin();
  const result = await supabase.rpc("program_monitoring", { operation: "report", payload: filters })
    .abortSignal(AbortSignal.timeout(30000)).then(value => value, () => null);
  if (result?.error?.message === "ADMIN_REQUIRED") redirect("/dashboard?status=akses-ditolak");
  return { data: !result || result.error ? null : result.data as unknown as MonitoringReport | null, invalidFilter: result?.error?.message === "INVALID_FILTER" };
}
