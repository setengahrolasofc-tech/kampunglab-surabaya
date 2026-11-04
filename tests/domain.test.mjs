import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rupiah, waLink, inisial } from "../src/lib/domain/format.mjs";
import { checkSubmission, pembagianTahap, skalaOf, plafonOf, DEFAULT_PARAMS } from "../src/lib/domain/innovation-rules.mjs";
import { evaluateStandards, keputusanTersedia, hashIp, parseSurveyForm, thresholds } from "../src/lib/domain/survey.mjs";
import { TRANSITIONS, canTransition, actionsFor, STATUSES, STATUS_INFO } from "../src/lib/domain/workflow.mjs";
import { validateSignup, isStrongPassword, normalizeIntent, destinationForIntent, safeAuthDestination, validateKelurahanAccess } from "../src/lib/auth/validation.mjs";

test("format Rupiah dan WA", () => {
  assert.equal(rupiah(5000000).replace(/\s/g, ""), "Rp5.000.000");
  assert.equal(waLink("0812-3456-789"), "https://wa.me/628123456789");
  assert.equal(inisial("budi santoso"), "B. S.");
});

test("skala, plafon, dan pembagian 30-30-40", () => {
  assert.equal(skalaOf("PROGRAM"), "KECIL_5JT");
  assert.equal(skalaOf("PRODUK"), "KECIL_5JT");
  assert.equal(skalaOf("PROTOTIPE"), "TERAPAN_15JT");
  assert.equal(skalaOf("TEKNOLOGI"), "TERAPAN_15JT");
  assert.equal(plafonOf("KECIL_5JT"), 5_000_000);
  assert.equal(plafonOf("TERAPAN_15JT"), 15_000_000);
  const p = pembagianTahap(10_000_000);
  assert.deepEqual(p, { TAHAP_1_30: 3_000_000, TAHAP_2_30: 3_000_000, TAHAP_3_40: 4_000_000 });
  assert.equal(p.TAHAP_1_30 + p.TAHAP_2_30 + p.TAHAP_3_40, 10_000_000);
});

const lengkap = {
  judul: "Pemilah Sampah Pintar", ringkasan: "Alat pemilah sampah berbasis sensor untuk RT.", masalah: "Warga kesulitan memilah sampah rumah tangga.",
  tujuan: "Meningkatkan pemilahan sampah di RT 3 hingga 60 persen.", target_pengguna: "Warga RT 3", target_rt_rw: "RT 3/RW 2",
  tipe_inovasi: "TEKNOLOGI", total_rab: 10_000_000, rab_tak_terduga: 1_000_000, rab_honor: 1_500_000, rencana_perawatan_bulan: 9,
  prd_url: "a", rab_url: "b", surat_keaslian_url: "c", surat_kesepakatan_url: "d",
};
const tim = [{ jenjang_pendidikan: "MAHASISWA_DIPLOMA_S1", is_ketua: true }, { jenjang_pendidikan: "SMA_SMK", is_ketua: false }];

test("checkSubmission: pengajuan lengkap lolos", () => assert.deepEqual(checkSubmission(lengkap, tim), []));
test("checkSubmission: plafon, tak terduga, honor, perawatan, tim", () => {
  assert.ok(checkSubmission({ ...lengkap, tipe_inovasi: "PROGRAM", total_rab: 5_000_001 }, tim).some((e) => e.includes("plafon")));
  assert.ok(checkSubmission({ ...lengkap, rab_tak_terduga: 1_000_001 }, tim).some((e) => e.includes("tak terduga")));
  assert.ok(checkSubmission({ ...lengkap, rab_honor: 1_500_001 }, tim).some((e) => e.includes("Honorarium")));
  assert.ok(checkSubmission({ ...lengkap, rencana_perawatan_bulan: 5 }, tim).some((e) => e.includes("perawatan")));
  assert.ok(checkSubmission({ ...lengkap, rencana_perawatan_bulan: 13 }, tim).some((e) => e.includes("perawatan")));
  assert.ok(checkSubmission(lengkap, tim.slice(0, 1)).some((e) => e.includes("Tim wajib")));
  assert.ok(checkSubmission(lengkap, [...tim, ...Array(5).fill(tim[1])]).some((e) => e.includes("Tim wajib")));
  assert.ok(checkSubmission(lengkap, [tim[0], { jenjang_pendidikan: "SMP_KE_BAWAH", is_ketua: false }]).some((e) => e.includes("SMP")));
  assert.ok(checkSubmission({ ...lengkap, surat_kesepakatan_url: null }, tim).some((e) => e.includes("Kesepakatan")));
});
test("batas tepat plafon diterima", () => {
  assert.deepEqual(checkSubmission({ ...lengkap, tipe_inovasi: "PROGRAM", total_rab: 5_000_000, rab_tak_terduga: 500_000, rab_honor: 750_000 }, tim), []);
  assert.deepEqual(checkSubmission({ ...lengkap, total_rab: 15_000_000, rab_tak_terduga: 1_500_000, rab_honor: 2_250_000 }, tim), []);
});

test("empat standar kelayakan (30 responden, 3,8, 75%, 80%)", () => {
  const t = thresholds(DEFAULT_PARAMS);
  assert.equal(evaluateStandards({ responden: 30, avg_rating: 3.8, helpful_pct: 75, photo_pct: 80 }, t).eligible, true);
  assert.equal(evaluateStandards({ responden: 29, avg_rating: 5, helpful_pct: 100, photo_pct: 100 }, t).eligible, false);
  assert.equal(evaluateStandards({ responden: 40, avg_rating: 3.79, helpful_pct: 100, photo_pct: 100 }, t).eligible, false);
  assert.equal(evaluateStandards({ responden: 40, avg_rating: 4, helpful_pct: 74.9, photo_pct: 100 }, t).eligible, false);
  assert.equal(evaluateStandards({ responden: 40, avg_rating: 4, helpful_pct: 80, photo_pct: 79.9 }, t).eligible, false);
});

test("keputusan Lurah yang tersedia", () => {
  const k = { kuota: 30, ratingTunda: 3 };
  assert.deepEqual(keputusanTersedia({ eligible: true, responden: 35, avg_rating: 4.2 }, k), ["LOLOS"]);
  assert.deepEqual(keputusanTersedia({ eligible: false, responden: 20, avg_rating: 2.0 }, k), ["TUNDA", "GAGAL"]);
  assert.deepEqual(keputusanTersedia({ eligible: false, responden: 35, avg_rating: 3.5 }, k), ["TUNDA", "GAGAL"]);
  assert.deepEqual(keputusanTersedia({ eligible: false, responden: 35, avg_rating: 2.5 }, k), ["GAGAL"]);
});

test("hash IP stabil, berbeda garam, tidak memuat IP", () => {
  assert.equal(hashIp("1.2.3.4", "s"), hashIp("1.2.3.4", "s"));
  assert.notEqual(hashIp("1.2.3.4", "s"), hashIp("1.2.3.4", "t"));
  assert.ok(!hashIp("1.2.3.4", "s").includes("1.2.3.4"));
  assert.match(hashIp("x", "s"), /^[0-9a-f]{64}$/);
});

test("parseSurveyForm: semua kolom wajib", () => {
  const q = [{ id: "q_mudah", tipe: "skala" }, { id: "q_sesuai", tipe: "pilihan", pilihan: ["Ya", "Sebagian", "Tidak"] }];
  const f = new FormData();
  const kosong = parseSurveyForm(f, q, { fotoWajib: true });
  for (const k of ["nama", "usia", "tempat_tinggal", "kecamatan", "kelurahan", "rt", "rw", "rating", "membantu", "q_q_mudah", "q_q_sesuai", "foto"]) assert.ok(kosong.errors[k], `harus ada galat untuk ${k}`);
  for (const [k, v] of Object.entries({ nama: "Budi", usia: "30", tempat_tinggal: "Jl Mawar 1", kecamatan: "Gubeng", kelurahan: "Airlangga", rt: "3", rw: "2", rating: "5", membantu: "ya", q_q_mudah: "4", q_q_sesuai: "Ya" })) f.set(k, v);
  f.set("foto", new File([new Uint8Array(10)], "a.jpg", { type: "image/jpeg" }));
  const ok = parseSurveyForm(f, q, { fotoWajib: true });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.value.membantu, true);
  assert.deepEqual(ok.value.jawaban, { q_mudah: 4, q_sesuai: "Ya" });
  f.set("q_q_sesuai", "Mungkin");
  assert.ok(parseSurveyForm(f, q, { fotoWajib: true }).errors.q_q_sesuai);
  f.set("foto", new File([new Uint8Array(10)], "a.exe", { type: "application/x-msdownload" }));
  assert.ok(parseSurveyForm(f, q, { fotoWajib: true }).errors.foto);
});

test("state machine: transisi kunci", () => {
  assert.ok(canTransition("DRAFT", "WAITING_KELURAHAN_MANDATE", "INNOVATOR"));
  assert.ok(canTransition("WAITING_KELURAHAN_MANDATE", "SUBMITTED_TO_KELURAHAN", "SYSTEM"));
  assert.ok(!canTransition("WAITING_KELURAHAN_MANDATE", "APPROVED_WAITING_TERM_1", "KELURAHAN"), "tanpa mandat tidak boleh langsung disetujui");
  assert.ok(!canTransition("SUBMITTED_TO_KELURAHAN", "APPROVED_WAITING_TERM_1", "INNOVATOR"), "inovator tidak boleh menyetujui sendiri");
  assert.ok(!canTransition("DRAFT", "BUILDING_PHASE", "INNOVATOR"));
  assert.ok(!canTransition("EVALUATION_TERM_2", "COMPLETED_PUBLISHED", "KELURAHAN"), "tahap 3 wajib lewat serah terima");
  assert.ok(canTransition("EVALUATION_TERM_2", "STOPPED_AS_LEARNING", "KELURAHAN"));
  assert.ok(!canTransition("APPROVED_WAITING_TERM_1", "TERMINATED_BLACKLISTED", "BRIDA_ADMIN"), "sanksi hanya setelah Tahap 1 cair");
  assert.ok(canTransition("BUILDING_PHASE", "TERMINATED_BLACKLISTED", "BRIDA_ADMIN"));
  for (const s of ["COMPLETED_PUBLISHED", "STOPPED_AS_LEARNING", "CANCELLED_BY_KELURAHAN", "TERMINATED_BLACKLISTED"]) {
    assert.equal(TRANSITIONS.filter(([f]) => f === s).length, 0, `${s} adalah status akhir`);
  }
  for (const s of STATUSES) assert.ok(STATUS_INFO[s], `label untuk ${s}`);
});

test("aksi tombol sesuai status dan role", () => {
  assert.deepEqual(actionsFor("INNOVATOR", "DRAFT"), ["edit", "kirim", "hapus"]);
  assert.ok(actionsFor("INNOVATOR", "BUILDING_PHASE").includes("siap-uji"));
  assert.ok(!actionsFor("INNOVATOR", "SUBMITTED_TO_KELURAHAN").includes("edit"));
  assert.ok(actionsFor("KELURAHAN", "SUBMITTED_TO_KELURAHAN").includes("periksa"));
  assert.equal(actionsFor("KELURAHAN", "WAITING_KELURAHAN_MANDATE").length, 0);
  assert.ok(actionsFor("BRIDA_ADMIN", "APPEALED").includes("putus-banding"));
  assert.ok(!actionsFor("INNOVATOR", "REJECTED").includes("putus-banding"));
});

test("TS dan SQL memakai tabel transisi yang sama", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20261103090000_rev4_core.sql", import.meta.url), "utf8");
  const start = sql.indexOf("insert into public.innovation_transitions");
  const block = sql.slice(start);
  const fixed = [...block.matchAll(/\('([A-Z_0-9]+)', '([A-Z_0-9]+)', '([A-Z_]+)'\)/g)].map((m) => m.slice(1).join(">"));
  // blok unnest: ambil daftar status dan aktor
  const lists = [...block.matchAll(/unnest\(array\[([^\]]+)\]\)/g)].map((m) => [...m[1].matchAll(/'([A-Z_0-9]+)'/g)].map((x) => x[1]));
  const set = new Set(fixed);
  const [disp, actors, restore, cancel, term] = lists;
  for (const s of disp) for (const a of actors) set.add(`${s}>DISPUTED>${a}`);
  for (const s of restore) set.add(`DISPUTED>${s}>BRIDA_ADMIN`);
  for (const s of cancel) set.add(`${s}>CANCELLED_BY_KELURAHAN>KELURAHAN`);
  for (const s of term) set.add(`${s}>TERMINATED_BLACKLISTED>BRIDA_ADMIN`);
  const ts = new Set(TRANSITIONS.map((t) => t.join(">")));
  assert.deepEqual([...set].filter((x) => !ts.has(x)), [], "ada di SQL tetapi tidak di TS");
  assert.deepEqual([...ts].filter((x) => !set.has(x)), [], "ada di TS tetapi tidak di SQL");
});

test("validasi pendaftaran per peran", () => {
  const f = (o) => { const d = new FormData(); for (const [k, v] of Object.entries(o)) d.set(k, v); return d; };
  const basis = { email: "a@b.id", password: "Abcdef1!x", confirmation: "Abcdef1!x", display_name: "Rani Inovator", phone_wa: "081234567890" };
  assert.deepEqual(validateSignup(f({ ...basis, role: "INNOVATOR", institusi: "UNESA", kota_domisili: "Sidoarjo" })).errors, {});
  assert.ok(validateSignup(f({ ...basis, role: "INNOVATOR" })).errors.institusi);
  assert.ok(validateSignup(f({ ...basis, role: "ADMIN" })).errors.role, "peran tak dikenal ditolak");
  const kel = validateSignup(f({ ...basis, role: "KELURAHAN", nip: "198001012005011001", jabatan: "Lurah", kecamatan: "Gubeng", kelurahan: "Airlangga" }));
  assert.ok(kel.errors.sk, "SK wajib untuk Kelurahan");
  assert.ok(!kel.errors.nip && !kel.errors.kelurahan);
  assert.ok(validateSignup(f({ ...basis, role: "KELURAHAN", nip: "1", jabatan: "Lurah", kecamatan: "Gubeng", kelurahan: "Mojo Palsu" })).errors.kelurahan);
  assert.ok(validateSignup(f({ ...basis, role: "BRIDA_ADMIN" })).errors.role, "Admin BRIDA tidak bisa mendaftar lewat formulir");
  assert.ok(!isStrongPassword("abc"));
});

test("pintu masuk, tujuan sesudah masuk, dan permintaan akses Kelurahan", () => {
  const f = (o) => { const d = new FormData(); for (const [k, v] of Object.entries(o)) d.set(k, v); return d; };
  assert.equal(normalizeIntent("kelurahan"), "kelurahan");
  assert.equal(normalizeIntent("KELURAHAN"), "kelurahan");
  assert.equal(normalizeIntent("brida"), "inovator", "nilai tak dikenal jatuh ke Inovator");
  assert.equal(normalizeIntent(undefined), "inovator");
  assert.equal(destinationForIntent("kelurahan"), "/minta-akses");
  assert.equal(destinationForIntent("inovator"), "/dashboard");
  assert.equal(safeAuthDestination("/minta-akses"), "/minta-akses");
  assert.equal(safeAuthDestination("https://jahat.example"), "/dashboard");
  assert.equal(safeAuthDestination("/admin"), "/dashboard");
  const ok = { kecamatan: "Gubeng", kelurahan: "Airlangga", nip: "198001012005011001", jabatan: "Lurah", phone_wa: "081234567890" };
  assert.deepEqual(validateKelurahanAccess(f(ok)).errors, {});
  assert.ok(validateKelurahanAccess(f({ ...ok, nip: "12" })).errors.nip);
  assert.ok(validateKelurahanAccess(f({ ...ok, jabatan: "L" })).errors.jabatan);
  assert.ok(validateKelurahanAccess(f({ ...ok, phone_wa: "abc" })).errors.phone_wa);
  assert.ok(validateKelurahanAccess(f({ ...ok, kelurahan: "Mojo Palsu" })).errors.kelurahan);
  assert.ok(validateKelurahanAccess(f({ ...ok, kecamatan: "__proto__" })).errors.kecamatan);
});
