import { roleLabels, mandateLabels } from "@/lib/admin/validation.mjs";
import type { AuditEntry, AuditValue } from "./types";
export const auditEntities: Record<string, string> = {
  "public.office_mandates": "Mandat jabatan", "public.platform_role_grants": "Peran program",
  "public.territories": "Master wilayah", "public.offices": "Master jabatan", "public.physical_route_settings": "Pengaturan jalur fisik",
  "public.simulation_panel_cases": "Pembagian panel DEMO", "public.simulation_panel_assignments": "Penugasan reviewer",
  "public.simulation_panel_events": "Peristiwa koordinasi panel",
};
export const auditFields = {
  user_id: "ID penerima akses", office_id: "ID jabatan", role: "Peran", mandate_type: "Jenis mandat", starts_at: "Mulai berlaku", ends_at: "Akhir berlaku",
  status: "Status", granted_by: "ID pemberi penetapan", revoked_at: "Waktu pencabutan", kind: "Tingkat/jenis", code: "Kode", name: "Nama master",
  parent_id: "ID wilayah induk", territory_id: "ID wilayah jabatan", active: "Aktif",
} as const;
const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
export const auditDate = (value: string) => Number.isFinite(Date.parse(value)) ? dateFormat.format(new Date(value)) + " WIB" : value;
export function auditValue(key: string, value: AuditValue | undefined): string {
  if (value === undefined) return "Tidak tercatat";
  if (value === null || value === "") return "Kosong";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "string") {
    if (["starts_at", "ends_at", "revoked_at"].includes(key)) return auditDate(value);
    if (key === "role" && Object.hasOwn(roleLabels, value)) return roleLabels[value as keyof typeof roleLabels];
    if (key === "mandate_type" && Object.hasOwn(mandateLabels, value)) return mandateLabels[value as keyof typeof mandateLabels];
    if (key === "status") return ({ active: "Aktif", revoked: "Dicabut" } as Record<string, string>)[value] ?? value;
  }
  return String(value);
}
export const auditChangedFields = (entry: AuditEntry) => Object.keys(auditFields).filter(key => JSON.stringify(entry.before_data[key]) !== JSON.stringify(entry.after_data[key])) as (keyof typeof auditFields)[];
