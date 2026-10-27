"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  GitBranch,
  ListTree,
  LoaderCircle,
  PenLine,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Terminal,
  TrendingDown,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ChromeLang } from "@/lib/copy";
import type { RealTraceStep } from "@/lib/load-trace";

interface LiveTelemetryDrawerProps {
  lang: ChromeLang;
  running: boolean;
  elapsed: number;
  steps: RealTraceStep[];
  runMode: "sample" | "live";
  scenarioId: string;
}

const AGENT_ICONS: Record<string, typeof Cpu> = {
  planner: ListTree,
  load: Database,
  host: Cpu,
  diagnostician: Stethoscope,
  classifier: ShieldCheck,
  simulator: TrendingDown,
  scenario: GitBranch,
  judge: Scale,
  reporter: PenLine,
  approval: UserCheck,
};

const AGENT_COLORS: Record<string, string> = {
  planner: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  load: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  host: "text-slate-300 border-slate-500/30 bg-slate-500/10",
  diagnostician: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  classifier: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  simulator: "text-teal-400 border-teal-500/30 bg-teal-500/10",
  scenario: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  judge: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  reporter: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  approval: "text-signal border-signal/30 bg-signal/10",
};

export function LiveTelemetryDrawer({
  lang,
  running,
  elapsed,
  steps,
  runMode,
  scenarioId,
}: LiveTelemetryDrawerProps) {
  const [expanded, setExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event when steps arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps.length, running]);

  if (!running && steps.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-graphite text-bone shadow-md">
      {/* Header bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule/30 bg-black/40 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full ${
                running ? "bg-signal animate-ping" : "bg-emerald-400"
              }`}
            />
            <Terminal className="size-4 text-signal" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-bone">
              {lang === "es"
                ? "Consola de Pensamientos y Trazas en Streaming"
                : "Live Agent Telemetry & Thought Stream"}
            </span>
          </div>

          <Badge className="bg-signal/20 text-signal border-signal/40 font-mono text-[10px] gap-1 px-2 py-0.2">
            <Sparkles className="size-2.5" />
            {runMode === "live"
              ? "NVIDIA Nemotron · Meterless Nightshift"
              : "Deterministic Simulator · Fast Trace"}
          </Badge>

          {running ? (
            <span className="font-mono text-xs text-amber-400 flex items-center gap-1">
              <LoaderCircle className="size-3 animate-spin" />
              {elapsed.toFixed(1)}s
            </span>
          ) : (
            <span className="font-mono text-[11px] text-emerald-400">
              ✔ {lang === "es" ? "Completado" : "Completed"} ({steps.length} {lang === "es" ? "trazas" : "steps"})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-bone/60">
            scenario: <strong className="text-bone">{scenarioId}</strong>
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-bone/70 hover:bg-white/10 hover:text-bone cursor-pointer"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            <span className="text-[11px] font-mono">{expanded ? "Ocultar" : "Expandir"}</span>
          </button>
        </div>
      </header>

      {/* Terminal log entries */}
      {expanded ? (
        <div
          ref={scrollRef}
          className="max-h-64 overflow-y-auto p-3.5 font-mono text-xs space-y-2 select-text"
        >
          {steps.map((step, idx) => {
            const Icon = AGENT_ICONS[step.id] || AGENT_ICONS[step.actor] || Cpu;
            const colorClass = AGENT_COLORS[step.id] || AGENT_COLORS[step.actor] || "text-bone/80 border-rule/30 bg-white/5";
            const isRetry = step.status === "retry" || (step.retryCount ?? 0) > 0;

            return (
              <div
                key={`${step.id}-${idx}`}
                className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-black/25 p-2 transition-all"
              >
                <div
                  className={`flex size-6 shrink-0 items-center justify-center rounded border ${colorClass}`}
                >
                  <Icon className="size-3" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-bone text-xs capitalize">
                      {step.actor || step.id}
                    </span>
                    <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] uppercase tracking-wider text-bone/70">
                      action: {step.action}
                    </span>
                    {step.model ? (
                      <span className="rounded bg-signal/15 text-signal px-1.5 py-0.2 text-[9px]">
                        {step.model}
                      </span>
                    ) : null}
                    {isRetry ? (
                      <span className="flex items-center gap-0.5 rounded bg-hold/20 border border-hold/40 text-hold px-1.5 py-0.2 text-[9px] font-bold">
                        <RotateCcw className="size-2.5" />
                        Host Critic Retry
                      </span>
                    ) : null}
                    {step.durationMs ? (
                      <span className="text-[10px] text-bone/40 ml-auto">
                        {(step.durationMs / 1000).toFixed(2)}s
                      </span>
                    ) : null}
                  </div>

                  <p className="text-bone/90 text-[11px] leading-relaxed break-words">
                    {step.outputRaw || step.summary}
                  </p>

                  {step.inputSummary ? (
                    <p className="text-bone/50 text-[10px] mt-0.5 truncate">
                      ↳ input: {step.inputSummary}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}

          {running ? (
            <div className="flex items-center gap-2 rounded-lg border border-signal/30 bg-signal/5 p-2.5 text-signal">
              <LoaderCircle className="size-4 animate-spin shrink-0" />
              <span className="text-xs font-semibold">
                {lang === "es"
                  ? "Ejecutando inferencia y deliberación en tiempo real..."
                  : "Live multi-agent inference & deliberation in progress..."}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
