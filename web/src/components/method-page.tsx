"use client";

import { SitePage } from "@/components/site-page";
import { PageIntro } from "@/components/page-intro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chromeCopy } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";
import { RUN_STEPS } from "@/lib/run";

export function MethodPage() {
  const { lang } = useLanguage();
  const copy = chromeCopy[lang];

  return (
    <SitePage>
      <PageIntro
        kicker={copy.methodPage.kicker}
        title={copy.methodPage.title}
        body={copy.methodPage.body}
      />
      <section className="grid gap-3">
        {RUN_STEPS.map((step, index) => (
          <Card key={step.id} className="rounded-2xl">
            <CardContent className="grid gap-2 p-5 sm:grid-cols-[120px_180px_1fr] sm:items-center">
              <span className="font-mono text-sm text-muted-foreground">
                {String(index + 1).padStart(2, "0")} · {step.action}
              </span>
              <span className="font-medium">{step.actor}</span>
              <span className="text-base leading-7">{copy.platform.steps[step.id]}</span>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card className="rounded-3xl bg-graphite text-bone ring-0">
        <CardHeader>
          <CardTitle className="text-bone">{copy.methodPage.cannot}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-base leading-7 text-bone/85">
          <p>{copy.trace.body}</p>
          <p>{copy.approval.pending}</p>
        </CardContent>
      </Card>
    </SitePage>
  );
}
