import { requireUser } from "@/lib/auth/session";
import { monitoringFilters } from "@/lib/monitoring/filters";
import { monitoringCsv } from "@/lib/monitoring/csv";
import type { MonitoringReport } from "@/lib/monitoring/types";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: Request) {
  const { supabase } = await requireUser();
  const query = new URL(request.url).searchParams;
  const filters = monitoringFilters(Object.fromEntries(["kelurahan_id", "theme_id", "status", "page"].map(key => [key, query.getAll(key).length > 1 ? query.getAll(key) : query.get(key) ?? ""])));
  if (!filters) return Response.json({ error: "Filter laporan tidak valid." }, { status: 400, headers });
  try {
    const result = await supabase.rpc("program_monitoring", { operation: "export", payload: filters })
      .abortSignal(AbortSignal.timeout(30000));
    if (result.error || !result.data) {
      const code = result.error?.message;
      return Response.json({ error: code === "ADMIN_REQUIRED" ? "Diperlukan admin program aktif." : code === "INVALID_FILTER" ? "Filter laporan tidak tersedia." : "Laporan belum dapat diunduh." },
        { status: code === "ADMIN_REQUIRED" || code === "SESSION_REQUIRED" ? 403 : code === "INVALID_FILTER" ? 400 : 503, headers });
    }
    return new Response(monitoringCsv(result.data as unknown as MonitoringReport), { headers: {
      ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="kampunglab-monitoring-demo.csv"', "Content-Security-Policy": "sandbox",
    } });
  } catch {
    return Response.json({ error: "Laporan belum dapat diunduh. Coba kembali." }, { status: 503, headers });
  }
}
