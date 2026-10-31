import assert from "node:assert/strict";
import test from "node:test";
import { domicileFromMetadata } from "../src/lib/auth/domicile-match.mjs";

test("klaim domisili dibaca dari metadata dan nilai bukan teks diabaikan", () => {
  assert.deepEqual(domicileFromMetadata({ domicile_address: " Jl. A 1 ", domicile_rw: 3, domicile_rt: "7" }), { address: "Jl. A 1", kecamatan: "", kelurahan: "", rw: "", rt: "7" });
  assert.equal(domicileFromMetadata(null).rt, "");
});
