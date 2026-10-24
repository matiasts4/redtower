import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertScenarioId, findRepoRoot } from "../../../lib/agent-launch";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const scenarioId = assertScenarioId(body.scenario_id || "scn-block");
    const decision = body.decision === "reject" ? "reject" : "approve";
    const record = {
      timestamp: new Date().toISOString(),
      scenario_id: scenarioId,
      operator_name: body.operator_name || "Operador Control Tower",
      decision,
      reason:
        body.reason ||
        (decision === "approve"
          ? "Revisión y validación de alternativa de menor daño"
          : "Rechazo operativo preventivo"),
      applied: false,
      limitations: [
        "The system does not change routes.",
        "Recommendations require human operator confirmation.",
      ],
    };

    const logsDir = path.join(findRepoRoot(fileURLToPath(import.meta.url)), "logs");
    mkdirSync(logsDir, { recursive: true });
    appendFileSync(path.join(logsDir, "approvals.jsonl"), `${JSON.stringify(record)}\n`, "utf8");

    return Response.json({
      success: true,
      authorization: "recorded",
      operator_decision: record.decision,
      operator_name: record.operator_name,
      applied: false,
      timestamp: record.timestamp,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Approval failed.";
    return Response.json({ error: message, applied: false }, { status: 400 });
  }
}
