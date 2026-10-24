import { existsSync } from "node:fs";
import path from "node:path";

const SCENARIO_ID = /^scn-[a-z]+$/;

function walkForRoot(start: string): string | null {
  let dir = start;
  for (let i = 0; i < 12; i += 1) {
    if (
      existsSync(path.join(dir, "run.py")) &&
      existsSync(path.join(dir, "input_examples"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

export function findRepoRoot(startFile?: string): string {
  const starts = [process.cwd(), path.resolve(process.cwd(), "..")];
  if (startFile) starts.unshift(path.dirname(startFile));
  for (const start of starts) {
    const found = walkForRoot(start);
    if (found) return found;
  }
  throw new Error("RED Control Tower root was not found.");
}

export function pythonExecutable(repoRoot: string): string {
  const windows = path.join(repoRoot, ".venv", "Scripts", "python.exe");
  const unix = path.join(repoRoot, ".venv", "bin", "python");
  if (existsSync(windows)) return windows;
  if (existsSync(unix)) return unix;
  return process.platform === "win32" ? "python" : "python3";
}

export function assertScenarioId(value: unknown): string {
  if (typeof value !== "string" || !SCENARIO_ID.test(value)) {
    throw new Error("Invalid scenario_id.");
  }
  return value;
}

export function webOutputRelative(scenarioId: string): string {
  return path.join("logs", `web_${scenarioId}.json`);
}
