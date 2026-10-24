import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findRepoRoot, pythonExecutable } from "../../../lib/agent-launch";

export async function GET() {
  try {
    const repoRoot = findRepoRoot(fileURLToPath(import.meta.url));
    const result = spawnSync(pythonExecutable(repoRoot), ["run.py", "--check"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 20000,
    });
    const exitCode = result.status ?? 1;
    return Response.json({
      live_ready: exitCode === 0,
      exit_code: exitCode,
      sample_available: true,
    });
  } catch {
    return Response.json({
      live_ready: false,
      exit_code: 1,
      sample_available: true,
    });
  }
}
