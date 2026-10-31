import { KECAMATAN_KELURAHAN } from "./surabaya-areas.mjs";

/** Panjang kode OTP email. Samakan dengan pengaturan "Email OTP Length" di Supabase (lihat docs/OTP_SETUP.md). */
export const OTP_LENGTH = 6;

/** Aturan kekuatan password untuk daftar dan ubah password. */
export const PASSWORD_RULES = [
  { id: "length", label: "Minimal 8 karakter", test: (/** @type {string} */ v) => v.length >= 8 },
  { id: "upper", label: "Mengandung huruf besar", test: (/** @type {string} */ v) => /[A-Z]/.test(v) },
  { id: "lower", label: "Mengandung huruf kecil", test: (/** @type {string} */ v) => /[a-z]/.test(v) },
  { id: "digit", label: "Mengandung angka", test: (/** @type {string} */ v) => /\d/.test(v) },
  { id: "special", label: "Mengandung karakter khusus", test: (/** @type {string} */ v) => /[^A-Za-z0-9]/.test(v) },
];

/** @param {string} value */
export const isStrongPassword = (value) => PASSWORD_RULES.every((rule) => rule.test(value));

/** @param {string} value */
export const isValidEmail = (value) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** @param {FormData} form @param {'login'|'signup'|'reset'|'password'|'profile'} mode */
export function validateAuthForm(form, mode) {
  /** @type {Record<string, string>} */
  const errors = {};
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  const displayName = String(form.get("display_name") ?? "").trim();

  if (["login", "signup", "reset"].includes(mode)) {
    if (!isValidEmail(email)) errors.email = "Masukkan alamat email yang valid.";
  }
  if (["login", "signup", "password"].includes(mode)) {
    if (!password) errors.password = "Isi password.";
    else if (new TextEncoder().encode(password).length > 72) errors.password = "Password terlalu panjang. Gunakan password yang lebih pendek.";
    else if (mode !== "login" && !isStrongPassword(password)) errors.password = "Password belum memenuhi semua aturan di atas.";
    if (mode !== "login" && password !== confirmation) errors.confirmation = "Konfirmasi password belum sama.";
  }
  if (["signup", "profile"].includes(mode)) {
    if (displayName.length < 2 || displayName.length > 80 || /[\u0000-\u001f\u007f]/.test(displayName)) {
      errors.display_name = "Isi nama sepanjang 2–80 karakter.";
    }
  }
  return { errors, email, password, displayName };
}

/**
 * Domisili saat daftar: alamat, kecamatan, kelurahan (dari daftar contoh di surabaya-areas.mjs),
 * serta RW dan RT yang diketik manual. Ini klaim warga yang belum diverifikasi, bukan dasar hak akses.
 * @param {FormData} form
 */
export function validateDomicile(form) {
  /** @type {Record<string, string>} */
  const errors = {};
  const address = String(form.get("address") ?? "").trim().replace(/\s+/g, " ");
  const kecamatan = String(form.get("kecamatan") ?? "");
  const kelurahan = String(form.get("kelurahan") ?? "");
  // RW dan RT diketik manual: terima 1–3 digit angka. Nol di depan dibuang ("03" disimpan sebagai "3").
  const number = (/** @type {FormDataEntryValue | null} */ raw) => {
    const text = String(raw ?? "").trim();
    return /^\d{1,3}$/.test(text) && Number(text) >= 1 ? String(Number(text)) : "";
  };
  const rw = number(form.get("rw"));
  const rt = number(form.get("rt"));

  if (address.length < 5 || address.length > 160 || /[\u0000-\u001f\u007f]/.test(address)) {
    errors.address = "Isi nama jalan dan nomor rumah (5–160 karakter).";
  }
  const kelurahanList = Object.hasOwn(KECAMATAN_KELURAHAN, kecamatan) ? KECAMATAN_KELURAHAN[kecamatan] : null;
  if (!kelurahanList) errors.kecamatan = "Pilih kecamatan.";
  else if (!kelurahanList.includes(kelurahan)) errors.kelurahan = "Pilih kelurahan sesuai kecamatan.";
  if (!rw) errors.rw = "Ketik nomor RW berupa angka, misalnya 3.";
  if (!rt) errors.rt = "Ketik nomor RT berupa angka, misalnya 7.";
  return { errors, value: { address, kecamatan, kelurahan, rw, rt } };
}

/** Kode OTP email untuk verifikasi daftar atau pemulihan. @param {FormData} form */
export function validateOtp(form) {
  /** @type {Record<string, string>} */
  const errors = {};
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const token = String(form.get("token") ?? "").replace(/\s/g, "");
  if (!isValidEmail(email)) errors.email = "Alamat email tidak valid.";
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(token)) errors.token = `Masukkan ${OTP_LENGTH} digit kode OTP.`;
  return { errors, email, token };
}

/** Only fixed destinations are accepted; never use a visitor-provided URL. @param {string | null} value */
export function safeAuthDestination(value) {
  return value === "/ubah-kata-sandi" ? "/ubah-kata-sandi" : "/dashboard";
}

/** Trusted origin for outgoing Auth links; no request Host header is used. @param {string | undefined} value */
export function getAppOrigin(value) {
  let parsed;
  try { parsed = new URL(value || "http://localhost:3000"); }
  catch { throw new Error("Konfigurasi NEXT_PUBLIC_APP_URL tidak valid."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if ((parsed.protocol !== "https:" && !(parsed.protocol === "http:" && local)) || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("NEXT_PUBLIC_APP_URL harus berupa origin HTTPS atau localhost tanpa path.");
  }
  return parsed.origin;
}

/** @param {{status: string, starts_at: string, ends_at: string | null}} grant @param {number} now */
export function isCurrentGrant(grant, now = Date.now()) {
  return grant.status === "active" && Date.parse(grant.starts_at) <= now &&
    (grant.ends_at === null || now < Date.parse(grant.ends_at));
}
