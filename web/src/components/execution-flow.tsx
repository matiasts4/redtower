"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Clock,
  Cpu,
  Database,
  GitBranch,
  GitFork,
  ListTree,
  LoaderCircle,
  PenLine,
  Play,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { chromeCopy, type ChromeLang } from "@/lib/copy";
import {
  buildExecutionGraph,
  formatShortModel,
  type ExecutionNode,
  type ExecutionNodeId,
  type ExecutionTreeNode,
  type NodeStatus,
} from "@/lib/execution-graph";
import type { RealTraceStep } from "@/lib/load-trace";
import type { ScenarioFile } from "@/lib/scenarios";

const ICONS: Record<string, typeof Cpu> = {
  host: Cpu,
  planner: ListTree,
  load: Database,
  diagnostician: Stethoscope,
  classifier: ShieldCheck,
  simulator: TrendingDown,
  scenario: GitBranch,
  judge: Scale,
  reporter: PenLine,
  approval: UserCheck,
};

function getNodeIcon(id: string) {
  return ICONS[id] ?? Cpu;
}

export function ExecutionFlow({
  lang,
  steps,
  running,
  elapsed,
  scenario,
  isReal = false,
}: {
  lang: ChromeLang;
  steps: RealTraceStep[];
  running: boolean;
  elapsed: number;
  scenario?: ScenarioFile;
  isReal?: boolean;
}) {
  const copy = chromeCopy[lang];
  const flowCopy = copy.executionFlow;
  const [viewMode, setViewMode] = useState<"graph" | "tree">("graph");
  const [selectedNodeId, setSelectedNodeId] = useState<ExecutionNodeId>("reporter");
  const [replayCursor, setReplayCursor] = useState<number | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);

  const effectiveSteps = useMemo(() => {
    if (replayCursor !== null) return steps.slice(0, replayCursor);
    return steps;
  }, [steps, replayCursor]);

  const graph = useMemo(
    () =>
      buildExecutionGraph(effectiveSteps, {
        running: running || isReplaying,
        cursor: replayCursor ?? undefined,
        scenario,
      }),
    [effectiveSteps, running, isReplaying, replayCursor, scenario],
  );

  // Auto-select latest working or updated node
  useEffect(() => {
    if (graph.currentNodeId) {
      setSelectedNodeId(graph.currentNodeId);
    } else if (graph.nodes.some((n) => n.id === "reporter" && n.status === "done")) {
      setSelectedNodeId("reporter");
    }
  }, [graph.currentNodeId, steps.length]);

  // Replay animation effect
  useEffect(() => {
    if (!isReplaying) return;
    if (replayCursor === null || replayCursor >= steps.length) {
      setIsReplaying(false);
      setReplayCursor(null);
      return;
    }

    const timer = setTimeout(() => {
      setReplayCursor((prev) => {
        if (prev === null) return 1;
        const next = prev + 1;
        if (next >= steps.length) {
          setIsReplaying(false);
          return null;
        }
        return next;
      });
    }, 650);

    return () => clearTimeout(timer);
  }, [isReplaying, replayCursor, steps.length]);

  function triggerReplay() {
    if (steps.length === 0) return;
    setReplayCursor(1);
    setIsReplaying(true);
  }

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) || graph.nodes[0];

  const stages: Array<{
    num: string;
    title: string;
    dotClass: string;
    nodeIds: ExecutionNodeId[];
  }> = [
    {
      num: "01",
      title: flowCopy.stages.plan,
      dotClass: "bg-signal",
      nodeIds: ["planner", "load"],
    },
    {
      num: "02",
      title: flowCopy.stages.diagnose,
      dotClass: "bg-hold",
      nodeIds: ["diagnostician", "classifier"],
    },
    {
      num: "03",
      title: flowCopy.stages.simulate,
      dotClass: "bg-clear",
      nodeIds: ["simulator", "scenario", "judge"],
    },
    {
      num: "04",
      title: flowCopy.stages.synthesize,
      dotClass: "bg-ink",
      nodeIds: ["reporter", "approval"],
    },
  ];

  return (
    <section
      className="overflow-hidden rounded-xl border border-rule bg-card shadow-xs"
      aria-label={flowCopy.title}
    >
      {/* Compact Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-2.5 border-b border-rule px-4 py-2.5 bg-field/40">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 text-ink">
            <GitFork className="size-4 text-signal" />
            {flowCopy.title}
          </h2>
          {isReal ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[10px] text-signal font-semibold">
              <Sparkles className="size-2.5" /> {copy.platform.realTraceBadge}
            </span>
          ) : null}
          {running ? (
            <Badge className="bg-signal text-bone font-mono text-[10px] animate-pulse gap-1 px-2 py-0.5">
              <LoaderCircle className="size-3 animate-spin" />
              {flowCopy.running} ({elapsed.toFixed(1)}s)
            </Badge>
          ) : null}
          <span className="hidden xl:inline text-xs text-muted-foreground">
            · {flowCopy.subtitle}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {graph.totalDurationMs > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rule bg-card px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              <Clock className="size-3 text-ink" />
              {(graph.totalDurationMs / 1000).toFixed(1)}s
            </span>
          ) : null}

          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border border-rule bg-card p-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                viewMode === "graph"
                  ? "bg-ink text-bone font-semibold"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              <GitFork className="size-3" />
              {flowCopy.graphView}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                viewMode === "tree"
                  ? "bg-ink text-bone font-semibold"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              <ListTree className="size-3" />
              {flowCopy.treeView}
            </button>
          </div>

          {/* Replay button */}
          <Button
            variant="outline"
            size="sm"
            onClick={triggerReplay}
            disabled={running || steps.length === 0}
            className="gap-1.5 text-[11px] font-mono cursor-pointer h-7 px-2.5 rounded-lg"
          >
            <Play className={`size-3 ${isReplaying ? "text-signal animate-spin" : ""}`} />
            {flowCopy.replay}
          </Button>
        </div>
      </header>

      {/* Main Graph / Tree Canvas — Calibrated to fit viewport without horizontal scroll */}
      <div className="p-3.5 md:p-4 bg-[radial-gradient(#d9d1c3_1px,transparent_1px)] [background-size:16px_16px] bg-paper/40">
        {viewMode === "graph" ? (
          <div className="flex flex-col gap-3">
            {/* 4-Stage Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
              {stages.map((stage, stageIdx) => {
                const stageNodes = stage.nodeIds
                  .map((id) => graph.nodes.find((n) => n.id === id))
                  .filter((n): n is ExecutionNode => Boolean(n));

                const nextStageFirstNode =
                  stageIdx < stages.length - 1
                    ? graph.nodes.find((n) => n.id === stages[stageIdx + 1].nodeIds[0])
                    : undefined;
                const stageBridgeActive =
                  nextStageFirstNode && nextStageFirstNode.status !== "idle";

                return (
                  <div
                    key={stage.num}
                    className="relative flex flex-col rounded-xl border border-rule/90 bg-card/90 p-3 shadow-2xs"
                  >
                    {/* Stage Header */}
                    <div className="flex items-center justify-between gap-1.5 border-b border-rule/80 pb-2 mb-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`size-2 rounded-full shrink-0 ${stage.dotClass}`} />
                        <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-ink truncate">
                          {stage.title}
                        </span>
                      </div>
                      <span className="rounded bg-field px-1.5 py-0.2 font-mono text-[9px] font-semibold text-muted-foreground border border-rule">
                        S{stage.num}
                      </span>
                    </div>

                    {/* Nodes Stack inside Stage */}
                    <div className="flex flex-col flex-1 justify-between">
                      {stageNodes.map((node, nodeIdx) => {
                        const nextNode = stageNodes[nodeIdx + 1];
                        const edgeActive = nextNode ? nextNode.status !== "idle" : false;
                        const hasRetryOnNode =
                          node.status === "retry" ||
                          node.attempts.some((a) => a.status === "retry");

                        return (
                          <div key={node.id} className="flex flex-col">
                            <NodeCard
                              node={node}
                              selected={selectedNodeId === node.id}
                              onSelect={() => setSelectedNodeId(node.id)}
                              copy={flowCopy}
                            />
                            {nextNode ? (
                              <EdgeConnector
                                active={edgeActive}
                                hasRetry={hasRetryOnNode}
                              />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {/* Inter-Stage Horizontal Connector Bridge */}
                    {stageIdx < stages.length - 1 ? (
                      <div
                        className="hidden lg:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                        aria-hidden
                      >
                        <div
                          className={`flex items-center justify-center size-5 rounded-full border shadow-2xs transition-colors ${
                            stageBridgeActive
                              ? "border-signal/50 bg-card text-signal"
                              : "border-rule bg-field text-muted-foreground/60"
                          }`}
                        >
                          <ArrowRight className="size-3" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Compact Topology Summary Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rule bg-card px-3 py-1.5 text-[11px] font-mono text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-ink font-medium">
                  <span className="size-2 rounded-full bg-clear" />
                  {flowCopy.status.done}: {graph.completedCount}/9
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-signal" />
                  Host ({flowCopy.decides})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-hold" />
                  Nemotron ({flowCopy.explains})
                </span>
                {graph.hasRetries ? (
                  <span className="flex items-center gap-1 rounded-full bg-hold/15 border border-hold/30 px-2 py-0.2 text-[10px] text-hold font-semibold">
                    <RotateCcw className="size-2.5" /> {flowCopy.retryLoop}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Host: Markovian World Model · NVIDIA Nemotron Super 120B / Ultra 550B / Nano 30B
              </span>
            </div>
          </div>
        ) : (
          /* Hierarchical Tree View */
          <div className="max-w-4xl mx-auto font-mono text-xs">
            <TreeBranch
              tree={graph.tree[0]}
              selectedNodeId={selectedNodeId}
              onSelect={setSelectedNodeId}
              copy={flowCopy}
            />
          </div>
        )}
      </div>

      {/* Compact Bottom Inspector Drawer */}
      <aside className="border-t border-rule bg-card px-4 py-3">
        <div className="grid gap-3 lg:grid-cols-[16rem_1fr] items-start">
          {/* Inspector Col 1: Selected Agent Meta */}
          <div className="flex flex-col gap-2 rounded-lg border border-rule bg-field/40 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
                  {flowCopy.inspectorTitle}
                </p>
                <h3 className="font-semibold text-xs text-ink truncate mt-0.5">
                  {selectedNode.label}
                </h3>
              </div>
              <StatusBadge status={selectedNode.status} copy={flowCopy} />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
              <span
                className={`rounded border px-1.5 py-0.5 font-semibold ${
                  selectedNode.authority === "decides"
                    ? "border-signal/30 bg-signal/10 text-signal"
                    : "border-rule bg-card text-ink"
                }`}
              >
                {flowCopy[selectedNode.authority] || selectedNode.authority}
              </span>
              <span className="rounded border border-rule bg-card px-1.5 py-0.5 text-ink">
                {formatShortModel(selectedNode.model) || "Host"}
              </span>
              {selectedNode.durationMs > 0 ? (
                <span className="rounded border border-rule bg-card px-1.5 py-0.5 text-muted-foreground">
                  {(selectedNode.durationMs / 1000).toFixed(2)}s
                </span>
              ) : null}
            </div>

            {selectedNode.evidenceIds.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {selectedNode.evidenceIds.map((ev) => (
                  <span
                    key={ev}
                    className="rounded border border-signal/30 bg-signal/10 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-signal"
                  >
                    {ev}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Inspector Col 2: Input & Full Output Side-by-Side */}
          <div className="grid gap-2.5 md:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {flowCopy.inputSummary}
              </p>
              <div className="rounded-lg border border-rule bg-paper px-2.5 py-2 font-mono text-[11px] text-ink leading-snug break-words max-h-24 overflow-y-auto">
                {selectedNode.activeAttempt?.inputSummary || (
                  <span className="text-muted-foreground italic">{flowCopy.inspectorEmpty}</span>
                )}
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {flowCopy.rawOutput}
              </p>
              <div className="rounded-lg border border-rule bg-paper px-2.5 py-2 font-mono text-[11px] text-ink leading-snug break-words max-h-24 overflow-y-auto">
                {selectedNode.activeAttempt?.outputRaw || selectedNode.lastStep?.summary || (
                  <span className="text-muted-foreground italic">{flowCopy.inspectorEmpty}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}

function NodeCard({
  node,
  selected,
  onSelect,
  copy,
}: {
  node: ExecutionNode;
  selected: boolean;
  onSelect: () => void;
  copy: any;
}) {
  const Icon = getNodeIcon(node.id);
  const isWorking = node.status === "working";
  const isRetry = node.status === "retry" || node.attempts.some((a) => a.status === "retry");
  const isDone = node.status === "done";
  const isDecides = node.authority === "decides";

  const stateBorder = isWorking
    ? "border-signal ring-2 ring-signal/30 bg-card"
    : isRetry
      ? "border-hold/80 bg-hold/5"
      : isDone
        ? "border-rule bg-card"
        : "border-rule/60 bg-field/30 opacity-75";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer shadow-2xs flex flex-col justify-between ${
        selected
          ? "ring-2 ring-ink border-ink bg-card shadow-xs"
          : "hover:border-ink/60 hover:shadow-xs"
      } ${stateBorder}`}
    >
      {/* Retry loop indicator ribbon */}
      {node.attempts.length > 1 && (
        <span className="absolute -top-2 right-2.5 flex items-center gap-0.5 rounded-full bg-hold px-2 py-0.2 text-[9px] font-mono font-bold text-bone shadow-2xs">
          <RotateCcw className="size-2.5" />
          {node.attempts.length}x
        </span>
      )}

      {/* Top Row: Icon + Label + Model + Status Dot */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`size-6 rounded-lg flex items-center justify-center shrink-0 border ${
              isDecides
                ? "bg-signal/10 border-signal/25 text-signal"
                : "bg-hold/12 border-hold/25 text-hold"
            }`}
          >
            <Icon className="size-3.5" />
          </div>
          <div className="min-w-0">
            <span className="block font-semibold text-xs leading-tight text-ink truncate group-hover:text-signal transition-colors">
              {node.label}
            </span>
            <span className="block font-mono text-[9px] text-muted-foreground truncate">
              {node.action}
              {node.durationMs > 0 ? ` · ${(node.durationMs / 1000).toFixed(1)}s` : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {node.model ? (
            <span className="rounded bg-field px-1.5 py-0.2 text-[9px] font-mono font-medium text-ink border border-rule">
              {formatShortModel(node.model)}
            </span>
          ) : null}
          <StatusDot status={node.status} />
        </div>
      </div>

      {/* Real-Time Output Box (1–2 lines below every agent header) */}
      <div
        className={`mt-2 rounded-lg border px-2 py-1.5 font-mono text-[10px] leading-snug min-h-[2.35rem] flex items-center ${
          isWorking
            ? "border-signal/30 bg-signal/5 text-signal animate-pulse"
            : isRetry && node.status === "retry"
              ? "border-hold/40 bg-hold/10 text-hold"
              : node.liveOutput
                ? "border-rule/70 bg-paper/90 text-ink"
                : "border-rule/40 bg-field/20 text-muted-foreground/60"
        }`}
      >
        <p className="line-clamp-2 break-words w-full">
          {isWorking
            ? node.liveOutput || `${copy.status.working}...`
            : node.liveOutput || "—"}
        </p>
      </div>
    </button>
  );
}

function StatusDot({ status }: { status: NodeStatus }) {
  if (status === "working") {
    return (
      <span className="relative flex size-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75" />
        <span className="relative inline-flex rounded-full size-2.5 bg-signal" />
      </span>
    );
  }
  if (status === "retry") {
    return <span className="block size-2.5 rounded-full bg-hold" />;
  }
  if (status === "done") {
    return <span className="block size-2.5 rounded-full bg-clear" />;
  }
  return <span className="block size-2 rounded-full bg-muted-foreground/30" />;
}

function StatusBadge({ status, copy }: { status: NodeStatus; copy: any }) {
  if (status === "working") {
    return (
      <Badge className="bg-signal text-bone font-mono text-[10px] gap-1 px-1.5 py-0.2">
        <LoaderCircle className="size-2.5 animate-spin" />
        {copy.status.working}
      </Badge>
    );
  }
  if (status === "retry") {
    return (
      <Badge className="bg-hold/15 text-hold border-hold/30 font-mono text-[10px] gap-1 px-1.5 py-0.2">
        <RotateCcw className="size-2.5" />
        {copy.status.retry}
      </Badge>
    );
  }
  if (status === "done") {
    return (
      <Badge className="bg-clear/15 text-clear border-clear/30 font-mono text-[10px] gap-1 px-1.5 py-0.2">
        <Check className="size-2.5" />
        {copy.status.done}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.2">
      {copy.status.idle}
    </Badge>
  );
}

function EdgeConnector({
  active,
  hasRetry,
}: {
  active: boolean;
  hasRetry?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center py-1">
      <div
        className={`h-2.5 w-0.5 rounded-full transition-colors ${
          active ? "bg-signal" : "bg-rule"
        }`}
      />
      <ArrowDown
        className={`size-3 -mt-0.5 transition-colors ${
          active ? "text-signal" : "text-rule"
        }`}
      />
      {hasRetry ? (
        <span className="absolute right-2 rounded-full border border-hold/40 bg-hold/10 px-1.5 py-0.2 font-mono text-[8px] font-semibold text-hold">
          ↺ retry
        </span>
      ) : null}
    </div>
  );
}

function TreeBranch({
  tree,
  selectedNodeId,
  onSelect,
  copy,
}: {
  tree: ExecutionTreeNode;
  selectedNodeId: ExecutionNodeId;
  onSelect: (id: ExecutionNodeId) => void;
  copy: any;
}) {
  const Icon = getNodeIcon(tree.nodeId || "host");
  const isSelected = tree.nodeId === selectedNodeId;

  return (
    <div className="space-y-1.5">
      <div
        onClick={() => tree.nodeId && onSelect(tree.nodeId)}
        className={`rounded-lg border px-3 py-2 transition-all cursor-pointer ${
          isSelected
            ? "border-ink ring-1 ring-ink/20 bg-card font-semibold"
            : "border-rule bg-card hover:border-ink/50 hover:bg-paper"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="size-3.5 text-ink shrink-0" />
            <span className="truncate text-xs text-ink">{tree.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {tree.model ? (
              <span className="rounded bg-field px-2 py-0.5 text-[10px] text-ink border border-rule">
                {tree.model}
              </span>
            ) : null}
            <StatusDot status={tree.status} />
          </div>
        </div>
        {tree.summary ? (
          <p className="mt-1 pl-5.5 text-[10px] text-muted-foreground line-clamp-1 font-normal">
            {tree.summary}
          </p>
        ) : null}
      </div>

      {tree.children && tree.children.length > 0 && (
        <div className="pl-5 border-l-2 border-rule/80 space-y-1.5 ml-3.5 my-1">
          {tree.children.map((child) => (
            <TreeBranch
              key={child.id}
              tree={child}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              copy={copy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
