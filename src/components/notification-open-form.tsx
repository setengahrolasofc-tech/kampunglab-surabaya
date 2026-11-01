"use client";

import { useActionState } from "react";
import { openNotification } from "@/app/notifikasi/actions";
import type { NotificationFormState, NotificationItem } from "@/lib/notifications/types";

type NotificationIdentity = Pick<NotificationItem, "kind" | "source_id" | "occurred_at">;

export function NotificationOpenForm({ item, label }: { item: NotificationIdentity; label: string }) {
  const [state, action, pending] = useActionState<NotificationFormState, FormData>(openNotification, {});
  return <form action={action} className="space-y-3">
    <input type="hidden" name="kind" value={item.kind} />
    <input type="hidden" name="source_id" value={item.source_id} />
    <input type="hidden" name="occurred_at" value={item.occurred_at} />
    {state.error ? <p role="alert" className="max-w-lg rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-900">{state.error}</p> : null}
    <button type="submit" disabled={pending} aria-label={`Buka pembaruan: ${label}`} className="min-h-11 rounded-full border border-emerald-900 px-5 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-50">
      {pending ? "Membuka…" : "Buka pembaruan"}
    </button>
  </form>;
}
