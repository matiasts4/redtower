"use client";

import { useEffect, useRef, useState } from "react";
import {
  Cpu,
  GitBranch,
  ListTree,
  LoaderCircle,
  PenLine,
  Scale,
  Stethoscope,
} from "lucide-react";
import { chromeCopy, type ChromeLang } from "@/lib/copy";
import { pendingRole, previewText } from "@/lib/live-feed";
import type { RealTraceStep } from "@/lib/load-trace";

const ICONS = {
  host: Cpu,
  planner: ListTree,
  diagnostician: Stethoscope,
  scenario: GitBranch,
  judge: Scale,
  reporter: PenLine,
} as const;

function roleIcon(role: string) {
  return ICONS[role as keyof typeof ICONS] ?? Cpu;
}

export function LiveRun({
  lang,
  steps,
  running,
  elapsed,
}: {
  lang: ChromeLang;
  steps: RealTraceStep[];
  running: boolean;
  elapsed: number;
}) {
  const copy = chromeCopy[lang].platform;
  const phases = copy.livePhases as Record<string, string>;
  const [open, setOpen] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const waiting = pendingRole(steps);
  const WaitIcon = roleIcon(waiting);

  useEffect(() => {
    setOpen(steps.length ? steps.length - 1 : null);
  }, [steps.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [steps.length, running]);

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-card" aria-live="polite">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <h2 className="text-sm font-medium">{copy.liveTitle}</h2>
          {running ? (
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-signal">
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              {phases[waiting] ?? phases.host}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{copy.liveNote}</p>
          )}
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {steps.length} · {running ? `${elapsed.toFixed(1)}s` : copy.done}
        </p>
      </header>

      {steps.length === 0 && !running ? (
        <p className="px-4 py-8 text-sm text-muted-foreground">{copy.liveEmpty}</p>
      ) : (
        <ol className="grid">
          {steps.map((step, index) => {
            const Icon = roleIcon(step.actor);
            const expanded = open === index;
            const retry = step.status === "retry";
            const body = step.outputRaw || step.summary;
            return (
              <li key={`${step.timestamp ?? index}-${step.action}-${index}`} className="border-b border-rule last:border-b-0">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : index)}
                  className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left ${
                    retry ? "bg-hold/10" : "hover:bg-paper"
                  }`}
                >
                  <Icon className={`mt-0.5 size-4 shrink-0 ${step.decides ? "text-signal" : "text-hold"}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{step.actor}</span>
                      <span className="font-mono text-xs text-muted-foreground">{step.action}</span>
                      {step.model ? (
                        <span className="rounded-full border border-rule px-2 py-0.5 font-mono text-[10px]">
                          {step.model === "host" ? "host" : step.model.split("/").pop()}
                        </span>
                      ) : null}
                      {retry ? (
                        <span className="rounded-full bg-hold/15 px-2 py-0.5 text-[11px] text-hold">{copy.liveRetry}</span>
                      ) : null}
                    </span>
                    {expanded ? null : (
                      <span className="mt-1 block text-sm text-muted-foreground">{previewText(body)}</span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {step.durationMs && step.durationMs > 0 ? `${(step.durationMs / 1000).toFixed(1)}s` : ""}
                  </span>
                </button>
                {expanded ? (
                  <div className="grid gap-2 px-4 pb-4 pl-11">
                    {step.inputSummary ? (
                      <p className="text-xs text-muted-foreground">{step.inputSummary}</p>
                    ) : null}
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-paper p-3 font-mono text-xs leading-relaxed text-ink">
                      {body}
                    </pre>
                    {step.targetAgent ? (
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {copy.livePasses} {step.targetAgent}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
          {running ? (
            <li className="flex items-center gap-3 px-4 py-4">
              <WaitIcon className="size-4 text-signal" aria-hidden />
              <span className="text-sm font-medium">{phases[waiting] ?? phases.host}</span>
              <LoaderCircle className="size-4 animate-spin text-signal" aria-hidden />
            </li>
          ) : null}
        </ol>
      )}
      <div ref={endRef} />
    </section>
  );
}
