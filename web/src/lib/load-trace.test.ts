import assert from "node:assert/strict";
import test from "node:test";
import { loadRealTrace } from "./load-trace.ts";
import { loadScenarios } from "./scenarios.ts";
import { SOURCES } from "./sources.ts";

const counts = Object.fromEntries(
  SOURCES.map((source) => [source.query, source.query === "reports" ? 3 : 1]),
);

test("loadRealTrace loads the actual trace records for scn-block", () => {
  const scenario = loadScenarios().find((s) => s.file_id === "scn-block");
  assert.ok(scenario);
  const steps = loadRealTrace(scenario, counts);
  assert.ok(steps.length >= 7);
  assert.equal(steps[0].id, "planner");
  assert.equal(steps[0].actor, "planner");
  assert.ok(steps[0].isReal);
  assert.equal(steps[0].model, scenario.model);

  const loadStep = steps.find((s) => s.action === "load_sources");
  assert.ok(loadStep);
  assert.equal(loadStep.decides, true);

  const reporterStep = steps.find((s) => s.actor === "reporter");
  assert.ok(reporterStep);
  assert.equal(reporterStep.decides, false);
});
