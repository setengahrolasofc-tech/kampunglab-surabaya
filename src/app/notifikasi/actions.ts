"use server";

import { revalidatePath } from "next/cache";
import { requireAnyUser } from "@/lib/auth/session";
import { back } from "@/lib/flash";
import { isUuid, str } from "@/lib/form";

/** Setelah menandai, segarkan seluruh tata letak agar angka di ikon lonceng ikut berubah. */
function refresh() { revalidatePath("/", "layout"); }

export async function markReadAction(form: FormData) {
  const { supabase } = await requireAnyUser();
  const id = str(form, "id");
  if (!isUuid(id)) back("/notifikasi", "err", "Notifikasi tidak ditemukan.");
  const { error } = await supabase.rpc("mark_notification_read", { p_id: id });
  if (error) back("/notifikasi", "err", "Notifikasi belum dapat ditandai dibaca. Coba lagi sebentar lagi.");
  refresh();
  back("/notifikasi", "ok", "Notifikasi ditandai sudah dibaca.");
}

export async function markAllReadAction() {
  const { supabase } = await requireAnyUser();
  const { error } = await supabase.rpc("mark_all_notifications_read");
  if (error) back("/notifikasi", "err", "Notifikasi belum dapat ditandai dibaca. Coba lagi sebentar lagi.");
  refresh();
  back("/notifikasi", "ok", "Semua notifikasi ditandai sudah dibaca.");
}
