"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chromeCopy, corridorName, corridorStops } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";
import { RUN_STEPS } from "@/lib/run";
import type { ScenarioFile } from "@/lib/scenarios";

const tone = {
  real: "bg-signal",
  insufficient: "bg-hold",
  clear: "bg-clear",
} as const;

function count(value: number, lang: "en" | "es") {
  return new Intl.NumberFormat(lang === "es" ? "es-CL" : "en-US").format(value);
}

export function Landing({
  scenarios,
  routes,
}: {
  scenarios: ScenarioFile[];
  routes: string[];
}) {
  const { lang } = useLanguage();
  const copy = chromeCopy[lang];
  const block = scenarios.find((item) => item.file_id === "scn-block") ?? scenarios[0];
  const limitations = [...new Set(scenarios.flatMap((scenario) => scenario.limitations))];

  return (
    <div className="min-h-full bg-paper">
      <SiteHeader />
      <main>
        <section id="top" className="mx-auto grid max-w-6xl scroll-mt-24 gap-8 px-4 pt-14 pb-16 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-field px-3 py-1 text-sm">
              <span className="size-2 rounded-full bg-signal" />
              {copy.home.kicker}
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[0.94] text-balance md:text-7xl">
              {copy.home.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8">{copy.home.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button nativeButton={false} render={<Link href="/system" />}>
                {copy.landing.reviews}
                <ArrowRight />
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link href="#cases" />}>
                {copy.landing.cases}
              </Button>
            </div>
          </div>
          <Card className="rounded-3xl bg-graphite text-bone ring-0">
            <CardContent className="grid gap-4 p-6">
              <p className="text-sm text-bone/70">{corridorName}</p>
              <p className="font-display text-2xl leading-snug italic">{block.diagnosis}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-signal px-3 py-1 text-sm">{block.incident.status}</span>
                <span className="rounded-full bg-bone/10 px-3 py-1 font-mono text-sm">
                  {block.recommendation.reduction_percent}%
                </span>
                <span className="rounded-full bg-bone/10 px-3 py-1 font-mono text-sm">applied false</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="proof" aria-labelledby="proof-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10 md:px-8">
          <h2 id="proof-title" className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
            {copy.landing.sectionProof}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              [copy.metric.passengers, count(block.impact.passengers_20, lang)],
              [copy.recommendation.versus, `${block.recommendation.reduction_percent}%`],
              [copy.metric.routes, block.impact.routes.join(" ")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 font-display text-4xl leading-none">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cases" aria-labelledby="cases-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:px-8">
          <h2 id="cases-title" className="font-display text-4xl md:text-5xl">
            {copy.landing.sectionCases}
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8">{copy.scenariosPage.body}</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-rule bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-field">
                  <TableHead className="border-r border-rule">{copy.scenariosPage.scenario}</TableHead>
                  <TableHead className="border-r border-rule">{copy.scenariosPage.status}</TableHead>
                  <TableHead className="border-r border-rule">{copy.scenariosPage.action}</TableHead>
                  <TableHead className="border-r border-rule text-right">{copy.scenariosPage.reduction}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((scenario) => (
                  <TableRow key={scenario.file_id}>
                    <TableCell className="font-mono">{scenario.file_id}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${tone[scenario.incident.status]}`} />
                        {scenario.incident.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{scenario.recommendation.recommended_action}</TableCell>
                    <TableCell className="text-right font-mono">{scenario.recommendation.reduction_percent}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" nativeButton={false} render={<Link href={`/system?file=${scenario.file_id}`} />}>
                        {copy.scenariosPage.open}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{copy.actions.note}</p>
        </section>

        <section id="corridor" aria-labelledby="corridor-title" className="mx-auto grid max-w-6xl scroll-mt-24 gap-6 px-4 py-14 md:px-8 lg:grid-cols-[280px_1fr]">
          <div>
            <h2 id="corridor-title" className="font-display text-4xl md:text-5xl">
              {copy.landing.sectionCorridor}
            </h2>
            <p className="mt-3 text-lg leading-8">{copy.corridorPage.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {routes.map((route) => (
                <span key={route} className="rounded-full bg-ink px-4 py-2 font-mono text-sm text-bone">
                  {route}
                </span>
              ))}
            </div>
          </div>
          <Card className="rounded-2xl">
            <CardHeader className="flex-row items-baseline justify-between">
              <CardTitle className="font-display text-2xl">{corridorName}</CardTitle>
              <span className="font-mono text-sm text-muted-foreground">
                {corridorStops.length} {copy.corridorPage.stops.toLowerCase()}
              </span>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="h-1 rounded-full bg-signal" />
              <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {corridorStops.map((stop) => (
                  <li key={stop} className="flex min-h-11 items-center gap-2 rounded-full bg-field px-3 font-mono text-sm">
                    <span className="size-2.5 rounded-full bg-ink" />
                    {stop}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        <section id="method" aria-labelledby="method-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:px-8">
          <h2 id="method-title" className="font-display text-4xl md:text-5xl">
            {copy.landing.sectionMethod}
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8">{copy.methodPage.body}</p>
          <div className="mt-6 grid gap-3">
            {RUN_STEPS.map((step, index) => (
              <div
                key={step.id}
                className="grid gap-2 rounded-2xl border border-rule bg-card p-4 sm:grid-cols-[120px_180px_1fr] sm:items-center"
              >
                <span className="font-mono text-sm text-muted-foreground">
                  {String(index + 1).padStart(2, "0")} · {step.action}
                </span>
                <span className="font-medium">{step.actor}</span>
                <span className="text-base leading-7">{copy.platform.steps[step.id]}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" nativeButton={false} render={<Link href="/system" />}>
              {copy.landing.reviews}
            </Button>
          </div>
        </section>

        <section id="limits" aria-labelledby="limits-title" className="mx-auto grid max-w-6xl scroll-mt-24 gap-4 px-4 py-14 md:px-8 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <h2 id="limits-title" className="font-display text-4xl md:text-5xl">
              {copy.landing.sectionLimits}
            </h2>
            <p className="mt-3 max-w-2xl text-lg leading-8">{copy.limitsPage.body}</p>
          </div>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>{copy.limitsPage.data}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-base leading-7">
              <p>{copy.limits.synthetic}</p>
              <p>{copy.spine.note}</p>
              <p>{copy.sponsor.body}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>{copy.limitsPage.product}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-base leading-7">
              <p>{copy.approval.pending}</p>
              <p>{copy.platform.dialogBody}</p>
              <ul className="list-disc space-y-1 pl-5">
                {limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
          <div className="grid gap-4 rounded-3xl bg-graphite p-8 text-bone ring-0">
            <h2 className="max-w-2xl font-display text-4xl leading-tight text-balance md:text-5xl">
              {copy.landing.ctaTitle}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-bone/80">{copy.landing.ctaBody}</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" nativeButton={false} render={<Link href="/system" />}>
                {copy.landing.reviews}
                <ArrowRight />
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
