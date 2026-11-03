"use server";

import { randomUUID } from "node:crypto";
import { createAdminSupabaseClient, hasServiceRole } from "@/lib/supabase/admin";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { visitorIpHash } from "@/lib/client-ip";
import { isUuid } from "@/lib/form";
import { parseSurveyForm } from "@/lib/domain/survey.mjs";
import type { SurveyQuestion } from "@/lib/types";

export type SurveyState = { ok?: boolean; total?: number; error?: string; errors?: Record<string, string> };

export async function submitSurveyAction(_: SurveyState, form: FormData): Promise<SurveyState> {
  const id = String(form.get("id") ?? "");
  if (!isUuid(id)) return { error: "Survei tidak ditemukan." };
  if (String(form.get("website") ?? "")) return { ok: true, total: 0 }; // honeypot
  if (!hasServiceRole()) return { error: "Survei belum dikonfigurasi di server. Hubungi pengelola." };

  const { data: info } = await createPublicSupabaseClient().rpc("survey_public_info", { p_id: id });
  const i = info as { aktif: boolean; pertanyaan?: SurveyQuestion[]; foto_wajib?: boolean } | null;
  if (!i?.aktif) return { error: "Uji warga untuk inovasi ini sedang tidak dibuka atau sudah berakhir." };

  const parsed = parseSurveyForm(form, i.pertanyaan ?? [], { fotoWajib: Boolean(i.foto_wajib) });
  if (Object.keys(parsed.errors).length) return { errors: parsed.errors, error: "Periksa isian yang ditandai." };

  const admin = createAdminSupabaseClient();
  let fotoPath: string | null = null;
  if (parsed.foto) {
    const ext = parsed.foto.type === "image/png" ? "png" : parsed.foto.type === "image/webp" ? "webp" : "jpg";
    fotoPath = `survey/${id}/${randomUUID()}.${ext}`;
    const up = await admin.storage.from("berkas").upload(fotoPath, Buffer.from(await parsed.foto.arrayBuffer()), { contentType: parsed.foto.type });
    if (up.error) return { error: "Foto belum dapat diunggah. Coba lagi." };
  }
  const v = parsed.value;
  const { data, error } = await admin.rpc("submit_survey_response", {
    p_innovation: id, p_nama: v.nama, p_usia: v.usia, p_tempat_tinggal: v.tempat_tinggal, p_kecamatan: v.kecamatan, p_kelurahan: v.kelurahan,
    p_rt: v.rt, p_rw: v.rw, p_foto_path: fotoPath, p_rating: v.rating, p_membantu: v.membantu, p_jawaban: v.jawaban, p_komentar: v.komentar || null,
    p_ip_hash: await visitorIpHash(),
  });
  if (error) {
    if (fotoPath) await admin.storage.from("berkas").remove([fotoPath]);
    return { error: error.code === "P0001" ? error.message : "Jawaban belum dapat disimpan. Coba lagi." };
  }
  return { ok: true, total: (data as { total?: number } | null)?.total };
}
