import assert from "node:assert/strict";
import test from "node:test";
import { runViews } from "./replay.ts";
import { loadScenarios } from "./scenarios.ts";
import { SOURCES } from "./sources.ts";

const counts = Object.fromEntries(SOURCES.map((source) => [source.query, source.query === "reports" ? 3 : 1]));

test("the rank step records the host winner and only the host steps decide", () => {
  const scenario = loadScenarios().find((item) => item.file_id === "scn-block");
  assert.ok(scenario);
  const views = runViews(scenario, counts);
  const rank = views.find((view) => view.id === "rank");
  assert.equal(rank?.decides, true);
  assert.equal(rank?.summary, "relief_and_divert_210 1488");
  assert.ok(rank?.lines.includes("winner relief_and_divert_210 1488 vs 2400"));
  assert.deepEqual(
    views.filter((view) => view.decides).map((view) => view.id),
    ["load", "rank"],
  );
  const judge = views.find((view) => view.id === "judge");
  assert.equal(judge?.lines[0], "01 relief_and_divert_210 1488");
  assert.equal(judge?.decides, false);
});

test("the reporter keeps the host sentence and an evidence id from the file", () => {
  const scenario = loadScenarios().find((item) => item.file_id === "scn-block");
  assert.ok(scenario);
  const reporter = runViews(scenario, counts).find((view) => view.id === "reporter");
  assert.equal(reporter?.lines[0], scenario.recommendation.text);
  assert.ok(reporter?.lines.includes("cite REP_BLK_1"));
  assert.equal(reporter?.decides, false);
});

test("the planner lists every named query and the load step uses the given counts", () => {
  const scenario = loadScenarios().find((item) => item.file_id === "scn-false");
  assert.ok(scenario);
  const views = runViews(scenario, counts);
  const planner = views.find((view) => view.id === "planner");
  assert.equal(planner?.decides, false);
  assert.equal(planner?.lines.filter((line) => SOURCES.some((source) => source.query === line)).length, 11);
  assert.ok(planner?.lines.includes("file scn-false"));
  const load = views.find((view) => view.id === "load");
  assert.ok(load?.lines.includes("reports=3"));
  const diagnostician = views.find((view) => view.id === "diagnostician");
  assert.ok(diagnostician?.lines.includes("status insufficient"));
  assert.equal(diagnostician?.lines.some((line) => line.includes("status real")), false);
});
