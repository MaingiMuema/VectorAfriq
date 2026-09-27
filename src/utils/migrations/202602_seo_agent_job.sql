-- ============================================================
-- Phase 1.1 — durable job queue + per-step observability
-- Runs on MariaDB 10.4.32 in this project (not MySQL 8 as originally assumed) —
-- avoid SELECT...FOR UPDATE SKIP LOCKED (needs MariaDB 10.6+); the worker uses a
-- plain atomic UPDATE...ORDER BY...LIMIT 1 claim instead. ROW_NUMBER() OVER(...)
-- is fine (MariaDB 10.2+).
-- ============================================================

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
  `cancelRequested` tinyint(1) NOT NULL DEFAULT 0,
  `errorMessage` text NULL,
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
