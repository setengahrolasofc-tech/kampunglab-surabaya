import { KECAMATAN_KELURAHAN } from "./surabaya-areas.mjs";

/** Panjang kode OTP email. Samakan dengan "Email OTP Length" di Supabase. */
export const OTP_LENGTH = 6;

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
/** @param {string} v */
const cleanPhone = (v) => String(v ?? "").replace(/[^0-9+]/g, "");

/** Pendaftaran terbuka hanya untuk Inovator dan permintaan akses Kelurahan. Admin BRIDA dipilih lewat skrip seed, bukan pendaftaran. */
export const ROLES_PENDAFTARAN = ["INNOVATOR", "KELURAHAN"];

/** Pintu masuk yang dipilih pengunjung ("sebagai"). Hanya niat tampilan, bukan otorisasi. @param {unknown} value @returns {'inovator'|'kelurahan'} */
export function normalizeIntent(value) {
  return String(value ?? "").toLowerCase() === "kelurahan" ? "kelurahan" : "inovator";
}

/** Tujuan sesudah masuk menurut pintu yang dipilih. @param {'inovator'|'kelurahan'} intent */
export const destinationForIntent = (intent) => (intent === "kelurahan" ? "/minta-akses" : "/dashboard");

/**
 * Permintaan akses Kelurahan dari akun yang sudah ada (email atau Google).
 * @param {FormData} form
 */
export function validateKelurahanAccess(form) {
  /** @type {Record<string, string>} */
  const errors = {};
  const txt = (/** @type {string} */ k) => String(form.get(k) ?? "").trim().replace(/\s+/g, " ");
  const kecamatan = txt("kecamatan"), kelurahan = txt("kelurahan");
  const nip = txt("nip").replace(/\s/g, "");
  const jabatan = txt("jabatan");
  const phone = cleanPhone(txt("phone_wa"));
  const list = Object.hasOwn(KECAMATAN_KELURAHAN, kecamatan) ? KECAMATAN_KELURAHAN[kecamatan] : null;
  if (!list) errors.kecamatan = "Pilih kecamatan.";
  else if (!list.includes(kelurahan)) errors.kelurahan = "Pilih kelurahan sesuai kecamatan.";
  if (!/^[0-9]{8,24}$/.test(nip)) errors.nip = "Isi NIP (hanya angka, 8–24 digit).";
  if (jabatan.length < 3 || jabatan.length > 120) errors.jabatan = "Isi jabatan (3–120 karakter).";
  if (!/^[0-9+]{8,16}$/.test(phone)) errors.phone_wa = "Isi nomor WA aktif (8–16 digit).";
  return { errors, kecamatan, kelurahan, nip, jabatan, phone };
}

/** @param {FormData} form @param {'login'|'reset'|'password'} mode */
export function validateAuthForm(form, mode) {
  /** @type {Record<string, string>} */
  const errors = {};
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  if (mode !== "password" && !isValidEmail(email)) errors.email = "Masukkan alamat email yang valid.";
  if (mode !== "reset") {
    if (!password) errors.password = "Isi password.";
    else if (new TextEncoder().encode(password).length > 72) errors.password = "Password terlalu panjang (maks. 72 byte).";
    else if (mode === "password" && !isStrongPassword(password)) errors.password = "Password belum memenuhi semua aturan di atas.";
    if (mode === "password" && password !== confirmation) errors.confirmation = "Konfirmasi password belum sama.";
  }
  return { errors, email, password };
}

/**
 * Pendaftaran per peran: INNOVATOR atau KELURAHAN (permintaan akses).
 * Peran yang dipilih hanyalah niat pendaftar, bukan otorisasi: akun Kelurahan menunggu mandat Admin BRIDA.
 * @param {FormData} form
 */
export function validateSignup(form) {
  /** @type {Record<string, string>} */
  const errors = {};
  const role = String(form.get("role") ?? "");
  const txt = (/** @type {string} */ k) => String(form.get(k) ?? "").trim().replace(/\s+/g, " ");
  const base = validateAuthForm(form, "password");
  Object.assign(errors, base.errors);
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) errors.email = "Masukkan alamat email yang valid.";
  if (!ROLES_PENDAFTARAN.includes(role)) errors.role = "Pilih peran pendaftaran.";
  const name = txt("display_name");
  if (name.length < 2 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) errors.display_name = "Isi nama lengkap 2–100 karakter.";
  const phone = cleanPhone(txt("phone_wa"));
  if (!/^[0-9+]{8,16}$/.test(phone)) errors.phone_wa = "Isi nomor WA aktif (8–16 digit).";
  const meta = { role, display_name: name, phone_wa: phone };
  /** @type {Record<string, string>} */
  const extra = {};
  if (role === "INNOVATOR") {
    extra.institusi = txt("institusi");
    extra.kota_domisili = txt("kota_domisili");
    if (extra.institusi.length < 2 || extra.institusi.length > 120) errors.institusi = "Isi institusi/komunitas (2–120 karakter). Tulis \"Warga umum\" bila tidak ada.";
    if (extra.kota_domisili.length < 2 || extra.kota_domisili.length > 80) errors.kota_domisili = "Isi kota domisili.";
  } else if (role === "KELURAHAN") {
    extra.nip = txt("nip").replace(/\s/g, "");
    extra.jabatan = txt("jabatan");
    const kecamatan = txt("kecamatan"), kelurahan = txt("kelurahan");
    if (!/^[0-9]{8,24}$/.test(extra.nip)) errors.nip = "Isi NIP (hanya angka).";
    if (extra.jabatan.length < 3 || extra.jabatan.length > 120) errors.jabatan = "Isi jabatan.";
    const list = Object.hasOwn(KECAMATAN_KELURAHAN, kecamatan) ? KECAMATAN_KELURAHAN[kecamatan] : null;
    if (!list) errors.kecamatan = "Pilih kecamatan.";
    else if (!list.includes(kelurahan)) errors.kelurahan = "Pilih kelurahan sesuai kecamatan.";
    extra.kecamatan = kecamatan; extra.kelurahan = kelurahan;
    const sk = form.get("sk");
    if (!(sk instanceof File) || sk.size === 0) errors.sk = "Unggah SK/surat tugas (PDF, JPG, atau PNG).";
    else if (!["application/pdf", "image/jpeg", "image/png"].includes(sk.type)) errors.sk = "SK harus berformat PDF, JPG, atau PNG.";
    else if (sk.size > 4 * 1024 * 1024) errors.sk = "Ukuran SK maksimal 4 MB.";
  }
  /** @type {Record<string, string>} */
  const allMeta = { ...meta, ...extra };
  return { errors, email, password: String(form.get("password") ?? ""), role, meta: allMeta };
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

/** Hanya tujuan tetap yang diterima; tidak pernah memakai URL dari pengunjung. @param {string | null} value */
export function safeAuthDestination(value) {
  return value === "/ubah-kata-sandi" ? "/ubah-kata-sandi" : value === "/minta-akses" ? "/minta-akses" : "/dashboard";
}

/** Origin tepercaya untuk tautan Auth; tanpa header Host. @param {string | undefined} value */
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
