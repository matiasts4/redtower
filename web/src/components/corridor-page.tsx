"use client";

import { SitePage } from "@/components/site-page";
import { PageIntro } from "@/components/page-intro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chromeCopy, corridorName, corridorStops } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";

export function CorridorPage({ routes }: { routes: string[] }) {
  const { lang } = useLanguage();
  const copy = chromeCopy[lang];

  return (
    <SitePage>
      <PageIntro
        kicker={copy.corridorPage.kicker}
        title={copy.corridorPage.title}
        body={copy.corridorPage.body}
      />
      <section className="grid gap-4 md:grid-cols-[220px_1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{copy.corridorPage.routes}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {routes.map((route) => (
              <span key={route} className="rounded-full bg-ink px-4 py-2 font-mono text-sm text-bone">
                {route}
              </span>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{corridorName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {corridorStops.length} {copy.corridorPage.stops.toLowerCase()}
            </p>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="h-1 rounded-full bg-signal" />
            <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {corridorStops.map((stop) => (
                <li
                  key={stop}
                  className="flex min-h-11 items-center gap-2 rounded-full bg-field px-3 font-mono text-sm"
                >
                  <span className="size-2.5 rounded-full bg-ink" />
                  {stop}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>
    </SitePage>
  );
}
