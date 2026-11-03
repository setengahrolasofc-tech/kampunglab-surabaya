import { createHmac } from "node:crypto";

export const MAX_FOTO_BYTES = 4 * 1024 * 1024;
export const FOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Ambang kelayakan dari parameter sistem. @param {Record<string, number>} p */
export const thresholds = (p) => ({ kuota: p.ambang_kuota, rating: p.ambang_rating, helpful: p.ambang_helpful_pct, foto: p.ambang_foto_pct });

/**
 * Empat standar kelayakan (Bab 4.2). Cerminan app.test_metrics(); database tetap penentu.
 * @param {{responden: number, avg_rating: number, helpful_pct: number, photo_pct: number}} m
 * @param {{kuota: number, rating: number, helpful: number, foto: number}} t
 */
export function evaluateStandards(m, t) {
  const standar = [
    { id: "kuota", label: `Minimal ${t.kuota} responden unik`, nilai: m.responden, target: t.kuota, ok: m.responden >= t.kuota },
    { id: "rating", label: `Rata-rata rating minimal ${String(t.rating).replace(".", ",")}`, nilai: m.avg_rating, target: t.rating, ok: m.avg_rating >= t.rating },
    { id: "helpful", label: `Minimal ${t.helpful}% menjawab "Ya, membantu"`, nilai: m.helpful_pct, target: t.helpful, ok: m.helpful_pct >= t.helpful },
    { id: "foto", label: `Minimal ${t.foto}% melampirkan foto`, nilai: m.photo_pct, target: t.foto, ok: m.photo_pct >= t.foto },
  ];
  return { standar, eligible: standar.every((s) => s.ok) };
}

/** Pilihan keputusan Lurah yang sah untuk hasil uji tertentu. */
export function keputusanTersedia(/** @type {{eligible: boolean, responden: number, avg_rating: number}} */ m, /** @type {{kuota: number, ratingTunda: number}} */ t) {
  if (m.eligible) return ["LOLOS"];
  const out = ["GAGAL"];
  if (m.responden < t.kuota || m.avg_rating >= t.ratingTunda) out.unshift("TUNDA");
  return out;
}

/** Hash IP dengan garam rahasia server; IP mentah tidak disimpan. @param {string} ip @param {string} salt */
export function hashIp(ip, salt) {
  return createHmac("sha256", salt).update(String(ip || "tak-diketahui")).digest("hex");
}

/**
 * Validasi isian survei sebelum dikirim ke database (database memvalidasi ulang).
 * @param {FormData} form @param {Array<{id: string, tipe: string, pilihan?: string[]}>} pertanyaan @param {{fotoWajib: boolean}} opt
 */
export function parseSurveyForm(form, pertanyaan, opt) {
  /** @type {Record<string, string>} */
  const errors = {};
  const txt = (/** @type {string} */ k) => String(form.get(k) ?? "").trim();
  const num = (/** @type {string} */ k) => (/^\d{1,3}$/.test(txt(k)) ? Number(txt(k)) : NaN);
  const nama = txt("nama"), tempat = txt("tempat_tinggal");
  const usia = /^\d{1,3}$/.test(txt("usia")) ? Number(txt("usia")) : NaN;
  const rt = num("rt"), rw = num("rw"), rating = num("rating");
  if (nama.length < 1 || nama.length > 100) errors.nama = "Isi nama atau inisial.";
  if (!(usia >= 5 && usia <= 110)) errors.usia = "Isi usia (5–110).";
  if (tempat.length < 3 || tempat.length > 200) errors.tempat_tinggal = "Isi tempat tinggal (jalan/kampung).";
  if (!txt("kecamatan")) errors.kecamatan = "Pilih kecamatan.";
  if (!txt("kelurahan")) errors.kelurahan = "Pilih kelurahan.";
  if (!(rt >= 1)) errors.rt = "Isi RT (angka).";
  if (!(rw >= 1)) errors.rw = "Isi RW (angka).";
  if (!(rating >= 1 && rating <= 5)) errors.rating = "Pilih rating 1–5.";
  const membantu = txt("membantu");
  if (membantu !== "ya" && membantu !== "tidak") errors.membantu = "Jawab Ya atau Tidak.";
  /** @type {Record<string, string | number>} */
  const jawaban = {};
  for (const q of pertanyaan) {
    const v = txt("q_" + q.id);
    if (q.tipe === "skala") {
      if (!/^[1-5]$/.test(v)) errors["q_" + q.id] = "Pilih 1–5.";
      else jawaban[q.id] = Number(v);
    } else if (!q.pilihan?.includes(v)) errors["q_" + q.id] = "Pilih salah satu.";
    else jawaban[q.id] = v;
  }
  const foto = form.get("foto");
  const adaFoto = foto instanceof File && foto.size > 0;
  if (adaFoto) {
    if (!FOTO_TYPES.includes(foto.type)) errors.foto = "Foto harus JPG, PNG, atau WebP.";
    else if (foto.size > MAX_FOTO_BYTES) errors.foto = "Ukuran foto maksimal 4 MB.";
  } else if (opt.fotoWajib) errors.foto = "Lampirkan foto bukti penggunaan.";
  const komentar = txt("komentar").slice(0, 600);
  return {
    errors,
    value: { nama, usia, tempat_tinggal: tempat, kecamatan: txt("kecamatan"), kelurahan: txt("kelurahan"), rt, rw, rating, membantu: membantu === "ya", jawaban, komentar },
    foto: adaFoto ? /** @type {File} */ (foto) : null,
  };
}
