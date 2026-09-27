/**
 * SEO Agent Base Runner
 * 
 * Provides lifecycle management for agent runs: creates run records,
 * tracks metrics, handles errors, and updates status on completion.
 */

import { v4 as uuid } from "uuid";
import { query } from "@/lib/db";
import type { AgentType, AgentMetrics, RunStatus, StepStatus } from "./types";

export interface AgentRunContext {
  runId: string;
  startedAt: Date;
  metrics: AgentMetrics;
}

/**
 * Start a new agent run — creates the DB record and returns context.
 */
export async function startAgentRun(
  agentType: AgentType,
  options: { triggerManually?: boolean } = {}
): Promise<AgentRunContext> {
  const runId = `run_${agentType}_${Date.now()}_${uuid().substring(0, 8)}`;
  const startedAt = new Date();

  await query(
    `INSERT INTO seo_agent_run (id, agentType, status, startedAt, itemsProcessed, itemsSucceeded, costUsd)
     VALUES (?, ?, 'running', ?, 0, 0, 0)`,
    [runId, agentType, startedAt]
  );

  console.log(`[SEO Agent] Started ${agentType} run: ${runId} (trigger: ${options.triggerManually ? "manual" : "scheduled"})`);

  return {
    runId,
    startedAt,
    metrics: {},
  };
}

/**
 * Complete an agent run — update status, metrics, and summary.
 */
export async function completeAgentRun(
  runId: string,
  status: RunStatus,
  summary: string,
  metrics: AgentMetrics,
  errorMessage?: string
): Promise<void> {
  const completedAt = new Date();
  // fixes D15 — prefer the explicit counts agents now set; the OR-chain is only a
  // last-resort fallback for any call site that hasn't been updated to pass them.
  const itemsProcessed =
    metrics.itemsProcessed ??
    (metrics.keywordsDiscovered || metrics.pagesAudited || metrics.issuesFound || 0);
  const itemsSucceeded = metrics.itemsSucceeded ?? itemsProcessed;

  await query(
    `UPDATE seo_agent_run 
     SET status = ?, completedAt = ?, summary = ?, metrics = ?, itemsProcessed = ?, itemsSucceeded = ?, 
         errorMessage = ?, costUsd = ?
     WHERE id = ?`,
    [
      status,
      completedAt,
      summary,
      JSON.stringify(metrics),
      itemsProcessed,
      itemsSucceeded,
      errorMessage || null,
      metrics.totalCost || 0,
      runId,
    ]
  );

  console.log(`[SEO Agent] Completed run ${runId}: ${status} — ${summary}`);
}

/**
 * Log an error for an agent run without failing the whole run.
 */
export async function logAgentWarning(runId: string, warning: string): Promise<void> {
  console.warn(`[SEO Agent] Warning in ${runId}: ${warning}`);
}

/**
 * Fetch the last N runs for dashboard display.
 */
export async function getRecentRuns(limit = 20): Promise<Record<string, unknown>[]> {
  return query<Record<string, unknown>>(
    `SELECT * FROM seo_agent_run ORDER BY startedAt DESC LIMIT ?`,
    [limit]
  );
}

/**
 * Get dashboard stats for the SEO agent overview.
 */
export async function getAgentDashboardStats(): Promise<{
  keywordCount: number;
  trackingKeywordCount: number;
  rankingKeywordCount: number;
  pendingTaskCount: number;
  openIssueCount: number;
  contentGapCount: number;
  lastRunByType: Record<string, { status: string; startedAt: string; summary: string }>;
}> {
  const [kwCount] = await query<{ count: number }>("SELECT COUNT(*) as count FROM seo_keyword");
  const [trackingCount] = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM seo_keyword WHERE status = 'tracking'"
  );
  const [rankingCount] = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM seo_keyword WHERE currentRank IS NOT NULL AND currentRank > 0"
  );
  const [pendingTaskCount] = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM seo_optimization_task WHERE status = 'pending'"
  );
  const [openIssueCount] = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM seo_technical_issue WHERE status = 'open'"
  );
  const [gapCount] = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM seo_content_gap WHERE status = 'new'"
  );

  // Get last run for each agent type — fixes D16's ambiguous self-join (ties on
  // startedAt returned multiple rows per type). ROW_NUMBER() is supported on
  // MariaDB 10.2+ (this project runs 10.4.32) and MySQL 8+.
  const lastRuns = await query<{ agentType: string; status: string; startedAt: string; summary: string }>(
    `SELECT agentType, status, startedAt, summary FROM (
       SELECT agentType, status, startedAt, summary,
              ROW_NUMBER() OVER (PARTITION BY agentType ORDER BY startedAt DESC, id DESC) AS rn
       FROM seo_agent_run
     ) ranked WHERE rn = 1`
  );

  const lastRunByType: Record<string, { status: string; startedAt: string; summary: string }> = {};
  for (const run of lastRuns) {
    lastRunByType[run.agentType] = {
      status: run.status,
      startedAt: run.startedAt,
      summary: run.summary || "",
    };
  }

  return {
    keywordCount: kwCount?.count || 0,
    trackingKeywordCount: trackingCount?.count || 0,
    rankingKeywordCount: rankingCount?.count || 0,
    pendingTaskCount: pendingTaskCount?.count || 0,
    openIssueCount: openIssueCount?.count || 0,
    contentGapCount: gapCount?.count || 0,
    lastRunByType,
  };
}

// ─── Per-step progress (Phase 1.2) ────────────────────────────────────────────

/** Record the start of one pipeline step so the dashboard can show real progress. */
export async function startStep(runId: string, stepName: string): Promise<string> {
  const id = `step_${uuid().substring(0, 16)}`;
  await query(
    `INSERT INTO seo_agent_run_step (id, runId, stepName, status) VALUES (?, ?, ?, 'running')`,
    [id, runId, stepName]
  );
  return id;
}

/** Mark a step finished (or failed) and record how much it did. */
export async function endStep(
  stepId: string,
  status: StepStatus,
  detail?: string,
  itemCount = 0,
  costUsd = 0
): Promise<void> {
  await query(
    `UPDATE seo_agent_run_step SET status = ?, detail = ?, itemCount = ?, costUsd = ?, endedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
    [status, detail || null, itemCount, costUsd, stepId]
  );
}

/** Fetch every step recorded for a run, oldest first — used by the run detail view. */
export async function getRunSteps(runId: string): Promise<Record<string, unknown>[]> {
  return query<Record<string, unknown>>(
    `SELECT * FROM seo_agent_run_step WHERE runId = ? ORDER BY startedAt ASC`,
    [runId]
  );
}
