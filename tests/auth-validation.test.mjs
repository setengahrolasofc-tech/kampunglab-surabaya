import assert from "node:assert/strict";
import test from "node:test";
import { validateAuthForm, safeAuthDestination, getAppOrigin, isCurrentGrant } from "../src/lib/auth/validation.mjs";

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
