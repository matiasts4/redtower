"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  GitBranch,
  GitFork,
  HelpCircle,
  ListTree,
  LoaderCircle,
  Lock,
  MessageSquare,
  PenLine,
  Play,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stamp,
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

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-card shadow-xs" aria-label={flowCopy.title}>
      {/* Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3 bg-field/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-ink">
              <GitFork className="size-4 text-signal" />
              {flowCopy.title}
              {isReal ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-signal/15 px-2.5 py-0.5 font-mono text-[10px] text-signal font-semibold">
                  <Sparkles className="size-3" /> {copy.platform.realTraceBadge}
                </span>
              ) : null}
            </h2>
            {running ? (
              <Badge className="bg-signal text-bone font-mono text-[10px] animate-pulse gap-1">
                <LoaderCircle className="size-3 animate-spin" />
                {flowCopy.running} ({elapsed.toFixed(1)}s)
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{flowCopy.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {graph.totalDurationMs > 0 ? (
            <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground mr-1">
              <Clock className="size-3.5" />
              {(graph.totalDurationMs / 1000).toFixed(1)}s
            </span>
          ) : null}

          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border border-rule bg-card p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                viewMode === "graph" ? "bg-ink text-bone font-semibold" : "text-muted-foreground hover:text-ink"
              }`}
            >
              <GitFork className="size-3" />
              {flowCopy.graphView}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                viewMode === "tree" ? "bg-ink text-bone font-semibold" : "text-muted-foreground hover:text-ink"
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
            className="gap-1.5 text-xs font-mono cursor-pointer min-h-8"
          >
            <Play className={`size-3 ${isReplaying ? "text-signal animate-spin" : ""}`} />
            {flowCopy.replay}
          </Button>
        </div>
      </header>

      {/* Main Flow Canvas & Inspector */}
      <div className="grid lg:grid-cols-[1fr_22rem] divide-y lg:divide-y-0 lg:divide-x divide-rule">
        {/* Left: Interactive Canvas */}
        <div className="p-4 overflow-x-auto min-h-[420px] bg-paper/30">
          {viewMode === "graph" ? (
            <div className="min-w-[700px] flex flex-col gap-5">
              {/* Stage Columns Grid */}
              <div className="grid grid-cols-4 gap-3">
                {/* Stage 1 */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 border-b border-rule pb-1.5">
                    <span className="size-2 rounded-full bg-signal/60" />
                    <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                      {flowCopy.stages.plan}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <NodeCard
                      node={graph.nodes.find((n) => n.id === "planner")!}
                      selected={selectedNodeId === "planner"}
                      onSelect={() => setSelectedNodeId("planner")}
                      copy={flowCopy}
                    />
                    <EdgeIndicator direction="down" active={graph.nodes.find((n) => n.id === "load")?.status !== "idle"} />
                    <NodeCard
                      node={graph.nodes.find((n) => n.id === "load")!}
                      selected={selectedNodeId === "load"}
                      onSelect={() => setSelectedNodeId("load")}
                      copy={flowCopy}
                    />
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 border-b border-rule pb-1.5">
                    <span className="size-2 rounded-full bg-hold/60" />
                    <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                      {flowCopy.stages.diagnose}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <NodeCard
                      node={graph.nodes.find((n) => n.id === "diagnostician")!}
                      selected={selectedNodeId === "diagnostician"}
                      onSelect={() => setSelectedNodeId("diagnostician")}
                      copy={flowCopy}
                    />
                    <EdgeIndicator direction="down" active={graph.nodes.find((n) => n.id === "classifier")?.status !== "idle"} />
                    <NodeCard
                      node={graph.nodes.find((n) => n.id === "classifier")!}
                      selected={selectedNodeId === "classifier"}
                      onSelect={() => setSelectedNodeId("classifier")}
                      copy={flowCopy}
                    />
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 border-b border-rule pb-1.5">
                    <span className="size-2 rounded-full bg-clear/60" />
                    <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                      {flowCopy.stages.simulate}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <NodeCard
                      node={graph.nodes.find((n) => n.id === "simulator")!}
                      selected={selectedNodeId === "simulator"}
                      onSelect={() => setSelectedNodeId("simulator")}
                      copy={flowCopy}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <NodeCard
                        compact
                        node={graph.nodes.find((n) => n.id === "scenario")!}
                        selected={selectedNodeId === "scenario"}
                        onSelect={() => setSelectedNodeId("scenario")}
                        copy={flowCopy}
                      />
                      <NodeCard
                        compact
                        node={graph.nodes.find((n) => n.id === "judge")!}
                        selected={selectedNodeId === "judge"}
                        onSelect={() => setSelectedNodeId("judge")}
                        copy={flowCopy}
                      />
                    </div>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 border-b border-rule pb-1.5">
                    <span className="size-2 rounded-full bg-ink/60" />
                    <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                      {flowCopy.stages.synthesize}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <NodeCard
                      node={graph.nodes.find((n) => n.id === "reporter")!}
                      selected={selectedNodeId === "reporter"}
                      onSelect={() => setSelectedNodeId("reporter")}
                      copy={flowCopy}
                    />
                    <EdgeIndicator direction="down" active={graph.nodes.find((n) => n.id === "approval")?.status !== "idle"} />
                    <NodeCard
                      node={graph.nodes.find((n) => n.id === "approval")!}
                      selected={selectedNodeId === "approval"}
                      onSelect={() => setSelectedNodeId("approval")}
                      copy={flowCopy}
                    />
                  </div>
                </div>
              </div>

              {/* Topology Summary Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rule bg-card px-3 py-2 text-xs font-mono text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-clear" /> {flowCopy.status.done}: {graph.completedCount}/9
                  </span>
                  {graph.hasRetries ? (
                    <span className="flex items-center gap-1.5 text-hold font-semibold">
                      <RotateCcw className="size-3" /> {flowCopy.retryLoop}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    Host: Markovian World Model · Models: NVIDIA Nemotron Super/Ultra/Nano
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Hierarchical Tree View */
            <div className="space-y-3 font-mono text-xs">
              <TreeBranch tree={graph.tree[0]} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} copy={flowCopy} />
            </div>
          )}
        </div>

        {/* Right: Agent Node Telemetry Inspector */}
        <aside className="p-4 flex flex-col gap-3 bg-card/60">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <div>
              <p className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">{flowCopy.inspectorTitle}</p>
              <h3 className="font-semibold text-sm text-ink flex items-center gap-1.5 mt-0.5">
                {selectedNode.label}
              </h3>
            </div>
            <StatusBadge status={selectedNode.status} copy={flowCopy} />
          </div>

          <div className="space-y-3 text-xs">
            {/* Meta tags */}
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="rounded border border-rule bg-field p-2">
                <span className="text-muted-foreground block text-[10px] uppercase">{flowCopy.authority}</span>
                <span className={`font-semibold ${selectedNode.authority === "decides" ? "text-signal" : "text-ink"}`}>
                  {flowCopy[selectedNode.authority] || selectedNode.authority}
                </span>
              </div>
              <div className="rounded border border-rule bg-field p-2">
                <span className="text-muted-foreground block text-[10px] uppercase">Model</span>
                <span className="font-semibold text-ink">
                  {formatShortModel(selectedNode.model) || "Host"}
                </span>
              </div>
            </div>

            {/* Duration */}
            {selectedNode.durationMs > 0 ? (
              <p className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                {flowCopy.totalDuration}: {(selectedNode.durationMs / 1000).toFixed(2)}s
              </p>
            ) : null}

            {/* Retries Alert if applicable */}
            {selectedNode.attempts.length > 1 ? (
              <div className="rounded-lg border border-hold/30 bg-hold/10 p-2.5 text-[11px]">
                <p className="font-semibold text-hold flex items-center gap-1.5">
                  <RotateCcw className="size-3.5" />
                  {selectedNode.attempts.length} {flowCopy.attempts} ({flowCopy.retryLoop})
                </p>
                <div className="mt-1.5 space-y-1">
                  {selectedNode.attempts.map((att, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span>Intento #{i + 1}: {att.status === "retry" ? "Rechazado" : "Aceptado"}</span>
                      <span className="font-mono">{(att.durationMs || 0) > 0 ? `${((att.durationMs || 0) / 1000).toFixed(1)}s` : "<0.1s"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Evidence cited chips */}
            {selectedNode.evidenceIds.length > 0 ? (
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1.5">{flowCopy.evidenceCited}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.evidenceIds.map((ev) => (
                    <span key={ev} className="rounded-md border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-signal">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Input Summary */}
            {selectedNode.activeAttempt?.inputSummary ? (
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">{flowCopy.inputSummary}</p>
                <div className="rounded-md border border-rule bg-paper p-2 font-mono text-[11px] text-ink leading-relaxed break-words max-h-28 overflow-y-auto">
                  {selectedNode.activeAttempt.inputSummary}
                </div>
              </div>
            ) : null}

            {/* Output Raw */}
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">{flowCopy.rawOutput}</p>
              <div className="rounded-md border border-rule bg-paper p-2.5 font-mono text-[11px] text-ink leading-relaxed break-words max-h-48 overflow-y-auto">
                {selectedNode.activeAttempt?.outputRaw || selectedNode.lastStep?.summary || (
                  <span className="text-muted-foreground italic">{flowCopy.inspectorEmpty}</span>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function NodeCard({
  node,
  selected,
  compact = false,
  onSelect,
  copy,
}: {
  node: ExecutionNode;
  selected: boolean;
  compact?: boolean;
  onSelect: () => void;
  copy: any;
}) {
  const Icon = getNodeIcon(node.id);
  const isWorking = node.status === "working";
  const isRetry = node.status === "retry" || node.attempts.some((a) => a.status === "retry");
  const isDone = node.status === "done";

  const stateBorder = isWorking
    ? "border-signal ring-2 ring-signal/30"
    : isRetry
      ? "border-hold/80 bg-hold/5"
      : isDone
        ? "border-rule bg-card"
        : "border-rule/50 bg-field/30 opacity-70";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full rounded-xl border p-2.5 text-left transition-all cursor-pointer shadow-xs ${
        selected ? "ring-2 ring-ink bg-card" : "hover:border-ink/50"
      } ${stateBorder}`}
    >
      {/* Retry loop indicator ribbon */}
      {node.attempts.length > 1 && (
        <span className="absolute -top-2 -right-1 flex items-center gap-0.5 rounded-full bg-hold px-1.5 py-0.2 text-[9px] font-mono font-bold text-bone shadow-xs">
          <RotateCcw className="size-2.5" />
          {node.attempts.length}x
        </span>
      )}

      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className={`size-4 shrink-0 ${node.authority === "decides" ? "text-signal" : "text-hold"}`} />
          <span className="font-semibold text-xs truncate text-ink">{node.label}</span>
        </div>
        <StatusDot status={node.status} />
      </div>

      {!compact ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-muted-foreground">
          <span className="truncate">({node.action})</span>
          {node.model ? (
            <span className="rounded bg-field px-1.5 py-0.2 text-[9px] border border-rule">
              {formatShortModel(node.model)}
            </span>
          ) : null}
        </div>
      ) : null}
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
    return <span className="size-2.5 rounded-full bg-hold" />;
  }
  if (status === "done") {
    return <span className="size-2.5 rounded-full bg-clear" />;
  }
  return <span className="size-2 rounded-full bg-muted-foreground/30" />;
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

function EdgeIndicator({ direction, active }: { direction: "down" | "right"; active: boolean }) {
  return (
    <div className="flex justify-center items-center py-0.5">
      <div
        className={`h-3 w-0.5 rounded-full transition-colors ${
          active ? "bg-signal animate-pulse" : "bg-rule"
        }`}
      />
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
    <div className="space-y-1">
      <div
        onClick={() => tree.nodeId && onSelect(tree.nodeId)}
        className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors cursor-pointer ${
          isSelected ? "border-ink bg-field font-semibold" : "border-rule bg-card hover:bg-paper"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{tree.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tree.model ? (
            <span className="rounded bg-field px-1.5 py-0.5 text-[10px] text-muted-foreground border border-rule">
              {tree.model}
            </span>
          ) : null}
          <StatusDot status={tree.status} />
        </div>
      </div>

      {tree.children && tree.children.length > 0 && (
        <div className="pl-4 border-l border-rule/70 space-y-1.5 ml-3 my-1">
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
