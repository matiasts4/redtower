import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { RUN_STEPS } from "./run.ts";
import { SOURCES, rowsFor } from "./sources.ts";

test("the replay names the host as the only decider and keeps the planner unused", () => {
  assert.equal(RUN_STEPS.find((step) => step.id === "planner")?.decides, false);
  assert.equal(RUN_STEPS.find((step) => step.id === "rank")?.decides, true);
  assert.equal(RUN_STEPS.filter((step) => step.decides).map((step) => step.id).join(","), "load,rank");
  assert.equal(RUN_STEPS.at(-1)?.id, "reporter");
});

test("source rows are the checked-in files, including the untrusted report", () => {
  const file = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../data/sample/user_reports.csv",
  );
  const lines = readFileSync(file, "utf8").trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  const reports = rowsFor(
    {
      "user_reports.csv": lines.slice(1).map((line) => {
        const cells = line.split(",");
        return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
      }),
    },
    "reports",
    "scn-false",
  );
  assert.equal(reports.some((row) => row.report_id === "REP_FALSE_1"), true);
  assert.equal(SOURCES.find((source) => source.query === "weather")?.usedToClassify, false);
  assert.equal(SOURCES.find((source) => source.query === "reports")?.usedToClassify, true);
  assert.equal(SOURCES.length, 11);
});
