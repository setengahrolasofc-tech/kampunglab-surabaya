"use server";

import { createAdminSupabaseClient, hasServiceRole } from "@/lib/supabase/admin";
import { visitorIpHash } from "@/lib/client-ip";
import { back } from "@/lib/flash";
import { isUuid, optStr, str } from "@/lib/form";

export async function pilotInterestAction(form: FormData) {
  const id = str(form, "id");
  if (!isUuid(id)) back("/etalase", "err", "Inovasi tidak ditemukan.");
  const to = `/etalase/${id}`;
  if (str(form, "website")) back(to, "ok", "Terima kasih."); // honeypot untuk bot
  if (!hasServiceRole()) back(to, "err", "Formulir minat pilot belum dikonfigurasi di server.");
  const { error } = await createAdminSupabaseClient().rpc("tandai_minat_pilot", {
    p_id: id, p_nama: str(form, "nama"), p_instansi: str(form, "instansi"), p_kontak: str(form, "kontak"), p_pesan: optStr(form, "pesan"), p_ip_hash: await visitorIpHash(),
  });
  if (error) back(to, "err", error.code === "P0001" ? error.message : "Isian belum valid (nama, instansi, dan kontak wajib).");
  back(to, "ok", "Minat pilot Anda tercatat. BRIDA akan menghubungi lewat kontak yang diberikan.");
}
