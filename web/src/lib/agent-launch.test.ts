import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertScenarioId,
  findRepoRoot,
  pythonExecutable,
  webOutputRelative,
} from "./agent-launch.ts";

test("the launcher finds the agent root and a python command", () => {
  const root = findRepoRoot(fileURLToPath(import.meta.url));
  assert.equal(existsSync(path.join(root, "run.py")), true);
  assert.equal(existsSync(path.join(root, "input_examples", "scn-block.json")), true);
  assert.equal(path.basename(root), "redtower");
  const python = pythonExecutable(root);
  assert.equal(python.length > 0, true);
});

test("web runs write beside logs and reject a scenario id that is not a name", () => {
  assert.equal(webOutputRelative("scn-block").split("\\").join("/"), "logs/web_scn-block.json");
  assert.equal(assertScenarioId("scn-false"), "scn-false");
  assert.throws(() => assertScenarioId("../output_examples/scn-block"));
  assert.throws(() => assertScenarioId("scn-block;drop"));
});
