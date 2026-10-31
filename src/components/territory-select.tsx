"use client";
import { useState } from "react";
import type { Territory } from "@/lib/drafts/types";
import { OTHER_KECAMATAN, byName, kecamatanOf, nameOptions } from "@/lib/drafts/territory-areas.mjs";

const style = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base disabled:opacity-60";

function Pick({ id, label, value, onChange, options, placeholder, disabled, name, invalid, describedBy }: {
  id: string; label: string; value: string; onChange: (value: string) => void; options: { id: string; label: string }[];
  placeholder: string; disabled?: boolean; name?: string; invalid?: boolean; describedBy?: string;
}) {
  return <div>
    <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
    <select id={id} name={name} value={value} disabled={disabled} className={style} aria-invalid={invalid} aria-describedby={describedBy} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  </div>;
}

/** Kecamatan → kelurahan → RW → RT. Kecamatan diturunkan dari kode kelurahan; nilai yang disimpan tetap id RT. */
export function TerritorySelect({ territories, value, onChange, prefix, error }: {
  territories: Territory[]; value: string; onChange: (id: string) => void; prefix: string; error?: string;
}) {
  const initialRt = territories.find(t => t.id === value);
  const initialRw = territories.find(t => t.id === initialRt?.parent_id);
  const initialKel = territories.find(t => t.id === initialRw?.parent_id);
  const [kec, setKec] = useState(initialKel ? kecamatanOf(initialKel) : "");
  const [kel, setKel] = useState(initialKel?.id ?? "");
  const [rw, setRw] = useState(initialRw?.id ?? "");
  const kelurahan = territories.filter(t => t.kind === "kelurahan");
  const kecamatan = [...new Set(kelurahan.map(kecamatanOf))].sort((a, b) => a === OTHER_KECAMATAN ? 1 : b === OTHER_KECAMATAN ? -1 : a.localeCompare(b, "id"));
  const children = (kind: string, parent: string) => nameOptions(territories.filter(t => t.kind === kind && t.parent_id === parent).sort(byName));
  const kelOptions = kec ? nameOptions(kelurahan.filter(t => kecamatanOf(t) === kec).sort(byName)) : [];
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <Pick id={`${prefix}-kec`} label="Kecamatan" value={kec} placeholder="Pilih kecamatan" options={kecamatan.map(k => ({ id: k, label: k }))}
        onChange={v => { setKec(v); setKel(""); setRw(""); onChange(""); }} />
      <Pick id={`${prefix}-kel`} label="Kelurahan" value={kel} placeholder="Pilih kelurahan" disabled={!kec} options={kelOptions}
        onChange={v => { setKel(v); setRw(""); onChange(""); }} />
      <Pick id={`${prefix}-rw`} label="RW" value={rw} placeholder="Pilih RW" disabled={!kel} options={kel ? children("rw", kel) : []}
        onChange={v => { setRw(v); onChange(""); }} />
      <Pick id={`${prefix}-rt`} name="rt_id" label="RT" value={value} placeholder="Pilih RT" disabled={!rw} options={rw ? children("rt", rw) : []}
        invalid={Boolean(error)} describedBy={error ? `${prefix}-error` : undefined} onChange={onChange} />
    </div>
    {error ? <p id={`${prefix}-error`} className="text-sm text-red-800">{error}</p> : null}
  </div>;
}
