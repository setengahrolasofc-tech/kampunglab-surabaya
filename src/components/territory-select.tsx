"use client";
import { useState } from "react";
import type { Territory } from "@/lib/drafts/types";

const style = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base";
export function TerritorySelect({ territories, value, onChange, prefix, error }: {
  territories: Territory[]; value: string; onChange: (id: string) => void; prefix: string; error?: string;
}) {
  const initialRt = territories.find(t => t.id === value);
  const initialRw = territories.find(t => t.id === initialRt?.parent_id);
  const [kel, setKel] = useState(initialRw?.parent_id ?? "");
  const [rw, setRw] = useState(initialRw?.id ?? "");
  const options = (kind: string, parent?: string) => territories.filter(t => t.kind === kind && (parent === undefined || t.parent_id === parent)).sort((a,b) => a.name.localeCompare(b.name,"id",{numeric:true}));
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-3">
      <div><label htmlFor={`${prefix}-kel`} className="mb-2 block text-sm font-semibold">Kelurahan</label><select id={`${prefix}-kel`} value={kel} className={style} onChange={e => { setKel(e.target.value); setRw(""); onChange(""); }}><option value="">Pilih kelurahan</option>{options("kelurahan").map(t => <option key={t.id} value={t.id}>{t.name} · {t.code}</option>)}</select></div>
      <div><label htmlFor={`${prefix}-rw`} className="mb-2 block text-sm font-semibold">RW</label><select id={`${prefix}-rw`} value={rw} className={style} disabled={!kel} onChange={e => { setRw(e.target.value); onChange(""); }}><option value="">Pilih RW</option>{options("rw",kel).map(t => <option key={t.id} value={t.id}>{t.name} · {t.code}</option>)}</select></div>
      <div><label htmlFor={`${prefix}-rt`} className="mb-2 block text-sm font-semibold">RT</label><select id={`${prefix}-rt`} name="rt_id" value={value} className={style} disabled={!rw} aria-invalid={Boolean(error)} aria-describedby={error ? `${prefix}-error` : undefined} onChange={e => onChange(e.target.value)}><option value="">Pilih RT</option>{options("rt",rw).map(t => <option key={t.id} value={t.id}>{t.name} · {t.code}</option>)}</select></div>
    </div>
    {error ? <p id={`${prefix}-error`} className="text-sm text-red-800">{error}</p> : null}
    <p className="text-sm leading-6 text-slate-600">Nama berawalan DEMO adalah data latihan, bukan wilayah resmi program.</p>
  </div>;
}
