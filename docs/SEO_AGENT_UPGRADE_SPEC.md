# SEO Agent — Upgrade Specification

**Audience:** a coding agent implementing changes in this repository.
**Repo:** `vectorafriqproperties` (Next.js 16 App Router, MySQL via `@/lib/db`, NextAuth, OpenRouter for LLM).
**Scope:** the agentic SEO subsystem under `src/lib/seo/**`, `src/app/api/admin/seo/agent/**`, `src/app/admin/seo/agent/**`, and the static SEO layer it is supposed to drive.

Read this whole document before writing code. Phases are ordered by dependency — **Phase 0 and Phase 1 must land before anything else**, because without them the system produces output that has no effect on the live site.

---

## 1. Current state (verified by reading the code)

### 1.1 Static / non-agentic SEO layer

| Concern | Implementation | Notes |
|---|---|---|
| Root metadata | `src/app/layout.tsx` | Hardcoded title/description/keywords/OG/verification. Not DB-driven. |
| Per-page metadata helper | `src/lib/seo/metadata.ts` | `generateSeoMetadata()` builds title/desc/OG/Twitter/canonical from **caller-supplied args only**. |
| Canonicals | `src/lib/seo/canonical.ts` | Filter-param stripping, search-page collapsing. Solid. |
| Sitemap | `src/app/sitemap.xml/route.ts` | DB-driven (`sitemap_url`, `property`, `post`, `service_pages`, `county`/`city`/`neighborhood`). Single file, `LIMIT 1000` properties, `LIMIT 50` per location tier. |
| robots.txt | `src/app/robots.txt/route.ts` | **Hardcoded string**, ignores the `seo_config` / admin robots API entirely. |
| Structured data | `src/components/seo/{SchemaMarkup,PropertyStructuredData,LocationStructuredData}.tsx` | Typed schema builders, good coverage. |
| Admin SEO config | `seo_config`, `page_meta`, `sitemap_url` tables + `/api/admin/seo/{config,pages,settings,sitemap,robots}` | CRUD exists. |

### 1.2 Agentic layer

```
src/lib/seo/
  orchestrator.ts      runAgent / runAllAgents — fixed 5-step sequential pipeline
  agent-runner.ts      run lifecycle → seo_agent_run; dashboard stat aggregation
  openrouter.ts        callLLM / callLLMForJSON (+ truncated-JSON repair)
  config.ts            active model persisted to .seo-agent/model.json ON LOCAL DISK
  models.ts            OpenRouter catalog fetch + 6h in-memory cache
  web-tools.ts         Google/Bing autocomplete, DuckDuckGo SERP scrape, competitor page scrape
  agents/
    keyword-discovery.ts      autocomplete + SERP + competitor mining → LLM cluster/score → seo_keyword
    on-page-optimization.ts   live-fetch pages → programmatic checks + LLM rewrite → seo_optimization_task
    content-strategy.ts       location gaps, thin content, competitor gaps, LLM blog topics → seo_content_gap
    technical-monitor.ts      crawl ≤113 URLs → seo_technical_issue
    ranking-tracker.ts        DDG SERP per keyword → seo_ranking + auto content gaps
```

API: `POST/GET /api/admin/seo/agent/run`, `GET /status`, `GET|PATCH /tasks`, `GET|PATCH /issues` (also serves gaps via `?type=gaps`), `GET /keywords`, `GET /rankings`, `GET|POST /model`.
UI: `src/app/admin/seo/agent/page.tsx` (1090 lines, 6 tabs, single "Run All Agents" button).
Schema: `src/utils/seo-agent-schema.sql` — `seo_agent_run`, `seo_keyword`, `seo_optimization_task`, `seo_ranking`, `seo_content_gap`, `seo_technical_issue`.

---

## 2. Defects found (fix these; each is a concrete, verifiable bug)

### D1 — The write-back loop is disconnected. Nothing the agent approves changes the live site. **[P0]**
`PATCH /api/admin/seo/agent/tasks` (`action: "approve"`) writes to `page_meta`. Grep for `page_meta` across `src/`: it appears **only** in the admin API, the agents, the SQL/scripts, and docs — **no rendering path reads it**. `src/app/layout.tsx` hardcodes metadata; `generateSeoMetadata()` takes values from its caller. Result: approving a task is a no-op on the rendered HTML, and the next `on_page_optimization` run re-detects the same issue forever.

Additionally: for property listings the task's `pageUrl` is `/listings/{slug}/{id}`, for which no `page_meta` row exists, so the `UPDATE ... WHERE path = ?` matches **0 rows and reports success**.

### D2 — Agent runs execute synchronously inside the HTTP request. **[P0]**
`POST /agent/run` calls `runAgent()` and awaits it. Rough runtime:
- `keyword_discovery`: up to 60 seeds × (10 autocomplete fetches + related-search fetch) with 300 ms sleeps, plus 5 SERP+competitor rounds at 1.5 s → **many minutes**.
- `ranking_tracker`: 50 keywords × 1.5 s minimum → **≥75 s**.
- `technical_monitor`: up to 113 sequential page fetches, no delay budget.
- `runAllAgents`: all five, sequentially, in one request.

The browser `fetch` in `runAgent()` (UI) awaits the whole thing. Any platform/proxy timeout kills the request; the DB row is left `status='running'` forever. There is no progress, no cancel, no concurrency guard (two admins can start overlapping runs).

### D3 — Task/issue/gap inserts never dedupe. **[P0]**
- `createIssueTask()` uses `INSERT IGNORE` with a **freshly generated UUID primary key** and there is no unique index on `(pageUrl, issueType)` → nothing is ever ignored. Every run inserts a new duplicate row.
- `createOptimizationTasks()` uses `ON DUPLICATE KEY UPDATE` — also with a fresh UUID PK and no matching unique key → same problem.
- `persistContentGap()` — same pattern in `content-strategy.ts` and in `ranking-tracker.ts`'s auto-gap insert.

The `pendingTaskCount` / `openIssueCount` badges grow without bound.

### D4 — There is no LLM fallback, despite the code claiming one. **[P1]**
`getMODELS()` returns the same active model for `reasoning`, `fast`, and `fallback`. In `callLLM()` the retry guard is `if (model !== getMODELS().fallback)` — always false → **the fallback path is dead code** and any OpenRouter error propagates.

### D5 — Cost tracking silently reports $0. **[P1]**
`getCostPer1M()` returns `{input: 0, output: 0}` when `getModelSnapshot()` misses. The snapshot only exists if the admin selected a model *after* the snapshot feature shipped, and `FALLBACK_MODELS` contains 2 entries. Any other model → all runs report `costUsd = 0`.

### D6 — Model config lives on local disk. **[P1]**
`src/lib/seo/config.ts` writes `.seo-agent/model.json` under `process.cwd()`. This does not survive container redeploys, is not shared across instances, and is not backed up. It belongs in `seo_config`.

### D7 — Rankings are labelled `google` but scraped from DuckDuckGo. **[P1]**
`ranking-tracker.ts` inserts `searchEngine = 'google'` while `getSerpInsights()` uses `html.duckduckgo.com`. DDG positions do not correlate reliably with Google positions. Every ranking number in the dashboard is mislabelled.

### D8 — Competitor rows pollute the ranking history table. **[P1]**
Competitor positions are inserted into `seo_ranking` with `searchEngine = 'competitor:{domain}'` and `keywordId` pointing at *our* keyword. Any query over `seo_ranking` for our own trend must remember to filter — `GET /agent/rankings` and the dashboard do not consistently do so.

### D9 — Unvalidated LLM output crashes the page audit. **[P1]**
`on-page-optimization.ts:112` reads `result.data.issues.length` with no check. If the model omits `issues`, this throws a `TypeError`, which is swallowed by the per-page `catch` and logged as a generic warning — the page is silently skipped. `zod` is already a dependency and is unused here.

### D10 — Technical issues never auto-resolve, and low-value checks dominate. **[P2]**
`createTechnicalIssue()` refreshes `lastDetected` for existing open issues but **nothing ever closes an issue when the next crawl is clean**. Combined with `detectMissingStructuredData` and `detectMissingAltText` firing on essentially every page, the issue list becomes permanent noise.

### D11 — Duplicate-title/meta detection only sees one batch. **[P2]**
`detectDuplicateTitles()` compares within the ≤113 crawled URLs of a single run. Property detail pages — the largest and most duplication-prone surface — are not in that set.

### D12 — Cron auth via query string. **[P2]**
`/agent/run?key=SECRET` puts the shared secret in URLs, access logs, and referrers. Use an `Authorization: Bearer` header and `crypto.timingSafeEqual`.

### D13 — Unbounded outbound fetch from DB-controlled values. **[P2]**
`fetchLivePage(path)` and `crawlPage(path)` accept absolute URLs (`path.startsWith("http")`) sourced from `sitemap_url`/`page_meta`. An attacker with DB write access, or a bad admin paste, turns the server into an SSRF proxy. Restrict to the configured site origin unless explicitly allowlisted.

### D14 — Slug generation is duplicated in three places. **[P2]**
`generateSlug` in `src/app/sitemap.xml/route.ts`, an inline copy in `on-page-optimization.ts:132`, and (per its own comment) `propertyCache.ts`. Drift means the agent audits URLs that 404 while the sitemap advertises different ones.

### D15 — Run metrics are lossy. **[P3]**
`completeAgentRun()` computes `itemsProcessed = keywordsDiscovered || pagesAudited || issuesFound || 0` — an OR-chain, so a run that audited 12 pages and found 0 keywords reports the wrong number, and `itemsSucceeded` is hardcoded equal to it.

### D16 — `getAgentDashboardStats()` last-run join is ambiguous. **[P3]**
The `MAX(startedAt)` self-join returns multiple rows on identical timestamps (possible — `startedAt` is set in JS, and two agent types can share a millisecond). Use a window function or `ORDER BY startedAt DESC, id DESC LIMIT 1` per type.

### D17 — Fragile regex HTML parsing. **[P3]**
`web-tools.ts` and both crawling agents parse HTML with regexes (`extractTag`, `extractHeadings`, `extractInternalLinks`). This misses attributes in unusual order, self-closing variants, and multi-line tags. Use `linkedom` or `cheerio` (server-side, small).

### D18 — `pageType` is hardcoded. **[P3]**
`auditLivePage()` always passes `"static"` to `createIssueTask()` regardless of what the URL actually is, so the `pageType` filter in the Optimization Queue is meaningless for programmatically-detected issues.

---

## 3. Capability gaps (what the system cannot do that it should)

| Gap | Why it matters |
|---|---|
| **No Google Search Console integration** | GSC is free and authoritative: real impressions, clicks, CTR, and average position per query × page, plus the URL Inspection API for index coverage. Today `searchVolumeEst` is literally always `0` and difficulty is an LLM guess. This is the single highest-leverage addition. |
| **No GA4 / conversion signal** | Rankings are a proxy. Without sessions and lead conversions per landing page, the agent cannot prioritise by business value. |
| **No Core Web Vitals data** | `loadTimeMs` from a server-side `fetch` measures TTFB of HTML, not LCP/INP/CLS. PageSpeed Insights API + CrUX give real field data, free. |
| **No index-coverage loop** | No way to know if a page is indexed. GSC URL Inspection + IndexNow + the Google Indexing API would close this. |
| **Not actually agentic** | The "agents" are a fixed 5-step script with one-shot LLM calls. No tool use, no planning, no iteration, no self-verification. A real agent loop (tool-calling over `web-tools` + DB read tools) would let one agent investigate *why* a page dropped instead of running the same checklist. |
| **No auto-apply policy** | Every task requires manual approval, so nothing scales. There is no confidence score, no per-issue-type autonomy setting, no rollback. |
| **No verification of outcomes** | Nothing measures whether an applied change improved anything. No before/after snapshot, no experiment framework. |
| **No content generation** | `content_strategy` produces briefs that a human must then write. It could draft location landing pages and blog posts as `post` drafts. |
| **No internal-linking agent** | `internal_link_opportunity` exists in the `gapType` enum but **no code ever produces one**. |
| **No scheduling UI or alerting** | Runs are manual (or an undocumented external cron). No email/Slack on ranking drops or critical issues. |
| **No cost controls** | No budget cap, no per-agent model routing (a title rewrite and a competitive analysis use the same model). |
| **No dry-run / tests** | Nothing lets you run an agent against a fixture set without hitting live sites, the LLM, or the DB. |

---

## 4. Target architecture

```
                    ┌──────────────────────────────────────┐
   Admin UI ───────▶│  POST /agent/run  (enqueue only)     │
   Cron/Scheduler ─▶│  → seo_agent_job (queued)            │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │  Worker (src/lib/seo/worker.ts)      │
                    │  claim job → run steps → checkpoint  │
                    └──────────────┬───────────────────────┘
                                   │
         ┌─────────────────────────┼──────────────────────────────┐
         │                         │                              │
   ┌─────▼──────┐        ┌─────────▼────────┐          ┌──────────▼─────────┐
   │ Data layer │        │  Agents (tools)  │          │  Policy engine     │
   │ GSC / GA4  │        │  keyword, onpage │          │  auto-apply rules  │
   │ PSI / CrUX │        │  content, tech,  │          │  + rollback        │
   │ SERP prov. │        │  rank, linking   │          └──────────┬─────────┘
   └────────────┘        └──────────────────┘                     │
                                                       ┌──────────▼─────────┐
                                                       │  seo_page_override │
                                                       │  read at render    │
                                                       └────────────────────┘
```

**Core principle:** an agent's output is only valuable if a rendering path reads it. Build the read path first.

---

## 5. Implementation plan

### Phase 0 — Close the loop (nothing else matters until this works)

#### 0.1 Create a render-time metadata override store

Migration `src/utils/migrations/2026xx_seo_page_override.sql`:

```sql
CREATE TABLE IF NOT EXISTS `seo_page_override` (
  `id`          varchar(191) NOT NULL,
  `urlPattern`  varchar(500) NOT NULL,       -- exact path, or pattern with :id / * for entity routes
  `entityType`  enum('static','property','blog_post','location','service') NOT NULL DEFAULT 'static',
  `entityId`    varchar(191) NULL,           -- property.id / post.id when entityType != 'static'
  `title`       varchar(255) NULL,
  `description` varchar(500) NULL,
  `keywords`    varchar(500) NULL,
  `ogImage`     varchar(500) NULL,
  `noIndex`     tinyint(1) NOT NULL DEFAULT 0,
  `source`      enum('admin','agent') NOT NULL DEFAULT 'agent',
  `taskId`      varchar(191) NULL,           -- FK-ish to seo_optimization_task
  `appliedAt`   datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revertedAt`  datetime(3) NULL,
  `previousValue` json NULL,                 -- snapshot for rollback
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_page_override_target` (`urlPattern`(255), `entityType`, `entityId`),
  KEY `seo_page_override_entity_idx` (`entityType`, `entityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Do **not** extend `page_meta` — it is admin-owned and path-keyed only. Keep agent-applied overrides separate so admin edits always win and rollback is possible.

#### 0.2 Build the resolver

New file `src/lib/seo/overrides.ts`:

```ts
export interface ResolvedMeta {
  title?: string; description?: string; keywords?: string;
  ogImage?: string; noIndex?: boolean;
  source: 'admin' | 'agent' | 'default';
}

/** Precedence: page_meta (admin) > seo_page_override (agent) > computed default. */
export async function resolvePageMeta(
  pathname: string,
  entity?: { type: string; id: string }
): Promise<ResolvedMeta | null>
```

Requirements:
- `unstable_cache` (or `React.cache` + a tagged fetch) keyed `seo-meta:{path}` with tag `seo-meta`; TTL 300 s.
- Applying or reverting an override calls `revalidateTag('seo-meta')`.
- Must **never throw** — a DB error returns `null` and the caller falls back to computed defaults. SEO metadata must not be able to break page rendering.

#### 0.3 Wire the resolver into rendering

- Extend `SeoMetadataOptions` in `src/lib/seo/metadata.ts` with `entity?: { type, id }`.
- Add `export async function generateSeoMetadataAsync(options)` that calls `resolvePageMeta()` and overlays the result on top of the caller's values before building the `Metadata` object. Keep the existing sync function for callers that don't need DB lookup.
- Migrate the page-level `generateMetadata` exports for: home, the search/listing routes, `/listings/{slug}/{id}`, `/blogs/{slug}`, `/services/{slug}`, and the static pages backed by `page_meta`.
- Make `src/app/layout.tsx` read defaults from `seo_config` (`SITE_NAME`, `DEFAULT_TITLE`, `DEFAULT_DESCRIPTION`, `GOOGLE_VERIFICATION`, …) via `generateMetadata()` instead of the hardcoded const. Keep the current literals as fallbacks.

#### 0.4 Rewrite the approve path

In `PATCH /api/admin/seo/agent/tasks`:
- Parse `proposedValue` with a **zod schema**; reject malformed payloads with 400 instead of a silent `catch {}`.
- Resolve `pageUrl` → `{ entityType, entityId, urlPattern }` using a shared route classifier (see 0.5).
- Snapshot the current effective values into `previousValue`, then upsert `seo_page_override`.
- `revalidateTag('seo-meta')`.
- **Return the number of affected rows.** Never report success on a 0-row write.
- Add `action: "revert"` that sets `revertedAt` and restores `previousValue`.
- Set `seo_optimization_task.status = 'applied'` **only after** the override write succeeds.

#### 0.5 Single source of truth for URLs

New `src/lib/seo/routes.ts`:

```ts
export function generateSlug(title: string): string
export function buildListingUrl(p: { id: string; title: string }): string
export function classifyUrl(url: string): { entityType: EntityType; entityId: string | null; pageType: PageType }
```

Replace the copies in `src/app/sitemap.xml/route.ts`, `src/lib/seo/agents/on-page-optimization.ts:132`, and `propertyCache.ts` with imports from this module. Use `classifyUrl()` to populate `pageType` correctly (fixes **D18**).

**Phase 0 acceptance criteria**
1. Approving a title-rewrite task for `/about-us`, then requesting that page, returns the new `<title>` in the HTML within one cache TTL.
2. Same for a property listing at `/listings/{slug}/{id}`.
3. Approving a task whose target does not exist returns HTTP 4xx with an explanatory message and leaves the task `pending`.
4. `action: "revert"` restores the previous title and marks the override reverted.
5. An admin `page_meta` value always beats an agent override for the same path (assert with a test).

---

### Phase 1 — Make runs durable, observable, and idempotent

#### 1.1 Job queue

Migration:

```sql
CREATE TABLE IF NOT EXISTS `seo_agent_job` (
  `id`           varchar(191) NOT NULL,
  `agentType`    varchar(64) NOT NULL,
  `status`       enum('queued','claimed','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  `params`       json NULL,
  `runId`        varchar(191) NULL,
  `attempts`     int NOT NULL DEFAULT 0,
  `maxAttempts`  int NOT NULL DEFAULT 3,
  `claimedAt`    datetime(3) NULL,
  `heartbeatAt`  datetime(3) NULL,
  `createdAt`    datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy`    varchar(191) NULL,
  PRIMARY KEY (`id`),
  KEY `seo_agent_job_status_idx` (`status`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `seo_agent_run_step` (
  `id`        varchar(191) NOT NULL,
  `runId`     varchar(191) NOT NULL,
  `stepName`  varchar(128) NOT NULL,
  `status`    enum('running','completed','failed','skipped') NOT NULL DEFAULT 'running',
  `detail`    text NULL,
  `itemCount` int NOT NULL DEFAULT 0,
  `costUsd`   decimal(10,6) NOT NULL DEFAULT 0,
  `startedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endedAt`   datetime(3) NULL,
  PRIMARY KEY (`id`),
  KEY `seo_agent_run_step_run_idx` (`runId`, `startedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- `POST /agent/run` **enqueues and returns immediately** with `{ jobId }` (HTTP 202).
- `src/lib/seo/worker.ts`: claim via `UPDATE ... SET status='claimed', claimedAt=NOW() WHERE status='queued' ORDER BY createdAt LIMIT 1` inside a transaction (or `SELECT ... FOR UPDATE SKIP LOCKED`), heartbeat every 15 s, reclaim jobs whose `heartbeatAt` is older than 2 minutes.
- Run the worker via `server.js` (this project uses a custom server — start a single in-process worker there) **or** a separate `npm run seo-worker` entrypoint. Decide based on deployment; document the choice in the file header.
- Refuse to enqueue if a job for the same `agentType` is already `queued`/`running` (**D2** concurrency guard). Return 409.
- Add `POST /agent/jobs/:id/cancel`; agents check a cancellation flag between steps.
- Sweep on worker start: mark any `seo_agent_run` still `running` with no live job as `failed` with `errorMessage = 'orphaned'`.

#### 1.2 Progress in the UI

- `GET /agent/jobs?active=1` returns queued/running jobs with their latest `seo_agent_run_step`.
- The dashboard polls every 3 s while a job is active (or use SSE). Replace the blocking `await fetch` in `runAgent()` with enqueue + poll, and show a per-step progress list.
- Every agent calls `startStep(runId, name)` / `endStep(...)` around each phase so progress is real, not a spinner.

#### 1.3 Idempotent writes (fixes D3)

Add a deterministic `fingerprint` column and unique index to all three finding tables:

```sql
ALTER TABLE `seo_optimization_task`
  ADD COLUMN `fingerprint` char(64) NOT NULL DEFAULT '',
  ADD COLUMN `occurrences` int NOT NULL DEFAULT 1,
  ADD COLUMN `lastSeenAt` datetime(3) NULL,
  ADD UNIQUE KEY `seo_opt_task_fp` (`fingerprint`);

ALTER TABLE `seo_technical_issue`
  ADD COLUMN `fingerprint` char(64) NOT NULL DEFAULT '',
  ADD UNIQUE KEY `seo_tech_issue_fp` (`fingerprint`);

ALTER TABLE `seo_content_gap`
  ADD COLUMN `fingerprint` char(64) NOT NULL DEFAULT '',
  ADD UNIQUE KEY `seo_content_gap_fp` (`fingerprint`);
```

`fingerprint = sha256(normalizedUrl + '|' + issueType + '|' + discriminator)`. Backfill existing rows in the migration, then dedupe (keep oldest, sum `occurrences`) before adding the unique index.

All inserts become:
```sql
INSERT INTO ... (id, ..., fingerprint, lastSeenAt) VALUES (...)
ON DUPLICATE KEY UPDATE
  occurrences = occurrences + 1,
  lastSeenAt  = CURRENT_TIMESTAMP(3),
  severity    = VALUES(severity),
  currentValue = VALUES(currentValue),
  -- never clobber an admin decision:
  status = IF(status IN ('rejected','applied','auto_applied'), status, 'pending');
```

#### 1.4 Auto-resolve stale issues (fixes D10)

At the end of each `technical_monitor` run, for every URL crawled in this run, close any `open` issue on that URL whose `fingerprint` was not re-detected:
```sql
UPDATE seo_technical_issue
SET status='resolved', resolvedAt=CURRENT_TIMESTAMP(3)
WHERE status='open' AND url IN (?) AND fingerprint NOT IN (?);
```
Also demote the always-on checks: only raise `invalid_structured_data` for page types where schema is expected (listing, blog, location), and only raise `missing_alt_text` above a threshold ratio, grouped one issue per page (not per image).

#### 1.5 Fix run accounting (D15, D16)

- Replace the `||` chain in `completeAgentRun()`: agents pass explicit `itemsProcessed` / `itemsSucceeded`; the metrics JSON keeps the detail.
- Rewrite the last-run query in `getAgentDashboardStats()` using `ROW_NUMBER() OVER (PARTITION BY agentType ORDER BY startedAt DESC, id DESC)` (MySQL 8) — this project already uses MySQL 8 features (`utf8mb4`, `datetime(3)`); verify the server version before relying on window functions and fall back to a correlated subquery if needed.

**Phase 1 acceptance criteria**
1. `POST /agent/run` returns in < 500 ms with a `jobId`.
2. Running `all` twice in a row produces **zero** new duplicate tasks/issues/gaps for unchanged pages; `occurrences` increments instead.
3. Killing the worker mid-run leaves the job reclaimable; the run does not stay `running` forever.
4. The dashboard shows live per-step progress and a working Cancel button.
5. Fixing a real issue on a page makes it disappear from the open list after the next crawl, without manual action.

---

### Phase 2 — Real data instead of scraped guesses

#### 2.1 Google Search Console (highest priority in this phase)

New `src/lib/seo/providers/gsc.ts` using a service-account JWT (`googleapis` or a hand-rolled JWT + `fetch`; prefer no new heavy dep if a simple JWT works).

Env: `GSC_SERVICE_ACCOUNT_EMAIL`, `GSC_PRIVATE_KEY`, `GSC_SITE_URL`.

Pull daily via a `gsc_sync` agent:
- `searchanalytics.query` dimensions `[query, page, country, device]`, last 28 days → new table `seo_search_console_metric (date, query, page, country, device, clicks, impressions, ctr, position)` with a unique key on the dimension tuple.
- `urlInspection.index.inspect` for priority URLs → `seo_index_status (url, coverageState, indexingState, lastCrawlTime, canonicalGoogle, canonicalUser, verdict, checkedAt)`.

Then rewire:
- `seo_keyword.searchVolumeEst` ← GSC impressions (28-day sum). Add `clicks`, `ctr`, `avgPosition` columns.
- `ranking_tracker` uses GSC `position` as the primary signal; keep the SERP scrape as a secondary, clearly-labelled source.
- Keyword discovery seeds from **queries we already get impressions for but rank 8–20** — the highest-ROI segment — instead of only autocomplete guesses.
- New derived opportunity score: `impressions × (expectedCtrAtRank(target) − currentCtr)`.

#### 2.2 Fix the SERP layer (D7, D8, D17)

- Define `interface SerpProvider { search(keyword, opts): Promise<SerpResult[]> }` in `src/lib/seo/providers/serp.ts`.
- Implementations: `DuckDuckGoProvider` (current behaviour, correctly labelled `searchEngine='duckduckgo'`), `GscPositionProvider`, and an optional `DataForSeoProvider` behind `SERP_PROVIDER` env config.
- **Migrate `seo_ranking.searchEngine` values**: existing `'google'` rows were DDG — relabel them in the migration; do not silently keep lying.
- Move competitor positions out of `seo_ranking` into `seo_competitor_ranking (keywordId, domain, position, url, checkedAt)`; update `GET /agent/rankings` and dashboard stats accordingly.
- Cache SERP responses for 24 h in `seo_serp_cache (queryHash, provider, payload, fetchedAt)` so re-runs cost nothing and stay polite.
- Replace regex HTML parsing with `linkedom` (add dep) in `web-tools.ts` and both crawlers.
- Add exponential backoff + a per-host concurrency limiter; honour a configurable crawl delay.

#### 2.3 Core Web Vitals

`src/lib/seo/providers/psi.ts` — PageSpeed Insights API (`PSI_API_KEY`), mobile + desktop, for the top N templates (not every URL). Store LCP/INP/CLS/TTFB per URL per day in `seo_page_vitals`. Replace the misleading `loadTimeMs > 3000` heuristic in both crawlers with real thresholds, and keep TTFB as a separate cheap signal.

#### 2.4 GA4 (optional but recommended)

`src/lib/seo/providers/ga4.ts` — Data API: sessions, engaged sessions, conversions per landing page. Feeds the prioritisation score so the agent works on pages that actually generate leads.

**Phase 2 acceptance criteria**
1. `seo_keyword` rows for tracked queries show non-zero `searchVolumeEst`, `clicks`, `ctr`, `avgPosition` sourced from GSC.
2. Dashboard "Rankings" distinguishes GSC position from scraped position, with the source labelled.
3. No `seo_ranking` row has `searchEngine` starting with `competitor:`.
4. Re-running `ranking_tracker` within 24 h issues no outbound SERP requests (cache hit).

---

### Phase 3 — Make it genuinely agentic

#### 3.1 Tool-calling agent loop

New `src/lib/seo/agent-loop.ts`: an OpenAI-compatible tool-calling loop against OpenRouter (`tools` / `tool_calls` in the chat completions payload — `openrouter.ts` currently sends none).

Tools to expose (thin, typed, zod-validated wrappers over existing code):

| Tool | Backed by |
|---|---|
| `search_serp(keyword)` | `providers/serp.ts` |
| `fetch_page(url)` | hardened `fetchLivePage` (origin-restricted, see D13) |
| `analyze_competitor(url)` | `web-tools.analyzeCompetitorPage` |
| `get_gsc_metrics(query?, page?, days)` | `providers/gsc.ts` |
| `query_properties(filters)` | read-only, parameterised, allowlisted columns |
| `get_page_vitals(url)` | `providers/psi.ts` |
| `list_open_issues(url?)` | `seo_technical_issue` |
| `propose_task(...)` | writes a `seo_optimization_task` |

Hard limits: max 12 tool calls per loop, max wall-clock 90 s per loop, per-run cost ceiling. Every tool call is recorded as a `seo_agent_run_step`.

Start by converting **one** agent — `on_page_optimization` for a single high-value URL — into a loop, behind a `SEO_AGENT_LOOP_ENABLED` flag. Compare output quality against the existing one-shot path before converting others.

#### 3.2 Structured output everywhere (D9)

Define zod schemas in `src/lib/seo/schemas.ts` for every LLM response shape. Change `callLLMForJSON` to `callLLMForJSON<T>(system, user, schema: ZodType<T>, opts)`; on parse failure, retry once with the validation error appended to the prompt, then fail the step explicitly rather than throwing a `TypeError` deep in an agent.

#### 3.3 Model routing and resilience (D4, D5, D6)

- `seo_config` keys: `SEO_MODEL_REASONING`, `SEO_MODEL_FAST`, `SEO_MODEL_FALLBACK`, `SEO_MONTHLY_BUDGET_USD`. Delete `.seo-agent/model.json` handling; migrate any existing file contents into `seo_config` on first boot.
- `getMODELS()` returns three genuinely different models; make the fallback retry in `callLLM` reachable and add a second retry with jittered backoff on 429/5xx.
- Persist the full `ModelOption` snapshot for **all three** configured models so `getCostPer1M` never returns `{0,0}`. If a snapshot is genuinely missing, log a warning and record `costUsd = null` (not `0`) so the dashboard can show "unknown" rather than "free".
- Enforce the budget: before each LLM call, sum `costUsd` for the current calendar month; if over budget, fail the step with a clear message and surface it in the UI.

#### 3.4 Auto-apply policy engine

New table `seo_autonomy_policy (issueType, pageType, mode enum('off','suggest','auto'), minConfidence decimal(3,2), maxPerRun int)`.

- Agents attach a `confidence` (0–1) to each proposed task.
- After a run, the policy engine auto-applies qualifying tasks via the same code path as manual approve (Phase 0.4), marking them `auto_applied` and always writing `previousValue`.
- Safe defaults to ship with: `auto` for `title_duplicate` and `meta_description` on `static`/`location_page`; `suggest` for everything else; `off` for anything touching property listing copy.
- Add a global kill switch (`SEO_AUTOPILOT_ENABLED`) and a daily cap.
- Admin UI: an "Autonomy" tab exposing the policy matrix, plus an audit log of auto-applied changes with one-click revert.

#### 3.5 Outcome verification

New agent `outcome_verifier`:
- For each override applied ≥14 days ago, compare GSC clicks/impressions/CTR/position for the affected page over the 14 days before vs. after `appliedAt`.
- Write `seo_change_outcome (overrideId, metricBefore, metricAfter, delta, verdict enum('improved','neutral','regressed'), evaluatedAt)`.
- Auto-revert `regressed` changes when they were `auto_applied` and the CTR drop exceeds a configured threshold.
- Feed verdicts back into the confidence calibration for that issue type.

This is what turns the system from "an LLM that writes titles" into a closed-loop optimiser. It is the most differentiated capability in this spec.

**Phase 3 acceptance criteria**
1. A single URL can be investigated by the loop agent, and the transcript of tool calls is visible in the run detail view.
2. Every LLM response is schema-validated; a deliberately malformed mock response produces a clean step failure, not a crash.
3. With autopilot on and defaults set, a duplicate-title issue is detected, auto-applied, and visible in the rendered HTML with no human action — and appears in the audit log with a working revert.
4. `seo_change_outcome` rows exist for changes older than 14 days with a computed verdict.

---

### Phase 4 — New agents and surfaces

#### 4.1 Internal linking agent
Currently `internal_link_opportunity` is an unused enum value. Build it:
- Crawl internal link graph (already partly collected in `technical-monitor.crawlPage().links`).
- Detect orphan pages (in sitemap, zero inbound internal links) — the `orphan_page` issue type is also never emitted today.
- For each high-priority keyword with a `targetUrl`, find pages containing the keyword phrase that do **not** link to the target, and propose an anchor-text link.
- Produce a `link_insertion` task type with the exact source page, anchor text, and target.

#### 4.2 Content generation agent
Promote `seo_content_gap` from brief → draft:
- For `missing_location_page`: generate a location landing page draft (intro copy, price stats computed from `property`, neighbourhood description, FAQ block) and create the route data.
- For `blog_topic`: create a **draft** row in `post` (`published = false`) with title, slug, body, meta, and the target keyword recorded.
- Never auto-publish. Require human review; that gate is non-negotiable for public-facing content.

#### 4.3 Schema/structured-data agent
- Validate emitted JSON-LD against schema.org shape requirements and Google's required/recommended fields for `RealEstateListing`, `Article`, `BreadcrumbList`, `FAQPage`.
- Propose fixes as tasks referencing the builder in `src/components/seo/SchemaMarkup.tsx`.

#### 4.4 Indexing agent
- IndexNow ping (Bing/Yandex) on property publish/update — cheap, no auth beyond a key file.
- Google Indexing API for `JobPosting`/`BroadcastEvent` is not applicable to listings; instead use GSC URL Inspection to find non-indexed high-value URLs and raise them as issues.

#### 4.5 Sitemap scaling
- Split into a sitemap index: `/sitemap.xml` (index) → `/sitemap-static.xml`, `/sitemap-properties-{n}.xml` (50k cap, currently capped at 1000 — **listings beyond 1000 are invisible to search engines today**), `/sitemap-locations.xml`, `/sitemap-blogs.xml`.
- Remove the `LIMIT 50` on counties/cities/neighbourhoods.
- Use real `updatedAt` for `lastmod`; drop `changefreq`/`priority` (Google ignores both) or keep them harmlessly.
- Make `robots.txt` read `seo_config` (fixes the hardcoded route) and reference the sitemap index.

#### 4.6 Scheduling + alerting
- Schedule config in `seo_config` (cron expressions per agent) with a UI in the Autonomy tab; the worker enqueues jobs on schedule.
- Alerts via the existing `nodemailer` setup: ranking drop > N positions on a priority keyword, new `critical` issue, run failure, budget exceeded.

---

### Phase 5 — Hardening

- **D12**: move cron auth to `Authorization: Bearer` + `crypto.timingSafeEqual`; keep the query-param path working for one release with a deprecation warning, then remove.
- **D13**: `assertSafeUrl(url)` — resolve, require http/https, require the host to equal the configured site origin or appear in an explicit `seo_config` allowlist, reject private/link-local IPs after DNS resolution.
- Rate-limit `POST /agent/run` per admin user.
- Redact the OpenRouter key from all error paths (currently `errorText.substring(0, 500)` is logged raw — verify it cannot echo the request).
- **Tests** (none exist today): unit tests for `canonical.ts`, `routes.ts` (slug parity with the sitemap), fingerprint stability, the zod schemas, and the override precedence rule; a fixture-backed integration test for `technical_monitor` against static HTML files; a `--dry-run` flag on every agent that logs intended writes without performing them.
- Add `npm run seo-agent -- --agent=<type> --dry-run` for local debugging without the admin UI.

---

## 6. Suggested execution order for the coding agent

1. **Phase 0** in full — this is the difference between a dashboard and a system that works. Do not proceed until its acceptance criteria pass.
2. **Phase 1.3 + 1.4** (idempotency, auto-resolve) — cheap, and stops the data from rotting while you build the rest.
3. **Phase 1.1 + 1.2** (queue, progress).
4. **Phase 2.1** (GSC) — largest single quality jump.
5. **Phase 3.2 + 3.3** (validation, model routing) — small, removes whole classes of silent failure.
6. **Phase 2.2** (SERP provider + relabel), **2.3** (vitals).
7. **Phase 3.4 + 3.5** (autopilot + outcome verification).
8. **Phase 3.1** (tool loop) — highest ceiling, but only valuable once the data layer is trustworthy.
9. **Phase 4**, then **Phase 5**.

## 7. Constraints and conventions to respect

- Match the existing code style: named exports, `async function` over classes, `query<T>()` from `@/lib/db` with parameterised SQL, `console.log("[Agent Name] ...")` prefixes.
- Every new table goes in a versioned file under `src/utils/migrations/` **and** is added to an idempotent init script following the pattern of `src/scripts/init-seo-agent.js`; add an npm script for it.
- All new API routes require `session.user.role === "ADMIN"` (or the hardened cron auth) — match the existing guard exactly.
- No new heavy dependencies without justification. Approved additions: `linkedom` (HTML parsing), `googleapis` **only if** a hand-rolled JWT proves impractical. `zod` is already present — use it.
- Never auto-publish public-facing content or auto-apply changes to property listing copy without human approval.
- Any change to `searchEngine`, `costUsd`, or ranking semantics must include a data migration that corrects historical rows rather than leaving mislabelled data in place.

## 8. Open questions for the repo owner

1. **Deployment target** — is this on a serverless platform or a long-lived Node process? `server.js` suggests a custom server, which makes the in-process worker (Phase 1.1) straightforward. Confirm before choosing the worker strategy.
2. **GSC access** — is `vectorafriqproperties.co.ke` verified in Search Console, and can a service account be granted read access? Phase 2 depends on it.
3. **Budget** — what is the acceptable monthly LLM spend? Needed to set `SEO_MONTHLY_BUDGET_USD` defaults.
4. **Autonomy appetite** — should autopilot ship enabled with conservative defaults, or off until the outcome verifier has 30 days of data? Recommendation: **off**, enable after Phase 3.5 has real verdicts.
