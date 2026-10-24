"use client";

import { useState } from "react";
import { Database, Code2, TableProperties, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chromeCopy, type ChromeLang } from "@/lib/copy";
import { SOURCES, rowsFor, type SourceRow, type SourceSpec } from "@/lib/sources";

const ZETARIS_QUERIES: Record<string, (scenarioId: string) => string> = {
  scenario_window: (id) =>
    `SELECT scenario_id, label, corridor\nFROM REDTOWER.scenarios\nWHERE scenario_id = '${id}'`,
  routes: () =>
    `SELECT route_id, corridor\nFROM REDTOWER.routes\nORDER BY route_id`,
  stops: () =>
    `SELECT stop_id, corridor, corridor_order, latitude, longitude\nFROM REDTOWER.stops\nORDER BY corridor_order`,
  stop_sequence: () =>
    `SELECT route_id, stop_id, sequence_order\nFROM REDTOWER.stop_sequence\nORDER BY route_id, sequence_order`,
  positions: (id) =>
    `SELECT scenario_id, vehicle_id, timestamp, route_id, nearest_stop, speed_kmh, latitude, longitude\nFROM REDTOWER.vehicle_positions\nWHERE scenario_id = '${id}'\nORDER BY vehicle_id, timestamp`,
  demand: (id) =>
    `SELECT scenario_id, stop_id, waiting_passengers, arrival_per_min, route_210_arrival_per_min\nFROM REDTOWER.passenger_demand\nWHERE scenario_id = '${id}'\nORDER BY stop_id`,
  reports: (id) =>
    `SELECT scenario_id, report_id, segment_id, description, reported_at\nFROM REDTOWER.user_reports\nWHERE scenario_id = '${id}'\nORDER BY report_id`,
  road_events: (id) =>
    `SELECT scenario_id, event_id, intersection, type, severity\nFROM REDTOWER.road_events\nWHERE scenario_id = '${id}'`,
  cameras: (id) =>
    `SELECT scenario_id, camera_id, intersection, state\nFROM REDTOWER.cameras\nWHERE scenario_id = '${id}'`,
  weather: (id) =>
    `SELECT scenario_id, condition, rain_intensity\nFROM REDTOWER.weather\nWHERE scenario_id = '${id}'`,
  vehicles: () =>
    `SELECT vehicle_id, capacity\nFROM REDTOWER.vehicles\nORDER BY vehicle_id`,
};

export function SourceItem({
  source,
  count,
  classifies,
  loaded,
  selected,
  onSelect,
}: {
  source: SourceSpec;
  count: number;
  classifies: string;
  loaded: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`grid min-h-11 w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-2 border-b border-rule px-3 py-2 text-left transition-colors duration-200 last:border-b-0 ${
        selected ? "bg-field" : "bg-card hover:bg-paper"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Database className={`size-4 shrink-0 ${source.usedToClassify ? "text-signal" : "text-hold"}`} aria-hidden />
        <span className="min-w-0">
          <span className="block truncate font-mono text-sm">{source.query}</span>
          <span className="block truncate text-xs text-muted-foreground">{source.file}</span>
        </span>
      </span>
      <span className="text-right">
        <span className="block font-mono text-xs">{count}</span>
        <span className={`block text-[11px] ${source.usedToClassify ? "text-signal" : "text-hold"}`}>
          {source.usedToClassify ? classifies : loaded}
        </span>
      </span>
    </button>
  );
}

export function SourceRack({
  lang,
  scenarioId,
  tables,
}: {
  lang: ChromeLang;
  scenarioId: string;
  tables: Record<string, SourceRow[]>;
}) {
  const copy = chromeCopy[lang].platform;
  const [query, setQuery] = useState("reports");
  const [viewMode, setViewMode] = useState<"table" | "sql">("table");

  const open = SOURCES.find((source) => source.query === query) ?? SOURCES[0];
  const rows = rowsFor(tables, open.query, scenarioId);
  const sqlGenerator = ZETARIS_QUERIES[open.query] || (() => `-- Query: ${open.query}`);
  const sqlQuery = sqlGenerator(scenarioId);

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">{copy.sources}</h2>
          <Badge className="bg-signal/10 text-signal border-signal/20 text-[10px] font-mono gap-1">
            <Sparkles className="size-2.5" /> Zetaris Lightning Data Fabric
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            className="h-8 gap-1 text-xs"
          >
            <TableProperties className="size-3.5" />
            Tabla
          </Button>
          <Button
            size="sm"
            variant={viewMode === "sql" ? "default" : "outline"}
            onClick={() => setViewMode("sql")}
            className="h-8 gap-1 text-xs"
          >
            <Code2 className="size-3.5" />
            SQL Zetaris
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <ol className="border-b border-rule lg:border-r lg:border-b-0">
          {SOURCES.map((source) => (
            <li key={source.query}>
              <SourceItem
                source={source}
                count={rowsFor(tables, source.query, scenarioId).length}
                classifies={copy.classifies}
                loaded={copy.loaded}
                selected={source.query === open.query}
                onSelect={() => setQuery(source.query)}
              />
            </li>
          ))}
        </ol>

        <div className="min-w-0 p-3">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-sm">{open.query}</p>
            <p className="text-xs text-muted-foreground">
              {open.file} · {copy.rows}: {rows.length} · {copy.total}: {tables[open.file]?.length ?? rows.length}
              {open.usedToClassify ? "" : ` · ${copy.loadedOnly}`}
            </p>
          </div>

          {open.query === "reports" ? <p className="mb-3 text-sm text-signal">{copy.untrusted}</p> : null}

          {viewMode === "sql" ? (
            <div className="rounded-md border border-rule bg-graphite p-4 text-bone">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule/30 pb-2 mb-3 text-xs text-bone/70">
                <span className="font-mono">POST /api/proxy/query/sql/start</span>
                <span>Base de Datos: <strong className="text-bone">REDTOWER</strong></span>
              </div>
              <pre className="font-mono text-xs leading-relaxed text-bone/90 overflow-x-auto whitespace-pre">
                {sqlQuery}
              </pre>
              <div className="mt-4 pt-3 border-t border-rule/20 flex flex-wrap items-center justify-between text-[11px] text-bone/60 font-mono">
                <span>Registros devueltos: {rows.length}</span>
                <span>Driver: Zetaris Lightning REST Proxy</span>
              </div>
            </div>
          ) : (
            <div className="max-h-[28rem] overflow-auto rounded-md border border-rule">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-field hover:bg-field">
                    {open.columns.map((column) => (
                      <TableHead
                        key={column}
                        className="sticky top-0 z-10 border-r border-b border-rule bg-field whitespace-nowrap"
                      >
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={open.columns.length} className="text-muted-foreground">
                        {copy.empty}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={`${row.scenario_id ?? "all"}-${index}`} className="hover:bg-paper/70">
                        {open.columns.map((column) => (
                          <TableCell
                            key={column}
                            className="border-r border-b border-rule font-mono text-xs whitespace-nowrap"
                          >
                            {row[column]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
