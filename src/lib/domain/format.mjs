/** Format Rupiah: 5000000 -> "Rp5.000.000". @param {number | string | null | undefined} n */
export function rupiah(n) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "Rp0";
  return "Rp" + Math.round(v).toLocaleString("id-ID");
}

/** @param {string | Date | null | undefined} value */
export function tanggal(value, withTime = false) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** @param {number | string | null | undefined} n @param {number} digits */
export function angka(n, digits = 0) {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits }) : "0";
}

/** Nomor WA ke format internasional untuk tautan wa.me. "0812-3456" -> "628123456". @param {string} wa */
export function waNumber(wa) {
  const d = String(wa ?? "").replace(/[^0-9]/g, "");
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  return d;
}

/** @param {string} wa @param {string} [text] */
export function waLink(wa, text) {
  return `https://wa.me/${waNumber(wa)}` + (text ? `?text=${encodeURIComponent(text)}` : "");
}

/** Inisial tersamarkan untuk tampilan publik: "Budi Santoso" -> "B. S." @param {string} name */
export function inisial(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.map((p) => p[0].toUpperCase() + ".").join(" ") : "?";
}

/** Hanya angka dan plus untuk nomor telepon. @param {string} v */
export const cleanPhone = (v) => String(v ?? "").replace(/[^0-9+]/g, "");
export const isPhone = (/** @type {string} */ v) => /^[0-9+]{8,16}$/.test(cleanPhone(v));

/** Hanya angka, tanpa nol di depan, maks 12 digit. "000" -> "", "0042" -> "42". @param {unknown} value */
export function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);
}

/** Pemisah ribuan titik gaya Indonesia: "1500000" -> "1.500.000". @param {unknown} raw */
export function formatRibuan(raw) {
  return digitsOnly(raw).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
