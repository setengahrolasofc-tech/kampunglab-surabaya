import type { Database } from "@/lib/supabase/database.types";
export type Simulation = Database["public"]["Tables"]["innovation_simulations"]["Row"];
export type SimulationRef = Pick<Simulation,"id"|"reference"|"draft_revision"|"submitted_at">;
export type RtNote = { id:string; actor_name:string; office_name:string; body:string; domicile_checked:boolean; problem_checked:boolean; family_conflict:boolean; created_at:string };
export type SimulationDetails = { simulation:Simulation; can_note:boolean; route_ready:boolean; notes:RtNote[] };
export type SimulationFormState = { error?:string; errors?:Record<string,string> };
