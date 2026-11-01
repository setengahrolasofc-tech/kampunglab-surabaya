"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { notificationDestination, notificationInput } from "@/lib/notifications/validation";
import type { NotificationFormState } from "@/lib/notifications/types";

export async function openNotification(_state: NotificationFormState, form: FormData): Promise<NotificationFormState> {
  const { supabase } = await requireUser();
  const payload = notificationInput(form);
  if (!payload) return { error: "Notifikasi tidak valid. Muat ulang daftar, lalu coba kembali." };

  let destination: unknown;
  try {
    const result = await supabase.rpc("notification_workflow", { operation: "open", payload })
      .abortSignal(AbortSignal.timeout(15000));
    if (result.error) {
      const messages: Record<string, string> = {
        SESSION_REQUIRED: "Sesi sudah berakhir. Masuk kembali.",
        NOTIFICATION_UNAVAILABLE: "Pembaruan ini sudah tidak tersedia untuk aksesmu. Muat ulang daftar.",
        NOTIFICATION_CHANGED: "Antrean sudah berubah. Muat ulang daftar sebelum membukanya.",
      };
      return { error: messages[result.error.message] ?? "Belum dapat membuka notifikasi. Muat ulang daftar, lalu coba kembali." };
    }
    destination = (result.data as { destination?: unknown } | null)?.destination;
  } catch {
    return { error: "Hasil pembukaan belum dapat dipastikan. Muat ulang daftar; aman untuk mencoba kembali." };
  }
  if (!notificationDestination(destination)) return { error: "Tautan pembaruan belum dapat dibuka. Muat ulang daftar." };
  revalidatePath("/notifikasi");
  revalidatePath("/dashboard");
  redirect(destination);
}
