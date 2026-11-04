import test from "node:test";
import assert from "node:assert/strict";
import { needsProfileCompletion, lengkapiProfilUrl } from "../src/lib/auth/profile.mjs";
import { validateCompleteProfile, validateRecovery } from "../src/lib/auth/validation.mjs";

const form = (o) => { const d = new FormData(); for (const [k, v] of Object.entries(o)) d.set(k, v); return d; };

test("akun Google baru (tanpa WA/institusi/kota) wajib melengkapi profil", () => {
  assert.equal(needsProfileCompletion({ role: "INNOVATOR", phone_wa: null, institusi: null, kota_domisili: null }), true);
  assert.equal(needsProfileCompletion({ role: "INNOVATOR", phone_wa: "081234567890", institusi: "UNESA", kota_domisili: null }), true);
  assert.equal(needsProfileCompletion({ role: "INNOVATOR", phone_wa: "081234567890", institusi: "UNESA", kota_domisili: "Surabaya" }), false);
  assert.equal(needsProfileCompletion({ role: "KELURAHAN", phone_wa: null, institusi: null, kota_domisili: null }), false);
  assert.equal(needsProfileCompletion({ role: "BRIDA_ADMIN", phone_wa: null, institusi: null, kota_domisili: null }), false);
  assert.equal(needsProfileCompletion(null), false);
  assert.equal(lengkapiProfilUrl("kelurahan"), "/lengkapi-profil?sebagai=kelurahan");
  assert.equal(lengkapiProfilUrl("apa-saja"), "/lengkapi-profil?sebagai=inovator");
});

test("lengkapi profil Inovator: nama, WA, institusi, kota wajib", () => {
  assert.deepEqual(validateCompleteProfile(form({ role: "INNOVATOR", display_name: "Rani Inovator", phone_wa: "0812-3456-7890", institusi: "UNESA", kota_domisili: "Sidoarjo" })).errors, {});
  const kosong = validateCompleteProfile(form({ role: "INNOVATOR" })).errors;
  for (const k of ["display_name", "phone_wa", "institusi", "kota_domisili"]) assert.ok(kosong[k], `galat untuk ${k}`);
  assert.equal(validateCompleteProfile(form({ role: "INNOVATOR", display_name: "Rani", phone_wa: "0812-3456-7890", institusi: "UNESA", kota_domisili: "Sidoarjo" })).phone, "081234567890");
});

test("lengkapi profil Kelurahan: NIP, jabatan, kelurahan sesuai kecamatan; peran lain ditolak", () => {
  const ok = { role: "KELURAHAN", display_name: "Lurah Satu", phone_wa: "081111111111", nip: "198001012005011001", jabatan: "Lurah", kecamatan: "Gubeng", kelurahan: "Airlangga" };
  assert.deepEqual(validateCompleteProfile(form(ok)).errors, {});
  assert.ok(validateCompleteProfile(form({ ...ok, nip: "12" })).errors.nip);
  assert.ok(validateCompleteProfile(form({ ...ok, kelurahan: "Tidak Ada" })).errors.kelurahan);
  assert.ok(validateCompleteProfile(form({ ...ok, kecamatan: "" })).errors.kecamatan);
  assert.ok(validateCompleteProfile(form({ ...ok, role: "BRIDA_ADMIN" })).errors.role, "peran BRIDA tidak bisa dipilih dari form");
});

test("pemulihan/ganti password: kode 6 digit + password kuat + konfirmasi sama", () => {
  const ok = { email: "a@b.id", token: "123456", password: "Abcdef1!x", confirmation: "Abcdef1!x" };
  assert.deepEqual(validateRecovery(form(ok)).errors, {});
  assert.ok(validateRecovery(form({ ...ok, token: "12345" })).errors.token);
  assert.ok(validateRecovery(form({ ...ok, token: "abcdef" })).errors.token);
  assert.ok(validateRecovery(form({ ...ok, password: "lemah" })).errors.password);
  assert.ok(validateRecovery(form({ ...ok, confirmation: "Beda1!xyz" })).errors.confirmation);
  assert.ok(validateRecovery(form({ ...ok, email: "bukan-email" })).errors.email);
  assert.equal(validateRecovery(form({ ...ok, token: "123 456" })).token, "123456");
});
