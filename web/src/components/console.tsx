"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bus, Gauge, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TraceLog } from "@/components/trace-log";
import { SourceRack } from "@/components/source-rack";
import { ApprovalCard, DamageComparison, Instrument, RankTable, SentenceBlock, SignalLane, StatusMark, statusDot } from "@/components/ops";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { chromeCopy } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";
import { runViews } from "@/lib/replay";
import type { ScenarioFile, ScenarioId } from "@/lib/scenarios";
import { SOURCES, rowsFor, type SourceRow } from "@/lib/sources";
import { groupEvidence, type SignalKind } from "@/lib/signals";

function count(value: number, lang: "en" | "es") {
  return new Intl.NumberFormat(lang === "es" ? "es-CL" : "en-US").format(value);
}

export function Console({
  scenarios,
  tables,
}: {
  scenarios: ScenarioFile[];
  tables: Record<string, SourceRow[]>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("file");
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [fileId, setFileId] = useState<ScenarioId>(
    scenarios.some((item) => item.file_id === initial) ? (initial as ScenarioId) : scenarios[0].file_id,
  );
  const copy = chromeCopy[lang];
  const visible = useMemo(
    () => scenarios.filter((item) => item.file_id.includes(query.trim().toLowerCase())),
    [scenarios, query],
  );
  const scenario = scenarios.find((item) => item.file_id === fileId) ?? scenarios[0];
  const signals = groupEvidence(scenario.evidence_ids);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        SOURCES.map((source) => [source.query, rowsFor(tables, source.query, scenario.scenario_id).length]),
      ),
    [tables, scenario.scenario_id],
  );
  const views = useMemo(() => runViews(scenario, counts), [scenario, counts]);

  function select(next: ScenarioId) {
    setFileId(next);
    router.replace(`/system?file=${next}`, { scroll: false });
  }

  return (
    <div className="min-h-full bg-paper">
      <SiteHeader surface="work" />
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] uppercase text-signal">{copy.masthead.reading}</p>
            <h1 className="mt-2 font-mono text-3xl leading-none">{scenario.file_id}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy.gallery.scenario} {scenario.scenario_id}
            </p>
          </div>
          <div className="max-w-sm text-right">
            <p className="text-xs tracking-[0.14em] uppercase text-muted-foreground">{copy.platform.modelId}</p>
            <p className="mt-1 font-mono text-sm break-all">{scenario.model}</p>
            <p className="mt-2 text-sm text-muted-foreground">{copy.platform.fileNote}</p>
          </div>
        </header>

        <div className="grid gap-3">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute top-3.5 left-4 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.platform.search}
              className="pl-10"
              aria-label={copy.platform.search}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visible.map((item) => {
              const active = item.file_id === scenario.file_id;
              return (
                <button
                  key={item.file_id}
                  type="button"
                  onClick={() => select(item.file_id)}
                  aria-pressed={active}
                  className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-200 ${
                    active ? "border-ink bg-ink text-bone" : "border-rule bg-card text-ink hover:bg-field"
                  }`}
                >
                  <span className={`size-2.5 rounded-full ${statusDot[item.incident.status]}`} aria-hidden />
                  <span className="font-mono text-xs">{item.file_id}</span>
                  <span className={`text-xs ${active ? "text-bone" : item.incident.status === "real" ? "text-signal" : item.incident.status === "clear" ? "text-clear" : "text-hold"}`}>
                    {item.incident.status}
                  </span>
                </button>
              );
            })}
          </div>
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.platform.empty}</p>
          ) : null}
        </div>

        <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-4">
            <section className="grid gap-4 rounded-xl border border-rule bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusMark status={scenario.incident.status} />
                <span className="rounded-full border border-rule px-3 py-1 font-mono text-sm">
                  {scenario.incident.incident_type}
                </span>
                {scenario.impact.routes.map((route) => (
                  <span key={route} className="inline-flex items-center gap-1 rounded-full bg-hold/15 px-3 py-1 font-mono text-sm text-hold">
                    <Bus className="size-3.5" aria-hidden />
                    {route}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 rounded-full bg-clear/10 px-3 py-1 font-mono text-sm text-clear">
                  <Gauge className="size-3.5" aria-hidden />
                  {scenario.incident.confidence}
                </span>
              </div>
              <SentenceBlock
                label={copy.sentence.label}
                note={copy.sentence.note}
                text={scenario.diagnosis}
                tone="signal"
              />
              <SentenceBlock label={copy.recommendation.label} text={scenario.recommendation.text} tone="clear" />
              <DamageComparison
                unit={copy.metric.minutes}
                versus={copy.recommendation.versus}
                waitLabel={copy.platform.waitDamage}
                choiceLabel={copy.recommendation.label}
                savedLabel={copy.platform.saved}
                reductionLabel={copy.platform.reduction}
                wait={scenario.recommendation.baseline_passenger_minutes}
                choice={scenario.recommendation.passenger_minutes}
                saved={scenario.recommendation.saved}
                reduction={scenario.recommendation.reduction_percent}
                format={(value) => count(value, lang)}
              />
              <p className="font-mono text-xs text-muted-foreground">
                {copy.metric.routes} {scenario.impact.routes.length} · {copy.metric.stops} {scenario.impact.stop_count} · {copy.metric.passengers} {count(scenario.impact.passengers_20, lang)}
              </p>
            </section>
            <section className="grid gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                <h2 className="text-sm font-medium">{copy.actions.label}</h2>
                <p className="text-xs text-muted-foreground">{copy.actions.note}</p>
              </div>
              <RankTable
                rows={scenario.alternatives}
                winner={scenario.recommendation.recommended_action}
                labels={{
                  action: copy.actions.name,
                  cost: copy.platform.cost,
                  risk: copy.platform.risk,
                  minutes: copy.metric.minutes,
                  winner: copy.actions.winner,
                }}
                format={(value) => count(value, lang)}
              />
            </section>
          </div>

          <div className="grid content-start gap-4">
            <ApprovalCard
              title={copy.approval.label}
              authorization={scenario.authorization}
              body={scenario.authorization === "recorded" ? copy.approval.recorded : copy.approval.pending}
              decisionLabel={copy.approval.decision}
              decision={scenario.operator_decision ?? copy.approval.none}
              appliedLabel={copy.approval.applied}
              limits={scenario.limitations}
              control={
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="apply-lock">{copy.platform.applyOff}</Label>
                    <Switch id="apply-lock" checked={false} disabled aria-label={copy.platform.applyOff} />
                  </div>
                  <Dialog>
                    <DialogTrigger render={<Button variant="outline" className="w-full" />}>
                      {copy.platform.whyOff}
                    </DialogTrigger>
                    <DialogContent className="rounded-xl">
                      <DialogHeader>
                        <DialogTitle>{copy.platform.dialogTitle}</DialogTitle>
                        <DialogDescription>{copy.platform.dialogBody}</DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
              }
            />
            <section className="grid gap-2">
              <h2 className="px-1 text-sm font-medium">{copy.platform.rates}</h2>
              <div className="grid grid-cols-2 gap-2">
                <Instrument label={copy.platform.waiting} value={String(scenario.impact.waiting)} mark="waiting" tone="hold" />
                <Instrument label={copy.platform.arrival} value={String(scenario.impact.arrival_per_min)} mark="arrival" tone="signal" />
                <Instrument label={copy.platform.board} value={String(scenario.impact.board_per_min)} mark="board" tone="clear" />
                <Instrument label={copy.platform.moving} value={String(scenario.impact.moving_buses)} mark="moving" tone="hold" />
              </div>
            </section>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-rule bg-card">
          <header className="border-b border-rule px-4 py-3">
            <h2 className="text-sm font-medium">{copy.platform.series}</h2>
            <p className="text-sm text-muted-foreground">{copy.platform.seriesNote}</p>
          </header>
          {( ["report", "vehicle", "camera", "road"] as SignalKind[]).map((kind) => (
            <SignalLane key={kind} kind={kind} label={copy.platform[kind]} ids={signals[kind]} empty={copy.platform.notCited} />
          ))}
        </section>

        <TraceLog lang={lang} views={views} fileId={scenario.file_id} />
        <SourceRack lang={lang} scenarioId={scenario.scenario_id} tables={tables} />
      </main>
      <SiteFooter surface="work" />
    </div>
  );
}
