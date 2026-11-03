import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert, Card, Field, Main, PageHeader, btnPrimary, inputCls } from "@/components/ui";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export const metadata: Metadata = { title: "Verifikasi Rapor" };

async function cari(form: FormData) {
  "use server";
  const kode = String(form.get("kode") ?? "").trim().toUpperCase().slice(0, 40);
  if (!/^RBI-[A-Z0-9-]{4,30}$/.test(kode)) redirect("/verifikasi?err=" + encodeURIComponent("Format kode: RBI-KL-xxxx-xxxxxx"));
  const { data } = await createPublicSupabaseClient().from("evidence_passports").select("innovation_id").eq("passport_code", kode).maybeSingle();
  if (!data) redirect("/verifikasi?err=" + encodeURIComponent("Kode Rapor tidak ditemukan."));
  redirect(`/rapor/${data.innovation_id}`);
}

export default async function VerifikasiPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  return (
    <Main narrow>
      <PageHeader title="Verifikasi Rapor Bukti Inovasi" subtitle="Cara termudah: pindai QR pada Rapor. Atau masukkan kode Rapor di bawah." />
      {err && <div className="mb-4"><Alert tone="bahaya">{err}</Alert></div>}
      <Card><form action={cari} className="flex flex-wrap items-end gap-3"><div className="grow"><Field label="Kode Rapor" htmlFor="kode"><input id="kode" name="kode" placeholder="RBI-KL-2611-ABC123" className={inputCls} /></Field></div><button className={btnPrimary}>Periksa</button></form></Card>
    </Main>
  );
}
