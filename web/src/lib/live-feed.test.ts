import assert from "node:assert/strict";
import test from "node:test";
import { pendingRole, previewText } from "./live-feed.ts";

test("the first wait is the planner", () => {
  assert.equal(pendingRole([]), "planner");
});

test("the wait follows the last handoff", () => {
  assert.equal(pendingRole([{ targetAgent: "diagnostician" }]), "diagnostician");
  assert.equal(pendingRole([{ targetAgent: "  " }, { targetAgent: "judge" }]), "judge");
  assert.equal(pendingRole([{ targetAgent: "" }]), "host");
});

test("previews stay on one line", () => {
  assert.equal(previewText("a\n\nb"), "a b");
  assert.equal(previewText("x".repeat(200)).endsWith("…"), true);
  assert.ok(previewText("x".repeat(200)).length < 200);
});
