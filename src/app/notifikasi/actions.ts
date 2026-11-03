"use server";

import { revalidatePath } from "next/cache";
import { requireAnyUser } from "@/lib/auth/session";
import { isUuid, str } from "@/lib/form";

export async function markReadAction(form: FormData) {
  const { supabase } = await requireAnyUser();
  const id = str(form, "id");
  if (isUuid(id)) await supabase.rpc("mark_notification_read", { p_id: id });
  revalidatePath("/notifikasi");
}

export async function markAllReadAction() {
  const { supabase } = await requireAnyUser();
  await supabase.rpc("mark_all_notifications_read");
  revalidatePath("/notifikasi");
}
