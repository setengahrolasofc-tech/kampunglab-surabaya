import assert from "node:assert/strict";
import test from "node:test";
import { validateAuthForm, validateDomicile, validateOtp, isStrongPassword, PASSWORD_RULES, OTP_LENGTH, safeAuthDestination, getAppOrigin, isCurrentGrant } from "../src/lib/auth/validation.mjs";
import { KECAMATAN_KELURAHAN } from "../src/lib/auth/surabaya-areas.mjs";

function form(values) { const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.set(key, value)); return data; }

test("signup validates on server and ignores a forged privileged role", () => {
  const result = validateAuthForm(form({ email: "  USER@EXAMPLE.ORG ", display_name: " Warga ", password: "Password-123!", confirmation: "Password-123!", role: "program_admin", user_id: "another-user" }), "signup");
  assert.deepEqual(result.errors, {});
  assert.equal(result.email, "user@example.org");
  assert.equal(result.displayName, "Warga");
  assert.equal("role" in result, false);
  assert.equal("user_id" in result, false);
});

test("invalid signup fields and confirmation are rejected", () => {
  const result = validateAuthForm(form({ email: "broken", display_name: "a", password: "short", confirmation: "other" }), "signup");
  assert.deepEqual(Object.keys(result.errors).sort(), ["confirmation", "display_name", "email", "password"]);
});

test("password whitespace is not silently trimmed and UTF-8 byte limits are checked", () => {
  const value = " abcdefgh ";
  assert.equal(validateAuthForm(form({ email: "a@example.org", password: value }), "login").password, value);
  const result = validateAuthForm(form({ password: "🎈".repeat(20), confirmation: "🎈".repeat(20) }), "password");
  assert.ok(result.errors.password);
});

test("Auth redirects never follow an arbitrary external or relative destination", () => {
  for (const candidate of [null, "https://evil.example", "//evil.example", "/admin", "/ubah-kata-sandi?next=https://evil.example", "/\\evil.example", "%2f%2fevil.example"]) {
    assert.equal(safeAuthDestination(candidate), "/dashboard");
  }
  assert.equal(safeAuthDestination("/ubah-kata-sandi"), "/ubah-kata-sandi");
});

test("outgoing email links only use a trusted configured origin", () => {
  assert.equal(getAppOrigin(undefined), "http://localhost:3000");
  assert.equal(getAppOrigin("https://kampung.example/"), "https://kampung.example");
  for (const origin of ["http://remote.example", "https://user:pass@example.org", "https://example.org/path", "https://example.org?next=x", "javascript:alert(1)"]) {
    assert.throws(() => getAppOrigin(origin));
  }
});

test("grant validity uses start-inclusive and end-exclusive periods, including revocation", () => {
  const starts_at = "2026-10-30T00:00:00Z", ends_at = "2026-10-31T00:00:00Z";
  const grant = { status: "active", starts_at, ends_at };
  assert.equal(isCurrentGrant(grant, Date.parse(starts_at) - 1), false);
  assert.equal(isCurrentGrant(grant, Date.parse(starts_at)), true);
  assert.equal(isCurrentGrant(grant, Date.parse(ends_at)), false);
  assert.equal(isCurrentGrant({ ...grant, status: "revoked" }, Date.parse(starts_at)), false);
  assert.equal(isCurrentGrant({ ...grant, ends_at: null }, Date.parse(ends_at)), true);
});

test("password harus memenuhi kelima aturan kekuatan saat daftar dan ubah password", () => {
  assert.equal(PASSWORD_RULES.length, 5);
  for (const weak of ["abcdefg1!", "ABCDEFG1!", "Abcdefgh!", "Abcdefg12", "Ab1!"]) {
    assert.equal(isStrongPassword(weak), false, weak);
    const result = validateAuthForm(form({ email: "a@example.org", display_name: "Warga", password: weak, confirmation: weak }), "signup");
    assert.ok(result.errors.password, weak);
  }
  assert.equal(isStrongPassword("Password-123!"), true);
  // Masuk tidak menerapkan aturan kekuatan agar akun lama tetap bisa login.
  assert.equal(validateAuthForm(form({ email: "a@example.org", password: "abc" }), "login").errors.password, undefined);
});

test("domisili wajib berurutan kecamatan, kelurahan, RW, RT dan berasal dari daftar", () => {
  const kecamatan = "Wonokromo";
  const kelurahan = KECAMATAN_KELURAHAN[kecamatan][0];
  const ok = validateDomicile(form({ address: "  Jl. Contoh   No. 5 ", kecamatan, kelurahan, rw: "03", rt: "07" }));
  assert.deepEqual(ok.errors, {});
  assert.deepEqual(ok.value, { address: "Jl. Contoh No. 5", kecamatan, kelurahan, rw: "03", rt: "07" });
  const wrongPair = validateDomicile(form({ address: "Jl. Contoh No. 5", kecamatan: "Wonokromo", kelurahan: "Pakal", rw: "03", rt: "07" }));
  assert.deepEqual(Object.keys(wrongPair.errors), ["kelurahan"]);
  const empty = validateDomicile(form({}));
  assert.deepEqual(Object.keys(empty.errors).sort(), ["address", "kecamatan", "rt", "rw"]);
  assert.ok(validateDomicile(form({ address: "Jl. Contoh No. 5", kecamatan, kelurahan, rw: "0", rt: "07" })).errors.rw);
  assert.ok(validateDomicile(form({ address: "Jl. Contoh No. 5", kecamatan, kelurahan, rw: "03", rt: "abcd" })).errors.rt);
  assert.ok(validateDomicile(form({ address: "Jl. Contoh No. 5", kecamatan, kelurahan, rw: "03", rt: "1234" })).errors.rt);
  // RW/RT diketik manual: angka tanpa nol di depan dirapikan jadi dua digit.
  const manual = validateDomicile(form({ address: "Jl. Contoh No. 5", kecamatan, kelurahan, rw: " 3 ", rt: "7" }));
  assert.deepEqual(manual.errors, {});
  assert.equal(manual.value.rw, "03");
  assert.equal(manual.value.rt, "07");
  assert.equal(validateDomicile(form({ address: "Jl. Contoh No. 5", kecamatan, kelurahan, rw: "25", rt: "120" })).value.rt, "120");
  assert.ok(validateDomicile(form({ address: "Jl. Contoh No. 5", kecamatan: "__proto__", kelurahan, rw: "03", rt: "07" })).errors.kecamatan);
});

test("semua kecamatan Surabaya punya kelurahan tanpa duplikat di dalam satu kecamatan", () => {
  assert.equal(Object.keys(KECAMATAN_KELURAHAN).length, 31);
  for (const [name, list] of Object.entries(KECAMATAN_KELURAHAN)) {
    assert.ok(list.length > 0, name);
    assert.equal(new Set(list).size, list.length, name);
  }
});

test("kode OTP harus tepat sesuai panjang dan email valid", () => {
  const good = "1".repeat(OTP_LENGTH);
  assert.deepEqual(validateOtp(form({ email: " USER@Example.org ", token: good })).errors, {});
  assert.equal(validateOtp(form({ email: " USER@Example.org ", token: good })).email, "user@example.org");
  assert.ok(validateOtp(form({ email: "a@example.org", token: "12345" })).errors.token);
  assert.ok(validateOtp(form({ email: "a@example.org", token: "12345a" })).errors.token);
  assert.ok(validateOtp(form({ email: "broken", token: good })).errors.email);
  assert.equal(validateOtp(form({ email: "a@example.org", token: `${good.slice(0, 3)} ${good.slice(3)}` })).errors.token, undefined);
});
