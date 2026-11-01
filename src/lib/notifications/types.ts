export const notificationKinds = [
  "queue_rt", "queue_rw", "queue_kelurahan", "rt_note", "review",
  "physical_queue", "physical_action", "panel_assignment", "panel_result",
  "panel_conflict", "panel_coordination", "panel_assignment_update", "panel_revoked",
  "role_grant", "role_revoked", "mandate_grant", "mandate_revoked",
  "assign_rt", "assign_rw", "assign_kelurahan",
] as const;

export type NotificationKind = typeof notificationKinds[number];
export type NotificationView = "unread" | "all";
export type NotificationItem = {
  kind: NotificationKind;
  source_id: string;
  occurred_at: string;
  label: string;
  reference: string | null;
  unread: boolean;
};
export type NotificationSummary = { unread: number; total: number };
export type NotificationInbox = NotificationSummary & { count: number; rows: NotificationItem[] };
export type NotificationFormState = { error?: string };
