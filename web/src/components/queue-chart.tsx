"use client";

import { useMemo, useState } from "react";
import { TrendingDown, Users, Zap } from "lucide-react";
import type { ScenarioFile } from "@/lib/scenarios";
import { Badge } from "@/components/ui/badge";

const COLOR_MAP: Record<string, { stroke: string; fill: string; label: string; dash?: string }> = {
  wait: {
    stroke: "#B33927",
    fill: "rgba(179, 57, 39, 0.15)",
    label: "Esperar (Línea Base)",
    dash: "4 3",
  },
  hold: {
    stroke: "#8A5A12",
    fill: "rgba(138, 90, 18, 0.15)",
    label: "Mantener Operación",
    dash: "4 3",
  },
  divert_210: {
    stroke: "#4A6FA5",
    fill: "rgba(74, 111, 165, 0.15)",
    label: "Desvío Recorrido 210",
  },
  dispatch_relief: {
    stroke: "#7B5EA7",
    fill: "rgba(123, 94, 167, 0.15)",
    label: "Bus de Refuerzo",
  },
  relief_and_divert_210: {
    stroke: "#2F5D45",
    fill: "rgba(47, 93, 69, 0.25)",
    label: "Refuerzo + Desvío (Óptima)",
  },
};

export function QueueChart({ scenario }: { scenario: ScenarioFile }) {
  const [hoveredMin, setHoveredMin] = useState<number | null>(null);

  const alternatives = useMemo(() => {
    return scenario.alternatives.map((alt) => {
      let series = alt.queue_series;
      if (!series || series.length === 0) {
        // Fallback compute
        const waiting = scenario.impact.waiting;
        let arrival = scenario.impact.arrival_per_min;
        let board = scenario.impact.board_per_min;
        if (alt.action === "divert_210") arrival = Math.max(0, arrival - 12);
        if (alt.action === "dispatch_relief") board += 36;
        if (alt.action === "relief_and_divert_210") {
          arrival = Math.max(0, arrival - 12);
          board += 36;
        }

        const sim: number[] = [];
        let q = waiting;
        for (let m = 0; m < 20; m++) {
          sim.push(q);
          const boarded = Math.min(q, board);
          q = Math.max(0, q - boarded + arrival);
        }
        sim.push(q);
        series = sim;
      }
      return {
        ...alt,
        queue_series: series,
        color: COLOR_MAP[alt.action] || {
          stroke: "#666",
          fill: "transparent",
          label: alt.action,
        },
      };
    });
  }, [scenario]);

  const maxQueue = useMemo(() => {
    let max = 1;
    for (const alt of alternatives) {
      for (const val of alt.queue_series || []) {
        if (val > max) max = val;
      }
    }
    return Math.max(max, scenario.impact.waiting, 10);
  }, [alternatives, scenario.impact.waiting]);

  // Chart coordinates
  const W = 580;
  const H = 220;
  const PAD_X = 45;
  const PAD_Y = 25;
  const GRAPH_W = W - PAD_X - 20;
  const GRAPH_H = H - PAD_Y - 30;

  const getX = (minute: number) => PAD_X + (minute / 20) * GRAPH_W;
  const getY = (val: number) => PAD_Y + GRAPH_H - (val / maxQueue) * GRAPH_H;

  const winner = scenario.recommendation.recommended_action;
  const winnerAlt = alternatives.find((a) => a.action === winner);
  const baselineAlt = alternatives.find((a) => a.action === "wait" || a.action === "hold");

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <h2 className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="size-4 text-clear" />
            Simulación de Colas · Evolución de Pasajeros en Espera (20 min)
          </h2>
          <p className="text-xs text-muted-foreground">
            Métrica determinista del Host: cada punto representa pasajeros esperando en el minuto t
          </p>
        </div>
        {scenario.recommendation.reduction_percent > 0 ? (
          <Badge className="bg-clear/15 text-clear border-clear/30 font-mono">
            -{scenario.recommendation.reduction_percent}% impacto ({scenario.recommendation.saved} min-pax ahorrados)
          </Badge>
        ) : null}
      </header>

      <div className="p-4 grid gap-4">
        {/* SVG Chart */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto select-none"
            onMouseLeave={() => setHoveredMin(null)}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const yVal = Math.round(maxQueue * pct);
              const y = getY(yVal);
              return (
                <g key={pct}>
                  <line
                    x1={PAD_X}
                    y1={y}
                    x2={W - 20}
                    y2={y}
                    stroke="#E6E0D4"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={PAD_X - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-muted-foreground font-mono text-[9px]"
                  >
                    {yVal}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {[0, 5, 10, 15, 20].map((m) => {
              const x = getX(m);
              return (
                <g key={m}>
                  <line
                    x1={x}
                    y1={PAD_Y}
                    x2={x}
                    y2={PAD_Y + GRAPH_H}
                    stroke="#E6E0D4"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={x}
                    y={H - 12}
                    textAnchor="middle"
                    className="fill-muted-foreground font-mono text-[10px]"
                  >
                    {m}m
                  </text>
                </g>
              );
            })}

            {/* Shaded Saved Area between baseline and winner */}
            {baselineAlt && winnerAlt && baselineAlt !== winnerAlt && (
              (() => {
                const bSeries = baselineAlt.queue_series || [];
                const wSeries = winnerAlt.queue_series || [];
                let d = `M ${getX(0)} ${getY(bSeries[0] || 0)}`;
                for (let m = 1; m <= 20; m++) {
                  d += ` L ${getX(m)} ${getY(bSeries[m] || 0)}`;
                }
                for (let m = 20; m >= 0; m--) {
                  d += ` L ${getX(m)} ${getY(wSeries[m] || 0)}`;
                }
                d += " Z";
                return <path d={d} fill="#2F5D45" fillOpacity="0.12" />;
              })()
            )}

            {/* Alternative Polylines */}
            {alternatives.map((alt) => {
              const series = alt.queue_series || [];
              const points = series.map((val, m) => `${getX(m)},${getY(val)}`).join(" ");
              const isWin = alt.action === winner;
              return (
                <polyline
                  key={alt.action}
                  points={points}
                  fill="none"
                  stroke={alt.color.stroke}
                  strokeWidth={isWin ? "3" : "1.8"}
                  strokeDasharray={alt.color.dash}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Hover vertical line */}
            {hoveredMin !== null && (
              <g>
                <line
                  x1={getX(hoveredMin)}
                  y1={PAD_Y}
                  x2={getX(hoveredMin)}
                  y2={PAD_Y + GRAPH_H}
                  stroke="#181613"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                {alternatives.map((alt) => {
                  const val = (alt.queue_series || [])[hoveredMin] ?? 0;
                  return (
                    <circle
                      key={alt.action}
                      cx={getX(hoveredMin)}
                      cy={getY(val)}
                      r="4"
                      fill={alt.color.stroke}
                      stroke="#FFF"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </g>
            )}

            {/* Invisible hover overlay zones across 21 minutes */}
            {Array.from({ length: 21 }, (_, m) => (
              <rect
                key={m}
                x={getX(m) - GRAPH_W / 40}
                y={PAD_Y}
                width={GRAPH_W / 20}
                height={GRAPH_H}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredMin(m)}
              />
            ))}
          </svg>
        </div>

        {/* Legend and Inspector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {alternatives.map((alt) => {
              const isWin = alt.action === winner;
              return (
                <div key={alt.action} className="flex items-center gap-1.5 font-mono">
                  <span
                    className="inline-block h-1 w-4 rounded-full"
                    style={{ backgroundColor: alt.color.stroke }}
                  />
                  <span className={isWin ? "font-bold text-ink" : "text-muted-foreground"}>
                    {alt.color.label} ({alt.passenger_minutes} min-pax)
                  </span>
                </div>
              );
            })}
          </div>

          {hoveredMin !== null && (
            <div className="rounded bg-field px-3 py-1 font-mono text-[11px] border border-rule flex items-center gap-3">
              <span className="font-bold">Minuto {hoveredMin}:</span>
              {alternatives.map((alt) => (
                <span key={alt.action} style={{ color: alt.color.stroke }}>
                  {alt.action}: {(alt.queue_series || [])[hoveredMin]} pax
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
