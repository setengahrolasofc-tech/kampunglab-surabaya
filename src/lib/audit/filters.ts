import "server-only";
import { isUuid } from "@/lib/admin/validation.mjs";
import { auditActions, auditModules, type AuditCursor, type AuditFilters } from "./types";

export type AuditQuery = { module?: string | string[]; action?: string | string[]; actor_id?: string | string[]; from?: string | string[]; to?: string | string[]; cursor?: string | string[] };
function validDate(value: string) {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function parseCursor(value: string): AuditCursor | null {
  if (!/^[A-Za-z0-9_-]{1,400}$/.test(value)) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const row = parsed as Record<string, unknown>;
    if ((row.source !== "identity" && row.source !== "workflow") || !isUuid(row.id) || typeof row.occurred_at !== "string"
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(row.occurred_at)
      || !validDate(row.occurred_at.slice(0, 10)) || !Number.isFinite(Date.parse(row.occurred_at))) return null;
    return { source: row.source, id: String(row.id), occurred_at: row.occurred_at };
  } catch { return null; }
}
export function auditFilters(query: AuditQuery): AuditFilters | null {
  if (Object.values(query).some(value => Array.isArray(value))) return null;
  const moduleName = query.module || "all", action = query.action || "all", actor = query.actor_id || "", from = query.from || "", to = query.to || "", cursor = query.cursor || "";
  if (typeof moduleName !== "string" || !Object.hasOwn(auditModules, moduleName) || typeof action !== "string" || !Object.hasOwn(auditActions, action)
    || typeof actor !== "string" || (actor && !isUuid(actor)) || typeof from !== "string" || (from && !validDate(from))
    || typeof to !== "string" || (to && !validDate(to)) || (from && to && from > to) || typeof cursor !== "string") return null;
  const parsed = cursor ? parseCursor(cursor) : null;
  if (cursor && !parsed) return null;
  return { module: moduleName as AuditFilters["module"], action: action as AuditFilters["action"], actor_id: actor, from, to, cursor: parsed };
}
export function auditSearch(filters: AuditFilters, cursor = filters.cursor) {
  const query = new URLSearchParams();
  for (const key of ["module", "action", "actor_id", "from", "to"] as const) if (filters[key] && filters[key] !== "all") query.set(key, filters[key]);
  if (cursor) query.set("cursor", Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url"));
  return query.toString();
}
