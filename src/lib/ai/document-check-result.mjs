import { documentSlots, extractedKeys } from "../drafts/schema.mjs";

const pick = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
const text = (value, max) => typeof value === "string" ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "";

/**
 * Mengubah laporan mentah model menjadi hasil pemeriksaan draf. Aturan status ada di sini, bukan di model,
 * supaya perilakunya dapat diuji. Hanya `perlu_perbaikan` yang menahan pengiriman; sisanya bersifat saran.
 * @param {string} slotKey prd | rab | declaration
 * @param {unknown} report objek laporan dari model
 * @param {string} title judul inovasi yang dijadikan acuan
 * @param {string} now ISO timestamp
 */
export function buildDocumentCheck(slotKey, report, title, now) {
  const slot = documentSlots.find(item => item.key === slotKey);
  if (!slot) throw new Error("Slot dokumen tidak dikenal.");
  const raw = report && typeof report === "object" ? /** @type {Record<string, any>} */ (report) : {};
  const issues = Array.isArray(raw.issues) ? raw.issues.map(item => text(item, 300)).filter(Boolean).slice(0, 12) : [];
  const titleMatch = pick(raw.title_match, ["ya", "tidak", "tidak_terbaca"], "tidak_terbaca");
  const signature = slot.signature ? pick(raw.signature, ["ada", "tidak_ada", "tidak_jelas"], "tidak_jelas") : "tidak_perlu";
  const stamp = slot.stamp ? pick(raw.stamp, ["ada", "tidak_ada", "tidak_jelas"], "tidak_jelas") : "tidak_perlu";
  const completeness = pick(raw.completeness, ["lengkap", "sebagian", "kosong"], "sebagian");
  const wrongDocument = raw.document_type_ok !== true;
  const extracted = {};
  if (slotKey === "rab" && raw.extracted && typeof raw.extracted === "object") {
    for (const key of extractedKeys) {
      const value = raw.extracted[key];
      if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 9999999999999) extracted[key] = value;
    }
  }
  const blockers = [];
  if (wrongDocument) blockers.push(`Berkas ini tidak tampak sebagai dokumen ${slot.label} sesuai template KampungLab.`);
  if (!wrongDocument && titleMatch === "tidak") blockers.push("Nama inovasi di dokumen berbeda dengan judul inovasi pada draf.");
  if (!wrongDocument && slot.signature && signature === "tidak_ada") blockers.push("Tanda tangan belum ditemukan pada dokumen.");
  if (!wrongDocument && slot.stamp && stamp === "tidak_ada") blockers.push("Meterai Rp10.000 belum ditemukan. Tempel meterai (atau pakai meterai elektronik) dan tanda tangani di atasnya.");
  if (!wrongDocument && completeness === "kosong") blockers.push("Isian dokumen masih kosong.");
  const warnings = [];
  if (!wrongDocument && titleMatch === "tidak_terbaca") warnings.push("Nama inovasi di dokumen tidak terbaca jelas; periksa sendiri.");
  if (!wrongDocument && slot.signature && signature === "tidak_jelas") warnings.push("Tanda tangan tidak terlihat jelas; pastikan hasil pindai terbaca.");
  if (!wrongDocument && slot.stamp && stamp === "tidak_jelas") warnings.push("Meterai tidak terlihat jelas; pastikan meterai dan tanda tangan di atasnya terbaca pada hasil pindai.");
  if (!wrongDocument && completeness === "sebagian") warnings.push("Sebagian isian dokumen tampak belum terisi.");
  const status = blockers.length ? "perlu_perbaikan" : warnings.length || issues.length ? "perlu_dicek" : "lulus";
  return {
    status,
    summary: text(raw.summary, 1200) || (status === "lulus" ? "Tidak ada masalah yang terdeteksi pada pemeriksaan otomatis." : ""),
    issues: [...blockers, ...warnings, ...issues].slice(0, 12),
    checked_title: title.trim(),
    checked_at: now,
    signature,
    stamp,
    title_match: wrongDocument ? "tidak_terbaca" : titleMatch,
    ai: true,
    extracted,
  };
}

/** Hasil saat pemeriksaan AI tidak tersedia. Tidak menahan pengiriman: petugas tetap memeriksa dokumen. */
export function uncheckedDocument(slotKey, reason, title, now) {
  const slot = documentSlots.find(item => item.key === slotKey);
  return {
    status: "tidak_diperiksa", summary: text(reason, 1200), issues: [], checked_title: title.trim(), checked_at: now,
    signature: slot?.signature ? "tidak_jelas" : "tidak_perlu", stamp: slot?.stamp ? "tidak_jelas" : "tidak_perlu", title_match: "tidak_terbaca", ai: false, extracted: {},
  };
}
