/**
 * SEO Agent Types
 * 
 * Shared types for the SEO agent system.
 */

// ─── Database row types ──────────────────────────────────────────────────────

export interface SeoAgentRun {
  id: string;
  agentType: AgentType;
  status: RunStatus;
  startedAt: string;
  completedAt: string | null;
  itemsProcessed: number;
  itemsSucceeded: number;
  summary: string | null;
  metrics: AgentMetrics | null;
  errorMessage: string | null;
  costUsd: number;
}

export interface SeoKeyword {
  id: string;
  keyword: string;
  cluster: string | null;
  intent: KeywordIntent;
  searchVolumeEst: number;
  difficulty: number;
  currentRank: number | null;
  bestRank: number | null;
  lastChecked: string | null;
  competitorUrls: string[] | null;
  targetUrl: string | null;
  status: KeywordStatus;
  priority: number;
  location: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeoOptimizationTask {
  id: string;
  pageUrl: string;
  pageType: PageType;
  issueType: IssueType;
  severity: Severity;
  currentValue: string | null;
  proposedValue: string | null;
  llmReasoning: string | null;
  keywordId: string | null;
  status: TaskStatus;
  appliedAt: string | null;
  agentRunId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeoRanking {
  id: string;
  keywordId: string;
  position: number | null;
  previousPosition: number | null;
  changeAmount: number;
  url: string | null;
  checkedAt: string;
  searchEngine: string;
}

export interface SeoContentGap {
  id: string;
  gapType: ContentGapType;
  title: string | null;
  targetKeyword: string | null;
  suggestedUrl: string | null;
  contentBrief: string | null;
  priorityScore: number;
  competitorExamples: string[] | null;
  status: ContentGapStatus;
  propertyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeoTechnicalIssue {
  id: string;
  issueType: TechnicalIssueType;
  url: string;
  detail: string | null;
  severity: Severity;
  status: IssueStatus;
  firstDetected: string;
  lastDetected: string;
  resolvedAt: string | null;
}

// ─── Enum types ──────────────────────────────────────────────────────────────

export type AgentType =
  | "keyword_discovery"
  | "on_page_optimization"
  | "content_strategy"
  | "technical_monitor"
  | "ranking_tracker"
  | "all";

export type RunStatus = "running" | "completed" | "failed" | "partial";

export type KeywordIntent = "commercial" | "transactional" | "informational" | "navigational";

export type KeywordStatus = "new" | "tracking" | "optimized" | "ranking" | "abandoned";

export type PageType =
  | "static"
  | "property_listing"
  | "location_page"
  | "blog_post"
  | "service_page"
  | "category_page";

export type IssueType =
  | "title_length"
  | "meta_description"
  | "title_duplicate"
  | "title_keyword"
  | "heading_structure"
  | "missing_alt"
  | "canonical"
  | "structured_data"
  | "thin_content"
  | "keyword_stuffing"
  | "missing_keyword"
  | "content_quality";

export type Severity = "critical" | "high" | "medium" | "low";

export type TaskStatus = "pending" | "applied" | "rejected" | "auto_applied" | "failed";

export type ContentGapType =
  | "missing_location_page"
  | "thin_content"
  | "blog_topic"
  | "missing_category_page"
  | "missing_landing"
  | "internal_link_opportunity";

export type ContentGapStatus = "new" | "approved" | "in_progress" | "published" | "rejected";

export type TechnicalIssueType =
  | "broken_link"
  | "404_error"
  | "redirect_chain"
  | "missing_canonical"
  | "duplicate_title"
  | "duplicate_meta"
  | "orphan_page"
  | "sitemap_missing"
  | "sitemap_stale"
  | "invalid_structured_data"
  | "missing_alt_text"
  | "slow_page"
  | "missing_robots"
  | "mixed_content";

export type IssueStatus = "open" | "resolved" | "ignored";

// ─── Agent metrics ────────────────────────────────────────────────────────────

export interface AgentMetrics {
  keywordsDiscovered?: number;
  pagesAudited?: number;
  tasksCreated?: number;
  contentGapsFound?: number;
  issuesFound?: number;
  rankingsTracked?: number;
  totalCost?: number;
  modelsUsed?: string[];
  /** Explicit counts — fixes D15's `||`-chain in completeAgentRun(). Agents should
   *  always set these; the OR-chain over the fields above is only a last-resort fallback. */
  itemsProcessed?: number;
  itemsSucceeded?: number;
}

// ─── Job queue (Phase 1.1) ────────────────────────────────────────────────────

export type JobStatus = "queued" | "claimed" | "running" | "completed" | "failed" | "cancelled";

export interface SeoAgentJob {
  id: string;
  agentType: AgentType;
  status: JobStatus;
  params: Record<string, unknown> | null;
  runId: string | null;
  attempts: number;
  maxAttempts: number;
  claimedAt: string | null;
  heartbeatAt: string | null;
  cancelRequested: boolean;
  errorMessage: string | null;
  createdAt: string;
  createdBy: string | null;
}

export type StepStatus = "running" | "completed" | "failed" | "skipped";

export interface SeoAgentRunStep {
  id: string;
  runId: string;
  stepName: string;
  status: StepStatus;
  detail: string | null;
  itemCount: number;
  costUsd: number;
  startedAt: string;
  endedAt: string | null;
}

// ─── Helper to parse JSON columns from DB ─────────────────────────────────────

export function parseJsonColumn<T>(value: string | T[] | null): T[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value as string);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseJsonObject<T>(value: string | object | null): T | null {
  if (!value) return null;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(value as string) as T;
  } catch {
    return null;
  }
}
