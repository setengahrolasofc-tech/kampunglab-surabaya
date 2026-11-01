export const auditModules = { all: "Semua modul", access: "Akses dan mandat", master: "Wilayah dan jabatan", physical: "Pengaturan jalur fisik", panel: "Koordinasi panel" } as const;
export const auditActions = { all: "Semua operasi", insert: "Penambahan", update: "Pembaruan", delete: "Penghapusan tercatat" } as const;
export type AuditCursor = { source: "identity" | "workflow"; id: string; occurred_at: string };
export type AuditFilters = { module: keyof typeof auditModules; action: keyof typeof auditActions; actor_id: string; from: string; to: string; cursor: AuditCursor | null };
export type AuditValue = string | number | boolean | null;
export type AuditEntry = AuditCursor & {
  actor_id: string | null; actor_name: string | null; actor_database_role: string;
  module: Exclude<keyof typeof auditModules, "all">; entity: string; entity_id: string; action: string;
  before_data: Record<string, AuditValue>; after_data: Record<string, AuditValue>; has_snapshot: boolean;
};
export type AuditLog = { generated_at: string; rows: AuditEntry[]; next_cursor: AuditCursor | null };
