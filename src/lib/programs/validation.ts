import { isUuid } from "@/lib/admin/validation.mjs";
import { aggregationLabels, type ProgramProposal } from "./types";
export function validProposalDate(value: string) {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateProgramForm(form: FormData, operation: "create" | "revise") {
  const errors: Record<string, string> = {};
  const read = (key: string) => {
    const value = form.get(key);
    if (form.getAll(key).length !== 1 || typeof value !== "string") { errors[key] = "Isian tidak valid. Muat ulang formulir."; return ""; }
    const text = value.trim();
    if (text.replace(/[\n\r\t]/g, "").match(/\p{Cc}/u)) errors[key] = "Hapus karakter kontrol dari isian.";
    return text;
  };
  const id = read("program_id"), requestId = read("request_id"), versionRaw = read("version");
  const version = /^(0|[1-9]\d{0,9})$/.test(versionRaw) ? Number(versionRaw) : -1;
  if (!isUuid(requestId) || version < 0 || version > 2147483646 || (operation === "create" ? Boolean(id) || version !== 0 : !isUuid(id) || version < 1)) errors.form = "Konteks formulir tidak valid. Buka kembali halaman terbaru.";
  const code = read("code").toUpperCase(), name = read("name"), summary = read("summary"), micro = read("micro_evaluator"), reason = read("reason");
  if (!/^[A-Z0-9][A-Z0-9_-]{2,47}$/.test(code)) errors.code = "Gunakan 3–48 huruf/angka, tanda hubung atau garis bawah; awali huruf/angka.";
  if ([...name].length < 3 || name.length > 160) errors.name = "Nama program/periode 3–160 karakter.";
  if (summary.length > 2000) errors.summary = "Ringkasan maksimal 2.000 karakter.";
  if (micro.length > 1000) errors.micro_evaluator = "Usulan penilai maksimal 1.000 karakter.";
  if ([...reason].length < 3 || reason.length > 1000) errors.reason = "Isi alasan penyusunan/perubahan 3–1.000 karakter.";
  const start = read("period_start"), end = read("period_end");
  if (start && !validProposalDate(start)) errors.period_start = "Tanggal awal tidak valid.";
  if (end && !validProposalDate(end)) errors.period_end = "Tanggal akhir tidak valid.";
  if (start && end && start > end) errors.period_end = "Tanggal akhir harus sama atau setelah tanggal awal.";
  const aggregation = read("aggregation");
  if (aggregation && !Object.hasOwn(aggregationLabels, aggregation)) errors.aggregation = "Pilih usulan rumus yang tersedia atau biarkan belum diusulkan.";
  const score = read("minimum_score"), agree = read("minimum_agree");
  if (score && (!/^(0|[1-9]\d{0,2})$/.test(score) || Number(score) > 100)) errors.minimum_score = "Isi bilangan bulat 0–100 atau biarkan kosong.";
  if (agree && !/^[1-3]$/.test(agree)) errors.minimum_agree = "Pilih 1–3 atau belum diusulkan.";
  const triState = (key: string) => { const value = read(key); if (!["", "yes", "no"].includes(value)) errors[key] = "Pilih Ya, Tidak atau belum diusulkan."; return value === "" ? null : value === "yes"; };
  const document: ProgramProposal = { schema_version: "program-proposal-v1", code, name, summary, period_start: start || null, period_end: end || null,
    micro_evaluator: micro, aggregation: aggregation ? aggregation as ProgramProposal["aggregation"] : null,
    minimum_score: score ? Number(score) : null, minimum_agree: agree ? Number(agree) : null,
    require_three: triState("require_three"), agree_requires_minimum: triState("agree_requires_minimum"),
  };
  return { errors, payload: { id: id || null, request_id: requestId, version, document, reason } };
}
