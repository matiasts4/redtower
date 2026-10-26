"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bus,
  Gauge,
  Search,
  Sparkles,
  Database,
  Play,
  LoaderCircle,
  CheckCircle2,
  Lock,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ExecutionFlow } from "@/components/execution-flow";
import { SourceRack } from "@/components/source-rack";
import { CorridorMap } from "@/components/corridor-map";
import { QueueChart } from "@/components/queue-chart";
import {
  ApprovalCard,
  DamageComparison,
  Instrument,
  RankTable,
  SentenceBlock,
  SignalLane,
  StatusMark,
  statusDot,
} from "@/components/ops";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { RealTraceStep } from "@/lib/load-trace";
import type { ScenarioFile, ScenarioId } from "@/lib/scenarios";
import { SOURCES, rowsFor, type SourceRow } from "@/lib/sources";
import { groupEvidence, type SignalKind } from "@/lib/signals";

function count(value: number, lang: "en" | "es") {
  return new Intl.NumberFormat(lang === "es" ? "es-CL" : "en-US").format(value);
}

export function Console({
  scenarios,
  tables,
  traces,
}: {
  scenarios: ScenarioFile[];
  tables: Record<string, SourceRow[]>;
  traces?: Record<string, RealTraceStep[]>;
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

  // Current scenario, with potential live override
  const baseScenario = scenarios.find((item) => item.file_id === fileId) ?? scenarios[0];
  const [liveScenarioOverride, setLiveScenarioOverride] = useState<Record<string, ScenarioFile>>({});
  const [runMode, setRunMode] = useState<"live" | "sample">("sample");
  const scenario =
    runMode === "live"
      ? liveScenarioOverride[baseScenario.file_id] || baseScenario
      : baseScenario;

  const signals = groupEvidence(scenario.evidence_ids);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        SOURCES.map((source) => [source.query, rowsFor(tables, source.query, scenario.scenario_id).length]),
      ),
    [tables, scenario.scenario_id],
  );

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [runElapsed, setRunElapsed] = useState(0);
  const [liveStreamTrace, setLiveStreamTrace] = useState<Record<string, RealTraceStep[]>>({});

  const [liveReady, setLiveReady] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const runToken = useRef(0);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        const ready = data?.live_ready === true;
        setLiveReady(ready);
        if (!ready) setRunMode("sample");
      })
      .catch(() => {
        setLiveReady(false);
        setRunMode("sample");
      });
  }, []);

  useEffect(() => {
    if (runMode !== "live") return;
    const token = runToken.current;
    let cancel = false;
    fetch(`/api/last-run?scenario_id=${encodeURIComponent(fileId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancel || token !== runToken.current || !data?.found || !data.result) return;
        setLiveScenarioOverride((prev) => (prev[fileId] ? prev : { ...prev, [fileId]: data.result }));
        setLiveStreamTrace((prev) =>
          prev[fileId]?.length ? prev : { ...prev, [fileId]: data.steps || [] },
        );
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [runMode, fileId]);

  // Timer while running
  useEffect(() => {
    if (!isRunning) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setRunElapsed(Math.round((Date.now() - start) / 100) / 10);
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning]);

  const fallbackViews = useMemo(() => runViews(baseScenario, counts), [baseScenario, counts]);
  const effectiveSteps = useMemo(() => {
    if (isRunning && liveStreamTrace[scenario.file_id]?.length) {
      return liveStreamTrace[scenario.file_id];
    }
    if (runMode === "live") {
      return liveStreamTrace[baseScenario.file_id]?.length
        ? liveStreamTrace[baseScenario.file_id]
        : traces?.[baseScenario.file_id] || fallbackViews;
    }
    return liveStreamTrace[baseScenario.file_id]?.length
      ? liveStreamTrace[baseScenario.file_id]
      : traces?.[baseScenario.file_id] || traces?.[baseScenario.scenario_id] || fallbackViews;
  }, [isRunning, liveStreamTrace, scenario.file_id, runMode, baseScenario.file_id, baseScenario.scenario_id, traces, fallbackViews]);

  // Operator approval modal state
  const [operatorName, setOperatorName] = useState(
    lang === "es" ? "Operador Turno Poniente" : "Control Tower Operator",
  );
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  async function handleApproval(decision: "approve" | "reject") {
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_id: scenario.scenario_id,
          operator_name: operatorName,
          decision,
          reason:
            decision === "approve"
              ? `Aprobación de la recomendación: ${scenario.recommendation.recommended_action}`
              : "Rechazo operativo preventivo",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLiveScenarioOverride((prev) => ({
          ...prev,
          [scenario.file_id]: {
            ...scenario,
            authorization: "recorded",
            operator_decision: data.operator_decision,
            applied: false,
          },
        }));
        const msg = decision === "approve"
          ? copy.platform.feedbackApprove.replace("{name}", operatorName)
          : copy.platform.feedbackReject.replace("{name}", operatorName);
        setApprovalFeedback(msg);
        setTimeout(() => {
          setApprovalOpen(false);
          setApprovalFeedback(null);
        }, 1500);
      }
    } catch (err: any) {
      setApprovalFeedback(`Error: ${err.message}`);
    }
  }

  // Trigger live or sample execution via SSE
  async function triggerRun() {
    if (runMode === "live" && !liveReady) return;
    runToken.current += 1;
    setIsRunning(true);
    setRunElapsed(0);
    setRunError(null);
    setLiveStreamTrace((prev) => ({ ...prev, [scenario.file_id]: [] }));
    setLiveScenarioOverride((prev) => {
      const next = { ...prev };
      delete next[scenario.file_id];
      return next;
    });

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_id: scenario.scenario_id,
          mode: runMode,
        }),
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buf = "";
      let stderr = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split(/\r?\n\r?\n/);
        buf = events.pop() || "";

        for (const evt of events) {
          const line = evt.replace(/^data:\s*/, "").trim();
          if (!line) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.event === "final_result" && parsed.data) {
              setLiveScenarioOverride((prev) => ({
                ...prev,
                [scenario.file_id]: {
                  ...parsed.data,
                  file_id: scenario.file_id,
                  applied: false,
                },
              }));
            } else if (parsed.event === "stderr" || parsed.event === "error") {
              stderr = String(parsed.message || copy.platform.runFailed);
            } else if (parsed.event === "done" && parsed.exit_code !== 0) {
              setRunError(stderr || `${copy.platform.runFailed} (${parsed.exit_code})`);
            } else if (parsed.role) {
              const displayStep: RealTraceStep = {
                id: (parsed.action === "load_sources"
                  ? "load"
                  : parsed.action === "rank_alternatives"
                    ? "rank"
                    : parsed.role) as any,
                actor: parsed.agent_name || parsed.role,
                action: parsed.action || parsed.role,
                decides: parsed.role === "host",
                summary: (parsed.output_summary || "").slice(0, 70).replace(/\s+/g, " "),
                lines: [
                  `[${parsed.timestamp}] ${parsed.role} (${parsed.action})`,
                  `model: ${parsed.model}`,
                  `status: ${parsed.status}${parsed.retry_count > 0 ? ` (retry ${parsed.retry_count})` : ""}`,
                  `duration: ${parsed.duration_ms ? `${(parsed.duration_ms / 1000).toFixed(1)}s` : "<0.1s"}`,
                  "--- input summary ---",
                  parsed.input_summary || "",
                  "--- output ---",
                  parsed.output_summary || "",
                ],
                timestamp: parsed.timestamp,
                model: parsed.model,
                durationMs: parsed.duration_ms,
                inputSummary: parsed.input_summary,
                outputRaw: parsed.output_summary,
                targetAgent: parsed.target_agent,
                retryCount: parsed.retry_count,
                status: parsed.status,
                isReal: true,
              };

              setLiveStreamTrace((prev) => ({
                ...prev,
                [scenario.file_id]: [...(prev[scenario.file_id] || []), displayStep],
              }));
            }
          } catch {}
        }
      }
    } finally {
      setIsRunning(false);
    }
  }

  // Evidence lookup details from CSVs
  const evidenceDetails = useMemo(() => {
    const details: Record<string, string> = {};
    for (const r of tables["user_reports.csv"] || []) {
      if (r.scenario_id === scenario.scenario_id && r.report_id) {
        details[r.report_id] = `Report: "${r.description}" (${r.reported_at})`;
      }
    }
    for (const p of tables["vehicle_positions.csv"] || []) {
      if (p.scenario_id === scenario.scenario_id && p.vehicle_id) {
        details[p.vehicle_id] = `Bus ${p.vehicle_id} · Route ${p.route_id} · Speed: ${p.speed_kmh} km/h · Stop: ${p.nearest_stop}`;
      }
    }
    for (const c of tables["cameras.csv"] || []) {
      if (c.scenario_id === scenario.scenario_id && c.camera_id) {
        details[c.camera_id] = `Camera ${c.camera_id} · State: '${c.state}' @ ${c.intersection}`;
      }
    }
    for (const re of tables["road_events.csv"] || []) {
      if (re.scenario_id === scenario.scenario_id && re.event_id) {
        details[re.event_id] = `Road event ${re.event_id}: ${re.type} · Severity: ${re.severity} @ ${re.intersection}`;
      }
    }
    return details;
  }, [tables, scenario.scenario_id]);

  function select(next: ScenarioId) {
    setFileId(next);
    router.replace(`/system?file=${next}`, { scroll: false });
  }

  const isRealTrace = effectiveSteps.some((s) => s.isReal);

  return (
    <div className="min-h-full bg-paper">
      <SiteHeader surface="work" />
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs tracking-[0.18em] uppercase text-signal">{copy.masthead.reading}</p>
              {runMode === "live" ? (
                <Badge className="bg-signal/15 text-signal border-signal/30 font-mono text-[11px] gap-1">
                  <Sparkles className="size-3" /> LIVE · Zetaris + NVIDIA Nemotron
                </Badge>
              ) : (
                <Badge className="bg-field text-muted-foreground border-rule font-mono text-[11px] gap-1">
                  <Database className="size-3" /> SAMPLE · SQLite + Fixture
                </Badge>
              )}
            </div>
            <h1 className="mt-2 font-mono text-3xl leading-none">{scenario.file_id}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy.gallery.scenario} {scenario.scenario_id}
              {scenario.trace_file ? (
                <span className="font-mono text-xs ml-2 text-muted-foreground">({scenario.trace_file})</span>
              ) : null}
            </p>
          </div>
          <div className="max-w-sm text-right">
            <p className="text-xs tracking-[0.14em] uppercase text-muted-foreground">{copy.platform.modelId}</p>
            <p className="mt-1 font-mono text-sm break-all font-semibold">
              {runMode === "live" ? (liveScenarioOverride[baseScenario.file_id]?.model ?? copy.platform.liveModelWaiting) : scenario.model}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {runMode === "live" ? copy.platform.liveNote : copy.platform.fileNote}
            </p>
            {(runMode === "sample" || liveScenarioOverride[baseScenario.file_id]) && scenario.explanation_source ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {scenario.explanation_source}
                {scenario.query_source ? ` · ${scenario.query_source}` : ""}
                {scenario.classification_source ? ` · ${scenario.classification_source}` : ""}
              </p>
            ) : null}
          </div>
        </header>

        {/* Live Execution & Connectivity Control Bar */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule bg-card px-4 py-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">{copy.platform.mode}</span>
              <button
                type="button"
                onClick={() => setRunMode("sample")}
                className={`cursor-pointer rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                  runMode === "sample"
                    ? "bg-ink text-bone font-bold"
                    : "bg-field text-ink hover:bg-field/80 border border-rule"
                }`}
              >
                {copy.platform.sampleMode}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (liveReady) setRunMode("live");
                }}
                disabled={!liveReady}
                className={`rounded-full px-3 py-1 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  runMode === "live"
                    ? "bg-signal text-bone font-bold"
                    : "cursor-pointer bg-field text-ink hover:bg-field/80 border border-rule"
                }`}
              >
                {copy.platform.runLive}
              </button>
            </div>

            {liveReady ? null : (
              <p className="text-xs text-hold">{copy.platform.liveUnavailable}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={triggerRun}
              disabled={isRunning || (runMode === "live" && !liveReady)}
              className="gap-2 bg-signal hover:bg-signal/90 text-white min-h-10 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  {runMode === "live" ? copy.platform.runningLive : copy.platform.runningSample} ({runElapsed.toFixed(1)}s)
                </>
              ) : (
                <>
                  <Play className="size-4 fill-current" />
                  {runMode === "live" ? copy.platform.runLive : copy.platform.runSample} ({scenario.scenario_id})
                </>
              )}
            </Button>
          </div>
          {runError ? <p className="w-full text-sm text-signal">{runError}</p> : null}
        </section>

        {/* Scenario Switcher */}
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

        {/* Spatial corridor map */}
        <CorridorMap scenario={scenario} tables={tables} />

        {/* Centerpiece: Interactive Multi-Agent Execution Flow (Graph DAG & Hierarchical Tree) */}
        <ExecutionFlow
          lang={lang}
          steps={effectiveSteps}
          running={isRunning}
          elapsed={runElapsed}
          scenario={scenario}
          isReal={isRealTrace}
        />

        {/* Decision & Response Grid */}
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

              {scenario.scenario_id === "scn-false" || scenario.evidence_ids.includes("REP_FALSE_1") ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold mb-1">
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>{copy.platform.injectionTitle}</span>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px] ml-auto">
                      {copy.platform.injectionBadge}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-2">
                    {copy.platform.injectionDesc}
                  </p>
                  <p className="font-mono text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/15 rounded px-2 py-1">
                    {copy.platform.injectionCorroboration}
                  </p>
                </div>
              ) : null}

              {/* Canonical Host Operator Sentence */}
              <SentenceBlock
                label={copy.sentence.label}
                note={copy.sentence.note}
                text={scenario.diagnosis}
                tone="signal"
              />

              {/* Host Canonical Recommendation */}
              <SentenceBlock
                label={copy.recommendation.canonical}
                text={scenario.recommendation.host_text || scenario.recommendation.text}
                tone="clear"
              />

              {/* Reporter Grounded Citation (if distinct) */}
              {scenario.recommendation.host_text &&
              scenario.recommendation.text &&
              scenario.recommendation.text !== scenario.recommendation.host_text ? (
                <div className="rounded-lg border border-rule bg-field/60 p-3 text-xs">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">{copy.recommendation.cited}</p>
                  <p className="text-ink font-mono text-[11px] leading-relaxed">{scenario.recommendation.text}</p>
                </div>
              ) : null}

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

            {/* Queue depletion simulation curve */}
            <QueueChart scenario={scenario} />

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

                  <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
                    <DialogTrigger
                      render={
                        <Button
                          variant={scenario.authorization === "recorded" ? "outline" : "default"}
                          className="w-full gap-2 cursor-pointer font-medium"
                        />
                      }
                    >
                      <UserCheck className="size-4" />
                      {scenario.authorization === "recorded"
                        ? copy.platform.btnModify
                        : copy.platform.btnRecord}
                    </DialogTrigger>
                    <DialogContent className="rounded-xl max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <ShieldCheck className="size-5 text-signal" />
                          {copy.platform.operatorModalTitle}
                        </DialogTitle>
                        <DialogDescription>
                          {copy.platform.operatorModalDesc}{" "}
                          <strong className="text-ink font-mono">
                            {scenario.recommendation.recommended_action}
                          </strong>
                          . {copy.platform.operatorModalAudited}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                          <Label htmlFor="op-name">{copy.platform.operatorName}</Label>
                          <Input
                            id="op-name"
                            value={operatorName}
                            onChange={(e) => setOperatorName(e.target.value)}
                            placeholder={copy.platform.operatorPlaceholder}
                          />
                        </div>

                        {approvalFeedback && (
                          <div className="rounded-md bg-clear/15 p-2.5 text-xs text-clear font-medium flex items-center gap-2">
                            <CheckCircle2 className="size-4 shrink-0" />
                            {approvalFeedback}
                          </div>
                        )}

                        <div className="rounded-md bg-field p-3 text-xs text-muted-foreground border border-rule">
                          <p className="flex items-center gap-1 font-semibold text-ink mb-1">
                            <Lock className="size-3.5 text-signal" /> {copy.platform.securityGuarantee}
                          </p>
                          {copy.platform.securityText}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleApproval("approve")}
                            className="flex-1 bg-clear hover:bg-clear/90 text-white cursor-pointer"
                          >
                            {copy.platform.btnApprove}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleApproval("reject")}
                            className="flex-1 border-hold/40 text-hold hover:bg-hold/10 cursor-pointer"
                          >
                            {copy.platform.btnReject}
                          </Button>
                        </div>
                      </div>
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

        {/* Signal Series */}
        <section className="overflow-hidden rounded-xl border border-rule bg-card">
          <header className="border-b border-rule px-4 py-3">
            <h2 className="text-sm font-medium">{copy.platform.series}</h2>
            <p className="text-sm text-muted-foreground">{copy.platform.seriesNote}</p>
          </header>
          {(["report", "vehicle", "camera", "road"] as SignalKind[]).map((kind) => (
            <SignalLane
              key={kind}
              kind={kind}
              label={copy.platform[kind]}
              ids={signals[kind]}
              empty={copy.platform.notCited}
              details={evidenceDetails}
            />
          ))}
        </section>

        {/* Data Source Tables */}
        <SourceRack lang={lang} scenarioId={scenario.scenario_id} tables={tables} />
      </main>
      <SiteFooter surface="work" />
    </div>
  );
}
