import "server-only";
import { redirect } from "next/navigation";
import { requireProgramAdmin } from "@/lib/admin/access";
import type { Json } from "@/lib/supabase/database.types";
import type { ProgramDetails, ProgramListData } from "./types";
async function read(operation: string, payload: Json) {
  const { supabase } = await requireProgramAdmin();
  const result = await supabase.rpc("program_draft_workflow", { operation, payload }).abortSignal(AbortSignal.timeout(30000)).then(value => value, () => null);
  if (result?.error?.message === "ADMIN_REQUIRED") redirect("/dashboard?status=akses-ditolak");
  return result;
}
export async function getProgramDrafts(page: number) {
  const result = await read("list", { page });
  return !result || result.error ? null : result.data as unknown as ProgramListData;
}
export async function getProgramDraft(id: string, page: number, selectedVersion: number | null) {
  const result = await read("details", { id, page, selected_version: selectedVersion });
  if (result?.error?.message === "PROGRAM_DRAFT_UNAVAILABLE") return null;
  if (!result || result.error) throw new Error("Draf program belum dapat dimuat. Muat ulang halaman.");
  return result.data as unknown as ProgramDetails;
}
