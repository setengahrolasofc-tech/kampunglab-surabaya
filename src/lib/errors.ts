/** Pesan aman dari error Supabase/Postgres. Error aturan bisnis (P0001) memang ditulis dalam bahasa Indonesia di database. */
export function dbMessage(error: { code?: string; message?: string } | null | undefined, fallback = "Terjadi kendala. Coba lagi sebentar lagi."): string {
  if (!error) return fallback;
  if (error.code === "P0001" && error.message) return error.message;
  if (error.code === "42501") return "Anda tidak berwenang untuk tindakan ini.";
  if (error.code === "23505") return "Data yang sama sudah ada.";
  if (error.code === "23514" || error.code === "22P02" || error.code === "23502") return "Isian belum valid. Periksa kembali data Anda.";
  if (error.code === "23503") return "Data rujukan tidak ditemukan.";
  return fallback;
}
