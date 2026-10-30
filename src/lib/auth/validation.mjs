/** @param {FormData} form @param {'login'|'signup'|'reset'|'password'|'profile'} mode */
export function validateAuthForm(form, mode) {
  /** @type {Record<string, string>} */
  const errors = {};
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  const displayName = String(form.get("display_name") ?? "").trim();

  if (["login", "signup", "reset"].includes(mode)) {
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Masukkan alamat email yang valid.";
    }
  }
  if (["login", "signup", "password"].includes(mode)) {
    if (!password) errors.password = "Isi kata sandi.";
    else if (new TextEncoder().encode(password).length > 72) errors.password = "Kata sandi terlalu panjang. Gunakan kata sandi yang lebih pendek.";
    else if (mode !== "login" && password.length < 8) errors.password = "Gunakan minimal 8 karakter.";
    if (mode !== "login" && password !== confirmation) errors.confirmation = "Konfirmasi kata sandi belum sama.";
  }
  if (["signup", "profile"].includes(mode)) {
    if (displayName.length < 2 || displayName.length > 80 || /[\u0000-\u001f\u007f]/.test(displayName)) {
      errors.display_name = "Isi nama tampilan sepanjang 2–80 karakter.";
    }
  }
  return { errors, email, password, displayName };
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
