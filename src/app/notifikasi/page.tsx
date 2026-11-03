import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Empty, Main, PageHeader, btnOutline, cx } from "@/components/ui";
import { requireAnyUser } from "@/lib/auth/session";
import { tanggal } from "@/lib/domain/format.mjs";
import type { NotificationRow } from "@/lib/types";
import { markAllReadAction, markReadAction } from "./actions";

export const metadata: Metadata = { title: "Notifikasi" };

export default async function NotifikasiPage() {
  const { supabase, userId } = await requireAnyUser();
  const { data } = await supabase.from("notifications").select("id, tipe, pesan, tautan, dibaca, dibuat_pada").eq("untuk_user_id", userId).order("dibuat_pada", { ascending: false }).limit(100);
  const rows = (data ?? []) as NotificationRow[];
  const belum = rows.filter((r) => !r.dibaca).length;
  return (
    <Main narrow>
      <PageHeader title="Notifikasi" subtitle={belum ? `${belum} belum dibaca` : "Semua sudah dibaca"} actions={belum > 0 ? <form action={markAllReadAction}><button className={btnOutline}>Tandai semua dibaca</button></form> : undefined} />
      {rows.length === 0 ? <Empty>Belum ada notifikasi.</Empty> : (
        <ul className="space-y-2">{rows.map((n) => (
          <li key={n.id} className={cx("rounded-xl border p-4", n.dibaca ? "border-celadon bg-white" : "border-gold bg-gold/20")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="text-sm">{n.pesan}</p><p className="mt-1 text-xs text-indigo-space/60">{tanggal(n.dibuat_pada, true)} {!n.dibaca && <Badge tone="perhatian">Baru</Badge>}</p></div>
              <div className="flex gap-2">{n.tautan && <Link href={n.tautan} className="text-sm font-semibold text-teal-deep underline">Buka</Link>}
                {!n.dibaca && <form action={markReadAction}><input type="hidden" name="id" value={n.id} /><button className="text-sm text-indigo-space/70 underline">Tandai dibaca</button></form>}</div>
            </div>
          </li>))}</ul>)}
    </Main>
  );
}
