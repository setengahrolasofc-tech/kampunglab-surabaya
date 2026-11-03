"use client";
import { useActionState, useState } from "react";
import { KECAMATAN_KELURAHAN } from "@/lib/auth/surabaya-areas.mjs";
import type { SurveyQuestion } from "@/lib/types";
import { submitSurveyAction, type SurveyState } from "@/app/uji/[id]/actions";
import { SubmitButton } from "./submit-button";
import { Alert, Field, cx, inputCls } from "./ui";

const init: SurveyState = {};

/** Kompres foto di perangkat (maks. 1280 px, JPEG) supaya unggah cepat dan di bawah batas ukuran server. */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.8));
    return blob && blob.size < file.size ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : file;
  } catch { return file; }
}

export function SurveyForm({ id, judul, pertanyaan, fotoWajib }: { id: string; judul: string; pertanyaan: SurveyQuestion[]; fotoWajib: boolean }) {
  const [state, formAction] = useActionState(submitSurveyAction, init);
  const [kec, setKec] = useState("");
  const [rating, setRating] = useState(0);
  const [prepared, setPrepared] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const e = state.errors ?? {};

  if (state.ok) {
    return (
      <div className="space-y-3 rounded-2xl border border-sea/50 bg-sea/10 p-6 text-center">
        <p className="text-4xl" aria-hidden>🙏</p>
        <h2 className="text-xl font-bold">Terima kasih atas penilaian jujur Anda!</h2>
        <p className="text-sm text-indigo-space/80">Jawaban Anda tercatat. Satu orang hanya satu suara, jadi Anda tidak perlu mengisi lagi.</p>
      </div>
    );
  }

  async function onFoto(f: File | undefined) {
    if (!f) { setPrepared(null); setPreview(""); return; }
    const small = await compress(f);
    setPrepared(small);
    setPreview(URL.createObjectURL(small));
  }

  // Kirim foto yang sudah dikompres menggantikan file asli.
  function action(fd: FormData) {
    if (prepared) fd.set("foto", prepared);
    return formAction(fd);
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="id" value={id} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <fieldset className="space-y-4"><legend className="mb-1 text-lg font-bold">Tentang Anda</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama lengkap" htmlFor="nama" error={e.nama}><input id="nama" name="nama" autoComplete="name" className={inputCls} /></Field>
          <Field label="Usia" htmlFor="usia" error={e.usia}><input id="usia" name="usia" inputMode="numeric" className={inputCls} /></Field>
          <div className="sm:col-span-2"><Field label="Tempat tinggal (jalan/kampung)" htmlFor="tempat_tinggal" error={e.tempat_tinggal}><input id="tempat_tinggal" name="tempat_tinggal" className={inputCls} /></Field></div>
          <Field label="Kecamatan" htmlFor="kecamatan" error={e.kecamatan}><select id="kecamatan" name="kecamatan" value={kec} onChange={(ev) => setKec(ev.target.value)} className={inputCls}><option value="">Pilih</option>{Object.keys(KECAMATAN_KELURAHAN).map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="Kelurahan" htmlFor="kelurahan" error={e.kelurahan}><select id="kelurahan" name="kelurahan" disabled={!kec} className={inputCls}><option value="">Pilih</option>{(KECAMATAN_KELURAHAN[kec as keyof typeof KECAMATAN_KELURAHAN] ?? []).map((k: string) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="RT" htmlFor="rt" error={e.rt}><input id="rt" name="rt" inputMode="numeric" className={inputCls} /></Field>
          <Field label="RW" htmlFor="rw" error={e.rw}><input id="rw" name="rw" inputMode="numeric" className={inputCls} /></Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4"><legend className="mb-1 text-lg font-bold">Penilaian Anda untuk “{judul}”</legend>
        <div>
          <p className="text-sm font-semibold">Apakah inovasi ini membantu?</p>
          <div className="mt-1 flex gap-3">{[["ya", "Ya, membantu"], ["tidak", "Tidak / belum"]].map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border border-celadon bg-white px-4 py-2 text-sm font-semibold has-[:checked]:border-teal-deep has-[:checked]:bg-teal-deep/10"><input type="radio" name="membantu" value={v} />{l}</label>))}</div>
          {e.membantu && <p className="mt-1 text-xs text-red-700">{e.membantu}</p>}
        </div>
        <div>
          <p className="text-sm font-semibold">Rating keseluruhan</p>
          <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating 1 sampai 5">{[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={cx("cursor-pointer text-4xl leading-none", n <= rating ? "text-gold" : "text-indigo-space/20")} style={{ textShadow: n <= rating ? "0 0 1px #9a8a2a" : undefined }}>
              <input type="radio" name="rating" value={n} className="sr-only" onChange={() => setRating(n)} aria-label={`${n} bintang`} />★</label>))}</div>
          {e.rating && <p className="mt-1 text-xs text-red-700">{e.rating}</p>}
        </div>
        {pertanyaan.map((q) => (
          <div key={q.id}>
            <p className="text-sm font-semibold">{q.teks}</p>
            <div className="mt-1 flex flex-wrap gap-2">{(q.tipe === "skala" ? ["1", "2", "3", "4", "5"] : q.pilihan ?? []).map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-2 rounded-lg border border-celadon bg-white px-3 py-1.5 text-sm has-[:checked]:border-teal-deep has-[:checked]:bg-teal-deep/10"><input type="radio" name={`q_${q.id}`} value={o} />{q.tipe === "skala" ? `${o}${o === "1" ? " (sulit)" : o === "5" ? " (mudah)" : ""}` : o}</label>))}</div>
            {e[`q_${q.id}`] && <p className="mt-1 text-xs text-red-700">{e[`q_${q.id}`]}</p>}
          </div>))}
        <Field label="Saran atau keluhan jujur (opsional)" htmlFor="komentar"><textarea id="komentar" name="komentar" rows={3} maxLength={600} className={inputCls} /></Field>
        <Field label={`Foto bukti Anda mencoba inovasi ini${fotoWajib ? "" : " (opsional)"}`} htmlFor="foto" error={e.foto} hint="Foto dikecilkan otomatis. Dipakai hanya sebagai bukti uji, bukan materi promosi.">
          <input id="foto" name="foto_asli" type="file" accept="image/*" capture="environment" onChange={(ev) => onFoto(ev.target.files?.[0])} className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-celadon file:px-3 file:py-1.5 file:text-xs file:font-semibold" />
        </Field>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img src={preview} alt="Pratinjau foto" className="h-32 rounded-lg border border-celadon object-cover" />}
      </fieldset>

      <p className="rounded-lg bg-celadon/40 p-3 text-xs text-indigo-space/80">Dengan mengirim, Anda setuju data Anda dipakai untuk menilai inovasi ini. Nama lengkap dan tempat tinggal hanya dilihat Kelurahan dan BRIDA, dan tampil disamarkan di halaman publik. Foto tidak dipakai sebagai materi promosi.</p>
      {state.error && <Alert tone="bahaya">{state.error}</Alert>}
      <SubmitButton className="w-full inline-flex justify-center rounded-lg bg-teal-deep px-5 py-3 text-base font-semibold text-white">Kirim penilaian</SubmitButton>
    </form>
  );
}
