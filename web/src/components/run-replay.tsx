"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chromeCopy, type ChromeLang } from "@/lib/copy";
import { RUN_STEPS } from "@/lib/run";

export function RunReplay({ lang }: { lang: ChromeLang }) {
  const copy = chromeCopy[lang].platform;
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const active = RUN_STEPS[cursor];

  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCursor(RUN_STEPS.length - 1);
      setPlaying(false);
      return;
    }
    if (cursor >= RUN_STEPS.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setCursor((value) => value + 1), 450);
    return () => window.clearTimeout(timer);
  }, [playing, cursor]);

  function replay() {
    setCursor(0);
    setPlaying(true);
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>{copy.replay}</CardTitle>
          <p className="text-sm text-muted-foreground">{copy.replayNote}</p>
        </div>
        <Button onClick={replay}>{copy.replay}</Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {RUN_STEPS.map((step, index) => {
            const state = cursor < 0 ? "idle" : index < cursor ? "done" : index === cursor ? "working" : "idle";
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setCursor(index);
                  }}
                  className={`flex min-h-11 min-w-28 cursor-pointer flex-col items-start rounded-xl border px-4 py-2 text-left transition-colors duration-200 ${
                    state === "working"
                      ? "border-hold bg-hold text-bone"
                      : state === "done"
                        ? "border-clear bg-clear text-bone"
                        : "border-rule bg-field text-ink"
                  }`}
                >
                  <span className="text-sm font-medium">{step.actor}</span>
                  <span className="font-mono text-[11px] uppercase tracking-wider opacity-80">
                    {state === "working" ? copy.working : state === "done" ? copy.done : copy.idle}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {active ? (
          <div className="rounded-xl border border-rule bg-field px-5 py-4">
            <p className="font-mono text-xs tracking-[0.14em] uppercase text-muted-foreground">
              {active.action} · {active.decides ? copy.decides : copy.explains}
            </p>
            <p className="mt-2 text-base leading-7">{copy.steps[active.id]}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
