"use client";

import { useState } from "react";
import { ApprovalCard, DamageComparison, RankTable, SentenceBlock, SignalLane, StatusMark } from "@/components/ops";
import { SourceItem } from "@/components/source-rack";
import { TraceRow, type TraceState } from "@/components/trace-log";
import { ExecutionFlow } from "@/components/execution-flow";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { chromeCopy } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";
import { SOURCES } from "@/lib/sources";
import type { RealTraceStep } from "@/lib/load-trace";

const blockRows = [
  { action: "wait", passenger_minutes: 2400, cost: "low", risk: "high" },
  { action: "divert_210", passenger_minutes: 1560, cost: "medium", risk: "medium" },
  { action: "dispatch_relief", passenger_minutes: 1716, cost: "high", risk: "medium" },
  { action: "relief_and_divert_210", passenger_minutes: 1488, cost: "high", risk: "medium" },
];

const traceSamples: Array<{ actor: string; action: string; summary: string; authority: "decides" | "explains"; state: TraceState }> = [
  { actor: "host", action: "load_sources", summary: "11 sources", authority: "decides", state: "done" },
  { actor: "host", action: "rank_alternatives", summary: "relief_and_divert_210 1488", authority: "decides", state: "working" },
  { actor: "reporter", action: "explain", summary: "REP_BLK_1", authority: "explains", state: "idle" },
];

const sampleExecutionSteps: RealTraceStep[] = [
  {
    id: "planner" as any,
    actor: "planner",
    action: "select_queries",
    decides: false,
    summary: "Selected 11 named queries from catalog",
    lines: [],
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    durationMs: 1200,
    inputSummary: "Scenario scn-block. Query catalog size: 11.",
    outputRaw: '{"queries": ["positions", "reports", "cameras", "road_events", "demand"]}',
    status: "ok",
    isReal: true,
  },
  {
    id: "load" as any,
    actor: "host",
    action: "load_sources",
    decides: true,
    summary: "ZetarisSource: reports=3, cameras=1, positions=12",
    lines: [],
    model: "host",
    durationMs: 450,
    inputSummary: "Named queries: positions, reports, cameras, road_events, demand",
    outputRaw: "Zetaris REST API execution successful across 11 tables",
    status: "ok",
    isReal: true,
  },
  {
    id: "diagnostician" as any,
    actor: "diagnostician",
    action: "diagnostician",
    decides: false,
    summary: "Proposed road_block based on sensor rows (untrusted report isolated)",
    lines: [],
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    durationMs: 1400,
    inputSummary: "Row summary and untrusted reports block",
    outputRaw: '{"status": "real", "incident_type": "road_block", "evidence_ids": ["REP_BLK_1"]}',
    status: "ok",
    isReal: true,
  },
  {
    id: "rank" as any,
    actor: "host",
    action: "rank_alternatives",
    decides: true,
    summary: "relief_and_divert_210: 1488 vs 2400 passenger-minutes (38% reduction)",
    lines: [],
    model: "host",
    durationMs: 100,
    inputSummary: "Queue simulation at horizon 20 min across 4 action curves",
    outputRaw: "Winner: relief_and_divert_210, 1488 passenger-minutes",
    status: "ok",
    isReal: true,
  },
  {
    id: "reporter" as any,
    actor: "reporter",
    action: "explain",
    decides: false,
    summary: "Draft #1 rejected (lacks evidence citation)",
    lines: [],
    model: "nvidia/nemotron-3.5-lightning-30b-a3b",
    durationMs: 1800,
    inputSummary: "Operator sentence explanation",
    outputRaw: "Recomendamos enviar un refuerzo y desviar el 210.",
    status: "retry",
    isReal: true,
  },
  {
    id: "reporter" as any,
    actor: "reporter",
    action: "explain",
    decides: false,
    summary: "Draft #2 accepted with REP_BLK_1 and 38%",
    lines: [],
    model: "nvidia/nemotron-3.5-lightning-30b-a3b",
    durationMs: 2100,
    inputSummary: "Operator sentence with citations",
    outputRaw: "Con la evidencia REP_BLK_1, la opción recomendada reduce 1488 minutos-pasajero en 20 minutos (38% vs esperar).",
    status: "ok",
    isReal: true,
  },
];

export function SystemSpecimens() {
  const { lang } = useLanguage();
  const copy = chromeCopy[lang];
  const [picked, setPicked] = useState(1);
  const reports = SOURCES.find((source) => source.query === "reports");
  const weather = SOURCES.find((source) => source.query === "weather");

  return (
    <section className="grid gap-6">
      <div>
        <h2 className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
          {copy.componentsPage.specimens}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.componentsPage.specimensBody}</p>
      </div>

      <div className="grid gap-3">
        <h3 className="text-sm font-medium">{copy.executionFlow.title}</h3>
        <ExecutionFlow
          lang={lang}
          steps={sampleExecutionSteps}
          running={false}
          elapsed={0}
          isReal={true}
        />
      </div>

      <div className="grid gap-3">
        <h3 className="text-sm font-medium">{copy.status.label}</h3>
        <div className="flex flex-wrap gap-2">
          <StatusMark status="real" />
          <StatusMark status="insufficient" />
          <StatusMark status="clear" />
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-rule bg-card p-4">
        <SentenceBlock
          label={copy.sentence.label}
          note={copy.sentence.note}
          text="El incidente probablemente es real. Afecta a cuatro recorridos, nueve paraderos y aproximadamente 1.800 pasajeros durante los próximos 20 minutos."
          tone="signal"
        />
        <SentenceBlock
          label={copy.recommendation.label}
          text="Enviar un bus de refuerzo y desviar temporalmente el recorrido 210. Esta opción reduce el impacto estimado en 38% frente a esperar."
          tone="clear"
        />
      </div>

      <DamageComparison
        unit={copy.metric.minutes}
        versus={copy.recommendation.versus}
        waitLabel={copy.platform.waitDamage}
        choiceLabel={copy.recommendation.label}
        savedLabel={copy.platform.saved}
        reductionLabel={copy.platform.reduction}
        wait={2400}
        choice={1488}
        saved={912}
        reduction={38}
        format={(value) => value.toLocaleString(lang === "es" ? "es-CL" : "en-US")}
      />

      <div className="grid gap-2">
        <h3 className="text-sm font-medium">{copy.actions.label}</h3>
        <RankTable
          rows={blockRows}
          winner="relief_and_divert_210"
          labels={{
            action: copy.actions.name,
            cost: copy.platform.cost,
            risk: copy.platform.risk,
            minutes: copy.metric.minutes,
            winner: copy.actions.winner,
          }}
          format={(value) => value.toLocaleString(lang === "es" ? "es-CL" : "en-US")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ApprovalCard
          title={copy.approval.label}
          authorization="pending_human"
          body={copy.approval.pending}
          decisionLabel={copy.approval.decision}
          decision={copy.approval.none}
          appliedLabel={copy.approval.applied}
          limits={["The system does not change routes."]}
          control={
            <div className="flex items-center justify-between gap-3">
              <Label>{copy.platform.applyOff}</Label>
              <Switch checked={false} disabled aria-label={copy.platform.applyOff} />
            </div>
          }
        />
        <ApprovalCard
          title={copy.approval.label}
          authorization="recorded"
          body={copy.approval.recorded}
          decisionLabel={copy.approval.decision}
          decision="approve"
          appliedLabel={copy.approval.applied}
          limits={["Recommendations require human approval before any operational change."]}
          control={
            <Button variant="outline" className="w-full" disabled>
              {copy.platform.applyOff}
            </Button>
          }
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-rule bg-card">
        <header className="border-b border-rule px-4 py-3">
          <h3 className="text-sm font-medium">{copy.platform.series}</h3>
        </header>
        <SignalLane kind="report" label={copy.platform.report} ids={["REP_BLK_1", "REP_BLK_2", "REP_BLK_3"]} empty={copy.platform.notCited} />
        <SignalLane kind="vehicle" label={copy.platform.vehicle} ids={["BUS_210_02"]} empty={copy.platform.notCited} />
        <SignalLane kind="camera" label={copy.platform.camera} ids={[]} empty={copy.platform.notCited} />
        <SignalLane kind="road" label={copy.platform.road} ids={["RD_AV023"]} empty={copy.platform.notCited} />
      </div>

      <div className="overflow-hidden rounded-xl border border-rule bg-card">
        <header className="border-b border-rule px-4 py-3">
          <h3 className="text-sm font-medium">{copy.platform.recordedRun}</h3>
        </header>
        <ol>
          {traceSamples.map((sample, index) => (
            <TraceRow
              key={sample.action}
              index={index}
              actor={sample.actor}
              action={sample.action}
              summary={sample.summary}
              authority={sample.authority === "decides" ? copy.platform.decides : copy.platform.explains}
              decides={sample.authority === "decides"}
              state={sample.state}
              stateLabel={
                sample.state === "working" ? copy.platform.working : sample.state === "done" ? copy.platform.done : copy.platform.idle
              }
              selected={picked === index}
              onSelect={() => setPicked(index)}
            />
          ))}
        </ol>
      </div>

      <div className="grid overflow-hidden rounded-xl border border-rule bg-card lg:grid-cols-2">
        {reports ? (
          <SourceItem
            source={reports}
            count={3}
            classifies={copy.platform.classifies}
            loaded={copy.platform.loaded}
            selected
            onSelect={() => undefined}
          />
        ) : null}
        {weather ? (
          <SourceItem
            source={weather}
            count={1}
            classifies={copy.platform.classifies}
            loaded={copy.platform.loaded}
            selected={false}
            onSelect={() => undefined}
          />
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-3 rounded-xl border border-rule bg-card p-4">
          <Label htmlFor="specimen-search">{copy.platform.search}</Label>
          <Input id="specimen-search" placeholder="scn-block" />
          <Input disabled value="applied false" aria-label={copy.approval.applied} />
          <div className="flex items-center gap-3">
            <Checkbox defaultChecked id="specimen-on" />
            <Label htmlFor="specimen-on">{copy.platform.classifies}</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="specimen-off" />
            <Label htmlFor="specimen-off">{copy.platform.loaded}</Label>
          </div>
          <div className="flex items-center justify-between">
            <Label>{copy.platform.working}</Label>
            <Switch defaultChecked aria-label={copy.platform.working} />
          </div>
          <div className="flex items-center justify-between">
            <Label>{copy.platform.idle}</Label>
            <Switch defaultChecked={false} aria-label={copy.platform.idle} />
          </div>
        </div>
        <div className="grid content-start gap-3 rounded-xl border border-rule bg-card p-4">
          <p className="text-sm">{copy.platform.reduction}</p>
          <Progress value={0} aria-label="0" />
          <Progress value={38} aria-label="38" />
          <Progress value={100} aria-label="100" />
          <Collapsible>
            <CollapsibleTrigger className="flex min-h-11 w-full cursor-pointer items-center rounded-md border border-rule px-3 text-left text-sm">
              {copy.limits.label}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pt-3 text-sm leading-6 text-muted-foreground">
              The system does not change routes.
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </section>
  );
}
