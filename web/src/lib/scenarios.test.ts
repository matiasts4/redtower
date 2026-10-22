import assert from "node:assert/strict";
import test from "node:test";
import { chromeCopy, forbiddenPublicPhrases } from "./copy.ts";
import { loadScenarios } from "./scenarios.ts";

const LOCKED = {
  "scn-block":
    "El incidente probablemente es real. Afecta a cuatro recorridos, nueve paraderos y aproximadamente 1.800 pasajeros durante los próximos 20 minutos.",
  "scn-false": "Evidencia insuficiente. No recomiendo modificar la operación.",
  "scn-normal":
    "La operación del corredor está dentro de lo esperado. No recomiendo modificar el servicio.",
} as const;

test("loads the five checked-in scenarios and never marks a decision applied", () => {
  const scenarios = loadScenarios();
  assert.deepEqual(
    scenarios.map((scenario) => scenario.file_id),
    ["scn-block", "scn-false", "scn-normal", "scn-stopped", "scn-surge", "scn-block-approved"],
  );
  for (const scenario of scenarios) {
    assert.equal(scenario.applied, false);
    assert.ok(scenario.diagnosis.length > 0);
    assert.ok(scenario.recommendation.text.length > 0);
  }
});

test("quotes the locked operator sentences and keeps 38 percent on the block files only", () => {
  const byId = new Map(loadScenarios().map((scenario) => [scenario.file_id, scenario]));
  for (const [id, sentence] of Object.entries(LOCKED)) {
    assert.equal(byId.get(id)?.diagnosis, sentence);
  }
  assert.equal(byId.get("scn-block")?.recommendation.reduction_percent, 38);
  assert.equal(byId.get("scn-block-approved")?.recommendation.reduction_percent, 38);
  assert.equal(byId.get("scn-block-approved")?.scenario_id, "scn-block");
  assert.equal(byId.get("scn-block-approved")?.authorization, "recorded");
  assert.equal(byId.get("scn-block-approved")?.operator_decision, "approve");
  assert.notEqual(byId.get("scn-false")?.recommendation.reduction_percent, 38);
});

test("chrome copy stays bilingual and does not carry forbidden public claims", () => {
  const blob = JSON.stringify(chromeCopy).toLowerCase();
  for (const phrase of forbiddenPublicPhrases) {
    assert.equal(blob.includes(phrase), false, phrase);
  }
  assert.equal(chromeCopy.en.language.default, "en");
  assert.ok(chromeCopy.es.masthead.product.length > 0);
});
