/**
 * Validates the hosted project's public configuration without echoing values.
 * @param {string | undefined} urlInput
 * @param {string | undefined} keyInput
 */
export function getSupabasePublicConfig(urlInput, keyInput) {
  const urlValue = urlInput?.trim();
  const publishableKey = keyInput?.trim();

  if (!urlValue || !publishableKey) {
    throw new Error(
      "Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di .env.local.",
    );
  }

  let parsed;
  try {
    parsed = new URL(urlValue);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL harus berupa URL HTTPS proyek Supabase.");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/"
  ) {
    throw new Error(
      "Gunakan URL HTTPS utama proyek Supabase tanpa kredensial, path, query, atau fragment.",
    );
  }

  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY harus memakai sb_publishable_. Jangan gunakan secret key atau legacy JWT key.",
    );
  }

  return { url: parsed.origin, publishableKey };
}
