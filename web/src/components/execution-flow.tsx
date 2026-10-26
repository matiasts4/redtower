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
      className="overflow-hidden rounded-2xl border border-rule bg-card shadow-xs"
      aria-label={flowCopy.title}
    >
      {/* Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-rule px-5 py-4 bg-field/40">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-semibold flex items-center gap-2 text-ink">
              <GitFork className="size-4 text-signal" />
              {flowCopy.title}
              {isReal ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-signal/15 px-3 py-0.5 font-mono text-[11px] text-signal font-semibold">
                  <Sparkles className="size-3" /> {copy.platform.realTraceBadge}
                </span>
              ) : null}
            </h2>
            {running ? (
              <Badge className="bg-signal text-bone font-mono text-[11px] animate-pulse gap-1.5 px-2.5 py-0.5">
                <LoaderCircle className="size-3.5 animate-spin" />
                {flowCopy.running} ({elapsed.toFixed(1)}s)
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{flowCopy.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {graph.totalDurationMs > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
              <Clock className="size-3.5 text-ink" />
              {(graph.totalDurationMs / 1000).toFixed(1)}s
            </span>
          ) : null}

          {/* View mode toggle */}
          <div className="inline-flex rounded-xl border border-rule bg-card p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
                viewMode === "graph"
                  ? "bg-ink text-bone font-semibold"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              <GitFork className="size-3.5" />
              {flowCopy.graphView}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
                viewMode === "tree"
                  ? "bg-ink text-bone font-semibold"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              <ListTree className="size-3.5" />
              {flowCopy.treeView}
            </button>
          </div>

          {/* Replay button */}
          <Button
            variant="outline"
            size="sm"
            onClick={triggerReplay}
            disabled={running || steps.length === 0}
            className="gap-2 text-xs font-mono cursor-pointer min-h-9 px-3.5 rounded-xl"
          >
            <Play className={`size-3.5 ${isReplaying ? "text-signal animate-spin" : ""}`} />
            {flowCopy.replay}
          </Button>
        </div>
      </header>

      {/* Full-Width Interactive Graph / Tree Canvas */}
      <div className="p-6 md:p-7 overflow-x-auto bg-[radial-gradient(#d9d1c3_1px,transparent_1px)] [background-size:18px_18px] bg-paper/40">
        {viewMode === "graph" ? (
          <div className="min-w-[980px] flex flex-col gap-6">
            {/* 4-Stage Architectural Lanes with generous spacing */}
            <div className="grid grid-cols-4 gap-6 xl:gap-7 items-stretch">
              {stages.map((stage, stageIdx) => {
                const stageNodes = stage.nodeIds
                  .map((id) => graph.nodes.find((n) => n.id === id))
                  .filter((n): n is ExecutionNode => Boolean(n));

                const nextStageFirstNode =
                  stageIdx < stages.length - 1
                    ? graph.nodes.find((n) => n.id === stages[stageIdx + 1].nodeIds[0])
                    : undefined;
                const stageBridgeActive = nextStageFirstNode && nextStageFirstNode.status !== "idle";

                return (
                  <div
                    key={stage.num}
                    className="relative flex flex-col rounded-2xl border border-rule/90 bg-card/85 backdrop-blur-[2px] p-4 xl:p-5 shadow-2xs"
                  >
                    {/* Stage Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-rule pb-3 mb-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`size-2.5 rounded-full shrink-0 ${stage.dotClass}`} />
                        <span className="font-mono text-xs font-semibold tracking-wider uppercase text-ink truncate">
                          {stage.title}
                        </span>
                      </div>
                      <span className="rounded-md bg-field px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground border border-rule">
                        S{stage.num}
                      </span>
                    </div>

                    {/* Nodes Stack inside Stage */}
                    <div className="flex flex-col flex-1 justify-between">
                      {stageNodes.map((node, nodeIdx) => {
                        const nextNode = stageNodes[nodeIdx + 1];
                        const edgeActive = nextNode ? nextNode.status !== "idle" : false;
                        const hasRetryOnNode =
                          node.status === "retry" || node.attempts.some((a) => a.status === "retry");

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
                                retryLabel={flowCopy.retryLoop}
                              />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {/* Inter-Stage Horizontal Connector Bridge */}
                    {stageIdx < stages.length - 1 ? (
                      <div
                        className="hidden lg:flex items-center justify-center absolute -right-5 xl:-right-5.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                        aria-hidden
                      >
                        <div
                          className={`flex items-center justify-center size-7 rounded-full border shadow-2xs transition-colors ${
                            stageBridgeActive
                              ? "border-signal/50 bg-card text-signal"
                              : "border-rule bg-field text-muted-foreground/60"
                          }`}
                        >
                          <ArrowRight className="size-3.5" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Topology Summary Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule bg-card px-4 py-3 text-xs font-mono text-muted-foreground shadow-2xs">
              <div className="flex flex-wrap items-center gap-5">
                <span className="flex items-center gap-2 text-ink font-medium">
                  <span className="size-2.5 rounded-full bg-clear" />
                  {flowCopy.status.done}: {graph.completedCount}/9
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-signal" />
                  Host ({flowCopy.decides})
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-hold" />
                  Nemotron ({flowCopy.explains})
                </span>
                {graph.hasRetries ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-hold/15 border border-hold/30 px-2.5 py-0.5 text-hold font-semibold">
                    <RotateCcw className="size-3" /> {flowCopy.retryLoop}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground">
                  Host: Markovian World Model · Models: NVIDIA Nemotron Super 120B / Ultra 550B / Nano 30B
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Hierarchical Tree View */
          <div className="max-w-4xl mx-auto py-1 font-mono text-xs">
            <TreeBranch
              tree={graph.tree[0]}
              selectedNodeId={selectedNodeId}
              onSelect={setSelectedNodeId}
              copy={flowCopy}
            />
          </div>
        )}
      </div>

      {/* Bottom: Expanded Node Telemetry Inspector */}
      <aside className="border-t border-rule bg-card p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr] items-start">
          {/* Inspector Column 1: Node Identity & Metadata */}
          <div className="flex flex-col gap-3.5 rounded-xl border border-rule bg-field/40 p-4">
            <div className="flex items-start justify-between gap-2 border-b border-rule pb-3">
              <div>
                <p className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
                  {flowCopy.inspectorTitle}
                </p>
                <h3 className="font-semibold text-base text-ink flex items-center gap-2 mt-0.5">
                  {selectedNode.label}
                </h3>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  action: <span className="text-ink font-medium">{selectedNode.action}</span>
                </p>
              </div>
              <StatusBadge status={selectedNode.status} copy={flowCopy} />
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="rounded-lg border border-rule bg-card p-2.5">
                <span className="text-muted-foreground block text-[10px] uppercase mb-0.5">
                  {flowCopy.authority}
                </span>
                <span
                  className={`font-semibold ${
                    selectedNode.authority === "decides" ? "text-signal" : "text-ink"
                  }`}
                >
                  {flowCopy[selectedNode.authority] || selectedNode.authority}
                </span>
              </div>
              <div className="rounded-lg border border-rule bg-card p-2.5">
                <span className="text-muted-foreground block text-[10px] uppercase mb-0.5">
                  Model
                </span>
                <span className="font-semibold text-ink">
                  {formatShortModel(selectedNode.model) || "Host"}
                </span>
              </div>
            </div>

            {selectedNode.durationMs > 0 ? (
              <div className="flex items-center justify-between rounded-lg border border-rule bg-card px-3 py-2 font-mono text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {flowCopy.totalDuration}
                </span>
                <span className="font-semibold text-ink">
                  {(selectedNode.durationMs / 1000).toFixed(2)}s
                </span>
              </div>
            ) : null}

            {/* Retries Alert if applicable */}
            {selectedNode.attempts.length > 1 ? (
              <div className="rounded-xl border border-hold/40 bg-hold/10 p-3 text-xs">
                <p className="font-semibold text-hold flex items-center gap-1.5">
                  <RotateCcw className="size-3.5" />
                  {selectedNode.attempts.length} {flowCopy.attempts} ({flowCopy.retryLoop})
                </p>
                <div className="mt-2 space-y-1.5">
                  {selectedNode.attempts.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded bg-card/80 px-2 py-1 text-[11px] font-mono border border-hold/20"
                    >
                      <span>
                        #{i + 1}: {att.status === "retry" ? flowCopy.status.retry : flowCopy.status.done}
                      </span>
                      <span>
                        {(att.durationMs || 0) > 0
                          ? `${((att.durationMs || 0) / 1000).toFixed(1)}s`
                          : "<0.1s"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Evidence cited chips */}
            {selectedNode.evidenceIds.length > 0 ? (
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1.5">
                  {flowCopy.evidenceCited}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.evidenceIds.map((ev) => (
                    <span
                      key={ev}
                      className="rounded-md border border-signal/30 bg-signal/10 px-2.5 py-1 font-mono text-xs font-semibold text-signal"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Inspector Column 2: Input Summary & Output Payload */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                {flowCopy.inputSummary}
              </p>
              <div className="rounded-xl border border-rule bg-paper p-3.5 font-mono text-xs text-ink leading-relaxed break-words min-h-[120px] max-h-48 overflow-y-auto">
                {selectedNode.activeAttempt?.inputSummary || (
                  <span className="text-muted-foreground italic">{flowCopy.inspectorEmpty}</span>
                )}
              </div>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                {flowCopy.rawOutput}
              </p>
              <div className="rounded-xl border border-rule bg-paper p-3.5 font-mono text-xs text-ink leading-relaxed break-words min-h-[120px] max-h-48 overflow-y-auto">
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
      className={`group relative w-full min-h-[112px] rounded-xl border p-4 text-left transition-all duration-150 cursor-pointer shadow-xs flex flex-col justify-between ${
        selected
          ? "ring-2 ring-ink border-ink bg-card shadow-sm -translate-y-0.5"
          : "hover:border-ink/60 hover:shadow-sm hover:-translate-y-0.5"
      } ${stateBorder}`}
    >
      {/* Retry loop indicator ribbon */}
      {node.attempts.length > 1 && (
        <span className="absolute -top-2.5 right-3 flex items-center gap-1 rounded-full bg-hold px-2.5 py-0.5 text-[10px] font-mono font-bold text-bone shadow-xs">
          <RotateCcw className="size-3" />
          {node.attempts.length}x
        </span>
      )}

      {/* Top Row: Icon + Label + Status Dot */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isDecides
                ? "bg-signal/10 border-signal/25 text-signal"
                : "bg-hold/12 border-hold/25 text-hold"
            }`}
          >
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <span className="block font-semibold text-sm leading-snug text-ink group-hover:text-signal transition-colors">
              {node.label}
            </span>
            <span
              className={`inline-block mt-0.5 font-mono text-[10px] uppercase tracking-wider ${
                isDecides ? "text-signal font-semibold" : "text-muted-foreground"
              }`}
            >
              {copy[node.authority] || node.authority}
            </span>
          </div>
        </div>
        <div className="pt-1 shrink-0">
          <StatusDot status={node.status} />
        </div>
      </div>

      {/* Bottom Row: Action & Model Badge */}
      <div className="mt-3.5 pt-2.5 border-t border-rule/70 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground">
        <span className="truncate max-w-[130px]" title={node.action}>
          {node.action}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {node.durationMs > 0 ? (
            <span className="text-[10px] text-muted-foreground">
              {(node.durationMs / 1000).toFixed(1)}s
            </span>
          ) : null}
          {node.model ? (
            <span className="rounded-md bg-field px-2 py-0.5 text-[10px] font-medium text-ink border border-rule">
              {formatShortModel(node.model)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function StatusDot({ status }: { status: NodeStatus }) {
  if (status === "working") {
    return (
      <span className="relative flex size-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75" />
        <span className="relative inline-flex rounded-full size-3 bg-signal" />
      </span>
    );
  }
  if (status === "retry") {
    return <span className="block size-3 rounded-full bg-hold ring-2 ring-hold/25" />;
  }
  if (status === "done") {
    return <span className="block size-3 rounded-full bg-clear ring-2 ring-clear/20" />;
  }
  return <span className="block size-2.5 rounded-full bg-muted-foreground/30" />;
}

function StatusBadge({ status, copy }: { status: NodeStatus; copy: any }) {
  if (status === "working") {
    return (
      <Badge className="bg-signal text-bone font-mono text-[10px] gap-1">
        <LoaderCircle className="size-3 animate-spin" />
        {copy.status.working}
      </Badge>
    );
  }
  if (status === "retry") {
    return (
      <Badge className="bg-hold/15 text-hold border-hold/30 font-mono text-[10px] gap-1">
        <RotateCcw className="size-3" />
        {copy.status.retry}
      </Badge>
    );
  }
  if (status === "done") {
    return (
      <Badge className="bg-clear/15 text-clear border-clear/30 font-mono text-[10px] gap-1">
        <Check className="size-3" />
        {copy.status.done}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
      {copy.status.idle}
    </Badge>
  );
}

function EdgeConnector({
  active,
  hasRetry,
  retryLabel,
}: {
  active: boolean;
  hasRetry?: boolean;
  retryLabel?: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center py-2 my-0.5">
      <div
        className={`h-6 w-0.5 rounded-full transition-colors ${
          active ? "bg-signal" : "bg-rule"
        }`}
      />
      <ArrowDown
        className={`size-3.5 -mt-1 transition-colors ${
          active ? "text-signal" : "text-rule"
        }`}
      />
      {hasRetry ? (
        <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-hold/40 bg-hold/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-hold">
          <RotateCcw className="size-2.5" />
          {retryLabel}
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
    <div className="space-y-2.5">
      <div
        onClick={() => tree.nodeId && onSelect(tree.nodeId)}
        className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all cursor-pointer shadow-2xs ${
          isSelected
            ? "border-ink ring-2 ring-ink/15 bg-card font-semibold"
            : "border-rule bg-card hover:border-ink/50 hover:bg-paper"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-7 rounded-lg bg-field border border-rule flex items-center justify-center shrink-0">
            <Icon className="size-4 text-ink" />
          </div>
          <span className="truncate text-sm text-ink">{tree.title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {tree.model ? (
            <span className="rounded-md bg-field px-2.5 py-1 text-[11px] text-ink border border-rule">
              {tree.model}
            </span>
          ) : null}
          <StatusDot status={tree.status} />
        </div>
      </div>

      {tree.children && tree.children.length > 0 && (
        <div className="pl-6 border-l-2 border-rule/80 space-y-2.5 ml-5 my-2">
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
