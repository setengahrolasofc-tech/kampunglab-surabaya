/** Klaim domisili tersimpan di metadata Auth (diisi saat daftar atau lengkapi profil). @param {Record<string, unknown> | null | undefined} meta */
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
