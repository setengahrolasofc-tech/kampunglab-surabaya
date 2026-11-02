import { aggregationLabels, type ProgramProposal } from "./types";
export const proposalLabels = {
  code: "Kode draf", name: "Nama program/periode", summary: "Ringkasan", period_start: "Usulan awal periode", period_end: "Usulan akhir periode",
  micro_evaluator: "Usulan penilai Mikro", aggregation: "Usulan rumus panel Kecil", minimum_score: "Usulan ambang skor",
  minimum_agree: "Usulan minimal suara Setuju", require_three: "Usulan ketiga reviewer wajib selesai", agree_requires_minimum: "Usulan skor minimum tiap reviewer yang Setuju",
} as const;
export type ProposalKey = keyof typeof proposalLabels;
const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
const periodFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });
export const programDate = (value: string) => dateFormat.format(new Date(value)) + " WIB";
export const programPeriod = (value: string | null) => value ? periodFormat.format(new Date(value + "T00:00:00Z")) : "Belum diusulkan";
export function proposalValue(doc: ProgramProposal, key: ProposalKey): string {
  const value = doc[key];
  if (value === null) return "Belum diusulkan";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (key === "period_start" || key === "period_end") return programPeriod(String(value));
  if (key === "aggregation") return aggregationLabels[value as keyof typeof aggregationLabels];
  return value === "" ? "Belum diisi" : String(value);
}
export function missingProposalFields(doc: ProgramProposal) {
  return (["period_start", "period_end", "micro_evaluator", "aggregation", "minimum_score", "minimum_agree", "require_three", "agree_requires_minimum"] as const)
    .filter(key => doc[key] === null || doc[key] === "").map(key => proposalLabels[key]);
}
export const programPage = (value?: string) => value && /^[1-9]\d{0,3}$/.test(value) ? Number(value) - 1 : 0;
