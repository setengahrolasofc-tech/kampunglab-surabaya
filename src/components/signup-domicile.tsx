"use client";

import { KECAMATAN_KELURAHAN } from "@/lib/auth/surabaya-areas.mjs";

export type Domicile = { address: string; kecamatan: string; kelurahan: string; rw: string; rt: string };
export const emptyDomicile: Domicile = { address: "", kecamatan: "", kelurahan: "", rw: "", rt: "" };

const control = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 disabled:opacity-60 aria-invalid:border-red-600";

function Select({ id, name, label, value, onChange, disabled, error, placeholder, options }: {
  id: string; name: string; label: string; value: string; onChange: (value: string) => void; disabled?: boolean;
  error?: string; placeholder: string; options: readonly string[];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      <select
        id={id} name={name} required value={value} disabled={disabled} className={control}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error ? <p id={`${id}-error`} className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}

function NumberField({ id, name, label, value, onChange, error, placeholder }: {
  id: string; name: string; label: string; value: string; onChange: (value: string) => void; error?: string; placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        id={id} name={name} required inputMode="numeric" autoComplete="off" maxLength={3} placeholder={placeholder}
        value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 3))}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={control}
      />
      {error ? <p id={`${id}-error`} className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}

/** Alamat, kecamatan → kelurahan (pilihan), lalu RW dan RT yang diketik manual. */
export function DomicileFields({ value, onChange, errors, prefix }: {
  value: Domicile; onChange: (next: Domicile) => void; errors?: Record<string, string>; prefix: string;
}) {
  const kelurahan = value.kecamatan && Object.hasOwn(KECAMATAN_KELURAHAN, value.kecamatan) ? KECAMATAN_KELURAHAN[value.kecamatan] : [];
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${prefix}-address`} className="mb-2 block text-sm font-semibold">Alamat</label>
        <input
          id={`${prefix}-address`} name="address" required maxLength={160} autoComplete="street-address"
          placeholder="Nama jalan dan nomor rumah" value={value.address}
          onChange={(event) => onChange({ ...value, address: event.target.value })}
          aria-invalid={Boolean(errors?.address)} aria-describedby={errors?.address ? `${prefix}-address-error` : undefined}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 aria-invalid:border-red-600"
        />
        {errors?.address ? <p id={`${prefix}-address-error`} className="mt-2 text-sm text-red-800">{errors.address}</p> : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          id={`${prefix}-kecamatan`} name="kecamatan" label="Kecamatan" value={value.kecamatan} error={errors?.kecamatan}
          placeholder="Pilih kecamatan" options={Object.keys(KECAMATAN_KELURAHAN)}
          onChange={(kecamatan) => onChange({ ...value, kecamatan, kelurahan: "" })}
        />
        <Select
          id={`${prefix}-kelurahan`} name="kelurahan" label="Kelurahan" value={value.kelurahan} error={errors?.kelurahan}
          placeholder="Pilih kelurahan" options={kelurahan} disabled={!value.kecamatan}
          onChange={(next) => onChange({ ...value, kelurahan: next })}
        />
        <NumberField id={`${prefix}-rw`} name="rw" label="RW" placeholder="Contoh: 3" value={value.rw} error={errors?.rw} onChange={(rw) => onChange({ ...value, rw })} />
        <NumberField id={`${prefix}-rt`} name="rt" label="RT" placeholder="Contoh: 7" value={value.rt} error={errors?.rt} onChange={(rt) => onChange({ ...value, rt })} />
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Ketik angka RW dan RT saja. Daftar kecamatan dan kelurahan masih contoh dan perlu dicocokkan dengan master resmi. Domisili ini belum diverifikasi RT/RW dan tidak memberi akses petugas.
      </p>
    </div>
  );
}
