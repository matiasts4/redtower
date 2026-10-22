"use client";

import Link from "next/link";
import { SitePage } from "@/components/site-page";
import { PageIntro } from "@/components/page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chromeCopy } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";
import type { ScenarioFile } from "@/lib/scenarios";

const tone = {
  real: "bg-signal",
  insufficient: "bg-hold",
  clear: "bg-clear",
} as const;

export function ScenariosPage({ scenarios }: { scenarios: ScenarioFile[] }) {
  const { lang } = useLanguage();
  const copy = chromeCopy[lang];

  return (
    <SitePage>
      <PageIntro
        kicker={copy.scenariosPage.kicker}
        title={copy.scenariosPage.title}
        body={copy.scenariosPage.body}
      />
      <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
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
                <TableCell className="font-mono text-sm">
                  {scenario.recommendation.recommended_action}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {scenario.recommendation.reduction_percent}%
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" render={<Link href={`/system?file=${scenario.file_id}`} />}>
                    {copy.scenariosPage.open}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">{copy.actions.note}</p>
      <div className="flex flex-wrap gap-2">
        {["real", "insufficient", "clear"].map((status) => (
          <Badge key={status} variant="outline" className="rounded-full px-3 py-1">
            {status}
          </Badge>
        ))}
      </div>
    </SitePage>
  );
}
