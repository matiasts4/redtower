"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bus, Camera, CheckCircle2, Construction, Info, Users } from "lucide-react";
import type { ScenarioFile } from "@/lib/scenarios";
import type { SourceRow } from "@/lib/sources";
import { Badge } from "@/components/ui/badge";
import { chromeCopy } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";

type StopData = {
  stop_id: string;
  order: number;
  lat: number;
  lon: number;
};

// 18 canonical stops in Corredor Poniente
const CANONICAL_STOPS: StopData[] = [
  { stop_id: "STOP_01", order: 1, lat: -33.4501, lon: -70.6501 },
  { stop_id: "STOP_02", order: 2, lat: -33.451, lon: -70.649 },
  { stop_id: "STOP_03", order: 3, lat: -33.452, lon: -70.648 },
  { stop_id: "STOP_04", order: 4, lat: -33.453, lon: -70.647 },
  { stop_id: "STOP_05", order: 5, lat: -33.454, lon: -70.646 },
  { stop_id: "STOP_06", order: 6, lat: -33.455, lon: -70.645 },
  { stop_id: "STOP_07", order: 7, lat: -33.456, lon: -70.644 },
  { stop_id: "STOP_08", order: 8, lat: -33.457, lon: -70.643 },
  { stop_id: "STOP_09", order: 9, lat: -33.458, lon: -70.642 },
  { stop_id: "STOP_10", order: 10, lat: -33.459, lon: -70.641 },
  { stop_id: "STOP_11", order: 11, lat: -33.46, lon: -70.64 },
  { stop_id: "STOP_12", order: 12, lat: -33.461, lon: -70.639 },
  { stop_id: "STOP_13", order: 13, lat: -33.462, lon: -70.638 },
  { stop_id: "STOP_14", order: 14, lat: -33.463, lon: -70.637 },
  { stop_id: "STOP_15", order: 15, lat: -33.464, lon: -70.636 },
  { stop_id: "STOP_16", order: 16, lat: -33.465, lon: -70.635 },
  { stop_id: "STOP_17", order: 17, lat: -33.466, lon: -70.634 },
  { stop_id: "STOP_18", order: 18, lat: -33.467, lon: -70.633 },
];

export function CorridorMap({
  scenario,
  tables,
}: {
  scenario: ScenarioFile;
  tables?: Record<string, SourceRow[]>;
}) {
  const { lang } = useLanguage();
  const copy = chromeCopy[lang].corridorMap;
  const [selectedStop, setSelectedStop] = useState<string | null>(null);

  const affectedStops = useMemo(
    () => new Set(scenario.impact.stops || []),
    [scenario.impact.stops],
  );

  const slowVehicleSet = useMemo(
    () => new Set(scenario.impact.slow_vehicle_ids || []),
    [scenario.impact.slow_vehicle_ids],
  );

  const stoppedVehicleId = useMemo(
    () => scenario.impact.slow_vehicle_ids?.[0] ?? "BUS_210_04",
    [scenario.impact.slow_vehicle_ids],
  );

  // Read positions if available
  const positions = useMemo(() => {
    const rows = tables?.["vehicle_positions.csv"] || [];
    return rows.filter((r) => r.scenario_id === scenario.scenario_id);
  }, [tables, scenario.scenario_id]);

  const vehiclesByStop = useMemo(() => {
    const map = new Map<string, SourceRow[]>();
    for (const pos of positions) {
      const stop = pos.nearest_stop;
      if (!stop) continue;
      if (!map.has(stop)) map.set(stop, []);
      map.get(stop)!.push(pos);
    }
    return map;
  }, [positions]);

  const isRoadBlock = scenario.incident.incident_type === "road_block";
  const isStoppedBus = scenario.incident.incident_type === "stopped_bus";
  const isSurge = scenario.incident.incident_type === "demand_surge";

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-card shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{copy.title}</h2>
          <p className="text-xs text-muted-foreground">
            {copy.subtitle} {affectedStops.size} {copy.stops}
            {scenario.impact.routes.length > 0
              ? ` · ${chromeCopy[lang].corridorPage.routes}: ${scenario.impact.routes.join(", ")}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {affectedStops.size > 0 ? (
            <Badge className="bg-signal/15 text-signal border-signal/30 font-mono text-[11px]">
              STOP_{Array.from(affectedStops)[0]?.replace("STOP_", "")} → STOP_
              {Array.from(affectedStops).slice(-1)[0]?.replace("STOP_", "")}
            </Badge>
          ) : (
            <Badge className="bg-clear/15 text-clear border-clear/30 font-mono text-[11px]">
              {copy.corridorClear}
            </Badge>
          )}
        </div>
      </header>

      <div className="p-4">
        {/* Schematic SVG Map */}
        <div className="relative w-full overflow-x-auto pb-3 pt-1">
          <svg
            viewBox="0 0 1000 130"
            className="w-full min-w-[760px] h-[130px] select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8A5A12" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#B33927" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2F5D45" stopOpacity="0.3" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base corridor line */}
            <line
              x1="40"
              y1="60"
              x2="960"
              y2="60"
              stroke="#D6CEBE"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Impact zone highlight band */}
            {affectedStops.size > 0 && (
              (() => {
                const stops = Array.from(affectedStops);
                const firstOrder =
                  CANONICAL_STOPS.find((s) => s.stop_id === stops[0])?.order || 6;
                const lastOrder =
                  CANONICAL_STOPS.find((s) => s.stop_id === stops[stops.length - 1])?.order || 14;
                const startX = 40 + ((firstOrder - 1) / 17) * 920 - 15;
                const endX = 40 + ((lastOrder - 1) / 17) * 920 + 15;
                return (
                  <g>
                    <rect
                      x={startX}
                      y="20"
                      width={endX - startX}
                      height="80"
                      rx="8"
                      fill="#B33927"
                      fillOpacity="0.12"
                      stroke="#B33927"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={(startX + endX) / 2}
                      y="32"
                      textAnchor="middle"
                      className="fill-signal font-mono text-[10px] font-semibold uppercase tracking-wider"
                    >
                      {copy.impactZone} ({affectedStops.size} {copy.stops})
                    </text>
                  </g>
                );
              })()
            )}

            {/* Incident marker */}
            {isRoadBlock && (
              <g transform="translate(485, 42)">
                <circle cx="15" cy="18" r="14" fill="#B33927" filter="url(#glow)" />
                <path
                  d="M15 10 L23 24 L7 24 Z"
                  fill="#F8F6F0"
                  stroke="#F8F6F0"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="15" cy="20" r="1.2" fill="#B33927" />
                <rect x="14.2" y="14" width="1.6" height="4" rx="0.8" fill="#B33927" />
                <text
                  x="15"
                  y="42"
                  textAnchor="middle"
                  className="fill-signal font-mono text-[10px] font-bold"
                >
                  RD_AV023
                </text>
              </g>
            )}

            {isStoppedBus && (
              <g transform="translate(525, 42)">
                <circle cx="15" cy="18" r="14" fill="#8A5A12" filter="url(#glow)" />
                <rect x="7" y="11" width="16" height="14" rx="2" fill="#F8F6F0" />
                <circle cx="10" cy="21" r="1.5" fill="#8A5A12" />
                <circle cx="20" cy="21" r="1.5" fill="#8A5A12" />
                <text
                  x="15"
                  y="42"
                  textAnchor="middle"
                  className="fill-hold font-mono text-[10px] font-bold"
                >
                  {stoppedVehicleId}
                </text>
              </g>
            )}

            {/* Stop nodes */}
            {CANONICAL_STOPS.map((stop) => {
              const x = 40 + ((stop.order - 1) / 17) * 920;
              const y = 60;
              const isAffected = affectedStops.has(stop.stop_id);
              const isSelected = selectedStop === stop.stop_id;
              const stopVehicles = vehiclesByStop.get(stop.stop_id) || [];
              const hasSlowBus = stopVehicles.some((v) =>
                slowVehicleSet.has(v.vehicle_id),
              );

              return (
                <g
                  key={stop.stop_id}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => setSelectedStop(isSelected ? null : stop.stop_id)}
                >
                  {/* Stop Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 8 : isAffected ? 6.5 : 5}
                    fill={
                      hasSlowBus
                        ? "#B33927"
                        : isAffected
                          ? "#B33927"
                          : "#181613"
                    }
                    stroke={isSelected ? "#F8F6F0" : "#F8F6F0"}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  {/* Node label */}
                  <text
                    x={x}
                    y={y + (stop.order % 2 === 0 ? 24 : -16)}
                    textAnchor="middle"
                    className={`font-mono text-[10px] ${
                      isAffected
                        ? "fill-signal font-semibold"
                        : "fill-muted-foreground"
                    }`}
                  >
                    {stop.stop_id.replace("STOP_", "")}
                  </text>

                  {/* Vehicle indicator dot */}
                  {stopVehicles.length > 0 && (
                    <g transform={`translate(${x - 4}, ${y - 30})`}>
                      <circle
                        cx="4"
                        cy="4"
                        r="5"
                        fill={hasSlowBus ? "#B33927" : "#2F5D45"}
                      />
                      <text
                        x="4"
                        y="6.5"
                        textAnchor="middle"
                        className="fill-white font-mono text-[8px] font-bold"
                      >
                        {stopVehicles.length}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Stop Details or Corridor Summary */}
        <div className="mt-2 rounded-lg border border-rule bg-field p-3 text-xs">
          {selectedStop ? (
            (() => {
              const stop = CANONICAL_STOPS.find((s) => s.stop_id === selectedStop)!;
              const stopVehicles = vehiclesByStop.get(stop.stop_id) || [];
              const isAff = affectedStops.has(stop.stop_id);
              return (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">{stop.stop_id}</span>
                    <span className="text-muted-foreground">· {copy.orderOf18} {stop.order} {copy.of18}</span>
                    <span className="text-muted-foreground font-mono">
                      ({stop.lat}, {stop.lon})
                    </span>
                    <Badge
                      className={
                        isAff
                          ? "bg-signal/15 text-signal border-signal/30 font-mono text-[10px]"
                          : "bg-clear/15 text-clear border-clear/30 font-mono text-[10px]"
                      }
                    >
                      {isAff ? copy.withinImpact : copy.normalService}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{copy.nearbyBuses}</span>
                    {stopVehicles.length === 0 ? (
                      <span className="font-mono text-muted-foreground">{copy.noBuses}</span>
                    ) : (
                      stopVehicles.map((v) => {
                        const isSlow = slowVehicleSet.has(v.vehicle_id);
                        return (
                          <span
                            key={v.vehicle_id}
                            className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                              isSlow
                                ? "bg-signal/20 text-signal font-bold"
                                : "bg-clear/20 text-clear"
                            }`}
                          >
                            {v.vehicle_id} ({v.speed_kmh} km/h)
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Info className="size-4 shrink-0" />
                {copy.clickPrompt}
              </span>
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-signal" /> {copy.impactedOrSlow}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-clear" /> {copy.normalMoving}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
