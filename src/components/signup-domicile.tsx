"use client";

import { KECAMATAN_KELURAHAN, RT_MAX, RW_MAX, twoDigits } from "@/lib/auth/surabaya-areas.mjs";

export type Domicile = { address: string; kecamatan: string; kelurahan: string; rw: string; rt: string };
export const emptyDomicile: Domicile = { address: "", kecamatan: "", kelurahan: "", rw: "", rt: "" };

const control = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 disabled:opacity-60 aria-invalid:border-red-600";
const numbers = (max: number) => Array.from({ length: max }, (_, index) => twoDigits(index + 1));

function Select({ id, name, label, value, onChange, disabled, error, placeholder, options, format }: {
  id: string; name: string; label: string; value: string; onChange: (value: string) => void; disabled?: boolean;
  error?: string; placeholder: string; options: readonly string[]; format?: (option: string) => string;
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
        {options.map((option) => <option key={option} value={option}>{format ? format(option) : option}</option>)}
      </select>
      {error ? <p id={`${id}-error`} className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}

/** Alamat, lalu kecamatan → kelurahan → RW → RT. Pilihan di bawahnya terbuka setelah yang di atasnya dipilih. */
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
          onChange={(kecamatan) => onChange({ ...value, kecamatan, kelurahan: "", rw: "", rt: "" })}
        />
        <Select
          id={`${prefix}-kelurahan`} name="kelurahan" label="Kelurahan" value={value.kelurahan} error={errors?.kelurahan}
          placeholder="Pilih kelurahan" options={kelurahan} disabled={!value.kecamatan}
          onChange={(next) => onChange({ ...value, kelurahan: next, rw: "", rt: "" })}
        />
        <Select
          id={`${prefix}-rw`} name="rw" label="RW" value={value.rw} error={errors?.rw}
          placeholder="Pilih RW" options={numbers(RW_MAX)} format={(option) => `RW ${option}`} disabled={!value.kelurahan}
          onChange={(rw) => onChange({ ...value, rw, rt: "" })}
        />
        <Select
          id={`${prefix}-rt`} name="rt" label="RT" value={value.rt} error={errors?.rt}
          placeholder="Pilih RT" options={numbers(RT_MAX)} format={(option) => `RT ${option}`} disabled={!value.rw}
          onChange={(rt) => onChange({ ...value, rt })}
        />
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Data wilayah masih contoh dan perlu dicocokkan dengan master resmi. Domisili ini belum diverifikasi RT/RW dan tidak memberi akses petugas.
      </p>
    </div>
  );
}
