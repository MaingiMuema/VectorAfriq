/**
 * Promo Video — job queue (MySQL-backed).
 *
 * `POST /api/admin/promo-video` inserts a queued row here and returns
 * immediately; `src/lib/promo-video/worker.ts` claims and executes jobs
 * out-of-band (started from src/instrumentation.ts), exactly like the SEO
 * agent worker.
 */

import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { v4 as uuid } from "uuid";
import { query, DatabaseValue } from "@/lib/db";
import type {
  JobScript,
  PromoVideoFormat,
  PromoVideoJob,
  PromoVideoStatus,
  ResolvedAsset,
} from "./types";

const HEARTBEAT_STALE_MS = 2 * 60 * 1000;

export const PROMO_VIDEOS_DIR = join(process.cwd(), ".promo-videos");

export function jobDir(jobId: string): string {
  return join(PROMO_VIDEOS_DIR, jobId);
}

export function ensureJobDir(jobId: string): string {
  const dir = jobDir(jobId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

interface JobRow {
  id: string;
  userId: string | null;
  prompt: string;
  model: string;
  format: string;
  uploadedAssets: string | null;
  status: string;
  progress: number;
  step: string | null;
  script: string | null;
  assets: string | null;
  videoFile: string | null;
  videoFileVertical: string | null;
  errorMessage: string | null;
  attempts: number;
  maxAttempts: number;
  claimedAt: string | null;
  heartbeatAt: string | null;
  createdAt: string;
  completedAt: string | null;
  createdBy: string | null;
}

function mapRow(row: JobRow): PromoVideoJob {
  return {
    ...row,
    format: row.format as PromoVideoFormat,
    status: row.status as PromoVideoStatus,
    uploadedAssets: row.uploadedAssets
      ? (JSON.parse(row.uploadedAssets) as string[])
      : null,
    script: row.script ? (JSON.parse(row.script) as JobScript) : null,
    assets: row.assets ? (JSON.parse(row.assets) as ResolvedAsset[]) : null,
  };
}

function jsonOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

export interface CreateJobInput {
  prompt: string;
  model: string;
  format: PromoVideoFormat;
  uploadedAssets?: string[];
  userId: string | null;
  createdBy: string | null;
}

export async function createJob(input: CreateJobInput): Promise<PromoVideoJob> {
  const id = `pvj_${uuid().replace(/-/g, "").substring(0, 20)}`;
  await query(
    `INSERT INTO promo_video_job
       (id, userId, prompt, model, format, uploadedAssets, status, createdBy)
     VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)`,
    [
      id,
      input.userId,
      input.prompt,
      input.model,
      input.format,
      jsonOrNull(input.uploadedAssets || null),
      input.createdBy,
    ]
  );
  const [row] = await query<JobRow>("SELECT * FROM promo_video_job WHERE id = ?", [id]);
  return mapRow(row);
}

export async function getJob(id: string): Promise<PromoVideoJob | null> {
  const [row] = await query<JobRow>("SELECT * FROM promo_video_job WHERE id = ?", [id]);
  return row ? mapRow(row) : null;
}

export async function listJobs(limit = 20, offset = 0): Promise<PromoVideoJob[]> {
  const rows = await query<JobRow>(
    `SELECT * FROM promo_video_job ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows.map(mapRow);
}

export async function listActiveJobs(): Promise<PromoVideoJob[]> {
  const rows = await query<JobRow>(
    `SELECT * FROM promo_video_job WHERE status IN ('queued','claimed','running') ORDER BY createdAt ASC`
  );
  return rows.map(mapRow);
}

export async function claimNextJob(): Promise<PromoVideoJob | null> {
  const candidates = await query<{ id: string }>(
    `SELECT id FROM promo_video_job WHERE status = 'queued' ORDER BY createdAt ASC LIMIT 1`
  );
  if (candidates.length === 0) return null;

  const result = await query<{ affectedRows: number }>(
    `UPDATE promo_video_job SET status = 'claimed', claimedAt = CURRENT_TIMESTAMP(3),
       heartbeatAt = CURRENT_TIMESTAMP(3), attempts = attempts + 1
     WHERE id = ? AND status = 'queued'`,
    [candidates[0].id]
  );
  const affected = (result as unknown as { affectedRows?: number }).affectedRows ?? 0;
  if (affected === 0) return null;

  const [row] = await query<JobRow>("SELECT * FROM promo_video_job WHERE id = ?", [candidates[0].id]);
  return row ? mapRow(row) : null;
}

export async function markJobRunning(jobId: string): Promise<void> {
  await query(
    `UPDATE promo_video_job SET status = 'running', heartbeatAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
    [jobId]
  );
}

export async function heartbeatJob(jobId: string): Promise<void> {
  await query(
    `UPDATE promo_video_job SET heartbeatAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
    [jobId]
  );
}

export async function updateJobProgress(
  jobId: string,
  progress: number,
  step: string
): Promise<void> {
  await query(
    `UPDATE promo_video_job SET progress = ?, step = ?, heartbeatAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
    [Math.max(0, Math.min(100, Math.round(progress))), step, jobId]
  );
}

export async function updateJobScript(
  jobId: string,
  script: JobScript
): Promise<void> {
  await query(`UPDATE promo_video_job SET script = ? WHERE id = ?`, [
    jsonOrNull(script),
    jobId,
  ]);
}

export async function updateJobAssets(
  jobId: string,
  assets: ResolvedAsset[]
): Promise<void> {
  await query(`UPDATE promo_video_job SET assets = ? WHERE id = ?`, [
    jsonOrNull(assets),
    jobId,
  ]);
}

export async function completeJob(
  jobId: string,
  fields: { videoFile?: string | null; videoFileVertical?: string | null }
): Promise<void> {
  const sets: string[] = [];
  const params: DatabaseValue[] = [];
  if (fields.videoFile !== undefined) {
    sets.push("videoFile = ?");
    params.push(fields.videoFile);
  }
  if (fields.videoFileVertical !== undefined) {
    sets.push("videoFileVertical = ?");
    params.push(fields.videoFileVertical);
  }
  sets.push("status = 'completed'");
  sets.push("progress = 100");
  sets.push("completedAt = CURRENT_TIMESTAMP(3)");
  params.push(jobId);
  // Never resurrect a cancelled job — a cancel that lands between the worker's
  // final status check and this UPDATE must win.
  await query(
    `UPDATE promo_video_job SET ${sets.join(", ")} WHERE id = ? AND status != 'cancelled'`,
    params
  );
}

export async function failJob(jobId: string, errorMessage: string): Promise<void> {
  await query(
    `UPDATE promo_video_job SET status = 'failed', errorMessage = ?, step = NULL WHERE id = ?`,
    [errorMessage, jobId]
  );
}

export async function cancelJob(jobId: string): Promise<boolean> {
  const result = await query<{ affectedRows: number }>(
    `UPDATE promo_video_job SET status = 'cancelled' WHERE id = ? AND status IN ('queued','claimed','running')`,
    [jobId]
  );
  return ((result as unknown as { affectedRows?: number }).affectedRows ?? 0) > 0;
}

export async function deleteJob(jobId: string): Promise<boolean> {
  const result = await query<{ affectedRows: number }>(
    `DELETE FROM promo_video_job WHERE id = ?`,
    [jobId]
  );
  const removed = ((result as unknown as { affectedRows?: number }).affectedRows ?? 0) > 0;
  if (removed) {
    try {
      const dir = jobDir(jobId);
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    } catch (err) {
      console.error(`[PromoVideo] Failed to remove job dir for ${jobId}:`, err);
    }
  }
  return removed;
}

/** Reclaim jobs whose worker died without heartbeating. */
export async function reclaimStaleJobs(): Promise<number> {
  const staleCutoff = new Date(Date.now() - HEARTBEAT_STALE_MS);
  const stale = await query<JobRow>(
    `SELECT * FROM promo_video_job WHERE status IN ('claimed','running') AND (heartbeatAt IS NULL OR heartbeatAt < ?)`,
    [staleCutoff]
  );
  let reclaimed = 0;
  for (const job of stale) {
    if (job.attempts >= job.maxAttempts) {
      await query(
        `UPDATE promo_video_job SET status = 'failed', errorMessage = 'Exceeded max attempts after heartbeat timeout' WHERE id = ?`,
        [job.id]
      );
    } else {
      await query(
        `UPDATE promo_video_job SET status = 'queued', claimedAt = NULL, heartbeatAt = NULL WHERE id = ?`,
        [job.id]
      );
      reclaimed++;
    }
  }
  return reclaimed;
}

