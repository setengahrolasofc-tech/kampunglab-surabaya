import "server-only";
import { requireUser } from "@/lib/auth/session";
import type { Json } from "@/lib/supabase/database.types";
import type { PhysicalContext } from "./types";
import type { SimulationDetails } from "@/lib/simulations/types";
import { samePhysicalLetterContext, type PhysicalLetter, type PhysicalLetterExpectation } from "./letter";

export class PhysicalLetterError extends Error {
  constructor(public code: "UNAVAILABLE" | "NOT_READY" | "CHANGED" | "LOAD_FAILED") { super(code); }
}
const record = (value: Json | undefined): Record<string, Json | undefined> => value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
const text = (value: Json | undefined, limit: number) => typeof value === "string" ? value.trim().slice(0, limit) : "";

export async function getPhysicalLetter(id: string) {
  const { supabase, user } = await requireUser();
  async function context() {
    const result = await supabase.rpc("physical_workflow", { operation: "context", payload: { simulation_id: id } })
      .abortSignal(AbortSignal.timeout(15000));
    if (result.error) throw new PhysicalLetterError(["PHYSICAL_UNAVAILABLE", "SESSION_REQUIRED"].includes(result.error.message) ? "UNAVAILABLE" : "LOAD_FAILED");
    const data = result.data as unknown as PhysicalContext | null;
    if (!data?.is_owner) throw new PhysicalLetterError("UNAVAILABLE");
    if (!data.stage || !data.eligible) throw new PhysicalLetterError("NOT_READY");
    return data as PhysicalContext & { stage: "rt" | "rw" };
  }
  const current = await context();
  const [simulationResult, profileResult] = await Promise.all([
    supabase.rpc("simulation_workflow", { operation: "details", payload: { id } }).abortSignal(AbortSignal.timeout(15000)),
    supabase.from("profiles").select("display_name").eq("id", user.id).abortSignal(AbortSignal.timeout(15000)).single(),
  ]);
  if (simulationResult.error) throw new PhysicalLetterError(["SIMULATION_UNAVAILABLE", "SESSION_REQUIRED"].includes(simulationResult.error.message) ? "UNAVAILABLE" : "LOAD_FAILED");
  if (profileResult.error) throw new PhysicalLetterError("LOAD_FAILED");
  const details = simulationResult.data as unknown as SimulationDetails | null, sim = details?.simulation;
  if (!details?.is_owner || !sim || sim.owner_id !== user.id || sim.mode !== "demo") throw new PhysicalLetterError("UNAVAILABLE");
  if (!sim.reference || !sim.title) throw new PhysicalLetterError("LOAD_FAILED");
  if (sim.workflow_version !== current.simulation.workflow_version || sim.status !== `waiting_${current.stage}` || sim.queue_entered_at !== current.queue_entered_at) throw new PhysicalLetterError("CHANGED");
  const territories = await supabase.from("territories").select("id,kind,name,code,parent_id")
    .in("id", [sim.rt_id, sim.rw_id, sim.kelurahan_id]).abortSignal(AbortSignal.timeout(15000));
  if (territories.error) throw new PhysicalLetterError("LOAD_FAILED");
  const rt = territories.data.find(row => row.id === sim.rt_id && row.kind === "rt");
  const rw = territories.data.find(row => row.id === sim.rw_id && row.kind === "rw");
  const kelurahan = territories.data.find(row => row.id === sim.kelurahan_id && row.kind === "kelurahan");
  if (!rt || !rw || !kelurahan || rt.parent_id !== rw.id || rw.parent_id !== kelurahan.id) throw new PhysicalLetterError("LOAD_FAILED");
  const prd = record(record(sim.document).prd);
  const data: PhysicalLetter = {
    simulationId: id, reference: sim.reference, title: sim.title, attempt: sim.attempt, draftRevision: sim.draft_revision,
    stage: current.stage, workflowVersion: sim.workflow_version, settingsVersion: current.settings_version,
    queueEnteredAt: current.queue_entered_at, eligibleAt: current.eligible_at, delayDays: current.delay_days,
    generatedAt: current.server_now, applicantName: profileResult.data.display_name,
    rt: `${rt.name} (${rt.code})`, rw: `${rw.name} (${rw.code})`, kelurahan: `${kelurahan.name} (${kelurahan.code})`,
    problem: text(prd.problem, 4000), beneficiaries: text(prd.beneficiaries, 4000), beneficiaryCount: text(prd.beneficiary_count, 10),
  };

  // Downloads check the same owner/session, queue and configuration again after packing the file.
  async function assertCurrent(expected: PhysicalLetterExpectation = data) {
    const latest = await context();
    if (!samePhysicalLetterContext(expected, {
      stage: latest.stage, workflowVersion: latest.simulation.workflow_version,
      settingsVersion: latest.settings_version, queueEnteredAt: latest.queue_entered_at,
    })) throw new PhysicalLetterError("CHANGED");
  }
  return { data, assertCurrent };
}
