"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Info, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RunReplay } from "@/components/run-replay";
import { SourceRack } from "@/components/source-rack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { chromeCopy, corridorStops } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";
import type { ScenarioFile, ScenarioId } from "@/lib/scenarios";
import type { SourceRow } from "@/lib/sources";
import { groupEvidence, type SignalKind } from "@/lib/signals";

const tone = {
  real: "bg-signal",
  insufficient: "bg-hold",
  clear: "bg-clear",
} as const;

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
  const [showEvidence, setShowEvidence] = useState(true);
  const copy = chromeCopy[lang];
  const visible = useMemo(
    () => scenarios.filter((item) => item.file_id.includes(query.trim().toLowerCase())),
    [scenarios, query],
  );
  const scenario = scenarios.find((item) => item.file_id === fileId) ?? scenarios[0];
  const ranked = [...scenario.alternatives].sort((a, b) => a.passenger_minutes - b.passenger_minutes);
  const signals = groupEvidence(scenario.evidence_ids);
  const baseline = scenario.recommendation.baseline_passenger_minutes;
  const remain =
    baseline === 0 ? 0 : Math.round((scenario.recommendation.passenger_minutes / baseline) * 100);

  function select(next: ScenarioId) {
    setFileId(next);
    router.replace(`/system?file=${next}`, { scroll: false });
  }

  return (
    <div className="min-h-full bg-field/40">
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] uppercase text-signal">{copy.masthead.reading}</p>
            <h1 className="mt-2 text-3xl font-medium md:text-4xl">{copy.gallery.case}</h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">{copy.platform.dialogBody}</p>
        </header>

        <div className="grid gap-4 xl:grid-cols-[220px_1fr_300px]">
          <aside className="grid content-start gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-3.5 left-4 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.platform.search}
                className="pl-10"
                aria-label={copy.platform.search}
              />
            </div>
            {visible.map((item) => (
              <button
                key={item.file_id}
                type="button"
                onClick={() => select(item.file_id)}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 text-left text-sm transition-colors duration-200 ${
                  item.file_id === scenario.file_id
                    ? "border-ink bg-ink text-bone"
                    : "border-rule bg-card hover:bg-paper"
                }`}
              >
                <span className={`size-2.5 rounded-full ${tone[item.incident.status]}`} />
                <span className="font-mono">{item.file_id}</span>
              </button>
            ))}
            {visible.length === 0 ? (
              <p className="rounded-xl border border-rule bg-card px-3 py-3 text-sm text-muted-foreground">
                {copy.platform.empty}
              </p>
            ) : null}
          </aside>

          <div className="grid gap-4">
            <Card className="rounded-2xl">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-field px-3 py-1 text-sm">
                    <span className={`size-2.5 rounded-full ${tone[scenario.incident.status]}`} />
                    {scenario.incident.status}
                  </span>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {scenario.incident.incident_type}
                  </Badge>
                  <span className="font-mono text-sm text-muted-foreground">{scenario.file_id}</span>
                  {scenario.impact.routes.map((route) => (
                    <span key={route} className="rounded-full bg-ink px-3 py-1 font-mono text-sm text-bone">
                      {route}
                    </span>
                  ))}
                </div>
                <Tooltip>
                  <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={copy.trace.label} />}>
                    <Info />
                  </TooltipTrigger>
                  <TooltipContent>{copy.trace.body}</TooltipContent>
                </Tooltip>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="max-w-3xl text-lg leading-7">{scenario.diagnosis}</p>
                <p className="text-base">{scenario.recommendation.text}</p>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{copy.platform.confidence}</span>
                    <span className="font-mono">{scenario.incident.confidence}</span>
                  </div>
                  <Progress value={Math.round(scenario.incident.confidence * 100)} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{copy.actions.label}</CardTitle>
                <p className="text-right text-xs text-muted-foreground">{copy.actions.note}</p>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>{copy.actions.label}</TableHead>
                      <TableHead>{copy.platform.cost}</TableHead>
                      <TableHead>{copy.platform.risk}</TableHead>
                      <TableHead className="text-right">{copy.metric.minutes}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranked.map((action, index) => {
                      const winner = action.action === scenario.recommendation.recommended_action;
                      return (
                        <TableRow key={action.action} data-state={winner ? "selected" : undefined}>
                          <TableCell className="font-mono">{String(index + 1).padStart(2, "0")}</TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{action.action}</span>
                            {winner ? (
                              <Badge className="ml-3 rounded-full">{copy.actions.winner}</Badge>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full bg-field px-2 py-1 text-xs">{action.cost}</span>
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full bg-field px-2 py-1 text-xs">{action.risk}</span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {count(action.passenger_minutes, lang)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid content-start gap-4">
            <Card className="rounded-2xl bg-graphite text-bone ring-0">
              <CardHeader>
                <CardTitle className="text-bone">{copy.approval.label}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm leading-6 text-bone/80">
                  {scenario.authorization === "recorded" ? copy.approval.recorded : copy.approval.pending}
                </p>
                <div className="flex items-center justify-between rounded-xl bg-bone/10 px-4 py-2">
                  <span className="text-sm">{copy.approval.applied}</span>
                  <span className="font-mono">false</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-bone">{copy.approval.decision}</Label>
                  <span className="font-mono text-sm">{scenario.operator_decision ?? copy.approval.none}</span>
                </div>
                <Switch checked={false} disabled aria-label={copy.platform.applyOff} />
                <Dialog>
                  <DialogTrigger render={<Button variant="secondary" className="w-full" />}>
                    {copy.platform.applyOff}
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>{copy.platform.dialogTitle}</DialogTitle>
                      <DialogDescription>{copy.platform.dialogBody}</DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">{copy.evidence.label}</CardTitle>
                <Switch checked={showEvidence} onCheckedChange={setShowEvidence} />
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {showEvidence ? (
                  scenario.evidence_ids.length === 0 ? (
                    <span className="font-mono text-sm text-muted-foreground">—</span>
                  ) : (
                    scenario.evidence_ids.map((id) => (
                      <span key={id} className="rounded-full bg-field px-3 py-1 font-mono text-xs">
                        {id}
                      </span>
                    ))
                  )
                ) : null}
              </CardContent>
            </Card>

          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>{copy.platform.waitDamage}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-4xl leading-none font-medium">{count(baseline, lang)}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{copy.platform.recommendedShare}</span>
                <span className="font-mono text-foreground">{remain}%</span>
              </div>
              <Progress value={remain} />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>{copy.platform.series}</CardTitle>
              <p className="text-sm text-muted-foreground">{copy.platform.seriesNote}</p>
            </CardHeader>
            <CardContent className="grid gap-2">
              {(["report", "vehicle", "camera", "road"] as SignalKind[]).map((kind) => (
                <div key={kind} className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl bg-field px-3 py-2">
                  <span className="w-28 text-sm">{copy.platform[kind]}</span>
                  {signals[kind].length === 0 ? (
                    <span className="font-mono text-sm text-muted-foreground">—</span>
                  ) : (
                    signals[kind].map((id) => (
                      <span key={id} className="rounded-full bg-card px-2 py-1 font-mono text-xs">
                        {id}
                      </span>
                    ))
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 sm:grid-cols-4">
          {(
            [
              [copy.platform.waiting, scenario.impact.waiting],
              [copy.platform.arrival, scenario.impact.arrival_per_min],
              [copy.platform.board, scenario.impact.board_per_min],
              [copy.platform.moving, scenario.impact.moving_buses],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
              <span className="grid size-11 place-items-center rounded-full bg-ink font-mono text-sm text-bone">
                {value}
              </span>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </section>

        <RunReplay lang={lang} />
        <SourceRack lang={lang} scenarioId={scenario.scenario_id} tables={tables} />

        <section className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm text-muted-foreground">{copy.spine.label}:</p>
          {corridorStops.map((stop) => (
            <span
              key={stop}
              className="grid size-8 place-items-center rounded-full bg-card font-mono text-[11px] ring-1 ring-foreground/10"
              title={stop}
            >
              {stop.replace("STOP_", "")}
            </span>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
