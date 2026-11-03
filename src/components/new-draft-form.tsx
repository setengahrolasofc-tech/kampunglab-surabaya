"use client";
import { useState } from "react";
import { KECAMATAN_KELURAHAN } from "@/lib/auth/surabaya-areas.mjs";
import { JENJANG, TIPE_INOVASI } from "@/lib/domain/innovation-rules.mjs";
import { createDraftAction } from "@/app/dashboard/actions";
import { SubmitButton } from "./submit-button";
import { Field, inputCls } from "./ui";

export function NewDraftForm({ problems, defaultProblem }: { problems: Array<{ id: string; label: string }>; defaultProblem?: string }) {
  const [problem, setProblem] = useState(defaultProblem ?? "");
  const [kec, setKec] = useState("");
  return (
    <form action={createDraftAction} className="space-y-4">
      <Field label="Masalah dari Papan Masalah (opsional)" htmlFor="problem_board_id" hint="Bila dipilih, kelurahan lokasi uji otomatis mengikuti masalah ini.">
        <select id="problem_board_id" name="problem_board_id" value={problem} onChange={(e) => setProblem(e.target.value)} className={inputCls}>
          <option value="">— Survei mandiri (pilih kelurahan sendiri) —</option>{problems.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </Field>
      {!problem && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kecamatan lokasi uji" htmlFor="kecamatan"><select id="kecamatan" name="kecamatan" value={kec} onChange={(e) => setKec(e.target.value)} className={inputCls}><option value="">Pilih kecamatan</option>{Object.keys(KECAMATAN_KELURAHAN).map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="Kelurahan lokasi uji" htmlFor="kelurahan"><select id="kelurahan" name="kelurahan" disabled={!kec} className={inputCls}><option value="">Pilih kelurahan</option>{(KECAMATAN_KELURAHAN[kec as keyof typeof KECAMATAN_KELURAHAN] ?? []).map((k: string) => <option key={k}>{k}</option>)}</select></Field>
        </div>)}
      <Field label="Judul sementara" htmlFor="judul"><input id="judul" name="judul" maxLength={160} className={inputCls} placeholder="Contoh: Pemilah Sampah Pintar RT 3" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipe inovasi" htmlFor="tipe_inovasi" hint="Program/Produk = Skala Kecil (maks Rp5 jt, 30 hari). Prototipe/Teknologi = Skala Terapan (maks Rp15 jt, 60 hari).">
          <select id="tipe_inovasi" name="tipe_inovasi" className={inputCls}>{TIPE_INOVASI.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
        <Field label="Jenjang pendidikan Anda (ketua tim)" htmlFor="jenjang" hint="Minimal SMA/SMK. SMP/SD ke bawah ditolak."><select id="jenjang" name="jenjang" defaultValue="WARGA_UMUM" className={inputCls}>{JENJANG.filter((j) => j.value !== "SMP_KE_BAWAH").map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}</select></Field>
      </div>
      <SubmitButton>Buat draft</SubmitButton>
    </form>
  );
}
