import type { Database } from "@/lib/supabase/database.types";
export type DraftDocument = {
  innovation: { title: string; theme_id: string; form: string; maturity: string; rt_id: string; summary: string; team: { id: string; name: string; role: string }[] };
  prd: Record<string, string>;
  budget: { items: { id: string; description: string; category: string; unit: string; quantity: string; unit_price: string; usage_stage: string }[]; contingency: string; honor: string; maintenance_cost: string; maintenance_months: string };
  declaration: { own_work: boolean; notes: string };
};
export type DraftFormState = { error?: string; errors?: Record<string,string>; saved?: boolean; version?: number; updatedAt?: string; document?: DraftDocument };
export type Theme = { id: string; name: string; active: boolean; is_demo: boolean };
export type Territory = Pick<Database["public"]["Tables"]["territories"]["Row"], "id" | "kind" | "name" | "code" | "parent_id">;
