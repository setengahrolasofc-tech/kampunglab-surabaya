export const monitoringStatuses = ["waiting_rt", "waiting_rw", "waiting_kelurahan", "waiting_evaluation", "revision_requested", "rejected"] as const;
export type MonitoringFilters = { kelurahan_id: string; theme_id: string; status: string; page: number };
export type MonitoringGroup = { id: string | null; name: string; code?: string; count: number; waiting: number; evaluation: number; revision: number; rejected: number };
export type MonitoringReport = {
  generated_at: string;
  mode: "demo";
  filters: { kelurahan_id: string | null; theme_id: string | null; status: string | null };
  options: { territories: { id: string; name: string; code: string }[]; themes: { id: string; name: string; code: string }[] };
  summary: { drafts: number; rounds: number; waiting: number; waiting_24h: number; needs_primary: number; physical_pending: number; small_unshared: number; small_open: number; small_paused: number };
  statuses: { status: string; count: number; waiting_24h: number; needs_primary: number; oldest_queue_at: string | null }[];
  themes: MonitoringGroup[];
  territory_count: number;
  territories: MonitoringGroup[];
};
