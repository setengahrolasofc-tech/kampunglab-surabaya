"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminSupabaseClient, hasServiceRole } from "@/lib/supabase/admin";
import { dbMessage } from "@/lib/errors";
import { back } from "@/lib/flash";
import { isUuid, optStr, str } from "@/lib/form";

export async function decideMandateAction(form: FormData) {
  const { supabase } = await requireRole("BRIDA_ADMIN");
  const user = str(form, "user");
  if (!isUuid(user)) back("/admin/mandat", "err", "Akun tidak ditemukan.");
  const tipe = str(form, "tipe");
  const { data, error } = await supabase.rpc("brida_decide_mandate", {
    p_user: user, p_action: str(form, "action"), p_tipe: tipe === "UTAMA" || tipe === "CADANGAN" ? tipe : null, p_alasan: optStr(form, "alasan"),
  });
  if (error) back("/admin/mandat", "err", dbMessage(error));
  revalidatePath("/admin");
  const n = (data as { pengajuan_dilanjutkan?: number } | null)?.pengajuan_dilanjutkan ?? 0;
  back("/admin/mandat", "ok", str(form, "action") === "BERI" ? `Mandat diberikan.${n ? ` ${n} pengajuan yang menunggu otomatis diteruskan ke Kelurahan.` : ""}` : "Keputusan tercatat dan pendaftar diberi tahu.");
}

export async function revokeMandateAction(form: FormData) {
  const { supabase } = await requireRole("BRIDA_ADMIN");
  const id = str(form, "mandate");
  if (!isUuid(id)) back("/admin/mandat", "err", "Mandat tidak ditemukan.");
  const { error } = await supabase.rpc("brida_revoke_mandate", { p_mandate: id, p_alasan: str(form, "alasan") });
  if (error) back("/admin/mandat", "err", dbMessage(error));
  revalidatePath("/admin");
  back("/admin/mandat", "ok", "Mandat dicabut dan tercatat di audit log.");
}

export async function setParametersAction(form: FormData) {
  const { supabase } = await requireRole("BRIDA_ADMIN");
  const values: Record<string, number | boolean> = {};
  for (const [k, v] of form.entries()) {
    if (!k.startsWith("p_")) continue;
    const key = k.slice(2), raw = String(v).trim();
    if (raw === "true" || raw === "false") values[key] = raw === "true";
    else if (raw !== "" && Number.isFinite(Number(raw.replace(",", ".")))) values[key] = Number(raw.replace(",", "."));
  }
  const { error } = await supabase.rpc("brida_set_parameters", { p_values: values });
  if (error) back("/admin/parameter", "err", dbMessage(error));
  back("/admin/parameter", "ok", "Parameter disimpan dan tercatat di audit log.");
}

async function adminRpc(form: FormData, fn: string, args: Record<string, unknown>, okMsg: string, to: string) {
  const { supabase } = await requireRole("BRIDA_ADMIN");
  void form;
  const { error } = await supabase.rpc(fn, args);
  if (error) back(to, "err", dbMessage(error));
  revalidatePath("/admin");
  back(to, "ok", okMsg);
}

export async function decideAppealAction(form: FormData) {
  const id = str(form, "id");
  if (!isUuid(id)) back("/admin/sengketa", "err", "Pengajuan tidak ditemukan.");
  await adminRpc(form, "brida_decide_appeal", { p_innovation: id, p_putusan: str(form, "putusan"), p_catatan: str(form, "catatan") }, "Putusan banding tercatat.", `/admin/pengajuan/${id}`);
}

export async function resolveDisputeAction(form: FormData) {
  const id = str(form, "id"), dispute = str(form, "dispute");
  if (!isUuid(id) || !isUuid(dispute)) back("/admin/sengketa", "err", "Sengketa tidak ditemukan.");
  await adminRpc(form, "brida_resolve_dispute", { p_dispute: dispute, p_resolusi: str(form, "resolusi"), p_catatan: str(form, "catatan") }, "Putusan sengketa tercatat.", `/admin/pengajuan/${id}`);
}

export async function terminateAction(form: FormData) {
  const id = str(form, "id");
  if (!isUuid(id)) back("/admin/sengketa", "err", "Pengajuan tidak ditemukan.");
  await adminRpc(form, "brida_terminate_innovation", { p_id: id, p_alasan: str(form, "alasan") }, "Proyek dihentikan; nama tim masuk daftar hitam dan akun ketua diblokir.", `/admin/pengajuan/${id}`);
}

export async function blacklistAddAction(form: FormData) {
  await adminRpc(form, "brida_blacklist_add", { p_nama: str(form, "nama"), p_alasan: str(form, "alasan") }, "Nama ditambahkan ke daftar hitam.", "/admin/blacklist");
}

export async function blacklistRemoveAction(form: FormData) {
  const id = str(form, "id");
  if (!isUuid(id)) back("/admin/blacklist", "err", "Entri tidak ditemukan.");
  await adminRpc(form, "brida_blacklist_remove", { p_id: id, p_alasan: str(form, "alasan") }, "Entri dihapus dari daftar hitam.", "/admin/blacklist");
}

export async function anonymizeAction(form: FormData) {
  const { supabase } = await requireRole("BRIDA_ADMIN");
  const id = str(form, "id");
  if (!isUuid(id)) back("/admin/sengketa", "err", "Pengajuan tidak ditemukan.");
  const to = `/admin/pengajuan/${id}`;
  const { data, error } = await supabase.rpc("brida_anonymize_survey", { p_id: id });
  if (error) back(to, "err", dbMessage(error));
  const paths = (data as string[] | null) ?? [];
  let hapus = "";
  if (paths.length && hasServiceRole()) {
    const r = await createAdminSupabaseClient().storage.from("berkas").remove(paths);
    hapus = r.error ? " Foto belum terhapus dari storage; ulangi atau hapus manual." : ` ${paths.length} foto dihapus dari storage.`;
  } else if (paths.length) hapus = " SUPABASE_SERVICE_ROLE_KEY belum diisi, jadi berkas foto belum dihapus dari storage.";
  back(to, "ok", "Data penguji dianonimkan (nama jadi inisial, tempat tinggal dihapus)." + hapus);
}
