import { isUuid } from "@/lib/admin/validation.mjs";
import { monitoringStatuses, type MonitoringFilters } from "./types";

export type MonitoringQuery = { kelurahan_id?: string | string[]; theme_id?: string | string[]; status?: string | string[]; page?: string | string[] };

export function monitoringFilters(query: MonitoringQuery): MonitoringFilters | null {
  if (Object.values(query).some(value => Array.isArray(value))) return null;
  const kelurahan = query.kelurahan_id || "", theme = query.theme_id || "", status = query.status || "", page = query.page || "1";
  if (typeof kelurahan !== "string" || typeof theme !== "string" || typeof status !== "string" || typeof page !== "string"
    || (kelurahan && !isUuid(kelurahan)) || (theme && !isUuid(theme))
    || (status && !monitoringStatuses.some(value => value === status)) || !/^[1-9]\d{0,3}$/.test(page)) return null;
  return { kelurahan_id: kelurahan, theme_id: theme, status, page: Number(page) - 1 };
}

export function monitoringSearch(filters: MonitoringFilters, page = filters.page) {
  const query = new URLSearchParams();
  for (const key of ["kelurahan_id", "theme_id", "status"] as const) if (filters[key]) query.set(key, filters[key]);
  if (page > 0) query.set("page", String(page + 1));
  return query.toString();
}
