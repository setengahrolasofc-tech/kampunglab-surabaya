import type { Database } from "@/lib/supabase/database.types";
export const aggregationLabels = { mean: "Rata-rata", median: "Median", consensus: "Nilai konsensus manual" } as const;
export type ProgramProposal = {
  schema_version: "program-proposal-v1"; code: string; name: string; summary: string; period_start: string | null; period_end: string | null;
  micro_evaluator: string; aggregation: keyof typeof aggregationLabels | null; minimum_score: number | null; minimum_agree: number | null;
  require_three: boolean | null; agree_requires_minimum: boolean | null;
};
export const blankProgramProposal = (): ProgramProposal => ({ schema_version: "program-proposal-v1", code: "", name: "", summary: "", period_start: null, period_end: null, micro_evaluator: "", aggregation: null, minimum_score: null, minimum_agree: null, require_three: null, agree_requires_minimum: null });
export type ProgramRoot = Database["public"]["Tables"]["program_drafts"]["Row"];
export type ProgramVersion = Omit<Database["public"]["Tables"]["program_draft_versions"]["Row"], "document"> & { document: ProgramProposal };
export type ProgramDetails = { program: ProgramRoot; current: ProgramVersion; selected: ProgramVersion; history_count: number; history: Pick<ProgramVersion, "version" | "actor_id" | "actor_name" | "reason" | "created_at">[] };
export type ProgramListData = { count: number; rows: (Pick<ProgramRoot, "id" | "code" | "state" | "version" | "updated_at"> & { name: string; period_start: string | null; period_end: string | null })[] };
export type ProgramFormState = { error?: string; errors?: Record<string, string> };
