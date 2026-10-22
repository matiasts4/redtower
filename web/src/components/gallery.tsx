"use client";

import { useState } from "react";
import { CaseFile, StatusMark } from "@/components/case-file";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chromeCopy, type ChromeLang } from "@/lib/copy";
import type { ScenarioFile } from "@/lib/scenarios";
import { Masthead } from "@/components/masthead";

const swatches = [
  ["paper", "bg-paper", "#F4F0E6"],
  ["ink", "bg-ink", "#1A1814"],
  ["field", "bg-field", "#E7E1D6"],
  ["rule", "bg-rule", "#D9D1C3"],
  ["signal", "bg-signal", "#9E2B1F"],
  ["clear", "bg-clear", "#2F5D45"],
  ["hold", "bg-hold", "#8A5A12"],
  ["graphite", "bg-graphite", "#1C1917"],
] as const;

export function Gallery({ scenarios }: { scenarios: ScenarioFile[] }) {
  const [lang, setLang] = useState<ChromeLang>("en");
  const [fileId, setFileId] = useState(scenarios[0]?.file_id ?? "scn-block");
  const copy = chromeCopy[lang];
  const scenario = scenarios.find((item) => item.file_id === fileId) ?? scenarios[0];

  return (
    <div>
      <Masthead lang={lang} onLang={setLang} />
      <main className="mx-auto grid max-w-6xl gap-16 px-4 py-12 md:px-8">
        <header className="grid gap-4 md:grid-cols-[1fr_16rem] md:items-end">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] uppercase text-signal">
              {copy.gallery.kicker}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-balance md:text-6xl">
              {copy.gallery.title}
            </h1>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{copy.home.cli}</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <div>
            <h2 className="font-mono text-xs tracking-[0.16em] uppercase text-muted-foreground">
              {copy.gallery.scenario}
            </h2>
            <div className="mt-3 grid gap-2">
              {scenarios.map((item) => (
                <Button
                  key={item.file_id}
                  variant={item.file_id === scenario.file_id ? "default" : "outline"}
                  className="justify-start font-mono"
                  onClick={() => setFileId(item.file_id)}
                >
                  {item.file_id}
                </Button>
              ))}
            </div>
            {scenario.file_id === "scn-block-approved" ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {copy.gallery.approvalVariant}
              </p>
            ) : null}
          </div>
          <CaseFile scenario={scenario} lang={lang} />
        </section>

        <section className="grid gap-10 border-t border-rule pt-12">
          <h2 className="font-display text-4xl">{copy.gallery.specimens}</h2>
          <div>
            <h3 className="font-medium">{copy.palette.label}</h3>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {swatches.map(([name, tone, hex]) => (
                <li key={name} className="border border-rule">
                  <div className={`h-16 ${tone}`} />
                  <p className="px-3 py-2 font-mono text-xs">
                    {copy.palette[name]} · {hex}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 border border-rule p-6">
            <h3 className="font-medium">{copy.type.label}</h3>
            <p className="font-display text-4xl">{copy.type.display}</p>
            <p className="text-lg">{copy.type.ui}</p>
            <p className="font-mono text-sm">{copy.type.mono}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusMark status="real" label={copy.status.label} />
            <StatusMark status="insufficient" label={copy.status.label} />
            <StatusMark status="clear" label={copy.status.label} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Badge variant="outline">pending_human</Badge>
            <Badge>recorded</Badge>
          </div>
          <Tabs defaultValue="method">
            <TabsList className="min-h-11">
              <TabsTrigger value="method" className="min-h-11 px-4">
                {copy.trace.label}
              </TabsTrigger>
              <TabsTrigger value="limits" className="min-h-11 px-4">
                {copy.limits.label}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="method" className="pt-4 text-base leading-7">
              {copy.trace.body}
            </TabsContent>
            <TabsContent value="limits" className="pt-4 text-base leading-7">
              {copy.limits.synthetic}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
