import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config.mjs";

/** Menyegarkan cookie sesi Supabase dan melarang cache untuk halaman yang bergantung pada sesi. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");

  let config;
  try {
    config = getSupabasePublicConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  } catch {
    return response; // Halaman Masuk menjelaskan konfigurasi yang kurang; halaman terlindungi gagal tertutup.
  }
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        const previousCookies = response.cookies.getAll();
        const previousHeaders = new Headers(response.headers);
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        previousHeaders.forEach((value, key) => { if (key.toLowerCase() !== "set-cookie") response.headers.set(key, value); });
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  try { await supabase.auth.getClaims(); } catch { /* halaman/aksi memeriksa ulang identitas dan gagal tertutup */ }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|templates/).*)"],
};
