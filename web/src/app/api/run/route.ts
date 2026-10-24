import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertScenarioId,
  findRepoRoot,
  pythonExecutable,
  webOutputRelative,
} from "../../../lib/agent-launch";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const scenarioId = assertScenarioId(body.scenario_id || "scn-block");
    const mode = body.mode === "live" ? "live" : "sample";
    const repoRoot = findRepoRoot(fileURLToPath(import.meta.url));
    const inputPath = path.join(repoRoot, "input_examples", `${scenarioId}.json`);
    if (!existsSync(inputPath)) {
      return Response.json({ error: "Unknown scenario." }, { status: 400 });
    }

    const outputPath = webOutputRelative(scenarioId);
    const args = ["-u", "run.py", "--input", inputPath, "--output", outputPath, "--stream"];
    const env: NodeJS.ProcessEnv = { ...process.env, PYTHONUNBUFFERED: "1", PYTHONIOENCODING: "utf-8" };
    if (mode === "sample") {
      args.push("--sample");
      env.SAMPLE_MODE = "true";
    } else {
      delete env.SAMPLE_MODE;
    }

    const py = spawn(pythonExecutable(repoRoot), args, {
      cwd: repoRoot,
      env,
    });

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let buffer = "";

        const push = (payload: string) => {
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        };

        push(JSON.stringify({ event: "started", scenario_id: scenarioId }));

        py.stdout.on("data", (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.trim()) push(line);
          }
        });

        py.stderr.on("data", (chunk: Buffer) => {
          const errText = chunk.toString("utf8").trim();
          if (errText) push(JSON.stringify({ event: "stderr", message: errText }));
        });

        py.on("close", (code) => {
          if (buffer.trim()) push(buffer);
          push(JSON.stringify({ event: "done", exit_code: code }));
          controller.close();
        });

        py.on("error", (err) => {
          push(JSON.stringify({ event: "error", message: err.message }));
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Run failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
