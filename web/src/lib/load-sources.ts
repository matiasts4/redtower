import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCES, type SourceRow } from "./sources";

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

export function loadTables(): Record<string, SourceRow[]> {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../data/sample");
  return Object.fromEntries(
    SOURCES.map((source) => {
      const text = readFileSync(path.join(dir, source.file), "utf8").replace(/^\uFEFF/, "");
      const lines = text.trim().split(/\r?\n/);
      const headers = splitCsvLine(lines[0] ?? "");
      const rows = lines.slice(1).filter(Boolean).map((line) => {
        const cells = splitCsvLine(line);
        return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
      });
      return [source.file, rows];
    }),
  );
}
