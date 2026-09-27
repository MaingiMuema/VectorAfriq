/**
 * SEO Agent job worker (Phase 1.1).
 *
 * Started from `src/instrumentation.ts`'s `register()`, which Next.js runs exactly
 * once when a server instance boots — under `next dev`, `next start`, and this repo's
 * custom `server.js` alike (server.js's `app.prepare()` triggers the same Next
 * bootstrap). That's simpler and more portable than requiring a `.ts` file from a
 * plain Node script or duplicating logic into a CommonJS entrypoint.
 *
 * Deployment assumption: a long-lived Node process (this repo ships `server.js` and
 * has no Vercel/serverless config), so a single in-process polling worker is
 * sufficient. On a serverless platform this module would need a different strategy —
 * instrumentation runs per cold-start there and setInterval/setTimeout don't survive
 * a frozen instance.
 *
 * Claims jobs with a plain atomic UPDATE (not SELECT...FOR UPDATE SKIP LOCKED — this
 * project's DB is MariaDB 10.4.32, which lacks SKIP LOCKED until 10.6). One in-process
 * worker is the deployment target, so no distributed-locking is required beyond that.
 */

import { runSingleAgent, type AgentRunResult } from "./orchestrator";
import {
  claimNextJob,
  markJobRunning,
  heartbeatJob,
  completeJob,
  markJobCancelled,
  isCancelRequested,
  reclaimStaleJobs,
  sweepOrphanedRuns,
} from "./jobs";
import { startStep, endStep } from "./agent-runner";
import type { AgentType } from "./types";

const POLL_INTERVAL_MS = 3000;
const HEARTBEAT_INTERVAL_MS = 15000;
const RECLAIM_INTERVAL_MS = 60000;

const PIPELINE: AgentType[] = [
  "keyword_discovery",
  "on_page_optimization",
  "content_strategy",
  "technical_monitor",
  "ranking_tracker",
];

let running = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let reclaimTimer: ReturnType<typeof setInterval> | null = null;

async function processJob(job: { id: string; agentType: AgentType }): Promise<void> {
  const heartbeat = setInterval(() => {
    heartbeatJob(job.id).catch((err) => console.error("[SEO Worker] heartbeat failed:", err));
  }, HEARTBEAT_INTERVAL_MS);

  try {
    const steps: AgentType[] = job.agentType === "all" ? PIPELINE : [job.agentType];
    const results: AgentRunResult[] = [];
    let cancelled = false;

    for (let i = 0; i < steps.length; i++) {
      const agentType = steps[i];
      if (await isCancelRequested(job.id)) {
        cancelled = true;
        break;
      }

      // Steps are grouped by job.id rather than the per-agent seo_agent_run id: each
      // agent function still creates its own seo_agent_run row internally (via
      // startAgentRun), and "all" runs five of them sequentially with no single parent
      // run row to attach to. job.id is the one stable id that spans the whole job,
      // so GET /agent/jobs?active=1 joins seo_agent_run_step on it for live progress.
      const stepId = await startStep(job.id, agentType);
      try {
        const result = await runSingleAgent(agentType, false);
        results.push(result);
        if (i === 0) {
          await markJobRunning(job.id, result.runId);
        }
        await endStep(stepId, result.success ? "completed" : "failed", result.message);
      } catch (stepError) {
        await endStep(stepId, "failed", stepError instanceof Error ? stepError.message : String(stepError));
        results.push({
          runId: "",
          agentType,
          success: false,
          message: stepError instanceof Error ? stepError.message : "Unknown error",
        });
      }
    }

    if (cancelled) {
      await markJobCancelled(job.id);
      console.log(`[SEO Worker] Job ${job.id} cancelled between steps`);
      return;
    }

    const allSuccess = results.every((r) => r.success);
    await completeJob(job.id, allSuccess ? "completed" : "failed", allSuccess ? undefined : results.find((r) => !r.success)?.message);
  } catch (error) {
    await completeJob(job.id, "failed", error instanceof Error ? error.message : "Unknown error");
    console.error(`[SEO Worker] Job ${job.id} failed:`, error);
  } finally {
    clearInterval(heartbeat);
  }
}

async function tick(): Promise<void> {
  try {
    const job = await claimNextJob();
    if (job) {
      console.log(`[SEO Worker] Claimed job ${job.id} (${job.agentType})`);
      await processJob(job);
    }
  } catch (error) {
    console.error("[SEO Worker] Tick failed:", error);
  } finally {
    if (running) {
      pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
    }
  }
}

/** Start the worker loop. Idempotent — calling twice is a no-op. */
export function startWorker(): void {
  if (running) return;
  running = true;

  console.log("[SEO Worker] Starting...");

  // Sweep stale state left over from a previous process before accepting new work.
  sweepOrphanedRuns()
    .then((n) => n > 0 && console.log(`[SEO Worker] Marked ${n} orphaned run(s) as failed`))
    .catch((err) => console.error("[SEO Worker] Orphan sweep failed:", err));
  reclaimStaleJobs()
    .then((n) => n > 0 && console.log(`[SEO Worker] Reclaimed ${n} stale job(s)`))
    .catch((err) => console.error("[SEO Worker] Reclaim failed:", err));

  reclaimTimer = setInterval(() => {
    reclaimStaleJobs().catch((err) => console.error("[SEO Worker] Reclaim failed:", err));
  }, RECLAIM_INTERVAL_MS);

  pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
}

export function stopWorker(): void {
  running = false;
  if (pollTimer) clearTimeout(pollTimer);
  if (reclaimTimer) clearInterval(reclaimTimer);
  pollTimer = null;
  reclaimTimer = null;
}
