import { KECAMATAN_KELURAHAN } from "../auth/surabaya-areas.mjs";

/**
 * Tabel `territories` hanya menyimpan kelurahan, RW, dan RT. Kecamatan tidak disimpan sebagai baris sendiri,
 * tetapi kode kelurahan hasil seed memuatnya: `SBY-<kecamatan>-<kelurahan>` (lihat migrasi 20261101010000).
 * Helper ini menurunkan kecamatan dari kode itu memakai daftar yang sama dengan form daftar.
 *
 * @typedef {{ id: string; kind: string; name: string; code: string; parent_id: string | null }} AreaTerritory
 */

/** Sama dengan private.area_slug di database. @param {string} value */
export function areaSlug(value) {
  return String(value).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

/** Kelurahan yang kodenya bukan hasil seed kecamatan (misalnya data latihan DEMO) dikelompokkan di sini. */
export const OTHER_KECAMATAN = "Wilayah latihan (DEMO)";

/** @type {Map<string, string>} */
const kecamatanByCode = new Map();
for (const [kecamatan, daftar] of Object.entries(KECAMATAN_KELURAHAN)) {
  for (const kelurahan of daftar) kecamatanByCode.set(`SBY-${areaSlug(kecamatan)}-${areaSlug(kelurahan)}`, kecamatan);
}

/** @param {{ code: string }} kelurahan */
export function kecamatanOf(kelurahan) {
  return kecamatanByCode.get(kelurahan.code) ?? OTHER_KECAMATAN;
}

/** Urut nama dengan angka dibaca sebagai angka (RW 2 sebelum RW 10). @param {{ name: string }} a @param {{ name: string }} b */
export function byName(a, b) {
  return a.name.localeCompare(b.name, "id", { numeric: true });
}

/**
 * Label pilihan = nama saja. Kode internal hanya ditambahkan bila ada dua pilihan bernama sama dalam satu daftar.
 * @param {AreaTerritory[]} items
 * @returns {{ id: string; label: string }[]}
 */
export function nameOptions(items) {
  /** @type {Map<string, number>} */
  const count = new Map();
  for (const item of items) count.set(item.name, (count.get(item.name) ?? 0) + 1);
  return items.map((item) => ({ id: item.id, label: (count.get(item.name) ?? 0) > 1 ? `${item.name} (${item.code})` : item.name }));
}

/**
 * Ringkasan wilayah untuk tampilan, mis. "Kecamatan Kenjeran · Kelurahan Tanah Kali Kedinding · RW 04 · RT 21".
 * Mengembalikan teks kosong bila RT belum dipilih atau induknya belum termuat.
 * @param {AreaTerritory[]} territories @param {string} rtId
 */
export function formatTerritoryPath(territories, rtId) {
  const byId = new Map(territories.map((item) => [item.id, item]));
  const rt = byId.get(rtId);
  const rw = rt?.parent_id ? byId.get(rt.parent_id) : undefined;
  const kelurahan = rw?.parent_id ? byId.get(rw.parent_id) : undefined;
  if (!rt || !rw || !kelurahan) return "";
  const kecamatan = kecamatanOf(kelurahan);
  return [kecamatan === OTHER_KECAMATAN ? "" : `Kecamatan ${kecamatan}`, `Kelurahan ${kelurahan.name}`, rw.name, rt.name].filter(Boolean).join(" · ");
}
