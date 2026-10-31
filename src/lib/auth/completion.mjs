const REQUIRED = ["domicile_address", "domicile_kecamatan", "domicile_kelurahan", "domicile_rw", "domicile_rt"];

/**
 * Akun yang masuk lewat Google belum mengisi nama dan domisili seperti pendaftar email.
 * Selama datanya belum lengkap, pengguna diarahkan ke /lengkapi-profil sebelum dashboard.
 * Ini gerbang pengumpulan data, bukan kontrol keamanan: domisili adalah klaim yang belum diverifikasi.
 * @param {{ app_metadata?: any, user_metadata?: any, identities?: Array<{ provider?: string }> | null }} user
 */
export function needsDomicileCompletion(user) {
  const providers = new Set([
    user.app_metadata?.provider,
    ...(Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : []),
    ...(user.identities ?? []).map((identity) => identity?.provider),
  ]);
  if (!providers.has("google")) return false;
  const meta = user.user_metadata ?? {};
  return !REQUIRED.every((key) => typeof meta[key] === "string" && meta[key].trim() !== "");
}
