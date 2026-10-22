"use client";

import { useState } from "react";
import { Database } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chromeCopy, type ChromeLang } from "@/lib/copy";
import { SOURCES, rowsFor, type SourceRow, type SourceSpec } from "@/lib/sources";

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
  const open = SOURCES.find((source) => source.query === query) ?? SOURCES[0];
  const rows = rowsFor(tables, open.query, scenarioId);

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-card">
      <header className="border-b border-rule px-4 py-3">
        <h2 className="text-sm font-medium">{copy.sources}</h2>
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
        </div>
      </div>
    </section>
  );
}
