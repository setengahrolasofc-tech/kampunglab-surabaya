import test from "node:test";
import assert from "node:assert/strict";
import { innovationForms, requiredSlotKeys, requiredSlots, draftChecklist, validateDraftDocument, emptyDraftDocument } from "../src/lib/drafts/schema.mjs";
import { buildDocumentCheck, uncheckedDocument } from "../src/lib/ai/document-check-result.mjs";
import { simulationMissing } from "../src/lib/simulations/validation.mjs";
import { completeDemoDocument } from "./simulation-fixture.mjs";
const id = "00000000-0000-4000-8000-000000000001";

test("jenis inovasi: gagasan dihapus dan dokumen wajib mengikuti tabel", () => {
  assert.deepEqual(innovationForms, ["prototipe", "produk", "program", "teknologi"]);
  for (const form of ["prototipe", "produk", "teknologi"]) assert.deepEqual(requiredSlotKeys(form), ["prd", "rab", "declaration"]);
  assert.deepEqual(requiredSlotKeys("program"), ["rab", "declaration"]);
  assert.deepEqual(requiredSlotKeys(""), []);
  assert.deepEqual(requiredSlotKeys("gagasan"), []);
  assert.deepEqual(requiredSlots("program").map(slot => slot.key), ["rab", "declaration"]);
});

test("jenis gagasan ditolak saat draf disimpan", () => {
  const doc = emptyDraftDocument();
  doc.innovation.form = "gagasan";
  assert.equal(validateDraftDocument(doc).errors["innovation.form"], "Pilih bentuk inovasi yang tersedia.");
});

test("Inovasi Program lengkap tanpa PRD, jenis lain tetap memerlukan PRD", () => {
  const doc = completeDemoDocument(id, id);
  delete doc.documents.prd;
  assert.ok(simulationMissing(doc).some(item => item.startsWith("PRD inovasi")));
  doc.innovation.form = "program";
  assert.deepEqual(simulationMissing(doc), []);
  assert.deepEqual(draftChecklist(validateDraftDocument(doc).data), [true, true, true, true]);
  delete doc.documents.rab;
  assert.ok(simulationMissing(doc).some(item => item.startsWith("RAB")));
});

test("jenis inovasi belum dipilih: dokumen belum dapat dianggap selesai", () => {
  const doc = completeDemoDocument(id, id);
  doc.innovation.form = "";
  const checklist = draftChecklist(validateDraftDocument(doc).data);
  assert.deepEqual(checklist, [false, false, false, false]);
  assert.ok(simulationMissing(doc).includes("Data inovasi dan tim"));
});

test("surat pernyataan wajib bermeterai; dokumen lain tidak diminta meterai", () => {
  const now = "2026-11-01T00:00:00Z", good = { document_type_ok: true, title_match: "ya", signature: "ada", completeness: "lengkap", issues: [], summary: "Baik" };
  assert.equal(buildDocumentCheck("declaration", { ...good, stamp: "ada" }, "Pompa", now).status, "lulus");
  const missing = buildDocumentCheck("declaration", { ...good, stamp: "tidak_ada" }, "Pompa", now);
  assert.equal(missing.status, "perlu_perbaikan");
  assert.ok(missing.issues.some(item => item.startsWith("Meterai Rp10.000")));
  assert.equal(buildDocumentCheck("declaration", { ...good, stamp: "tidak_jelas" }, "Pompa", now).status, "perlu_dicek");
  assert.equal(buildDocumentCheck("declaration", good, "Pompa", now).status, "perlu_dicek");
  assert.equal(buildDocumentCheck("rab", { ...good, stamp: "tidak_ada" }, "Pompa", now).status, "lulus");
  assert.equal(buildDocumentCheck("rab", good, "Pompa", now).stamp, "tidak_perlu");
  assert.equal(uncheckedDocument("declaration", "AI mati", "Pompa", now).stamp, "tidak_jelas");
});

test("hasil pemeriksaan menyimpan meterai dan tetap valid saat draf disimpan", () => {
  const doc = completeDemoDocument(id, id);
  doc.documents.declaration.check.stamp = "tidak_ada";
  assert.equal(validateDraftDocument(doc).data.documents.declaration.check.stamp, "tidak_ada");
  delete doc.documents.declaration.check.stamp;
  assert.equal(validateDraftDocument(doc).data.documents.declaration.check.stamp, "tidak_jelas");
});
