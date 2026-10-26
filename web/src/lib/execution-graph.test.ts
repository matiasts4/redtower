import test from "node:test";
import assert from "node:assert/strict";
import { buildExecutionGraph, formatShortModel } from "./execution-graph.ts";
import type { RealTraceStep } from "./load-trace.ts";

test("formatShortModel maps known model aliases", () => {
  assert.equal(formatShortModel("host"), "Host");
  assert.equal(formatShortModel("fixture"), "Fixture");
  assert.equal(formatShortModel("nvidia/nemotron-3.5-super-vl-120b-a12b"), "Nemotron 120B");
  assert.equal(formatShortModel("nvidia/nemotron-3-ultra-550b-a55b"), "Nemotron 550B");
  assert.equal(formatShortModel("nvidia/nemotron-3.5-lightning-30b-a3b"), "Nemotron 30B");
});

test("buildExecutionGraph constructs DAG nodes, edges, and tree from trace steps", () => {
  const steps: RealTraceStep[] = [
    {
      id: "planner" as any,
      actor: "planner",
      action: "select_queries",
      decides: false,
      summary: "Selected 11 queries",
      lines: [],
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      durationMs: 1500,
      inputSummary: "Scenario scn-block",
      outputRaw: '{"queries": ["positions", "reports", "cameras", "road_events", "demand"]}',
      targetAgent: "host",
      retryCount: 0,
      status: "ok",
      isReal: true,
    },
    {
      id: "load" as any,
      actor: "host",
      action: "load_sources",
      decides: true,
      summary: "ZetarisSource loaded 11 tables",
      lines: [],
      model: "host",
      durationMs: 400,
      inputSummary: "positions, reports",
      outputRaw: "ZetarisSource: reports=3, cameras=1",
      targetAgent: "diagnostician",
      status: "ok",
      isReal: true,
    },
    {
      id: "reporter" as any,
      actor: "reporter",
      action: "explain",
      decides: false,
      summary: "Failed draft without citation",
      lines: [],
      model: "nvidia/nemotron-3.5-lightning-30b-a3b",
      durationMs: 2000,
      inputSummary: "Write Spanish sentence",
      outputRaw: "Recomendamos enviar un refuerzo",
      targetAgent: "host",
      retryCount: 0,
      status: "retry",
      isReal: true,
    },
    {
      id: "reporter" as any,
      actor: "reporter",
      action: "explain",
      decides: false,
      summary: "Accepted draft with REP_BLK_1",
      lines: [],
      model: "nvidia/nemotron-3.5-lightning-30b-a3b",
      durationMs: 2200,
      inputSummary: "Cite evidence and numbers",
      outputRaw: "Con la evidencia REP_BLK_1 se reduce 1488 min-pax (38%).",
      targetAgent: "host",
      retryCount: 1,
      status: "ok",
      isReal: true,
    },
  ];

  const graph = buildExecutionGraph(steps, { running: false });

  assert.equal(graph.nodes.length, 9);
  assert.equal(graph.edges.length, 13);
  assert.equal(graph.hasRetries, true);

  const plannerNode = graph.nodes.find((n) => n.id === "planner");
  assert.ok(plannerNode);
  assert.equal(plannerNode.status, "done");
  assert.equal(plannerNode.model, "nvidia/nemotron-3-ultra-550b-a55b");

  const reporterNode = graph.nodes.find((n) => n.id === "reporter");
  assert.ok(reporterNode);
  assert.equal(reporterNode.attempts.length, 2);
  assert.equal(reporterNode.status, "done");
  assert.ok(reporterNode.evidenceIds.includes("REP_BLK_1"));

  const reporterRetryEdge = graph.edges.find((e) => e.from === "reporter" && e.to === "reporter");
  assert.ok(reporterRetryEdge);
  assert.equal(reporterRetryEdge.hasRetried, true);

  // Tree verification
  assert.equal(graph.tree.length, 1);
  const root = graph.tree[0];
  assert.equal(root.children?.length, 4);
});
