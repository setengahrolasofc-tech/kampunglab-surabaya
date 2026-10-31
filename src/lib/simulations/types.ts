import type { Database } from "@/lib/supabase/database.types";
import type { DecisionStage, ReviewStage, EvaluationPath } from "./workflow";
export type Simulation = Database["public"]["Tables"]["innovation_simulations"]["Row"];
export type SimulationRef = Pick<Simulation,"id"|"reference"|"draft_revision"|"submitted_at"|"status"|"attempt"|"attachment_revision">;
export type RtNote = { id:string; actor_name:string; office_name:string; body:string; domicile_checked:boolean; problem_checked:boolean; family_conflict:boolean; created_at:string };
export type ReviewEvent = { id:string; actor_name:string; office_name:string; stage:DecisionStage; outcome:string; body:string; checks:Record<string,boolean>; evaluation_path:EvaluationPath|null; evaluation_acknowledged:boolean; from_status:string; to_status:string; created_at:string };
export type SimulationCapabilities = {can_review_rt:boolean;can_review_rw:boolean;can_review_kelurahan:boolean;territory_ids:Record<ReviewStage,string[]>};
export type SimulationDetails = { simulation:Simulation; is_owner:boolean; can_note:boolean; action_stage:DecisionStage|null; decision_blocked:boolean; route_ready:boolean; next_id:string|null; notes:RtNote[];events:ReviewEvent[] };
export type SimulationFormState = { error?:string; errors?:Record<string,string> };
