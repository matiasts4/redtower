import type { ReactNode } from "react";
import {
  Bus,
  Camera,
  CircleCheck,
  CircleHelp,
  Clock,
  Construction,
  FileText,
  Hourglass,
  Lock,
  LogIn,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const statusDot = {
  real: "bg-signal",
  insufficient: "bg-hold",
  clear: "bg-clear",
} as const;

export type IncidentStatus = keyof typeof statusDot;

const statusTone = {
  real: "border-signal/30 bg-signal/10 text-signal",
  insufficient: "border-hold/40 bg-hold/15 text-hold",
  clear: "border-clear/30 bg-clear/10 text-clear",
} as const;

const statusIcon = {
  real: TriangleAlert,
  insufficient: CircleHelp,
  clear: CircleCheck,
} as const;

export function StatusMark({ status }: { status: IncidentStatus }) {
  const Icon = statusIcon[status];
  return (
    <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-sm ${statusTone[status]}`}>
      <Icon className="size-4" aria-hidden />
      {status}
    </span>
  );
}

const markIcon = {
  waiting: Users,
  arrival: UserPlus,
  board: LogIn,
  moving: Bus,
} as const;

const toneWell = {
  signal: "bg-signal/10 text-signal",
  hold: "bg-hold/15 text-hold",
  clear: "bg-clear/10 text-clear",
} as const;

export type ReadTone = keyof typeof toneWell;

export function Instrument({
  label,
  value,
  mark,
  tone,
}: {
  label: string;
  value: string;
  mark: keyof typeof markIcon;
  tone: ReadTone;
}) {
  const Icon = markIcon[mark];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-rule bg-card px-4 py-3">
      <span className={`grid size-11 shrink-0 place-items-center rounded-full ${toneWell[tone]}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl leading-none">{value}</p>
      </div>
    </div>
  );
}

export function DamageComparison({
  unit,
  versus,
  waitLabel,
  choiceLabel,
  savedLabel,
  reductionLabel,
  wait,
  choice,
  saved,
  reduction,
  format,
}: {
  unit: string;
  versus: string;
  waitLabel: string;
  choiceLabel: string;
  savedLabel: string;
  reductionLabel: string;
  wait: number;
  choice: number;
  saved: number;
  reduction: number;
  format: (value: number) => string;
}) {
  const scale = Math.max(wait, choice, 1);
  const empty = wait === 0 && choice === 0;
  const waitPct = empty ? 0 : Math.round((wait / scale) * 100);
  const choicePct = empty ? 0 : Math.round((choice / scale) * 100);
  return (
    <div className="grid gap-3 rounded-xl border border-rule bg-field px-4 py-4">
      <p className="text-xs text-muted-foreground">
        {unit} · {versus}
      </p>
      <ComparisonMeter icon={Clock} label={waitLabel} value={format(wait)} pct={waitPct} tone="signal" />
      <ComparisonMeter icon={CircleCheck} label={choiceLabel} value={format(choice)} pct={choicePct} tone="clear" />
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-rule pt-3 text-sm">
        <span className="font-mono">
          {format(wait)} − {format(choice)} = {format(saved)}
        </span>
        <span className="text-muted-foreground">{savedLabel}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{reductionLabel}</span>
        <span className="font-mono">{reduction}%</span>
      </p>
    </div>
  );
}

function ComparisonMeter({
  icon: Icon,
  label,
  value,
  pct,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  pct: number;
  tone: "signal" | "clear";
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm">
          <Icon className={`size-4 ${tone === "signal" ? "text-signal" : "text-clear"}`} aria-hidden />
          {label}
        </span>
        <span className="font-mono text-xl leading-none">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-card" aria-hidden>
        <div
          className={`h-full rounded-full ${tone === "signal" ? "bg-signal" : "bg-clear"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SentenceBlock({
  label,
  note,
  text,
  tone = "signal",
}: {
  label: string;
  note?: string;
  text: string;
  tone?: ReadTone;
}) {
  const bar = tone === "clear" ? "border-clear" : tone === "hold" ? "border-hold" : "border-signal";
  return (
    <figure className={`border-l-4 pl-4 ${bar}`}>
      <figcaption className={`text-xs tracking-[0.14em] uppercase ${tone === "clear" ? "text-clear" : tone === "hold" ? "text-hold" : "text-signal"}`}>
        {label}
        {note ? <span className="tracking-normal text-muted-foreground normal-case"> · {note}</span> : null}
      </figcaption>
      <blockquote className="mt-1 text-base leading-7 text-ink">{text}</blockquote>
    </figure>
  );
}

const signalIcon = {
  report: FileText,
  vehicle: Bus,
  camera: Camera,
  road: Construction,
} as const;

const signalTone: Record<keyof typeof signalIcon, ReadTone> = {
  report: "signal",
  vehicle: "hold",
  camera: "clear",
  road: "signal",
};

export function SignalLane({
  kind,
  label,
  ids,
  empty,
}: {
  kind: keyof typeof signalIcon;
  label: string;
  ids: string[];
  empty: string;
}) {
  const Icon = signalIcon[kind];
  const tone = ids.length === 0 ? undefined : signalTone[kind];
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-2 border-b border-rule px-3 py-2 last:border-b-0">
      <span className={`grid size-8 place-items-center rounded-full ${tone ? toneWell[tone] : "bg-field text-muted-foreground"}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="w-24 text-sm">{label}</span>
      <span className={`w-8 font-mono text-xs ${tone ? "" : "text-muted-foreground"}`}>{ids.length}</span>
      {ids.length === 0 ? (
        <span className="font-mono text-sm text-muted-foreground">{empty}</span>
      ) : (
        ids.map((id) => (
          <span key={id} className={`rounded-full px-2 py-1 font-mono text-xs ${toneWell[signalTone[kind]]}`}>
            {id}
          </span>
        ))
      )}
    </div>
  );
}

export function ApprovalCard({
  title,
  authorization,
  body,
  decisionLabel,
  decision,
  appliedLabel,
  limits,
  control,
}: {
  title: string;
  authorization: string;
  body: string;
  decisionLabel: string;
  decision: string;
  appliedLabel: string;
  limits: string[];
  control: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-rule bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          {authorization === "recorded" ? (
            <CircleCheck className="size-4 text-clear" aria-hidden />
          ) : (
            <Hourglass className="size-4 text-hold" aria-hidden />
          )}
          {title}
        </h2>
        <span className={`rounded-full px-2 py-1 font-mono text-xs ${authorization === "recorded" ? toneWell.clear : toneWell.hold}`}>
          {authorization}
        </span>
      </header>
      <div className="grid gap-3 p-4">
        <p className="text-sm leading-6">{body}</p>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>{decisionLabel}</span>
          <span className="font-mono">{decision}</span>
        </div>
        <div className="flex items-center justify-between rounded-md bg-graphite px-3 py-2 text-sm text-bone">
          <span className="inline-flex items-center gap-2">
            <Lock className="size-4 text-signal" aria-hidden />
            {appliedLabel}
          </span>
          <span className="font-mono">false</span>
        </div>
        {limits.length > 0 ? (
          <ul className="grid gap-1 text-sm text-muted-foreground">
            {limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        ) : null}
        {control}
      </div>
    </section>
  );
}

function levelClass(level: string) {
  if (level === "low") return "bg-clear/15 text-clear";
  if (level === "high") return "bg-signal/15 text-signal";
  return "bg-hold/15 text-hold";
}

export function RankTable({
  rows,
  winner,
  labels,
  format,
}: {
  rows: Array<{ action: string; passenger_minutes: number; cost: string; risk: string }>;
  winner: string;
  labels: { action: string; cost: string; risk: string; minutes: string; winner: string };
  format: (value: number) => string;
}) {
  const ranked = [...rows].sort((a, b) => a.passenger_minutes - b.passenger_minutes);
  return (
    <div className="overflow-auto rounded-xl border border-rule bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-field hover:bg-field">
            <TableHead className="border-r border-rule">#</TableHead>
            <TableHead className="border-r border-rule">{labels.action}</TableHead>
            <TableHead className="border-r border-rule">{labels.cost}</TableHead>
            <TableHead className="border-r border-rule">{labels.risk}</TableHead>
            <TableHead className="text-right">{labels.minutes}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ranked.map((action, index) => {
            const selected = action.action === winner;
            return (
              <TableRow key={action.action} data-state={selected ? "selected" : undefined} className={selected ? "bg-clear/10" : undefined}>
                <TableCell className="border-r border-rule font-mono">{String(index + 1).padStart(2, "0")}</TableCell>
                <TableCell className="border-r border-rule">
                  <span className="font-mono text-sm">{action.action}</span>
                  {selected ? <Badge className="ml-3 rounded-full bg-clear text-bone">{labels.winner}</Badge> : null}
                </TableCell>
                <TableCell className="border-r border-rule">
                  <span className={`rounded-full px-2 py-1 text-xs ${levelClass(action.cost)}`}>{action.cost}</span>
                </TableCell>
                <TableCell className="border-r border-rule">
                  <span className={`rounded-full px-2 py-1 text-xs ${levelClass(action.risk)}`}>{action.risk}</span>
                </TableCell>
                <TableCell className="text-right font-mono">{format(action.passenger_minutes)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
