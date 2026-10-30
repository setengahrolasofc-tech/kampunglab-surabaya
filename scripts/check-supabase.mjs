import nextEnv from "@next/env";
import { getSupabasePublicConfig } from "../src/lib/supabase/config.mjs";

/** @param {string} url @param {string} key @param {string} label */
async function readEndpoint(url, key, label) {
  let response;
  try {
    response = await fetch(url, {
      headers: { apikey: key, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
      cache: "no-store",
    });
  } catch {
    throw new Error(`${label}: koneksi gagal atau melewati batas 15 detik.`);
  }

  if (!response.ok) {
    throw new Error(`${label}: HTTP ${response.status}. Periksa konfigurasi dan status proyek.`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`${label}: respons bukan JSON yang valid.`);
  }
}

try {
  nextEnv.loadEnvConfig(process.cwd(), true);
  const { url, publishableKey } = getSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const results = await Promise.allSettled([
    readEndpoint(`${url}/auth/v1/.well-known/jwks.json`, publishableKey, "Auth JWKS"),
    readEndpoint(`${url}/auth/v1/settings`, publishableKey, "Auth Settings"),
  ]);

  const [jwks, settings] = results;
  for (const result of results) {
    if (result.status === "rejected") throw result.reason;
  }
  if (jwks.status !== "fulfilled" || !Array.isArray(jwks.value?.keys)) {
    throw new Error("Auth JWKS: bentuk respons tidak sesuai.");
  }
  if (
    settings.status !== "fulfilled" ||
    !settings.value?.external ||
    typeof settings.value.external !== "object" ||
    Array.isArray(settings.value.external)
  ) {
    throw new Error("Auth Settings: bentuk respons tidak sesuai.");
  }

  console.log("Lulus: endpoint Auth JWKS dan Auth Settings dapat diakses.");
  console.log("Pemeriksaan hanya-baca; tidak membuat akun, tabel, atau transaksi.");
  console.log("Query Data API, login, sesi pengguna, izin RLS, dan akses berkas belum diuji oleh pemeriksaan ini.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Pemeriksaan koneksi Supabase gagal.");
  process.exitCode = 1;
}
