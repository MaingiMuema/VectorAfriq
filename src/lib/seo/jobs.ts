/**
 * SEO Agent job queue (Phase 1.1).
 *
 * `POST /agent/run` enqueues a row here and returns immediately; `worker.ts` claims
 * and executes jobs out-of-band. This is what makes agent runs survive HTTP/proxy
 * timeouts and lets two admins share one run instead of racing (D2).
 */

import { v4 as uuid } from "uuid";
import { query } from "@/lib/db";
import type { AgentType, JobStatus, SeoAgentJob } from "./types";

const HEARTBEAT_STALE_MS = 2 * 60 * 1000; // 2 minutes — matches spec's reclaim window

interface JobRow {
  id: string;
  agentType: string;
  status: JobStatus;
  params: string | null;
  runId: string | null;
  attempts: number;
  maxAttempts: number;
  claimedAt: string | null;
  heartbeatAt: string | null;
  cancelRequested: number;
  errorMessage: string | null;
  createdAt: string;
  createdBy: string | null;
}

function mapRow(row: JobRow): SeoAgentJob {
  return {
    ...row,
    agentType: row.agentType as AgentType,
    params: row.params ? JSON.parse(row.params) : null,
    cancelRequested: !!row.cancelRequested,
  };
}

/**
 * Enqueue a job. Returns `{ conflict: true }` instead of creating a duplicate if a
 * job for the same agentType is already queued/claimed/running (D2's concurrency guard).
 */
export async function enqueueJob(
  agentType: AgentType,
  createdBy: string | null,
  params: Record<string, unknown> | null = null
): Promise<{ job: SeoAgentJob } | { conflict: SeoAgentJob }> {
  const existing = await query<JobRow>(
    `SELECT * FROM seo_agent_job WHERE agentType = ? AND status IN ('queued','claimed','running') ORDER BY createdAt DESC LIMIT 1`,
    [agentType]
  );
  if (existing.length > 0) {
    return { conflict: mapRow(existing[0]) };
  }

  const id = `job_${uuid().replace(/-/g, "").substring(0, 20)}`;
  await query(
    `INSERT INTO seo_agent_job (id, agentType, status, params, createdBy) VALUES (?, ?, 'queued', ?, ?)`,
    [id, agentType, params ? JSON.stringify(params) : null, createdBy]
  );

  const [row] = await query<JobRow>("SELECT * FROM seo_agent_job WHERE id = ?", [id]);
  return { job: mapRow(row) };
}

/**
 * Atomically claim the oldest queued job. Uses a plain UPDATE...ORDER BY...LIMIT 1
 * rather than SELECT...FOR UPDATE SKIP LOCKED — this project's DB is MariaDB 10.4.32,
 * which doesn't support SKIP LOCKED until 10.6. Safe with a single in-process worker;
 * if multiple workers are ever run, this still avoids double-claiming an already-updated
 * row (only one UPDATE can flip a given row from 'queued', the rest match 0 rows).
 */
export async function claimNextJob(): Promise<SeoAgentJob | null> {
  const candidates = await query<{ id: string }>(
    `SELECT id FROM seo_agent_job WHERE status = 'queued' ORDER BY createdAt ASC LIMIT 1`
  );
  if (candidates.length === 0) return null;

  const result = await query<{ affectedRows: number }>(
    `UPDATE seo_agent_job SET status = 'claimed', claimedAt = CURRENT_TIMESTAMP(3), heartbeatAt = CURRENT_TIMESTAMP(3), attempts = attempts + 1
     WHERE id = ? AND status = 'queued'`,
    [candidates[0].id]
  );
  const affected = (result as unknown as { affectedRows?: number }).affectedRows ?? 0;
  if (affected === 0) return null; // lost the race (or a second worker claimed it first)

  const [row] = await query<JobRow>("SELECT * FROM seo_agent_job WHERE id = ?", [candidates[0].id]);
  return mapRow(row);
}

export async function markJobRunning(jobId: string, runId: string): Promise<void> {
  await query(
    `UPDATE seo_agent_job SET status = 'running', runId = ?, heartbeatAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
    [runId, jobId]
  );
}

export async function heartbeatJob(jobId: string): Promise<void> {
  await query(`UPDATE seo_agent_job SET heartbeatAt = CURRENT_TIMESTAMP(3) WHERE id = ?`, [jobId]);
}

export async function completeJob(jobId: string, status: "completed" | "failed", errorMessage?: string): Promise<void> {
  await query(
    `UPDATE seo_agent_job SET status = ?, errorMessage = ? WHERE id = ?`,
    [status, errorMessage || null, jobId]
  );
}

export async function requestCancelJob(jobId: string): Promise<boolean> {
  const result = await query<{ affectedRows: number }>(
    `UPDATE seo_agent_job SET cancelRequested = 1 WHERE id = ? AND status IN ('queued','claimed','running')`,
    [jobId]
  );
  return ((result as unknown as { affectedRows?: number }).affectedRows ?? 0) > 0;
}

export async function isCancelRequested(jobId: string): Promise<boolean> {
  const [row] = await query<{ cancelRequested: number }>(
    `SELECT cancelRequested FROM seo_agent_job WHERE id = ?`,
    [jobId]
  );
  return !!row?.cancelRequested;
}

export async function markJobCancelled(jobId: string): Promise<void> {
  await query(`UPDATE seo_agent_job SET status = 'cancelled' WHERE id = ?`, [jobId]);
}

export async function listActiveJobs(): Promise<SeoAgentJob[]> {
  const rows = await query<JobRow>(
    `SELECT * FROM seo_agent_job WHERE status IN ('queued','claimed','running') ORDER BY createdAt ASC`
  );
  return rows.map(mapRow);
}

/**
 * Reclaim jobs whose worker died without heartbeating — moves them back to 'queued'
 * (if attempts remain) or 'failed' (maxAttempts exhausted). Call on worker startup
 * and periodically while it runs.
 */
export async function reclaimStaleJobs(): Promise<number> {
  const staleCutoff = new Date(Date.now() - HEARTBEAT_STALE_MS);
  const stale = await query<JobRow>(
    `SELECT * FROM seo_agent_job WHERE status IN ('claimed','running') AND (heartbeatAt IS NULL OR heartbeatAt < ?)`,
    [staleCutoff]
  );

  let reclaimed = 0;
  for (const job of stale) {
    if (job.attempts >= job.maxAttempts) {
      await query(
        `UPDATE seo_agent_job SET status = 'failed', errorMessage = 'Exceeded max attempts after heartbeat timeout' WHERE id = ?`,
        [job.id]
      );
    } else {
      await query(
        `UPDATE seo_agent_job SET status = 'queued', claimedAt = NULL, heartbeatAt = NULL WHERE id = ?`,
        [job.id]
      );
      reclaimed++;
    }
    // Also mark the orphaned seo_agent_run (if any) as failed so dashboards don't show it stuck running forever.
    if (job.runId) {
      await query(
        `UPDATE seo_agent_run SET status = 'failed', completedAt = CURRENT_TIMESTAMP(3), errorMessage = 'orphaned — worker died without heartbeat' WHERE id = ? AND status = 'running'`,
        [job.runId]
      );
    }
  }
  return reclaimed;
}

/**
 * Sweep on worker start: any `seo_agent_run` still `running` with no live job backing
 * it (e.g. from before this worker existed, or a crash that lost its job row) gets
 * marked failed/orphaned so it doesn't block the concurrency guard forever.
 */
export async function sweepOrphanedRuns(): Promise<number> {
  const result = await query<{ affectedRows: number }>(
    `UPDATE seo_agent_run r
     SET status = 'failed', completedAt = CURRENT_TIMESTAMP(3), errorMessage = 'orphaned'
     WHERE status = 'running'
       AND NOT EXISTS (SELECT 1 FROM seo_agent_job j WHERE j.runId = r.id AND j.status IN ('queued','claimed','running'))`
  );
  return (result as unknown as { affectedRows?: number }).affectedRows ?? 0;
}
