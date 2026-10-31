import test from "node:test";
import assert from "node:assert/strict";
import { KECAMATAN_KELURAHAN } from "../src/lib/auth/surabaya-areas.mjs";
import { areaSlug, kecamatanOf, nameOptions, formatTerritoryPath, OTHER_KECAMATAN } from "../src/lib/drafts/territory-areas.mjs";
import { emptyDraftDocument, draftChecklist } from "../src/lib/drafts/schema.mjs";

const t = (id, kind, name, code, parent_id = null) => ({ id, kind, name, code, parent_id });

test("kecamatan diturunkan dari kode kelurahan seed dan kelurahan sebaiknya tidak tertukar antar kecamatan", () => {
  assert.equal(areaSlug("Tanah Kali Kedinding"), "tanah-kali-kedinding");
  assert.equal(kecamatanOf({ code: "SBY-kenjeran-tanah-kali-kedinding" }), "Kenjeran");
  assert.equal(kecamatanOf({ code: "SBY-rungkut-wonorejo" }), "Rungkut");
  assert.equal(kecamatanOf({ code: "SBY-tegalsari-wonorejo" }), "Tegalsari");
  assert.equal(kecamatanOf({ code: "DEMO-KL" }), OTHER_KECAMATAN);
});

test("setiap kelurahan di daftar daftar akun kembali ke kecamatannya sendiri", () => {
  for (const [kecamatan, daftar] of Object.entries(KECAMATAN_KELURAHAN)) {
    for (const kelurahan of daftar) assert.equal(kecamatanOf({ code: `SBY-${areaSlug(kecamatan)}-${areaSlug(kelurahan)}` }), kecamatan);
  }
});

test("label pilihan memakai nama saja; kode muncul hanya bila nama kembar", () => {
  const options = nameOptions([t("a", "rw", "RW 04", "RW-04"), t("b", "rw", "RW 05", "RW-05")]);
  assert.deepEqual(options.map(o => o.label), ["RW 04", "RW 05"]);
  const twins = nameOptions([t("a", "rw", "RW 04", "RW-04"), t("b", "rw", "RW 04", "X-04")]);
  assert.deepEqual(twins.map(o => o.label), ["RW 04 (RW-04)", "RW 04 (X-04)"]);
});

test("ringkasan wilayah rapi, tanpa kode internal, dan kosong bila belum lengkap", () => {
  const kel = t("k", "kelurahan", "Tanah Kali Kedinding", "SBY-kenjeran-tanah-kali-kedinding");
  const rw = t("w", "rw", "RW 04", "RW-04", "k"), rt = t("r", "rt", "RT 21", "RT-21", "w");
  assert.equal(formatTerritoryPath([kel, rw, rt], "r"), "Kecamatan Kenjeran · Kelurahan Tanah Kali Kedinding · RW 04 · RT 21");
  assert.equal(formatTerritoryPath([kel, rw], "r"), "");
  assert.equal(formatTerritoryPath([kel, rw, rt], ""), "");
  const demoKel = t("dk", "kelurahan", "DEMO Kelurahan KampungLab", "DEMO-KL");
  const demoRw = t("dw", "rw", "DEMO RW 01", "DEMO-RW-01", "dk"), demoRt = t("dr", "rt", "DEMO RT 01", "DEMO-RT-01", "dw");
  assert.equal(formatTerritoryPath([demoKel, demoRw, demoRt], "dr"), "Kelurahan DEMO Kelurahan KampungLab · DEMO RW 01 · DEMO RT 01");
});

test("checklist data inovasi tidak lagi menunggu tema yang dipilih warga", () => {
  const doc = emptyDraftDocument("00000000-0000-4000-8000-000000000001");
  Object.assign(doc.innovation, { title: "Judul", form: "produk", summary: "Ringkasan", team: [{ id: "x", name: "Ani", role: "Ketua" }] });
  assert.equal(doc.innovation.theme_id, "");
  assert.equal(draftChecklist(doc)[0], true);
});
