import "server-only";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { isUuid } from "@/lib/form";
import type { FundRow, InnovationRow, MemberRow } from "@/lib/types";

/** Memuat pengajuan milik Inovator yang sedang masuk (RLS tetap menjadi penentu). */
export async function loadOwnProject(id: string) {
  if (!isUuid(id)) notFound();
  const session = await requireRole("INNOVATOR");
  const { supabase, userId } = session;
  await supabase.rpc("sync_due_tests");
  const { data: inv } = await supabase.from("innovations").select("*, kelurahan:master_kelurahan(kecamatan, kelurahan)").eq("id", id).eq("leader_user_id", userId).maybeSingle();
  if (!inv) notFound();
  const [{ data: members }, { data: funds }] = await Promise.all([
    supabase.from("innovation_members").select("*").eq("innovation_id", id).order("urutan"),
    supabase.from("logbooks_and_funds").select("*").eq("innovation_id", id).order("created_at"),
  ]);
  return { ...session, inv: inv as InnovationRow, members: (members ?? []) as MemberRow[], funds: (funds ?? []) as FundRow[] };
}

export async function loadParams(supabase: Awaited<ReturnType<typeof requireRole>>["supabase"]) {
  const { data } = await supabase.from("system_parameters").select("key, value");
  const out: Record<string, number | boolean> = {};
  for (const r of data ?? []) out[r.key] = r.value as number | boolean;
  return out;
}
