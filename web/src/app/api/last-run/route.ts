import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertScenarioId, findRepoRoot, webOutputRelative } from "../../../lib/agent-launch";
import { traceRecordsToSteps, type TraceRecord } from "../../../lib/load-trace";

const TRACE_NAME = /^trace_[0-9]{8}T[0-9]+Z\.jsonl$/;

export async function GET(req: Request) {
  try {
    const scenarioId = assertScenarioId(new URL(req.url).searchParams.get("scenario_id"));
    const root = findRepoRoot(fileURLToPath(import.meta.url));
    const outputPath = path.join(root, webOutputRelative(scenarioId));
    if (!existsSync(outputPath)) return Response.json({ found: false });

    const result = JSON.parse(readFileSync(outputPath, "utf8")) as {
      applied?: boolean;
      model?: string;
      trace_file?: string;
    };
    if (result.applied !== false) return Response.json({ found: false });
    if (typeof result.model !== "string" || !result.model.toLowerCase().includes("nemotron")) {
      return Response.json({ found: false });
    }

    const traceName = typeof result.trace_file === "string" ? result.trace_file : "";
    let steps: ReturnType<typeof traceRecordsToSteps> = [];
    if (TRACE_NAME.test(traceName)) {
      const tracePath = path.join(root, "logs", traceName);
      if (existsSync(tracePath)) {
        const records = readFileSync(tracePath, "utf8")
          .trim()
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => JSON.parse(line) as TraceRecord);
        steps = traceRecordsToSteps(records);
      }
    }

    return Response.json({
      found: true,
      result: { ...result, file_id: scenarioId, applied: false },
      steps,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unavailable.";
    return Response.json({ found: false, error: message }, { status: 400 });
  }
}
