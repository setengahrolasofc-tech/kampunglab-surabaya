import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config.mjs";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  let config;
  try {
    config = getSupabasePublicConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  } catch {
    return response; // Auth pages explain missing config; protected pages fail closed.
  }

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        const previousCookies = response.cookies.getAll();
        const previousHeaders = new Headers(response.headers);
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        previousHeaders.forEach((value, key) => {
          if (key.toLowerCase() !== "set-cookie") response.headers.set(key, value);
        });
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  try { await supabase.auth.getClaims(); }
  catch { /* Protected pages/actions revalidate identity and fail closed. */ }
  return response;
}

export const config = {
  matcher: ["/masuk", "/daftar", "/lupa-kata-sandi", "/ubah-kata-sandi", "/dashboard/:path*", "/admin/:path*", "/profil/:path*", "/pengajuan/:path*", "/auth/:path*"],
};
