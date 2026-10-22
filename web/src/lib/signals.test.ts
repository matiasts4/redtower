import assert from "node:assert/strict";
import test from "node:test";
import { groupEvidence } from "./signals.ts";

test("groups cited evidence ids in host order without inventing a missing kind", () => {
  const grouped = groupEvidence([
    "REP_BLK_1",
    "REP_BLK_2",
    "REP_BLK_3",
    "BUS_210_02",
    "BUS_307_01",
    "BUS_406_01",
    "CAM_AV023",
    "RD_AV023",
  ]);
  assert.deepEqual(grouped.report, ["REP_BLK_1", "REP_BLK_2", "REP_BLK_3"]);
  assert.deepEqual(grouped.vehicle, ["BUS_210_02", "BUS_307_01", "BUS_406_01"]);
  assert.deepEqual(grouped.camera, ["CAM_AV023"]);
  assert.deepEqual(grouped.road, ["RD_AV023"]);
});

test("an empty citation list leaves every lane empty", () => {
  const grouped = groupEvidence([]);
  assert.deepEqual(grouped, { report: [], vehicle: [], camera: [], road: [] });
});
