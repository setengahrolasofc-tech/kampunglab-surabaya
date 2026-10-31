import "server-only";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/session";
import type { createServerSupabaseClient } from "@/lib/supabase/server";
type Client = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function catalogs(supabase: Client) {
  const [profile, territories, themes] = await Promise.all([
    supabase.from("profiles").select("display_name,domicile_rt_id").maybeSingle(),
    supabase.from("territories").select("id,kind,name,code,parent_id", { count: "exact" }).order("id").limit(1000),
    supabase.from("innovation_themes").select("id,name,is_demo,active").order("code"),
  ]);
  if (profile.error || territories.error || themes.error || !profile.data) throw new Error("Data profil dan pilihan pengajuan belum dapat dimuat.");
  if ((territories.count ?? 0) > 1000) throw new Error("Daftar wilayah melampaui kapasitas prototipe. Hubungi pengelola untuk pemuatan wilayah bertahap.");
  return { profile: profile.data, territories: territories.data ?? [], themes: themes.data ?? [] };
}
export async function getDraftContext() {
  const { supabase } = await requireUser();
  return catalogs(supabase);
}
export async function getDraftList(page = 0) {
  const { supabase } = await requireUser();
  const [context, list] = await Promise.all([
    catalogs(supabase),
    supabase.from("innovation_drafts").select("id,title,revision,current_step,updated_at,status", { count: "exact" })
      .order("updated_at", { ascending: false }).order("id").range(page * 20, page * 20 + 19),
  ]);
  if (list.error) throw new Error("Daftar pengajuan belum dapat dimuat.");
  const simulations=list.data?.length?await supabase.from("innovation_simulations").select("id,draft_id,reference,draft_revision,submitted_at,status,attempt").in("draft_id",list.data.map(d=>d.id)).order("attempt",{ascending:false}):null;
  if(simulations?.error)throw new Error("Daftar simulasi belum dapat dimuat.");
  return { ...context, drafts: list.data ?? [], simulations:simulations?.data??[], count: list.count ?? 0, requestId: randomUUID() };
}
export async function getDraftEditor(id: string) {
  const { supabase } = await requireUser();
  const [context, draft, simulation] = await Promise.all([
    catalogs(supabase),
    supabase.from("innovation_drafts").select("id,document,revision,current_step,updated_at").eq("id", id).maybeSingle(),
    supabase.from("innovation_simulations").select("id,reference,draft_revision,submitted_at,status,attempt").eq("draft_id",id).order("attempt",{ascending:false}).limit(1).maybeSingle(),
  ]);
  if (draft.error||simulation.error) throw new Error("Draf belum dapat dimuat.");
  return { ...context, draft: draft.data, simulation:simulation.data };
}
