"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [open, setOpen] = useState<SourceSpec | null>(null);
  const rows = open ? rowsFor(tables, open.query, scenarioId) : [];
  const shown = rows.slice(0, 8);

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-medium">{copy.sources}</h2>
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((source) => (
          <Button
            key={source.query}
            variant={source.usedToClassify ? "secondary" : "outline"}
            onClick={() => setOpen(source)}
          >
            {source.query}
          </Button>
        ))}
      </div>
      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="max-w-3xl rounded-3xl">
          {open ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{open.query}</DialogTitle>
                <DialogDescription>
                  {open.file} · {copy.rows}: {rows.length}
                  {open.usedToClassify ? "" : ` · ${copy.loadedOnly}`}
                </DialogDescription>
              </DialogHeader>
              {open.query === "reports" ? (
                <p className="text-sm text-signal">{copy.untrusted}</p>
              ) : null}
              <div className="max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {open.columns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shown.map((row, index) => (
                      <TableRow key={`${row.scenario_id ?? "all"}-${index}`}>
                        {open.columns.map((column) => (
                          <TableCell key={column} className="font-mono text-xs">
                            {row[column]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
