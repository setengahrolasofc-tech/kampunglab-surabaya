export const innovationForms = ["gagasan", "produk", "prototipe", "program", "teknologi"];
export const maturityStages = ["inisiatif", "uji coba", "penerapan"];
export const prdFields = [
  ["problem", "Masalah yang ingin diselesaikan"],
  ["problem_evidence", "Bukti atau pengamatan masalah"],
  ["beneficiaries", "Siapa penerima manfaatnya?"],
  ["beneficiary_count", "Perkiraan jumlah penerima manfaat"],
  ["solution", "Solusi yang ditawarkan"],
  ["features", "Fitur atau kegiatan utama"],
  ["success_indicator", "Indikator keberhasilan yang diukur"],
  ["success_threshold", "Ambang keberhasilan yang ditargetkan"],
  ["test_method", "Metode pengujian"],
  ["test_plan", "Rencana pelaksanaan uji"],
  ["risks", "Risiko yang mungkin terjadi"],
  ["mitigation", "Cara mengurangi risiko"],
];
/** Dokumen bertemplate yang diunggah menggantikan isian teks PRD/RAB/keaslian. `signature`: surat harus bertanda tangan. */
/** @type {{ key: import("./types").DocumentSlotKey, label: string, tag: string, template: string, signature: boolean }[]} */
export const documentSlots = [
  { key: "prd", label: "PRD inovasi", tag: "PRD", template: "Template_PRD.docx", signature: false },
  { key: "rab", label: "RAB", tag: "RAB", template: "Template_RAB.docx", signature: true },
  { key: "declaration", label: "Surat pernyataan keaslian karya", tag: "Keaslian", template: "Surat_Pernyataan_Keaslian_Karya.docx", signature: true },
];
export const checkStatuses = ["lulus", "perlu_dicek", "perlu_perbaikan", "tidak_diperiksa"];
const signatureValues = ["ada", "tidak_ada", "tidak_jelas", "tidak_perlu"];
const titleMatchValues = ["ya", "tidak", "tidak_terbaca"];
export const extractedKeys = ["ordinary", "contingency", "honor", "maintenance"];
/** @returns {import("./types").DraftDocument} */
export function emptyDraftDocument(rtId = "") {
  return {
    innovation: { title: "", theme_id: "", form: "", maturity: "", rt_id: rtId, summary: "", team: [] },
    prd: Object.fromEntries(prdFields.map(([key]) => [key, ""])),
    budget: { items: [], subtotal: "", contingency: "", honor: "", maintenance_cost: "", maintenance_months: "" },
    declaration: { own_work: false, notes: "" },
    documents: {},
  };
}
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
export function quantityMilli(value) {
  if (value === "") return 0n;
  if (typeof value !== "string" || !/^(0|[1-9]\d{0,8})([.,]\d{1,3})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  return BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));
}
export function rupiahInteger(value) {
  if (value === "") return 0n;
  return typeof value === "string" && /^\d{1,13}$/.test(value) ? BigInt(value) : null;
}
export function budgetLineTotal(item) {
  const quantity=quantityMilli(item.quantity), price=rupiahInteger(item.unit_price);
  return quantity===null || price===null ? null : quantity*price;
}
export function budgetTotals(budget) {
  let subtotal = 0n, invalid = false;
  // Draf lama menghitung dari rincian; alur dokumen bertemplate memakai subtotal kebutuhan yang diisi pengaju.
  for (const item of budget.items) {
    const quantity = quantityMilli(item.quantity), price = rupiahInteger(item.unit_price);
    if (quantity === null || price === null) invalid = true;
    else subtotal += quantity * price;
  }
  if (!budget.items.length) {
    const typed = rupiahInteger(budget.subtotal ?? "");
    if (typed === null) invalid = true; else subtotal = typed * 1000n;
  }
  const contingency = rupiahInteger(budget.contingency), honor = rupiahInteger(budget.honor), maintenance = rupiahInteger(budget.maintenance_cost);
  if (contingency === null || honor === null || maintenance === null) invalid = true;
  return { subtotal, total: subtotal + ((contingency ?? 0n) + (honor ?? 0n)) * 1000n, maintenance: (maintenance ?? 0n) * 1000n, invalid };
}
export function formatRupiahMilli(amount) {
  const digits = (amount / 1000n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const fraction = (amount % 1000n).toString().padStart(3, "0").replace(/0+$/, "");
  return `Rp${digits}${fraction ? `,${fraction}` : ""}`;
}

function validateDocuments(raw, errors) {
  /** @type {Record<string, any>} */
  const out = {};
  if (raw === undefined) return out;
  if (!object(raw)) { errors.documents = "Data dokumen tidak valid."; return out; }
  for (const slot of documentSlots) {
    const row = raw[slot.key];
    if (row === undefined || row === null) continue;
    const path = `documents.${slot.key}`;
    const check = object(row) && object(row.check) ? row.check : null;
    if (!check || typeof row.attachment_id !== "string" || !uuid.test(row.attachment_id)) { errors[path] = "Data dokumen tidak valid. Unggah ulang dokumen."; continue; }
    const str = (value, max) => typeof value === "string" ? value.slice(0, max).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim() : "";
    const issues = Array.isArray(check.issues) ? check.issues.slice(0, 12).map(item => str(item, 300)).filter(Boolean) : [];
    const extracted = {};
    if (object(check.extracted)) for (const key of extractedKeys) {
      const value = check.extracted[key];
      if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 9999999999999) extracted[key] = value;
    }
    out[slot.key] = {
      attachment_id: row.attachment_id.toLowerCase(),
      file_name: str(row.file_name, 160),
      check: {
        status: checkStatuses.includes(check.status) ? check.status : "tidak_diperiksa",
        summary: str(check.summary, 1200),
        issues,
        checked_title: str(check.checked_title, 160),
        checked_at: str(check.checked_at, 40),
        signature: signatureValues.includes(check.signature) ? check.signature : "tidak_jelas",
        title_match: titleMatchValues.includes(check.title_match) ? check.title_match : "tidak_terbaca",
        ai: check.ai === true,
        extracted,
      },
    };
  }
  return out;
}
/** Masalah per dokumen: tidak ada, perlu perbaikan, atau judul berubah sejak diperiksa. @returns {string|null} */
export function documentSlotProblem(data, key) {
  const row = data.documents?.[key];
  if (!row) return "belum diunggah";
  if (row.check.status === "perlu_perbaikan") return "perlu diperbaiki sesuai hasil pemeriksaan";
  if (row.check.checked_title !== data.innovation.title.trim()) return "diperiksa untuk judul inovasi yang berbeda; unggah ulang";
  return null;
}
/** @returns {{data: import("./types").DraftDocument, errors: Record<string,string>}} */
export function validateDraftDocument(raw) {
  const data = emptyDraftDocument();
  /** @type {Record<string,string>} */
  const errors = {};
  if (!object(raw)) return { data, errors: { document: "Data draf tidak valid." } };
  const section = key => object(raw[key]) ? raw[key] : {};
  const text = (source, key, max, path) => {
    const value = source[key] ?? "";
    if (typeof value !== "string" || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
      errors[path] = `Gunakan teks maksimal ${max} karakter.`; return "";
    }
    return value.trim();
  };
  const info = section("innovation");
  for (const [key, max] of [["title",160],["theme_id",36],["form",24],["maturity",24],["rt_id",36],["summary",3000]]) data.innovation[key] = text(info,key,max,`innovation.${key}`);
  for (const key of ["theme_id","rt_id"]) if (data.innovation[key] && !uuid.test(data.innovation[key])) errors[`innovation.${key}`] = "Pilih data yang tersedia.";
  if (data.innovation.form && !innovationForms.includes(data.innovation.form)) errors["innovation.form"] = "Pilih bentuk inovasi yang tersedia.";
  if (data.innovation.maturity && !maturityStages.includes(data.innovation.maturity)) errors["innovation.maturity"] = "Pilih tahap inovasi yang tersedia.";
  const rows = (value, max, path, fields) => {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.length > max) { errors[path] = `Maksimal ${max} baris.`; return []; }
    return value.map((row,index) => {
      if (!object(row)) { errors[path] = "Baris tidak valid."; return {}; }
      return Object.fromEntries(fields.map(([key,limit]) => [key,text(row,key,limit,`${path}.${index}.${key}`)]));
    });
  };
  data.innovation.team = rows(info.team,20,"innovation.team",[["id",36],["name",160],["role",160]]);
  for (const [key] of prdFields) data.prd[key] = text(section("prd"),key,key === "beneficiary_count" ? 10 : 4000,`prd.${key}`);
  if (data.prd.beneficiary_count && !/^[1-9]\d{0,8}$/.test(data.prd.beneficiary_count)) errors["prd.beneficiary_count"] = "Isi bilangan bulat positif, maksimal 9 digit.";
  const budget = section("budget");
  data.budget.items = rows(budget.items,50,"budget.items",[["id",36],["description",240],["category",80],["unit",40],["quantity",16],["unit_price",13],["usage_stage",80]]);
  for (const key of ["subtotal","contingency","honor","maintenance_cost","maintenance_months"]) data.budget[key] = text(budget,key,key === "maintenance_months" ? 2 : 13,`budget.${key}`);
  data.budget.items.forEach((row,index) => {
    if (quantityMilli(row.quantity) === null) errors[`budget.items.${index}.quantity`] = "Volume berupa angka positif, maksimal 3 angka desimal (contoh 0,5).";
    else row.quantity = row.quantity.replace(",", ".");
    if (rupiahInteger(row.unit_price) === null) errors[`budget.items.${index}.unit_price`] = "Harga dalam rupiah bulat tanpa pemisah, maksimal 13 digit.";
  });
  for (const key of ["subtotal","contingency","honor","maintenance_cost"]) if (rupiahInteger(data.budget[key]) === null) errors[`budget.${key}`] = "Isi rupiah bulat tanpa pemisah, maksimal 13 digit.";
  if (data.budget.maintenance_months && !/^(6|7|8|9|10|11|12)$/.test(data.budget.maintenance_months)) errors["budget.maintenance_months"] = "Rencana perawatan 6–12 bulan.";
  const declaration = section("declaration");
  if (declaration.own_work !== undefined && typeof declaration.own_work !== "boolean") errors["declaration.own_work"] = "Pernyataan tidak valid.";
  data.declaration.own_work = declaration.own_work === true;
  data.declaration.notes = text(declaration,"notes",3000,"declaration.notes");
  data.documents = validateDocuments(raw.documents, errors);
  // Pernyataan karya sendiri kini dibuktikan oleh surat bertanda tangan yang diunggah, bukan kotak centang.
  data.declaration.own_work = Boolean(data.documents.declaration);
  if (new TextEncoder().encode(JSON.stringify(data)).length > 131072) errors.document = "Draf terlalu besar. Ringkas uraian dan rincian yang dimasukkan.";
  return { data, errors };
}

export function draftChecklist(data) {
  const i = data.innovation, b = data.budget;
  return [
    Boolean(i.title && i.form && i.maturity && i.rt_id && i.summary && i.team.some(member => member.name && member.role)),
    documentSlotProblem(data, "prd") === null,
    documentSlotProblem(data, "rab") === null && (rupiahInteger(b.subtotal) ?? 0n) > 0n && Boolean(b.maintenance_months),
    documentSlotProblem(data, "declaration") === null && data.declaration.own_work,
  ];
}

/** Draf lama menyimpan rincian RAB per baris. Alur dokumen memakai satu subtotal; rincian lama diringkas menjadi subtotal (dibulatkan ke bawah) saat draf dibuka. */
/**
 * @param {import("./types").DraftDocument} data
 * @returns {import("./types").DraftDocument}
 */
export function migrateLegacyBudget(data) {
  if (!data.budget.items.length) return data;
  const totals = budgetTotals({ ...data.budget, contingency: "", honor: "", maintenance_cost: "" });
  if (totals.invalid) return data;
  const subtotal = data.budget.subtotal || (totals.subtotal / 1000n).toString();
  return { ...data, budget: { ...data.budget, items: [], subtotal } };
}
