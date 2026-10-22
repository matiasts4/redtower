"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { chromeCopy, corridorName, type ChromeLang } from "@/lib/copy";
import type { ScenarioFile } from "@/lib/scenarios";

function count(value: number, lang: ChromeLang) {
  return new Intl.NumberFormat(lang === "es" ? "es-CL" : "en-US").format(value);
}

const tone = {
  real: "bg-signal",
  insufficient: "bg-hold",
  clear: "bg-clear",
} as const;

export function Landing({ scenarios }: { scenarios: ScenarioFile[] }) {
  const [lang, setLang] = useState<ChromeLang>("en");
  const copy = chromeCopy[lang];
  const block = scenarios.find((item) => item.file_id === "scn-block") ?? scenarios[0];

  return (
    <div className="min-h-full bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-8">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-display text-3xl italic leading-none">{copy.masthead.signal}</span>
          <span className="text-sm tracking-[0.16em] uppercase">{copy.masthead.product}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")}>
            EN
          </Button>
          <Button variant={lang === "es" ? "default" : "outline"} onClick={() => setLang("es")}>
            ES
          </Button>
          <Button render={<Link href="/system" />}>
            {copy.home.gallery}
            <ArrowRight />
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 md:px-8">
        <section className="grid items-end gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-field px-3 py-1 text-sm">
              <span className="size-2 rounded-full bg-signal" />
              {copy.home.kicker}
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[0.95] text-balance md:text-7xl">
              {copy.home.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8">{copy.home.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button render={<Link href="/system" />}>
                {copy.home.gallery}
                <ArrowRight />
              </Button>
              <Button variant="outline" render={<Link href="/system?file=scn-block" />}>
                scn-block
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

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            [copy.metric.passengers, count(block.impact.passengers_20, lang)],
            [copy.recommendation.versus, `${block.recommendation.reduction_percent}%`],
            [copy.metric.routes, block.impact.routes.join(" ")],
          ].map(([label, value]) => (
            <Card key={label} className="rounded-3xl">
              <CardContent className="grid gap-2 p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-display text-4xl leading-none">{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-4">
          {copy.home.steps.map((step, index) => (
            <div key={step} className="rounded-3xl bg-field p-5">
              <span className="grid size-11 place-items-center rounded-full bg-ink text-bone">
                {index + 1}
              </span>
              <p className="mt-4 text-lg font-medium">{step}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy.home.stepNotes[index]}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((item) => (
            <Link
              key={item.file_id}
              href={`/system?file=${item.file_id}`}
              className="rounded-3xl bg-card p-5 ring-1 ring-foreground/10 transition-colors duration-200 hover:bg-field"
            >
              <span className="flex items-center gap-2 text-sm">
                <span className={`size-2.5 rounded-full ${tone[item.incident.status]}`} />
                {item.incident.status}
              </span>
              <p className="mt-4 font-mono text-sm">{item.file_id}</p>
              <p className="mt-2 text-base">{item.recommendation.recommended_action}</p>
            </Link>
          ))}
        </section>
        <p className="font-mono text-sm text-muted-foreground">{copy.home.cli}</p>
      </main>
    </div>
  );
}
