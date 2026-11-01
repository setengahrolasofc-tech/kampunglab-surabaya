import { isUuid } from "@/lib/admin/validation.mjs";
import { notificationKinds } from "./types";

export function notificationInput(form: FormData) {
  const kind = form.get("kind"), sourceId = form.get("source_id"), occurredAt = form.get("occurred_at");
  if (typeof kind !== "string" || !notificationKinds.some(value => value === kind) || !isUuid(sourceId)
    || typeof occurredAt !== "string" || occurredAt.length > 40
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(occurredAt)
    || !Number.isFinite(Date.parse(occurredAt))) return null;
  // Preserve PostgreSQL microseconds; Date.toISOString() would round to milliseconds.
  return { kind, source_id: String(sourceId), occurred_at: occurredAt };
}

export function notificationDestination(value: unknown): value is string {
  if (value === "/dashboard") return true;
  if (typeof value !== "string") return false;
  const territory = /^\/mandat\/([^/]+)$/.exec(value);
  if (territory) return isUuid(territory[1]);
  const match = /^\/(?:simulasi|dokumen-fisik|panel\/penugasan|admin\/panel)\/([^/]+)(\/panel)?$/.exec(value);
  return Boolean(match && isUuid(match[1]) && (!match[2] || value.startsWith("/simulasi/")));
}
