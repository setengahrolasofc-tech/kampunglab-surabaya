/**
 * Pencocokan klaim domisili (kecamatan, kelurahan, RW, RT) ke tabel `territories`.
 * Tabel wilayah belum punya tingkat kecamatan, jadi kelurahan dicocokkan lewat nama dan
 * RW/RT lewat angka di ujung nama atau kode ("RW 03", "DEMO-RW-01", "3" -> 3).
 * Fungsi di sini murni (tanpa database) agar mudah diuji.
 */

/** @param {unknown} value */
export function normalizeLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/^(kelurahan|kel\.?)\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Angka di ujung teks; nol di depan dibuang. @param {unknown} value @returns {number | null} */
export function trailingNumber(value) {
  const match = /(\d{1,4})\s*$/.exec(String(value ?? "").trim());
  return match ? Number(match[1]) : null;
}

/** @param {{ id: string; name: string; code: string }[]} rows @param {string} kelurahan */
export function filterKelurahan(rows, kelurahan) {
  const wanted = normalizeLabel(kelurahan);
  if (!wanted) return [];
  return rows.filter((row) => normalizeLabel(row.name) === wanted || normalizeLabel(row.code) === wanted);
}

/** @param {{ id: string; name: string; code: string }[]} rows @param {string | number} number */
export function filterByNumber(rows, number) {
  const wanted = Number(number);
  if (!Number.isInteger(wanted) || wanted < 1) return [];
  return rows.filter((row) => (trailingNumber(row.name) ?? trailingNumber(row.code)) === wanted);
}

/** Klaim domisili tersimpan di metadata Auth. @param {Record<string, unknown> | null | undefined} meta */
export function domicileFromMetadata(meta) {
  const text = (/** @type {string} */ key) => (typeof meta?.[key] === "string" ? /** @type {string} */ (meta[key]).trim() : "");
  return {
    address: text("domicile_address"),
    kecamatan: text("domicile_kecamatan"),
    kelurahan: text("domicile_kelurahan"),
    rw: text("domicile_rw"),
    rt: text("domicile_rt"),
  };
}
