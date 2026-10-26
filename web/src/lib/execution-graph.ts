import type { RealTraceStep } from "./load-trace.ts";
import type { ScenarioFile } from "./scenarios.ts";

export type NodeStatus = "idle" | "working" | "retry" | "done";

export type ExecutionNodeId =
  | "planner"
  | "load"
  | "diagnostician"
  | "classifier"
  | "simulator"
  | "scenario"
  | "judge"
  | "reporter"
  | "approval";

export type GraphAttempt = {
  attemptNumber: number;
  status: string;
  inputSummary: string;
  outputRaw: string;
  model?: string;
  durationMs?: number;
  timestamp?: string;
  rejectionReason?: string;
};

export type ExecutionNode = {
  id: ExecutionNodeId;
  stageId: "plan" | "diagnose" | "simulate" | "synthesize";
  stageOrder: number;
  label: string;
  role: string;
  action: string;
  authority: "decides" | "proposes" | "explains" | "gate";
  status: NodeStatus;
  model?: string;
  durationMs: number;
  attempts: GraphAttempt[];
  activeAttempt?: GraphAttempt;
  lastStep?: RealTraceStep;
  evidenceIds: string[];
};

export type ExecutionEdge = {
  from: ExecutionNodeId;
  to: ExecutionNodeId;
  type: "delegation" | "handoff" | "retry_loop";
  active: boolean;
  hasRetried: boolean;
  label?: string;
};

export type ExecutionTreeNode = {
  id: string;
  nodeId?: ExecutionNodeId;
  title: string;
  role?: string;
  status: NodeStatus;
  authority?: string;
  model?: string;
  durationMs?: number;
  timestamp?: string;
  summary?: string;
  inputSummary?: string;
  outputRaw?: string;
  children?: ExecutionTreeNode[];
};

export type ExecutionGraphData = {
  nodes: ExecutionNode[];
  edges: ExecutionEdge[];
  tree: ExecutionTreeNode[];
  currentNodeId: ExecutionNodeId | null;
  hasRetries: boolean;
  totalDurationMs: number;
  completedCount: number;
};

export function formatShortModel(model?: string): string {
  if (!model) return "";
  if (model === "host") return "Host";
  if (model === "fixture") return "Fixture";
  const lower = model.toLowerCase();
  if (lower.includes("super")) return "Nemotron 120B";
  if (lower.includes("ultra")) return "Nemotron 550B";
  if (lower.includes("lightning") || lower.includes("nano") || lower.includes("fast")) return "Nemotron 30B";
  return model.split("/").pop() || model;
}

const CANONICAL_NODES: Array<{
  id: ExecutionNodeId;
  stageId: "plan" | "diagnose" | "simulate" | "synthesize";
  stageOrder: number;
  label: string;
  role: string;
  action: string;
  authority: "decides" | "proposes" | "explains" | "gate";
}> = [
  { id: "planner", stageId: "plan", stageOrder: 1, label: "Planner Agent", role: "planner", action: "select_queries", authority: "proposes" },
  { id: "load", stageId: "plan", stageOrder: 1, label: "Data Fabric (Zetaris / SQLite)", role: "host", action: "load_sources", authority: "decides" },
  { id: "diagnostician", stageId: "diagnose", stageOrder: 2, label: "Diagnostician Agent", role: "diagnostician", action: "diagnostician", authority: "proposes" },
  { id: "classifier", stageId: "diagnose", stageOrder: 2, label: "Host Sensor Classifier", role: "host", action: "classify", authority: "decides" },
  { id: "simulator", stageId: "simulate", stageOrder: 3, label: "Host Queue Simulator", role: "host", action: "rank_alternatives", authority: "decides" },
  { id: "scenario", stageId: "simulate", stageOrder: 3, label: "Scenario Agent", role: "scenario", action: "scenario", authority: "proposes" },
  { id: "judge", stageId: "simulate", stageOrder: 3, label: "Judge Agent", role: "judge", action: "judge", authority: "proposes" },
  { id: "reporter", stageId: "synthesize", stageOrder: 4, label: "Reporter Agent", role: "reporter", action: "explain", authority: "explains" },
  { id: "approval", stageId: "synthesize", stageOrder: 4, label: "Operator Approval Gate", role: "host", action: "authorize", authority: "gate" },
];

function stepToNodeId(step: RealTraceStep): ExecutionNodeId {
  const role = step.actor?.toLowerCase() || "";
  const action = step.action?.toLowerCase() || "";
  if (role === "planner" || action === "select_queries" || action === "reject_queries") return "planner";
  if (action === "load_sources" || action === "load") return "load";
  if (role === "diagnostician" || action === "diagnostician" || action === "reject_classification") return "diagnostician";
  if (action === "classify" || action === "measure") return "classifier";
  if (action === "rank_alternatives" || action === "rank") return "simulator";
  if (role === "scenario" || action === "scenario") return "scenario";
  if (role === "judge" || action === "judge" || action === "reject_judge_action") return "judge";
  if (role === "reporter" || action === "explain" || action === "request_evidence_citation") return "reporter";
  if (action === "authorize" || action === "approval") return "approval";
  return "simulator";
}

export function buildExecutionGraph(
  steps: RealTraceStep[],
  options: {
    running?: boolean;
    cursor?: number;
    scenario?: ScenarioFile;
  } = {},
): ExecutionGraphData {
  const effectiveCursor = Math.max(0, Math.min(options.cursor ?? steps.length, steps.length));
  const activeSteps = steps.slice(0, effectiveCursor);
  const isRunning = options.running ?? false;

  const nodeMap = new Map<ExecutionNodeId, ExecutionNode>();
  for (const def of CANONICAL_NODES) {
    nodeMap.set(def.id, {
      ...def,
      status: "idle",
      durationMs: 0,
      attempts: [],
      evidenceIds: [],
    });
  }

  // Populate steps into node attempts
  for (let i = 0; i < activeSteps.length; i++) {
    const step = activeSteps[i];
    const nodeId = stepToNodeId(step);
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const isRetry = step.status === "retry" || step.action.includes("reject") || step.action.includes("request_evidence");
    const dur = step.durationMs || 0;
    node.durationMs += dur;
    node.model = step.model || node.model;
    node.lastStep = step;

    // Check evidence citations in output
    const out = step.outputRaw || step.summary || "";
    const foundEvidence = out.match(/\b(REP_[A-Z0-9_]+|BUS_[A-Z0-9_]+|CAM_[A-Z0-9_]+|RD_[A-Z0-9_]+)\b/g);
    if (foundEvidence) {
      for (const ev of foundEvidence) {
        if (!node.evidenceIds.includes(ev)) node.evidenceIds.push(ev);
      }
    }

    node.attempts.push({
      attemptNumber: node.attempts.length + 1,
      status: isRetry ? "retry" : "ok",
      inputSummary: step.inputSummary || "",
      outputRaw: out,
      model: step.model,
      durationMs: dur,
      timestamp: step.timestamp,
      rejectionReason: isRetry ? (step.inputSummary || step.action) : undefined,
    });
  }

  // Determine current active node
  let currentNodeId: ExecutionNodeId | null = null;
  if (isRunning) {
    if (activeSteps.length === 0) {
      currentNodeId = "planner";
    } else {
      const last = activeSteps[activeSteps.length - 1];
      const target = (last.targetAgent || "").toLowerCase();
      if (target === "diagnostician") currentNodeId = "diagnostician";
      else if (target === "scenario") currentNodeId = "scenario";
      else if (target === "judge") currentNodeId = "judge";
      else if (target === "reporter") currentNodeId = "reporter";
      else if (target === "host") {
        if (last.actor === "planner") currentNodeId = "load";
        else if (last.actor === "diagnostician") currentNodeId = "classifier";
        else if (last.actor === "scenario") currentNodeId = "judge";
        else if (last.actor === "judge") currentNodeId = "reporter";
        else if (last.actor === "reporter") currentNodeId = "approval";
        else currentNodeId = "simulator";
      } else {
        currentNodeId = stepToNodeId(last);
      }
    }
  }

  // Update node statuses
  for (const [id, node] of nodeMap.entries()) {
    if (node.attempts.length === 0) {
      node.status = (isRunning && currentNodeId === id) ? "working" : "idle";
    } else {
      const lastAtt = node.attempts[node.attempts.length - 1];
      if (isRunning && currentNodeId === id) {
        node.status = "working";
      } else if (lastAtt.status === "retry") {
        node.status = "retry";
      } else {
        node.status = "done";
      }
      node.activeAttempt = lastAtt;
    }
  }

  // Terminal node: approval gate
  const approvalNode = nodeMap.get("approval")!;
  if (options.scenario) {
    if (options.scenario.authorization === "recorded") {
      approvalNode.status = "done";
      approvalNode.model = "operator";
      approvalNode.label = "Operator Gate (Approved)";
    } else if (nodeMap.get("reporter")?.status === "done") {
      approvalNode.status = "done";
      approvalNode.model = "pending";
      approvalNode.label = "Operator Gate (Pending Human)";
    }
  }

  // Edges definition
  const rawEdges: Array<[ExecutionNodeId, ExecutionNodeId, "delegation" | "handoff" | "retry_loop", string?]> = [
    ["planner", "planner", "retry_loop", "reject_queries"],
    ["planner", "load", "delegation", "queries"],
    ["load", "diagnostician", "handoff", "sensor_bundle"],
    ["diagnostician", "diagnostician", "retry_loop", "reject_classification"],
    ["diagnostician", "classifier", "delegation", "class_proposal"],
    ["classifier", "simulator", "handoff", "impact_measured"],
    ["simulator", "scenario", "delegation", "catalog"],
    ["simulator", "judge", "delegation", "scores"],
    ["judge", "judge", "retry_loop", "reject_judge_action"],
    ["scenario", "reporter", "handoff", "alternatives"],
    ["judge", "reporter", "handoff", "winner"],
    ["reporter", "reporter", "retry_loop", "request_evidence_citation"],
    ["reporter", "approval", "handoff", "explanation"],
  ];

  const edges: ExecutionEdge[] = rawEdges.map(([from, to, type, label]) => {
    const fromNode = nodeMap.get(from)!;
    const toNode = nodeMap.get(to)!;
    const isSelfRetry = from === to && type === "retry_loop";
    const hasRetried = isSelfRetry && fromNode.attempts.some((a) => a.status === "retry");
    const active = isRunning
      ? (fromNode.status === "working" || toNode.status === "working")
      : (fromNode.status === "done" && toNode.status === "done");

    return {
      from,
      to,
      type,
      active,
      hasRetried,
      label,
    };
  });

  // Tree representation
  const tree: ExecutionTreeNode[] = [
    {
      id: "root-host",
      title: "Host Deterministic Engine (Corredor Poniente)",
      role: "host",
      status: isRunning ? "working" : "done",
      authority: "decides",
      children: [
        {
          id: "stage-1",
          title: "1. Ingesta y Planificación (Planning & Ingestion)",
          status: nodeMap.get("load")?.status || "idle",
          children: [
            treeFromNode(nodeMap.get("planner")!),
            treeFromNode(nodeMap.get("load")!),
          ],
        },
        {
          id: "stage-2",
          title: "2. Diagnóstico y Corroboración Física (Diagnosis & Sensors)",
          status: nodeMap.get("classifier")?.status || "idle",
          children: [
            treeFromNode(nodeMap.get("diagnostician")!),
            treeFromNode(nodeMap.get("classifier")!),
          ],
        },
        {
          id: "stage-3",
          title: "3. Simulación de Colas y Evaluación (Simulation & Ranking)",
          status: nodeMap.get("judge")?.status || "idle",
          children: [
            treeFromNode(nodeMap.get("simulator")!),
            treeFromNode(nodeMap.get("scenario")!),
            treeFromNode(nodeMap.get("judge")!),
          ],
        },
        {
          id: "stage-4",
          title: "4. Síntesis y Compuerta Operativa (Synthesis & Approval)",
          status: nodeMap.get("approval")?.status || "idle",
          children: [
            treeFromNode(nodeMap.get("reporter")!),
            treeFromNode(nodeMap.get("approval")!),
          ],
        },
      ],
    },
  ];

  const totalDurationMs = Array.from(nodeMap.values()).reduce((sum, n) => sum + n.durationMs, 0);
  const completedCount = Array.from(nodeMap.values()).filter((n) => n.status === "done").length;
  const hasRetries = Array.from(nodeMap.values()).some((n) => n.attempts.some((a) => a.status === "retry"));

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
    tree,
    currentNodeId,
    hasRetries,
    totalDurationMs,
    completedCount,
  };
}

function treeFromNode(node: ExecutionNode): ExecutionTreeNode {
  const children: ExecutionTreeNode[] = [];
  if (node.attempts.length > 1) {
    node.attempts.forEach((att, idx) => {
      children.push({
        id: `${node.id}-attempt-${idx + 1}`,
        nodeId: node.id,
        title: `Intento #${idx + 1}: ${att.status === "retry" ? "Rechazado por Host (Retry Loop)" : "Aceptado"}`,
        status: att.status === "retry" ? "retry" : "done",
        model: formatShortModel(att.model),
        durationMs: att.durationMs,
        timestamp: att.timestamp,
        inputSummary: att.inputSummary,
        outputRaw: att.outputRaw,
        summary: att.rejectionReason,
      });
    });
  }

  return {
    id: `node-${node.id}`,
    nodeId: node.id,
    title: node.label,
    role: node.role,
    status: node.status,
    authority: node.authority,
    model: formatShortModel(node.model),
    durationMs: node.durationMs,
    summary: node.lastStep?.summary,
    inputSummary: node.lastStep?.inputSummary,
    outputRaw: node.lastStep?.outputRaw,
    children: children.length > 0 ? children : undefined,
  };
}
