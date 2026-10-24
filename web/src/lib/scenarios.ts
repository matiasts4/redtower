import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IDS = [
  "scn-block",
  "scn-false",
  "scn-normal",
  "scn-stopped",
  "scn-surge",
  "scn-block-approved",
] as const;

export type ScenarioId = (typeof IDS)[number];

export type ScenarioFile = {
  file_id: ScenarioId;
  scenario_id: string;
  model: string;
  trace_file?: string;
  incident: {
    status: "real" | "insufficient" | "clear";
    incident_type: string;
    confidence: number;
    evidence_ids: string[];
  };
  impact: {
    routes: string[];
    stop_count: number;
    stops?: string[];
    slow_vehicle_ids?: string[];
    passengers_20: number;
    waiting: number;
    arrival_per_min: number;
    board_per_min: number;
    moving_buses: number;
  };
  alternatives: Array<{
    action: string;
    passenger_minutes: number;
    cost: string;
    risk: string;
    queue_series?: number[];
  }>;
  recommendation: {
    recommended_action: string;
    passenger_minutes: number;
    baseline_passenger_minutes: number;
    saved: number;
    reduction_percent: number;
    text: string;
    action: string;
  };
  diagnosis: string;
  evidence_ids: string[];
  authorization: "pending_human" | "recorded";
  operator_decision: string | null;
  applied: false;
  limitations: string[];
  query_source?: string;
  classification_source?: string;
  explanation_source?: string;
  judge_agreed?: boolean;
};

function outputDir(): string {
  const fromHere = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../output_examples",
  );
  if (existsSync(fromHere)) return fromHere;
  return path.resolve(process.cwd(), "..", "output_examples");
}

export function loadScenarios(): ScenarioFile[] {
  return IDS.map((id) => {
    const file = path.join(outputDir(), `${id}.json`);
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Omit<ScenarioFile, "file_id">;
    if (parsed.applied !== false) {
      throw new Error(`${id} has applied=${String(parsed.applied)}`);
    }
    return { ...parsed, file_id: id };
  });
}
