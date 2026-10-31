import assert from "node:assert/strict";
import test from "node:test";
import { domicileFromMetadata, filterByNumber, filterKelurahan, normalizeLabel, trailingNumber } from "../src/lib/auth/domicile-match.mjs";

test("angka RW/RT dibaca dari nama atau kode dan nol di depan diabaikan", () => {
  assert.equal(trailingNumber("RW 03"), 3);
  assert.equal(trailingNumber("DEMO-RT-01"), 1);
  assert.equal(trailingNumber("7"), 7);
  assert.equal(trailingNumber("RW 3A"), null);
  const rows = [{ id: "a", name: "RW 03", code: "RW-03" }, { id: "b", name: "RW 13", code: "RW-13" }];
  assert.deepEqual(filterByNumber(rows, "3").map((row) => row.id), ["a"]);
  assert.deepEqual(filterByNumber(rows, "0"), []);
});

test("nama kelurahan dicocokkan tanpa memedulikan huruf besar, tanda baca, dan awalan Kelurahan", () => {
  assert.equal(normalizeLabel("Kelurahan Dr. Sutomo"), "dr sutomo");
  const rows = [{ id: "a", name: "Kelurahan Wonorejo", code: "WNR" }, { id: "b", name: "Keputran", code: "KPT" }];
  assert.deepEqual(filterKelurahan(rows, "wonorejo").map((row) => row.id), ["a"]);
  assert.deepEqual(filterKelurahan(rows, ""), []);
});

test("klaim domisili dibaca dari metadata dan nilai bukan teks diabaikan", () => {
  assert.deepEqual(domicileFromMetadata({ domicile_address: " Jl. A 1 ", domicile_rw: 3, domicile_rt: "7" }), { address: "Jl. A 1", kecamatan: "", kelurahan: "", rw: "", rt: "7" });
  assert.equal(domicileFromMetadata(null).rt, "");
});
