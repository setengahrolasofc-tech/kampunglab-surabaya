import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAppOrigin, safeAuthDestination } from "@/lib/auth/validation.mjs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = getAppOrigin(process.env.NEXT_PUBLIC_APP_URL);
  let destination = "/masuk?status=tautan-gagal";
  if (code && code.length <= 4096) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) destination = safeAuthDestination(request.nextUrl.searchParams.get("next"));
    } catch { /* No tokens or provider error bodies are exposed. */ }
  }
  const response = NextResponse.redirect(new URL(destination, origin), 303);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
