import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Tautan unduh berkas privat: tanda tangan 60 detik dibuat dengan sesi pengguna, jadi kebijakan storage (RLS) yang menentukan. */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "";
  const deny = () => new NextResponse("Berkas tidak tersedia atau Anda tidak berwenang.", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!path || path.length > 300 || path.includes("..") || path.startsWith("/")) return deny();
  try {
    const supabase = await createServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.redirect(new URL("/masuk?status=perlu-masuk", request.url), 303);
    const { data, error } = await supabase.storage.from("berkas").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) return deny();
    const res = NextResponse.redirect(data.signedUrl, 302);
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("Referrer-Policy", "no-referrer");
    return res;
  } catch {
    return deny();
  }
}
