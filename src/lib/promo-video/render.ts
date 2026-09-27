/**
 * Promo Video — render runner.
 *
 * Spawns the promo-video package's render-job script as a child process so the
 * long-running Remotion render (bundle + browser render + audio) never blocks
 * the Next.js server. Progress is streamed back on tab-separated lines.
 */

import { spawn } from "child_process";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { PromoVideoFormat } from "./types";

export interface RenderProgressEvent {
  stage: string;
  progress: number;
  message: string;
}

export interface RenderResult {
  formats: Array<{
    format: "landscape" | "vertical";
    file: string;
    filename: string;
    durationInFrames: number;
    durationSeconds: number;
    width: number;
    height: number;
  }>;
  schedule: unknown;
  durationInFrames: number;
  durationSeconds: number;
  scenes: unknown;
}

export function promoVideoRoot(): string {
  return join(process.cwd(), "promo-video");
}

/**
 * Resolve the absolute path of the render-job script at runtime.
 *
 * Turbopack statically analyzes `spawn` targets and tries to resolve them as
 * build-time module imports. `process.cwd()` is folded to a virtual `/ROOT`
 * during the build, so any statically-known script path fails with "server
 * relative imports are not implemented yet". Round-tripping the path through
 * a file on disk keeps it opaque to that analysis (the spawn target is a
 * plain `fs` read — Turbopack sees a purely dynamic value) while remaining
 * fully deterministic at runtime.
 */
const SCRIPT_DIR = join(process.cwd(), ".promo-video");
const SCRIPT_PATH_FILE = join(SCRIPT_DIR, "render-script-path.txt");

function renderJobScriptPath(): string {
  try {
    mkdirSync(SCRIPT_DIR, { recursive: true });
    // Rewrite the marker on every render so the stored path can never go stale.
    writeFileSync(
      SCRIPT_PATH_FILE,
      join(promoVideoRoot(), "scripts", "render-job.mjs"),
      "utf-8"
    );
  } catch {
    // a pre-existing marker still works if the write failed
  }
  // NB: the read and the throw must stay OUTSIDE the try/catch — Turbopack
  // folds the spawn target and hard-errors if the function's possible return
  // values include a constant (a wrapped throw would surface as `undefined`).
  const stored = readFileSync(SCRIPT_PATH_FILE, "utf-8").trim();
  if (!stored) throw new Error("Promo video render script path is missing");
  return stored;
}

export interface RunRenderOptions {
  jobDir: string;
  format: PromoVideoFormat;
  voice?: string;
  /** Hard wall-clock limit for the child process (default 20 min). */
  timeoutMs?: number;
  onProgress?: (event: RenderProgressEvent) => void;
  onLog?: (message: string) => void;
  onDone?: (result: RenderResult) => void;
  onError?: (message: string) => void;
}

export function runRenderJob(options: RunRenderOptions): Promise<RenderResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = renderJobScriptPath();
    const args = [
      scriptPath,
      "--jobDir",
      options.jobDir,
      "--format",
      options.format,
    ];
    if (options.voice) {
      args.push("--voice", options.voice);
    }

    const child = spawn("node", args, {
      cwd: promoVideoRoot(),
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    let settled = false;

    // Every settlement path must disarm the kill timer (a lingering timer would
    // otherwise hold the Node process open). Declared before killTimer so
    // `finish` can reference it; callbacks only run asynchronously.
    let killTimer: ReturnType<typeof setTimeout> | null = null;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (killTimer) clearTimeout(killTimer);
      fn();
    };

    // Hard timeout: kill the render child so a wedged render (or hung TTS)
    // can never leave a job "running" forever.
    const timeoutMs = options.timeoutMs ?? 20 * 60 * 1000;
    killTimer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // already gone
      }
      options.onError?.("Render process timed out — it was force-stopped.");
      finish(() =>
        reject(new Error("Render process timed out — it was force-stopped."))
      );
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      for (const rawLine of text.split("\n")) {
        const line = rawLine.trim();
        if (!line) continue;
        const parts = line.split("\t");
        const kind = parts[0];
        if (kind === "PROMO_JOB_PROGRESS") {
          options.onProgress?.({
            stage: parts[1] || "render",
            progress: Number(parts[2] || 0),
            message: parts[3] || "",
          });
        } else if (kind === "PROMO_JOB_LOG") {
          options.onLog?.(parts.slice(1).join("\t"));
        } else if (kind === "PROMO_JOB_DONE") {
          try {
            const result = JSON.parse(parts.slice(1).join("\t")) as RenderResult;
            options.onDone?.(result);
            finish(() => resolve(result));
          } catch (err) {
            finish(() => reject(new Error(`Failed to parse render result: ${(err as Error).message}`)));
          }
        } else if (kind === "PROMO_JOB_ERROR") {
          const message = parts.slice(1).join("\t");
          options.onError?.(message);
          finish(() => reject(new Error(message)));
        } else {
          // ordinary stdout (progress bar noise etc.)
        }
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      finish(() => reject(new Error(`Failed to start render process: ${err.message}`)));
    });

    child.on("close", (code) => {
      if (!settled) {
        const tail = stderr.trim().split("\n").slice(-5).join(" ");
        finish(() =>
          reject(
            new Error(
              `Render process exited with code ${code}${tail ? `: ${tail}` : ""}`
            )
          )
        );
      }
    });
  });
}
