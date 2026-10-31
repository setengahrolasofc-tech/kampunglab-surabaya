import test from "node:test";
import assert from "node:assert/strict";
import { validateAdminForm, wibToIso, makeTerritoryLabels } from "../src/lib/admin/validation.mjs";
const id = "00000000-0000-4000-8000-000000000001";
const form = (values) => { const f = new FormData(); for (const [k,v] of Object.entries(values)) f.set(k,v); return f; };
const valid = { operation: "grant_role", user_id: id, role: "reviewer", starts_at: "2026-10-30T21:00", reference: "QA-ONLY", verified: "on" };

test("WIB dates convert consistently and reject impossible dates", () => {
  assert.equal(wibToIso("2026-10-30T21:00"), "2026-10-30T14:00:00.000Z");
  assert.equal(wibToIso("2026-02-30T21:00"), null);
  assert.equal(wibToIso("2026-10-30T21:00Z"), null);
});
test("grant requires explicit verification and ignores forged authorization fields", () => {
  const result = validateAdminForm(form({ ...valid, granted_by: id, is_admin: "true" }));
  assert.deepEqual(result.errors, {});
  assert.equal(result.payload.starts_at, "2026-10-30T14:00:00.000Z");
  assert.equal("granted_by" in result.payload, false);
  assert.ok(validateAdminForm(form({ ...valid, verified: "" })).errors.verified);
});
test("delegation requires expiry and expiry must follow start", () => {
  const base = { ...valid, operation: "grant_mandate", office_id: id, mandate_type: "delegate" };
  assert.ok(validateAdminForm(form(base)).errors.ends_at);
  assert.ok(validateAdminForm(form({ ...base, ends_at: "2026-10-30T20:59" })).errors.ends_at);
  assert.deepEqual(validateAdminForm(form({ ...base, ends_at: "2026-10-31T21:00" })).errors, {});
});
test("revocation requires valid identity and a substantive reason", () => {
  assert.ok(validateAdminForm(form({ operation: "revoke_role", id, user_id: id, reason: " " })).errors.reason);
  assert.ok(validateAdminForm(form({ operation: "grant_role", user_id: "forged" })).errors.user_id);
  assert.ok(validateAdminForm(form({ operation: "delete_user" })).errors.operation);
});
test("territory hierarchy validates root and child selection", () => {
  assert.ok(validateAdminForm(form({ operation: "create_territory", kind: "rt", code: "01", name: "DEMO RT" })).errors.parent_id);
  assert.ok(validateAdminForm(form({ operation: "create_territory", kind: "kelurahan", code: "01", name: "DEMO", parent_id: id })).errors.parent_id);
});
test("identically named RW options remain distinguishable by kelurahan", () => {
  const labels = makeTerritoryLabels([
    { id: "a", kind: "kelurahan", name: "DEMO A", code: "A", parent_id: null },
    { id: "b", kind: "kelurahan", name: "DEMO B", code: "B", parent_id: null },
    { id: "rw-a", kind: "rw", name: "01", code: "01", parent_id: "a" },
    { id: "rw-b", kind: "rw", name: "01", code: "01", parent_id: "b" },
  ]);
  assert.notEqual(labels.get("rw-a"), labels.get("rw-b"));
  assert.ok(labels.get("rw-a").includes("DEMO A"));
  assert.ok(labels.get("rw-b").includes("DEMO B"));
});
