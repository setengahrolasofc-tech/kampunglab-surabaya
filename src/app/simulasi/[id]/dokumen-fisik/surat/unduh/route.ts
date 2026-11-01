import { isUuid } from "@/lib/admin/validation.mjs";
import { getPhysicalLetter, PhysicalLetterError } from "@/lib/physical/letter-data";
import { physicalLetterExpectation, samePhysicalLetterContext } from "@/lib/physical/letter";
import { createPhysicalLetterDocx } from "@/lib/physical/letter-docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "Surat tidak tersedia." }, { status: 404, headers });
  const expected = physicalLetterExpectation(new URL(request.url).searchParams);
  if (!expected) return Response.json({ error: "Buka ulang pratinjau untuk memakai konteks antrean terbaru." }, { status: 400, headers });
  try {
    const { data, assertCurrent } = await getPhysicalLetter(id);
    if (!samePhysicalLetterContext(expected, data)) throw new PhysicalLetterError("CHANGED");
    const buffer = await createPhysicalLetterDocx(data);
    await assertCurrent(expected);
    return new Response(new Uint8Array(buffer), { headers: {
      ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="DRAF-DEMO-Rekomendasi-${data.stage.toUpperCase()}-${id}.docx"`,
      "Content-Security-Policy": "sandbox",
    } });
  } catch (error) {
    if (!(error instanceof PhysicalLetterError)) throw error; // Includes framework redirects for missing sessions.
    const messages = {
      UNAVAILABLE: "Surat tidak tersedia untuk akunmu.", NOT_READY: "Jalur fisik belum tersedia pada konteks antrean ini. Buka ulang halaman pengajuan fisik.",
      CHANGED: "Tahap, versi alur, atau batas antrean berubah. Buka ulang pratinjau sebelum mengunduh.", LOAD_FAILED: "Data surat belum dapat dimuat. Coba kembali.",
    };
    return Response.json({ error: messages[error.code] }, { status: error.code === "UNAVAILABLE" ? 404 : error.code === "LOAD_FAILED" ? 503 : 409, headers });
  }
}
