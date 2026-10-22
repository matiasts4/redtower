import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { corridorName, corridorStops, type ChromeLang, chromeCopy } from "@/lib/copy";
import type { ScenarioFile } from "@/lib/scenarios";

const statusTone = {
  real: "bg-signal",
  insufficient: "bg-hold",
  clear: "bg-clear",
} as const;

function count(value: number, lang: ChromeLang) {
  return value.toLocaleString(lang === "es" ? "es-CL" : "en-US");
}

export function StatusMark({
  status,
  label,
}: {
  status: ScenarioFile["incident"]["status"];
  label: string;
}) {
  return (
    <p className="flex items-center gap-3 text-sm">
      <span className={`size-2.5 ${statusTone[status]}`} aria-hidden="true" />
      <span className="font-mono text-xs tracking-[0.16em] uppercase text-muted-foreground">
        {label}
      </span>
      <span className="font-medium">{status}</span>
    </p>
  );
}

export function CaseFile({
  scenario,
  lang,
}: {
  scenario: ScenarioFile;
  lang: ChromeLang;
}) {
  const copy = chromeCopy[lang];
  const ranked = [...scenario.alternatives].sort(
    (a, b) => a.passenger_minutes - b.passenger_minutes,
  );
  const evidence = scenario.evidence_ids;

  return (
    <article className="border border-rule bg-card">
      <header className="grid gap-6 border-b border-rule px-6 py-6 md:grid-cols-[1fr_auto] md:px-8">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
            {scenario.file_id}
          </p>
          <h2 className="mt-3 font-display text-4xl leading-none text-balance md:text-5xl">
            {corridorName}
          </h2>
        </div>
        <StatusMark status={scenario.incident.status} label={copy.status.label} />
      </header>

      <div className="grid gap-8 px-6 py-8 md:px-8">
        <section>
          <p className="font-mono text-xs tracking-[0.16em] uppercase text-muted-foreground">
            {copy.sentence.label}
          </p>
          <p className="mt-3 max-w-3xl font-display text-3xl leading-snug text-balance italic">
            {scenario.diagnosis}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{copy.sentence.note}</p>
        </section>

        <section className="border-t border-rule pt-6">
          <p className="font-mono text-xs tracking-[0.16em] uppercase text-muted-foreground">
            {copy.recommendation.label}
          </p>
          <p className="mt-3 max-w-3xl font-display text-2xl leading-snug">
            {scenario.recommendation.text}
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <Metric
              label={copy.metric.minutes}
              value={count(scenario.recommendation.passenger_minutes, lang)}
            />
            <Metric
              label={copy.recommendation.versus}
              value={`${scenario.recommendation.reduction_percent}%`}
            />
            <Metric
              label={copy.recommendation.saved}
              value={count(scenario.recommendation.saved, lang)}
            />
          </dl>
        </section>

        <section className="grid gap-4 border-t border-rule pt-6 sm:grid-cols-3">
          <Metric
            label={copy.metric.passengers}
            value={count(scenario.impact.passengers_20, lang)}
          />
          <Metric label={copy.metric.stops} value={String(scenario.impact.stop_count)} />
          <Metric label={copy.metric.routes} value={scenario.impact.routes.join(" · ")} />
        </section>

        <section className="border-t border-rule pt-6">
          <div className="flex items-end justify-between gap-4">
            <h3 className="font-medium">{copy.actions.label}</h3>
            <p className="max-w-sm text-right text-sm text-muted-foreground">{copy.actions.note}</p>
          </div>
          <ol className="mt-4 divide-y divide-rule border-y border-rule">
            {ranked.map((action, index) => {
              const winner = action.action === scenario.recommendation.recommended_action;
              return (
                <li
                  key={action.action}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-sm">
                    {action.action}
                    {winner ? (
                      <span className="ml-3 font-sans text-xs tracking-[0.14em] uppercase text-signal">
                        {copy.actions.winner}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-mono text-sm">
                    {count(action.passenger_minutes, lang)}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <h3 className="font-medium">{copy.evidence.label}</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {evidence.map((id) => (
              <li
                key={id}
                className="border border-rule bg-field px-2 py-1 font-mono text-xs tracking-wide"
              >
                {id}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 border border-ink bg-paper p-5 md:grid-cols-[1fr_auto]">
          <div>
            <h3 className="font-mono text-xs tracking-[0.16em] uppercase">{copy.approval.label}</h3>
            <p className="mt-3 text-lg">
              {scenario.authorization === "recorded"
                ? copy.approval.recorded
                : copy.approval.pending}
            </p>
            <p className="mt-2 font-mono text-sm">
              {copy.approval.decision}: {scenario.operator_decision ?? copy.approval.none}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{copy.approval.control}</p>
          </div>
          <p className="self-start border border-signal px-3 py-2 font-mono text-sm text-signal">
            {copy.approval.applied}: false
          </p>
        </section>

        <section>
          <h3 className="font-medium">{copy.spine.label}</h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.spine.note}</p>
          <div className="spine-rule mt-4 h-px bg-ink" />
          <ol className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
            {corridorStops.map((stop) => (
              <li key={stop} className="font-mono text-[10px] tracking-wide text-muted-foreground">
                {stop.replace("STOP_", "")}
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-rule pt-6">
          <h3 className="font-medium">{copy.limits.label}</h3>
          <p className="mt-2 text-sm">{copy.limits.synthetic}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {scenario.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="bg-graphite px-5 py-5 text-bone">
          <h3 className="font-mono text-xs tracking-[0.16em] uppercase text-bone/70">
            {copy.sponsor.label}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-bone/90">{copy.sponsor.body}</p>
          <p className="mt-4 font-mono text-sm">{scenario.model}</p>
        </section>

        <Collapsible className="border-t border-rule pt-4">
          <CollapsibleTrigger className="flex min-h-11 cursor-pointer items-center text-left font-medium">
            {copy.trace.summary}
          </CollapsibleTrigger>
          <CollapsibleContent className="max-w-3xl pt-3 text-sm leading-6 text-muted-foreground">
            {copy.trace.body}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-rule pl-3">
      <dt className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl leading-none">{value}</dd>
    </div>
  );
}
