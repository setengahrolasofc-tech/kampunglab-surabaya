import type { Database } from "@/lib/supabase/database.types";
export type DraftDocument = {
  innovation: { title: string; theme_id: string; form: string; rt_id: string; summary: string; team: { id: string; name: string; role: string }[] };
  prd: Record<string, string>;
  budget: { items: { id: string; description: string; category: string; unit: string; quantity: string; unit_price: string; usage_stage: string }[]; subtotal: string; contingency: string; honor: string; maintenance_cost: string; maintenance_months: string };
  declaration: { own_work: boolean; notes: string };
  documents: Partial<Record<DocumentSlotKey, DraftDocumentSlot>>;
};
export type DocumentSlotKey = "prd" | "rab" | "declaration";
export type DocumentCheckStatus = "lulus" | "perlu_dicek" | "perlu_perbaikan" | "tidak_diperiksa";
export type DocumentCheck = {
  status: DocumentCheckStatus; summary: string; issues: string[]; checked_title: string; checked_at: string;
  signature: "ada" | "tidak_ada" | "tidak_jelas" | "tidak_perlu"; title_match: "ya" | "tidak" | "tidak_terbaca"; ai: boolean;
  extracted: { ordinary?: number; contingency?: number; honor?: number; maintenance?: number };
};
export type DraftDocumentSlot = { attachment_id: string; file_name: string; check: DocumentCheck };
export type DocumentUploadState = { error?: string; slot?: DraftDocumentSlot; nextRequestId?: string };
export type DraftFormState = { error?: string; errors?: Record<string,string>; saved?: boolean; version?: number; updatedAt?: string; document?: DraftDocument };
export type Theme = { id: string; name: string; active: boolean; is_demo: boolean };
export type Territory = Pick<Database["public"]["Tables"]["territories"]["Row"], "id" | "kind" | "name" | "code" | "parent_id">;
