import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogoFull } from "@/components/logo";
import { SurveyForm } from "@/components/survey-form";
import { Alert, Card, Main } from "@/components/ui";
import { tanggal } from "@/lib/domain/format.mjs";
import { isUuid } from "@/lib/form";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { SurveyQuestion } from "@/lib/types";

export const metadata: Metadata = { title: "Survei Uji Warga", robots: { index: false } };

export default async function UjiPublik({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = createPublicSupabaseClient();
  await supabase.rpc("sync_due_tests");
  const { data } = await supabase.rpc("survey_public_info", { p_id: id });
  const i = data as { aktif: boolean; judul?: string; masalah?: string; tujuan?: string; kecamatan?: string; kelurahan?: string; sampai?: string; pertanyaan?: SurveyQuestion[]; foto_wajib?: boolean } | null;
  return (
    <Main narrow>
      <div className="mb-4 flex justify-center"><LogoFull size={44} /></div>
      {!i?.aktif ? (
        <Card className="space-y-2 text-center"><h1 className="text-xl font-bold">Survei ini sedang tidak dibuka</h1><p className="text-sm text-indigo-space/75">Masa uji sudah berakhir atau belum dimulai. Terima kasih sudah tertarik ikut menguji.</p></Card>
      ) : (
        <div className="space-y-5">
          <Card tone="celadon" className="space-y-1"><p className="text-xs font-bold uppercase tracking-widest text-teal-deep">Uji warga · Kel. {i.kelurahan}, Kec. {i.kecamatan}</p>
            <h1 className="text-2xl font-extrabold">{i.judul}</h1><p className="text-sm"><strong>Masalah:</strong> {i.masalah}</p><p className="text-sm"><strong>Tujuan:</strong> {i.tujuan}</p>
            <p className="text-xs text-indigo-space/65">Survei dibuka sampai {tanggal(i.sampai)}. Tanpa akun, ±2 menit.</p></Card>
          <Alert tone="info">Hanya untuk warga <strong>Kelurahan {i.kelurahan}</strong>. Satu orang, satu suara. Nilai dengan jujur: bintang lima yang dipaksakan justru merugikan warga.</Alert>
          <Card><SurveyForm id={id} judul={i.judul ?? ""} pertanyaan={i.pertanyaan ?? []} fotoWajib={Boolean(i.foto_wajib)} /></Card>
        </div>)}
    </Main>
  );
}
