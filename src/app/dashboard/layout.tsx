import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSession } from "@/lib/auth/session";

/** Kerangka dashboard Inovator (sidebar + topbar). Halaman di dalamnya tetap memeriksa peran sendiri. */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.profile.role !== "INNOVATOR") return <>{children}</>;
  const { count } = await session.supabase.from("notifications").select("id", { count: "exact", head: true }).eq("untuk_user_id", session.userId).eq("dibaca", false);
  return <DashboardShell name={session.profile.name} roleLabel="Tim Inovator" unread={count ?? 0}>{children}</DashboardShell>;
}
