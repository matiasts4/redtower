"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { chromeCopy, corridorStops, type ChromeLang } from "@/lib/copy";
import type { ScenarioFile, ScenarioId } from "@/lib/scenarios";
import { groupEvidence, type SignalKind } from "@/lib/signals";
import type { SourceRow } from "@/lib/sources";
import { RunReplay } from "@/components/run-replay";
import { SourceRack } from "@/components/source-rack";

const tone = {
  real: "bg-signal",
  insufficient: "bg-hold",
  clear: "bg-clear",
} as const;

function count(value: number, lang: ChromeLang) {
  return new Intl.NumberFormat(lang === "es" ? "es-CL" : "en-US").format(value);
}

export function Gallery({
  scenarios,
  tables,
}: {
  scenarios: ScenarioFile[];
  tables: Record<string, SourceRow[]>;
}) {
  const params = useSearchParams();
  const initial = params.get("file");
  const [lang, setLang] = useState<ChromeLang>("en");
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
  const ranked = [...scenario.alternatives].sort(
    (a, b) => a.passenger_minutes - b.passenger_minutes,
  );
  const signals = groupEvidence(scenario.evidence_ids);
  const baseline = scenario.recommendation.baseline_passenger_minutes;
  const remain =
    baseline === 0
      ? 0
      : Math.round((scenario.recommendation.passenger_minutes / baseline) * 100);

  return (
    <div className="min-h-full bg-field/40">
      <header className="sticky top-0 z-20 border-b border-rule/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="mr-2 text-sm font-medium tracking-[0.14em] uppercase">
            {copy.masthead.signal}
          </Link>
          <Link href="/method" className="text-sm text-muted-foreground hover:text-ink">
            {copy.nav.method}
          </Link>
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-3 left-4 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.platform.search}
              className="pl-10"
              aria-label={copy.platform.search}
            />
          </div>
          <Select
            value={fileId}
            onValueChange={(value) => {
              if (value) setFileId(value as ScenarioId);
            }}
          >
            <SelectTrigger className="min-h-11 rounded-full bg-card px-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((item) => (
                <SelectItem key={item.file_id} value={item.file_id}>
                  {item.file_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")}>
            EN
          </Button>
          <Button variant={lang === "es" ? "default" : "outline"} onClick={() => setLang("es")}>
            ES
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] md:px-6">
        <aside className="grid content-start gap-2">
          {visible.map((item) => (
            <button
              key={item.file_id}
              type="button"
              onClick={() => setFileId(item.file_id)}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-full px-3 text-left text-sm transition-colors duration-200 ${
                item.file_id === scenario.file_id ? "bg-ink text-bone" : "bg-card hover:bg-paper"
              }`}
            >
              <span className={`size-2.5 rounded-full ${tone[item.incident.status]}`} />
              <span className="font-mono">{item.file_id}</span>
            </button>
          ))}
        </aside>

        <div className="grid gap-6">
          <RunReplay lang={lang} />
          <SourceRack lang={lang} scenarioId={scenario.scenario_id} tables={tables} />
          <section className="grid gap-4 xl:grid-cols-[1fr_280px]">
            <Card className="rounded-3xl">
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-field px-3 py-1 text-sm">
                    <span className={`size-2.5 rounded-full ${tone[scenario.incident.status]}`} />
                    {scenario.incident.status}
                  </span>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {scenario.incident.incident_type}
                  </Badge>
                  {scenario.impact.routes.map((route) => (
                    <span
                      key={route}
                      className="rounded-full bg-ink px-3 py-1 font-mono text-sm text-bone"
                    >
                      {route}
                    </span>
                  ))}
                  <span className="font-mono text-sm text-muted-foreground">{scenario.file_id}</span>
                </div>
                <Tooltip>
                  <TooltipTrigger
                    render={<Button variant="ghost" size="icon" aria-label={copy.trace.label} />}
                  >
                    <Info />
                  </TooltipTrigger>
                  <TooltipContent>{copy.trace.body}</TooltipContent>
                </Tooltip>
              </CardHeader>
              <CardContent className="grid gap-5">
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

            <Card className="rounded-3xl bg-graphite text-bone ring-0">
              <CardHeader>
                <CardTitle className="text-bone">{copy.approval.label}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm leading-6 text-bone/80">
                  {scenario.authorization === "recorded"
                    ? copy.approval.recorded
                    : copy.approval.pending}
                </p>
                <div className="flex items-center justify-between rounded-full bg-bone/10 px-4 py-2">
                  <span className="text-sm">{copy.approval.applied}</span>
                  <span className="font-mono">false</span>
                </div>
                <Switch checked={false} disabled aria-label={copy.platform.applyOff} />
                <Dialog>
                  <DialogTrigger render={<Button variant="secondary" className="w-full" />}>
                    {copy.platform.applyOff}
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>{copy.platform.dialogTitle}</DialogTitle>
                      <DialogDescription>{copy.platform.dialogBody}</DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>{copy.platform.waitDamage}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-4xl leading-none font-medium">
                  {count(baseline, lang)}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{copy.platform.recommendedShare}</span>
                  <span className="font-mono text-foreground">{remain}%</span>
                </div>
                <Progress value={remain} />
              </CardContent>
            </Card>
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>{copy.platform.series}</CardTitle>
                <p className="text-sm text-muted-foreground">{copy.platform.seriesNote}</p>
              </CardHeader>
              <CardContent className="grid gap-2">
                {(["report", "vehicle", "camera", "road"] as SignalKind[]).map((kind) => (
                  <div
                    key={kind}
                    className="flex min-h-11 flex-wrap items-center gap-2 rounded-full bg-field px-3 py-2"
                  >
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
              <div key={label} className="flex items-center gap-3 rounded-full bg-card px-4 py-3 ring-1 ring-foreground/10">
                <span className="grid size-11 place-items-center rounded-full bg-ink font-mono text-sm text-bone">
                  {value}
                </span>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [copy.metric.minutes, count(scenario.recommendation.passenger_minutes, lang)],
              [copy.recommendation.versus, `${scenario.recommendation.reduction_percent}%`],
              [copy.metric.passengers, count(scenario.impact.passengers_20, lang)],
              [copy.metric.stops, String(scenario.impact.stop_count)],
            ].map(([label, value]) => (
              <Card key={label} className="rounded-3xl">
                <CardContent className="grid gap-2 p-5">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl leading-none font-medium">{value}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card className="rounded-3xl">
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

          <div className="flex flex-wrap items-center gap-3">
            <Label className="flex items-center gap-2">
              <Switch checked={showEvidence} onCheckedChange={setShowEvidence} />
              {copy.evidence.label}
            </Label>
            {showEvidence
              ? scenario.evidence_ids.map((id) => (
                  <span key={id} className="rounded-full bg-card px-3 py-1 font-mono text-sm ring-1 ring-foreground/10">
                    {id}
                  </span>
                ))
              : null}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {corridorStops.map((stop) => (
              <span
                key={stop}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-card font-mono text-[11px] ring-1 ring-foreground/10"
                title={stop}
              >
                {stop.replace("STOP_", "")}
              </span>
            ))}
          </div>

          <Tabs defaultValue="controls">
            <TabsList className="h-11 rounded-full">
              <TabsTrigger value="controls" className="min-h-11 rounded-full px-4">
                {copy.platform.controls}
              </TabsTrigger>
              <TabsTrigger value="shapes" className="min-h-11 rounded-full px-4">
                {copy.platform.shapes}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="controls" className="grid gap-4 pt-4 md:grid-cols-2">
              <Card className="rounded-3xl">
                <CardContent className="flex flex-wrap gap-3 p-5">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Signal</Button>
                  <Button disabled>Disabled</Button>
                </CardContent>
              </Card>
              <Card className="rounded-3xl">
                <CardContent className="grid gap-4 p-5">
                  <Input placeholder={copy.platform.search} />
                  <div className="flex items-center gap-3">
                    <Checkbox defaultChecked />
                    <Label>{copy.limits.synthetic}</Label>
                  </div>
                  <Slider defaultValue={[20]} max={30} />
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" />}>
                      {copy.gallery.scenario}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {scenarios.map((item) => (
                        <DropdownMenuItem key={item.file_id} onClick={() => setFileId(item.file_id)}>
                          {item.file_id}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="shapes" className="grid gap-4 pt-4 sm:grid-cols-4">
              <div className="grid h-36 place-items-center rounded-full bg-signal text-bone">Pill</div>
              <div className="grid h-36 place-items-center rounded-3xl bg-ink text-bone">Card</div>
              <div className="grid h-36 place-items-center rounded-full bg-clear text-bone">Circle</div>
              <div className="grid h-36 place-items-center rounded-3xl bg-hold text-bone">Hold</div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
