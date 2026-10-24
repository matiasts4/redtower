import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runViews, type StepView } from "./replay.ts";
import type { ScenarioFile } from "./scenarios.ts";
import { SOURCES, rowsFor, type SourceRow } from "./sources.ts";

export type RealTraceStep = StepView & {
  timestamp?: string;
  model?: string;
  durationMs?: number;
  inputSummary?: string;
  outputRaw?: string;
  targetAgent?: string;
  retryCount?: number;
  status?: string;
  isReal?: boolean;
};

export type TraceRecord = {
  timestamp: string;
  agent_name: string;
  role: string;
  action: string;
  input_summary: string;
  output_summary: string;
  target_agent: string;
  model: string;
  scenario_id: string;
  retry_count: number;
  status: string;
  duration_ms?: number;
};

const STATIC_LOGS: Record<string, string> = {
  "scn-block": "trace_20261023T154116668501Z.jsonl",
  "scn-block-approved": "trace_20261023T154117284364Z.jsonl",
  "scn-false": "trace_20261023T154116502872Z.jsonl",
  "scn-normal": "trace_20261023T154116333498Z.jsonl",
  "scn-stopped": "trace_20261023T154116890986Z.jsonl",
  "scn-surge": "trace_20261023T154130328075Z.jsonl",
};

function logsDir(): string {
  const fromHere = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../logs",
  );
  if (existsSync(/*turbopackIgnore: true*/ fromHere)) return fromHere;
  const fromCwd = path.resolve(process.cwd(), "..", "logs");
  if (existsSync(/*turbopackIgnore: true*/ fromCwd)) return fromCwd;
  return path.resolve(process.cwd(), "logs");
}

function stepIdFor(role: string, action: string): string {
  if (action === "load_sources") return "load";
  if (action === "rank_alternatives") return "rank";
  if (role === "planner") return "planner";
  if (role === "diagnostician") return "diagnostician";
  if (role === "scenario") return "scenario";
  if (role === "judge") return "judge";
  if (role === "reporter") return "reporter";
  return action || role;
}

export function loadRealTrace(
  scenario: ScenarioFile,
  counts: Record<string, number>,
): RealTraceStep[] {
  const candidate = scenario.trace_file;
  const fileName =
    candidate && existsSync(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ logsDir(), candidate))
      ? candidate
      : STATIC_LOGS[scenario.file_id] || STATIC_LOGS[scenario.scenario_id];
  if (!fileName) {
    return runViews(scenario, counts);
  }

  const tracePath = path.join(/*turbopackIgnore: true*/ logsDir(), fileName);
  if (!existsSync(/*turbopackIgnore: true*/ tracePath)) {
    return runViews(scenario, counts);
  }

  try {
    const text = readFileSync(/*turbopackIgnore: true*/ tracePath, "utf8").trim();
    if (!text) {
      return runViews(scenario, counts);
    }
    const lines = text.split(/\r?\n/).filter(Boolean);
    const records: TraceRecord[] = lines.map((line) => JSON.parse(line));

    return traceRecordsToSteps(records);
  } catch {
    return runViews(scenario, counts);
  }
}

export function traceRecordsToSteps(records: TraceRecord[]): RealTraceStep[] {
  return records.map((rec, index) => {
      const id = stepIdFor(rec.role, rec.action) as any;
      const decides = rec.role === "host";

      let durationMs = rec.duration_ms ?? 0;
      if (durationMs === 0 && index > 0) {
        const prevTime = new Date(records[index - 1].timestamp).getTime();
        const currTime = new Date(rec.timestamp).getTime();
        if (!isNaN(prevTime) && !isNaN(currTime) && currTime >= prevTime) {
          durationMs = currTime - prevTime;
        }
      }

      let formattedOutput: string[] = [];
      try {
        const parsed = JSON.parse(rec.output_summary);
        formattedOutput = JSON.stringify(parsed, null, 2).split("\n");
      } catch {
        formattedOutput = rec.output_summary.split(/\r?\n/);
      }

      const displayLines: string[] = [
        `[${rec.timestamp}] ${rec.role} (${rec.action})`,
        `model: ${rec.model}`,
        `target: ${rec.target_agent || "host"} · status: ${rec.status}${rec.retry_count > 0 ? ` (retry ${rec.retry_count})` : ""}`,
        `duration: ${durationMs > 0 ? `${(durationMs / 1000).toFixed(1)}s` : "<0.1s"}`,
        "--- input summary ---",
        rec.input_summary,
        "--- output ---",
        ...formattedOutput,
      ];

      return {
        id,
        actor: rec.agent_name || rec.role,
        action: rec.action || rec.role,
        decides,
        summary: rec.output_summary.slice(0, 70).replace(/\s+/g, " "),
        lines: displayLines,
        timestamp: rec.timestamp,
        model: rec.model,
        durationMs,
        inputSummary: rec.input_summary,
        outputRaw: rec.output_summary,
        targetAgent: rec.target_agent,
        retryCount: rec.retry_count,
        status: rec.status,
        isReal: true,
      };
    });
}

export function loadAllTraces(
  scenarios: ScenarioFile[],
  tables: Record<string, SourceRow[]>,
): Record<string, RealTraceStep[]> {
  const result: Record<string, RealTraceStep[]> = {};
  for (const scn of scenarios) {
    const counts = Object.fromEntries(
      SOURCES.map((source) => [
        source.query,
        rowsFor(tables, source.query, scn.scenario_id).length,
      ]),
    );
    result[scn.file_id] = loadRealTrace(scn, counts);
  }
  return result;
}
