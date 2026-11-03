import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { Card, Main, PageHeader, btnOutline, inputCls } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { tanggal } from "@/lib/domain/format.mjs";
import { setParametersAction } from "../actions";

export const metadata: Metadata = { title: "Parameter Sistem" };

export default async function ParameterPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("BRIDA_ADMIN");
  const { data } = await supabase.from("system_parameters").select("*").order("key");
  return (
    <Main narrow>
      <PageHeader title="Parameter Sistem" subtitle="Plafon, porsi pencairan, durasi uji, dan ambang kelayakan. Perubahan berlaku untuk keputusan berikutnya dan tercatat di audit log. Total porsi harus 100%." actions={<Link href="/admin" className={btnOutline}>← Dashboard</Link>} />
      <Flash ok={sp.ok} err={sp.err} />
      <Card>
        <form action={setParametersAction} className="space-y-4">
          {(data ?? []).map((p) => (
            <div key={p.key} className="grid items-center gap-2 border-b border-celadon/60 pb-3 sm:grid-cols-[1fr_12rem]">
              <label htmlFor={`p_${p.key}`}><span className="block text-sm font-semibold">{p.keterangan}</span><span className="text-xs text-indigo-space/55">{p.key} · diubah {tanggal(p.updated_at)}</span></label>
              {typeof p.value === "boolean"
                ? <select id={`p_${p.key}`} name={`p_${p.key}`} defaultValue={String(p.value)} className={inputCls}><option value="true">Ya</option><option value="false">Tidak</option></select>
                : <input id={`p_${p.key}`} name={`p_${p.key}`} defaultValue={String(p.value)} inputMode="decimal" className={inputCls} />}
            </div>))}
          <SubmitButton>Simpan parameter</SubmitButton>
        </form>
      </Card>
    </Main>
  );
}
