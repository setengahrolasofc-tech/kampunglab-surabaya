export type ReviewStage = "rt" | "rw" | "kelurahan";
export type DecisionStage = ReviewStage;
export type EvaluationPath = "demo_micro" | "demo_small";
export const evaluationPathLabels: Record<EvaluationPath, string> = {demo_micro:"Mikro — DEMO",demo_small:"Kecil — DEMO"};
export const evaluationPathLabel = (path:string|null) => path==="demo_micro"?evaluationPathLabels.demo_micro:path==="demo_small"?evaluationPathLabels.demo_small:"Jalur belum dipilih";
export const stageLabels: Record<ReviewStage, string> = { rt: "RT", rw: "RW", kelurahan: "Kelurahan" };
export const statusLabels: Record<string, string> = {
  waiting_rt: "Menunggu pemeriksaan RT", waiting_rw: "Menunggu pemeriksaan RW",
  waiting_kelurahan: "Menunggu tinjauan kelurahan", revision_requested: "Perlu revisi", rejected: "Ditolak dalam simulasi",
  waiting_evaluation: "Menunggu evaluasi DEMO",
};
export const outcomeLabels: Record<string, string> = {
  forward: "Rekomendasi diteruskan", revise: "Meminta revisi", reject: "Menolak simulasi", conflict: "Melaporkan konflik",
};
export const reviewChecks: Record<DecisionStage, { key: string; label: string }[]> = {
  rt: [
    { key: "domicile", label: "Saya telah memeriksa kesesuaian domisili." },
    { key: "problem", label: "Saya telah meninjau masalah nyata yang dijelaskan." },
  ],
  rw: [
    { key: "feasibility", label: "Saya telah meninjau kelayakan pelaksanaan di wilayah ini." },
    { key: "duplicates", label: "Saya telah meninjau potensi duplikasi secara manual." },
    { key: "budget", label: "Saya telah meninjau kewajaran RAB secara manual." },
  ],
  kelurahan: [
    {key:"recommendations",label:"Saya telah membaca rekomendasi RT dan RW pada putaran ini."},
    {key:"completeness",label:"Saya telah meninjau kelengkapan isian salinan, termasuk PRD dan RAB."},
  ],
};
