import "server-only";
import { requireUser } from "@/lib/auth/session";
import type { NotificationInbox, NotificationSummary, NotificationView } from "./types";

export async function getNotificationSummary(): Promise<NotificationSummary | null> {
  const { supabase } = await requireUser();
  try {
    const result = await supabase.rpc("notification_workflow", { operation: "summary", payload: {} })
      .abortSignal(AbortSignal.timeout(15000));
    return result.error ? null : result.data as unknown as NotificationSummary;
  } catch {
    return null;
  }
}

export async function getNotificationInbox(page: number, view: NotificationView): Promise<NotificationInbox | null> {
  const { supabase } = await requireUser();
  try {
    const result = await supabase.rpc("notification_workflow", { operation: "list", payload: { page, view } })
      .abortSignal(AbortSignal.timeout(15000));
    return result.error ? null : result.data as unknown as NotificationInbox;
  } catch {
    return null;
  }
}
