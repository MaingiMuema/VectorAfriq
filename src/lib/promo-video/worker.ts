/**
 * Promo Video — job worker.
 *
 * Started from src/instrumentation.ts's register() (same mechanism as the SEO
 * agent worker). Claims queued promo_video_job rows and runs the pipeline:
 *
 *   1. script   — OpenRouter LLM writes the video script (0 → 15%)
 *   2. assets   — resolve/download/generate image assets (15 → 40%)
 *   3. render   — child process: TTS, music, timing, Remotion render (40 → 95%)
 *   4. finalize — persist output paths (95 → 100%)
 *
 * The render runs as a child process (promo-video/scripts/render-job.mjs) so
 * long renders never block the server.
 */

import { writeFileSync } from "fs";
import { join } from "path";
import {
  claimNextJob,
  ensureJobDir,
  getJob,
  heartbeatJob,
  markJobRunning,
  completeJob,
  failJob,
  reclaimStaleJobs,
  updateJobAssets,
  updateJobProgress,
  updateJobScript,
  jobDir,
} from "./jobs";
import { resolveAssets, setUploadedAssets } from "./assets";
import { generateScript } from "./llm";
import { promoVideoRoot, runRenderJob, type RenderResult } from "./render";

const POLL_INTERVAL_MS = 4000;
const HEARTBEAT_INTERVAL_MS = 15000;
const RECLAIM_INTERVAL_MS = 60000;

const VOICE = process.env.PROMO_VOICE || "en-GB-SoniaNeural";

/** Safety net: a job can never run past this wall-clock limit. Even if a stage
 *  hangs without erroring (network, renderer), the job fails instead of staying
 *  "running" forever and making the admin UI poll indefinitely. */
const MAX_JOB_DURATION_MS =
  Number(process.env.PROMO_VIDEO_MAX_JOB_MS) || 25 * 60 * 1000;

let running = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let reclaimTimer: ReturnType<typeof setInterval> | null = null;

async function isJobCancelled(jobId: string): Promise<boolean> {
  const job = await getJob(jobId);
  return job?.status === "cancelled";
}

async function processJob(jobId: string): Promise<void> {
  const job = await getJob(jobId);
  if (!job) return;

  const startedAt = Date.now();
  let timedOut = false;
  let timeoutHandled = false;
  // Only mark the timeout as handled once the DB write succeeded, so a transient
  // write failure is retried on the next heartbeat tick instead of leaving the
  // job running forever.
  const handleTimeout = async () => {
    if (timeoutHandled) return;
    console.error(`[PromoVideo Worker] Job ${jobId} exceeded ${Math.round(MAX_JOB_DURATION_MS / 60000)} min — failing.`);
    try {
      await failJob(jobId, "Job exceeded the maximum allowed duration and was stopped.");
      timeoutHandled = true;
    } catch (err) {
      console.error("[PromoVideo Worker] timeout failJob write failed:", err);
    }
  };

  const heartbeat = setInterval(() => {
    if (Date.now() - startedAt > MAX_JOB_DURATION_MS) {
      timedOut = true;
      handleTimeout().catch(() => undefined);
    } else {
      heartbeatJob(jobId).catch((err) =>
        console.error("[PromoVideo Worker] heartbeat failed:", err)
      );
    }
  }, HEARTBEAT_INTERVAL_MS);

  const remainingBudget = () =>
    Math.max(60_000, MAX_JOB_DURATION_MS - (Date.now() - startedAt));

  try {
    await markJobRunning(jobId);
    ensureJobDir(jobId);

    // Admin-uploaded assets take priority in the resolver.
    setUploadedAssets(job.uploadedAssets || []);

    // ── 1. Script generation (LLM) ───────────────────────────────────────────
    await updateJobProgress(jobId, 3, "Writing script…");
    const { script } = await generateScript(job.prompt, job.model);
    if (timedOut) return;
    await updateJobScript(jobId, script);
    await updateJobProgress(jobId, 15, "Script ready");

    if (timedOut || (await isJobCancelled(jobId))) return;

    // ── 2. Asset resolution ───────────────────────────────────────────────────
    await updateJobProgress(jobId, 16, "Finding image assets…");
    const { script: scriptWithImages, assets } = await resolveAssets(
      script,
      jobId,
      promoVideoRoot(),
      (done, total, key) => {
        const pct = 15 + (done / Math.max(1, total)) * 25;
        updateJobProgress(jobId, pct, `Assets ${done}/${total} (${key})`).catch(() => undefined);
      }
    );
    if (timedOut) return;
    await updateJobScript(jobId, scriptWithImages);
    await updateJobAssets(jobId, assets);
    await updateJobProgress(jobId, 40, "Assets ready");

    if (timedOut || (await isJobCancelled(jobId))) return;

    // ── 3. Render (child process) ─────────────────────────────────────────────
    const dir = jobDir(jobId);
    writeFileSync(join(dir, "script.json"), JSON.stringify(scriptWithImages));

    let renderResult: RenderResult | null = null;
    await updateJobProgress(jobId, 42, "Starting render…");
    renderResult = await runRenderJob({
      jobDir: dir,
      format: job.format,
      voice: VOICE,
      timeoutMs: remainingBudget(),
      onProgress: (e) => {
        const stageBase = e.stage === "render" ? 55 : 42;
        const stageSpan = e.stage === "render" ? 40 : 10;
        const pct = stageBase + (e.progress / 100) * stageSpan;
        updateJobProgress(jobId, pct, e.message || e.stage).catch(() => undefined);
      },
      onLog: (msg) => console.log(`[PromoVideo] ${msg}`),
    });

    if (timedOut || (await isJobCancelled(jobId))) return;

    // ── 4. Finalize ───────────────────────────────────────────────────────────
    await updateJobProgress(jobId, 96, "Finalizing…");
    const hasLandscape = renderResult.formats.some((f) => f.format === "landscape");
    const hasVertical = renderResult.formats.some((f) => f.format === "vertical");
    await completeJob(jobId, {
      videoFile: hasLandscape ? "out.mp4" : null,
      videoFileVertical: hasVertical ? "out-vertical.mp4" : null,
    });
    console.log(`[PromoVideo Worker] Job ${jobId} completed`);
  } catch (error) {
    if (timedOut) return; // already failed by the watchdog
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PromoVideo Worker] Job ${jobId} failed:`, error);
    await failJob(jobId, message);
  } finally {
    clearInterval(heartbeat);
  }
}

async function tick(): Promise<void> {
  try {
    const job = await claimNextJob();
    if (job) {
      console.log(`[PromoVideo Worker] Claimed job ${job.id} (${job.format}, ${job.model})`);
      await processJob(job.id);
    }
  } catch (error) {
    console.error("[PromoVideo Worker] Tick failed:", error);
  } finally {
    if (running) {
      pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
    }
  }
}

/** Start the worker loop. Idempotent. */
export function startPromoVideoWorker(): void {
  if (running) return;
  running = true;

  console.log("[PromoVideo Worker] Starting...");

  reclaimStaleJobs()
    .then((n) => n > 0 && console.log(`[PromoVideo Worker] Reclaimed ${n} stale job(s)`))
    .catch((err) => console.error("[PromoVideo Worker] Reclaim failed:", err));

  reclaimTimer = setInterval(() => {
    reclaimStaleJobs().catch((err) =>
      console.error("[PromoVideo Worker] Reclaim failed:", err)
    );
  }, RECLAIM_INTERVAL_MS);

  pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
}

export function stopPromoVideoWorker(): void {
  running = false;
  if (pollTimer) clearTimeout(pollTimer);
  if (reclaimTimer) clearInterval(reclaimTimer);
  pollTimer = null;
  reclaimTimer = null;
}
