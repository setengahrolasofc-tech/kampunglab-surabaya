import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { destinationForIntent, getAppOrigin, normalizeIntent, safeAuthDestination } from "@/lib/auth/validation.mjs";
import { lengkapiProfilUrl, needsProfileCompletion } from "@/lib/auth/profile.mjs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = getAppOrigin(process.env.NEXT_PUBLIC_APP_URL);
  let destination = "/masuk?status=tautan-gagal";
  if (code && code.length <= 4096) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const next = request.nextUrl.searchParams.get("next");
        // Tanpa ?next= (masuk dengan Google): pakai pintu yang dipilih di halaman Masuk.
        const intent = normalizeIntent(request.cookies.get("kl_masuk_sebagai")?.value);
        destination = next ? safeAuthDestination(next) : destinationForIntent(intent);
        // Akun baru dari Google belum punya nama lengkap, WA, institusi, dst.: wajib melengkapi data (kecuali password) dulu.
        if (!next) {
          const { data: auth } = await supabase.auth.getUser();
          if (auth.user) {
            const { data: profile } = await supabase.from("users").select("role, phone_wa, institusi, kota_domisili").eq("id", auth.user.id).maybeSingle();
            if (needsProfileCompletion(profile)) destination = lengkapiProfilUrl(intent);
          }
        }
      }
    } catch { /* No tokens or provider error bodies are exposed. */ }
  }
  const response = NextResponse.redirect(new URL(destination, origin), 303);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.delete({ name: "kl_masuk_sebagai", path: "/auth" });
  return response;
}
