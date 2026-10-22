import { RUN_STEPS, type RunStepId } from "./run.ts";
import type { ScenarioFile } from "./scenarios.ts";
import { SOURCES } from "./sources.ts";

export type StepView = {
  id: RunStepId;
  actor: string;
  action: string;
  decides: boolean;
  summary: string;
  lines: string[];
};

export function runViews(scenario: ScenarioFile, counts: Record<string, number>): StepView[] {
  return RUN_STEPS.map((step) => ({
    id: step.id,
    actor: step.actor,
    action: step.action,
    decides: step.decides,
    summary: summaryFor(scenario, step.id),
    lines: linesFor(scenario, counts, step.id),
  }));
}

function summaryFor(scenario: ScenarioFile, id: RunStepId): string {
  const ranked = rankedActions(scenario);
  if (id === "planner") return `${SOURCES.length} queries`;
  if (id === "load") return `${SOURCES.length} sources`;
  if (id === "rank") {
    return `${scenario.recommendation.recommended_action} ${scenario.recommendation.passenger_minutes}`;
  }
  if (id === "diagnostician") {
    return `${scenario.incident.status} ${scenario.incident.incident_type}`;
  }
  if (id === "scenario") return scenario.alternatives.map((item) => item.action).join(" · ");
  if (id === "judge") {
    const first = ranked[0];
    return first ? `01 ${first.action}` : "—";
  }
  return scenario.evidence_ids[0] ?? "—";
}

function linesFor(scenario: ScenarioFile, counts: Record<string, number>, id: RunStepId): string[] {
  const ranked = rankedActions(scenario);
  if (id === "planner") {
    return [`file ${scenario.file_id}`, `scenario ${scenario.scenario_id}`, ...SOURCES.map((source) => source.query)];
  }
  if (id === "load") {
    return SOURCES.map((source) => `${source.query}=${counts[source.query] ?? 0}`);
  }
  if (id === "rank") {
    return [
      `status ${scenario.incident.status}`,
      `type ${scenario.incident.incident_type}`,
      `confidence ${scenario.incident.confidence}`,
      ...ranked.map((item) => `${item.action} ${item.passenger_minutes}`),
      `winner ${scenario.recommendation.recommended_action} ${scenario.recommendation.passenger_minutes} vs ${scenario.recommendation.baseline_passenger_minutes}`,
    ];
  }
  if (id === "diagnostician") {
    return [
      `status ${scenario.incident.status}`,
      `type ${scenario.incident.incident_type}`,
      `confidence ${scenario.incident.confidence}`,
    ];
  }
  if (id === "scenario") return scenario.alternatives.map((item) => item.action);
  if (id === "judge") {
    return ranked.map(
      (item, index) => `${String(index + 1).padStart(2, "0")} ${item.action} ${item.passenger_minutes}`,
    );
  }
  const cites =
    scenario.evidence_ids.length > 0 ? scenario.evidence_ids.map((evidence) => `cite ${evidence}`) : ["cite —"];
  return [scenario.recommendation.text, ...cites];
}

function rankedActions(scenario: ScenarioFile) {
  return [...scenario.alternatives].sort((a, b) => a.passenger_minutes - b.passenger_minutes);
}
