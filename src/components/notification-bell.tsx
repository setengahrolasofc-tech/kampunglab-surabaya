import Link from "next/link";
import { getSession } from "@/lib/auth/session";

/** Ikon lonceng + jumlah notifikasi belum dibaca (server component; data dibatasi RLS ke pemilik). */
export async function NotificationBell() {
  const session = await getSession();
  if (!session) return null;
  const { count } = await session.supabase.from("notifications").select("id", { count: "exact", head: true }).eq("untuk_user_id", session.userId).eq("dibaca", false);
  const n = count ?? 0;
  return (
    <Link href="/notifikasi" className="relative rounded-lg p-2 hover:bg-white/10" aria-label={n ? `Notifikasi, ${n} belum dibaca` : "Notifikasi"}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {n > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-[1.1rem] rounded-full bg-gold px-1 text-center text-[0.65rem] font-bold text-indigo-space">{n > 99 ? "99+" : n}</span>}
    </Link>
  );
}
