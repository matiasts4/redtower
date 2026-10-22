"use client";

import { SitePage } from "@/components/site-page";
import { PageIntro } from "@/components/page-intro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chromeCopy } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";
import type { ScenarioFile } from "@/lib/scenarios";

export function LimitsPage({ scenarios }: { scenarios: ScenarioFile[] }) {
  const { lang } = useLanguage();
  const copy = chromeCopy[lang];
  const limitations = [...new Set(scenarios.flatMap((scenario) => scenario.limitations))];

  return (
    <SitePage>
      <PageIntro
        kicker={copy.limitsPage.kicker}
        title={copy.limitsPage.title}
        body={copy.limitsPage.body}
      />
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{copy.limitsPage.data}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-base leading-7">
            <p>{copy.limits.synthetic}</p>
            <p>{copy.spine.note}</p>
            <p>{copy.sponsor.body}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
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
    </SitePage>
  );
}
