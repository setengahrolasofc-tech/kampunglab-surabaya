import type { PhysicalStage } from "./types";

export const PHYSICAL_LETTER_VERSION = "demo-physical-letter-v1";
export type PhysicalLetter = {
  simulationId: string; reference: string; title: string; attempt: number; draftRevision: number;
  stage: PhysicalStage; workflowVersion: number; settingsVersion: number; queueEnteredAt: string;
  eligibleAt: string; delayDays: number; generatedAt: string; applicantName: string;
  rt: string; rw: string; kelurahan: string; problem: string; beneficiaries: string; beneficiaryCount: string;
};
export type PhysicalLetterExpectation = Pick<PhysicalLetter, "stage" | "workflowVersion" | "settingsVersion" | "queueEnteredAt">;
export const physicalLetterChecks: Record<PhysicalStage, readonly string[]> = {
  rt: ["Domisili pemohon sesuai wilayah RT ini telah diperiksa.", "Masalah yang diuraikan nyata dan terjadi di lingkungan ini.", "Perkiraan penerima manfaat telah diperiksa kewajarannya.", "Saya tidak mempunyai konflik kepentingan untuk melakukan pemeriksaan ini."],
  rw: ["Rekomendasi RT dan kelayakan lokal telah diperiksa.", "Potensi duplikasi dengan inovasi lain telah diperiksa secara manual.", "Kewajaran rencana anggaran biaya telah diperiksa.", "Saya tidak mempunyai konflik kepentingan untuk melakukan pemeriksaan ini."],
};

export function physicalLetterSearch(data: PhysicalLetterExpectation) {
  return new URLSearchParams({ stage: data.stage, version: String(data.workflowVersion), settings: String(data.settingsVersion), queue: data.queueEnteredAt }).toString();
}

export function physicalLetterExpectation(query: URLSearchParams): PhysicalLetterExpectation | null {
  if (["stage", "version", "settings", "queue"].some(key => query.getAll(key).length !== 1)) return null;
  const stage = query.get("stage"), version = query.get("version") ?? "", settings = query.get("settings") ?? "", queue = query.get("queue") ?? "";
  if ((stage !== "rt" && stage !== "rw") || !/^\d{1,10}$/.test(version) || !/^\d{1,10}$/.test(settings)
    || queue.length > 40 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(queue)
    || !Number.isFinite(Date.parse(queue))) return null;
  // Keep the database timestamp intact, including microseconds, for version comparison.
  return { stage, workflowVersion: Number(version), settingsVersion: Number(settings), queueEnteredAt: queue };
}

export const samePhysicalLetterContext = (a: PhysicalLetterExpectation, b: PhysicalLetterExpectation) => a.stage === b.stage && a.workflowVersion === b.workflowVersion && a.settingsVersion === b.settingsVersion && a.queueEnteredAt === b.queueEnteredAt;
