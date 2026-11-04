/**
 * Akun Inovator dianggap "belum lengkap" bila nomor WA, institusi, atau kota domisili belum terisi.
 * Ini terjadi pada akun yang baru dibuat lewat Google (hanya nama dan email dari Google). Pendaftaran email selalu mengisi ketiganya.
 * Peran lain (Kelurahan, Admin BRIDA) tidak pernah dianggap belum lengkap.
 * @param {{ role?: string | null, phone_wa?: string | null, institusi?: string | null, kota_domisili?: string | null } | null | undefined} p
 */
export function needsProfileCompletion(p) {
  if (!p || p.role !== "INNOVATOR") return false;
  return !String(p.phone_wa ?? "").trim() || !String(p.institusi ?? "").trim() || !String(p.kota_domisili ?? "").trim();
}

/** Halaman tujuan setelah profil lengkap menurut pintu masuk yang dipilih. @param {'inovator'|'kelurahan'} intent */
export const lengkapiProfilUrl = (intent = "inovator") => `/lengkapi-profil?sebagai=${intent === "kelurahan" ? "kelurahan" : "inovator"}`;
