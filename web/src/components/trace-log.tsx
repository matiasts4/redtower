"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Circle,
  Cpu,
  GitBranch,
  ListTree,
  LoaderCircle,
  MessageSquare,
  PenLine,
  Scale,
  Stamp,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { chromeCopy, type ChromeLang } from "@/lib/copy";
import type { StepView } from "@/lib/replay";

export type TraceState = "idle" | "working" | "done";

export function TraceRow({
  index,
  actor,
  action,
  summary,
  authority,
  decides,
  state,
  stateLabel,
  selected,
  onSelect,
}: {
  index: number;
  actor: string;
  action: string;
  summary: string;
  authority: string;
  decides: boolean;
  state: TraceState;
  stateLabel: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const Actor = actorIcon[actor] ?? Cpu;
  const StateIcon = state === "working" ? LoaderCircle : state === "done" ? Check : Circle;
  const stateTone =
    state === "working"
      ? "bg-hold/15 text-hold"
      : state === "done"
        ? "bg-clear/15 text-clear"
        : "bg-field text-muted-foreground";
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`grid min-h-11 w-full cursor-pointer grid-cols-[2.25rem_1fr_auto] items-center gap-3 border-b border-rule px-3 py-2 text-left transition-colors duration-200 last:border-b-0 ${
          selected ? "bg-field" : "bg-card hover:bg-paper"
        } ${state === "working" ? "shadow-[inset_3px_0_0_0_#8A5A12]" : state === "done" ? "shadow-[inset_3px_0_0_0_#2F5D45]" : ""}`}
      >
        <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm">
            <Actor className={`size-4 shrink-0 ${decides ? "text-signal" : "text-hold"}`} aria-hidden />
            <span className="truncate">{actor}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">{action}</span>
          </span>
          <span className="mt-0.5 block truncate pl-6 font-mono text-[11px] text-muted-foreground">{summary}</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${stateTone}`}>
            <StateIcon className={`size-3.5 ${state === "working" ? "motion-safe:animate-spin" : ""}`} aria-hidden />
            {stateLabel}
          </span>
          <span className={`inline-flex items-center gap-1 font-mono text-[11px] tracking-wide uppercase ${decides ? "text-signal" : "text-muted-foreground"}`}>
            {decides ? <Stamp className="size-3" aria-hidden /> : <MessageSquare className="size-3" aria-hidden />}
            {authority}
          </span>
        </span>
      </button>
    </li>
  );
}

const actorIcon: Record<string, typeof Cpu> = {
  host: Cpu,
  planner: ListTree,
  diagnostician: Stethoscope,
  scenario: GitBranch,
  judge: Scale,
  reporter: PenLine,
};

export function TraceLog({ lang, views, fileId }: { lang: ChromeLang; views: StepView[]; fileId: string }) {
  const copy = chromeCopy[lang].platform;
  const [cursor, setCursor] = useState(views.length);
  const [selected, setSelected] = useState(2);
  const [playing, setPlaying] = useState(false);
  const filePane = useRef<HTMLDivElement>(null);
  const active = views[selected] ?? views[0];

  useEffect(() => {
    setPlaying(false);
    setCursor(views.length);
    setSelected(Math.max(0, views.findIndex((view) => view.id === "rank")));
  }, [fileId, views]);

  useEffect(() => {
    filePane.current?.scrollTo({ top: 0 });
  }, [selected, fileId]);

  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCursor(views.length);
      setSelected(views.length - 1);
      setPlaying(false);
      return;
    }
    if (cursor >= views.length) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setCursor((value) => {
        const next = value + 1;
        setSelected(Math.min(next, views.length - 1));
        return next;
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [playing, cursor, views.length]);

  function rowState(index: number): TraceState {
    if (cursor >= views.length) return "done";
    if (index < cursor) return "done";
    if (index === cursor) return "working";
    return "idle";
  }

  function replay() {
    setSelected(0);
    setCursor(0);
    setPlaying(true);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <h2 className="text-sm font-medium">{copy.recordedRun}</h2>
          <p className="text-sm text-muted-foreground">{copy.recordedRunNote}</p>
        </div>
        <Button onClick={replay}>{copy.replay}</Button>
      </header>
      <div className="grid h-[32rem] grid-rows-[14rem_minmax(0,1fr)] lg:h-[30rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:grid-rows-1">
        <ol className="min-h-0 overflow-y-auto border-b border-rule lg:border-r lg:border-b-0">
          {views.map((view, index) => {
            const state = rowState(index);
            return (
              <TraceRow
                key={view.id}
                index={index}
                actor={view.actor}
                action={view.action}
                summary={view.summary}
                authority={view.decides ? copy.decides : copy.explains}
                decides={view.decides}
                state={state}
                stateLabel={state === "working" ? copy.working : state === "done" ? copy.done : copy.idle}
                selected={index === selected}
                onSelect={() => {
                  setPlaying(false);
                  setSelected(index);
                }}
              />
            );
          })}
        </ol>
        {active ? (
          <div className="flex min-h-0 flex-col bg-field/70">
            <div className="shrink-0 border-b border-rule px-4 py-3">
              <p className="font-mono text-xs tracking-[0.14em] uppercase text-muted-foreground">
                {active.actor} · {active.action} · {active.decides ? copy.decides : copy.explains}
              </p>
              <p className="mt-2 text-sm leading-6">{copy.steps[active.id]}</p>
            </div>
            <div ref={filePane} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <p className="text-xs tracking-[0.14em] uppercase text-muted-foreground">{copy.inspect}</p>
              <ul className="mt-2 overflow-hidden rounded-md border border-rule bg-card">
                {active.lines.map((line, index) => (
                  <li key={`${active.id}-${index}`} className="border-b border-rule px-3 py-2 font-mono text-sm leading-6 break-words last:border-b-0">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
