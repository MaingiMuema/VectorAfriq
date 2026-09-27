-- ============================================================
-- SEO Agent System Schema
-- Extends the existing seo_config, page_meta, sitemap_url tables
-- ============================================================

-- Agent run log — tracks every agent execution
CREATE TABLE IF NOT EXISTS `seo_agent_run` (
  `id` varchar(191) NOT NULL,
  `agentType` enum('keyword_discovery','on_page_optimization','content_strategy','technical_monitor','ranking_tracker','all') NOT NULL,
  `status` enum('running','completed','failed','partial') NOT NULL DEFAULT 'running',
  `startedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` datetime(3) NULL,
  `itemsProcessed` int NOT NULL DEFAULT 0,
  `itemsSucceeded` int NOT NULL DEFAULT 0,
  `summary` text,
  `metrics` json,
  `errorMessage` text,
  `costUsd` decimal(10,4) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `seo_agent_run_type_idx` (`agentType`),
  KEY `seo_agent_run_status_idx` (`status`),
  KEY `seo_agent_run_started_idx` (`startedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Keyword universe — discovered target keywords with metadata
CREATE TABLE IF NOT EXISTS `seo_keyword` (
  `id` varchar(191) NOT NULL,
  `keyword` varchar(500) NOT NULL,
  `cluster` varchar(200),
  `intent` enum('commercial','transactional','informational','navigational') DEFAULT 'commercial',
  `searchVolumeEst` int DEFAULT 0,
  `difficulty` decimal(3,1) DEFAULT 0,
  `currentRank` int NULL,
  `bestRank` int NULL,
  `lastChecked` datetime(3) NULL,
  `competitorUrls` json,
  `targetUrl` varchar(500),
  `status` enum('new','tracking','optimized','ranking','abandoned') DEFAULT 'new',
  `priority` decimal(3,1) DEFAULT 0,
  `location` varchar(200),
  `category` varchar(100),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_keyword_keyword_key` (`keyword`),
  KEY `seo_keyword_cluster_idx` (`cluster`),
  KEY `seo_keyword_status_idx` (`status`),
  KEY `seo_keyword_rank_idx` (`currentRank`),
  KEY `seo_keyword_priority_idx` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optimization tasks — proposed changes for admin approval or auto-apply
CREATE TABLE IF NOT EXISTS `seo_optimization_task` (
  `id` varchar(191) NOT NULL,
  `pageUrl` varchar(500) NOT NULL,
  `pageType` enum('static','property_listing','location_page','blog_post','service_page','category_page') DEFAULT 'static',
  `issueType` enum('title_length','meta_description','title_duplicate','title_keyword','heading_structure','missing_alt','canonical','structured_data','thin_content','keyword_stuffing','missing_keyword','content_quality') NOT NULL,
  `severity` enum('critical','high','medium','low') DEFAULT 'medium',
  `currentValue` text,
  `proposedValue` text,
  `llmReasoning` text,
  `keywordId` varchar(191),
  `status` enum('pending','applied','rejected','auto_applied','failed') DEFAULT 'pending',
  `appliedAt` datetime(3) NULL,
  `agentRunId` varchar(191),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `seo_opt_task_url_idx` (`pageUrl`(255)),
  KEY `seo_opt_task_status_idx` (`status`),
  KEY `seo_opt_task_severity_idx` (`severity`),
  KEY `seo_opt_task_issue_idx` (`issueType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ranking history — daily SERP position tracking
CREATE TABLE IF NOT EXISTS `seo_ranking` (
  `id` varchar(191) NOT NULL,
  `keywordId` varchar(191) NOT NULL,
  `position` int,
  `previousPosition` int,
  `changeAmount` int DEFAULT 0,
  `url` varchar(500),
  `checkedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `searchEngine` varchar(50) DEFAULT 'google',
  PRIMARY KEY (`id`),
  KEY `seo_ranking_keyword_idx` (`keywordId`),
  KEY `seo_ranking_checked_idx` (`checkedAt`),
  KEY `seo_ranking_position_idx` (`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content gaps — missing/thin content opportunities
CREATE TABLE IF NOT EXISTS `seo_content_gap` (
  `id` varchar(191) NOT NULL,
  `gapType` enum('missing_location_page','thin_content','blog_topic','missing_category_page','missing_landing','internal_link_opportunity') NOT NULL,
  `title` varchar(500),
  `targetKeyword` varchar(500),
  `suggestedUrl` varchar(500),
  `contentBrief` text,
  `priorityScore` decimal(3,1) DEFAULT 0,
  `competitorExamples` json,
  `status` enum('new','approved','in_progress','published','rejected') DEFAULT 'new',
  `propertyCount` int DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `seo_content_gap_type_idx` (`gapType`),
  KEY `seo_content_gap_status_idx` (`status`),
  KEY `seo_content_gap_priority_idx` (`priorityScore`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Technical issues — crawl-detected problems
CREATE TABLE IF NOT EXISTS `seo_technical_issue` (
  `id` varchar(191) NOT NULL,
  `issueType` enum('broken_link','404_error','redirect_chain','missing_canonical','duplicate_title','duplicate_meta','orphan_page','sitemap_missing','sitemap_stale','invalid_structured_data','missing_alt_text','slow_page','missing_robots','mixed_content') NOT NULL,
  `url` varchar(500) NOT NULL,
  `detail` text,
  `severity` enum('critical','high','medium','low') DEFAULT 'medium',
  `status` enum('open','resolved','ignored') DEFAULT 'open',
  `firstDetected` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastDetected` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `resolvedAt` datetime(3) NULL,
  PRIMARY KEY (`id`),
  KEY `seo_tech_issue_type_idx` (`issueType`),
  KEY `seo_tech_issue_status_idx` (`status`),
  KEY `seo_tech_issue_severity_idx` (`severity`),
  KEY `seo_tech_issue_url_idx` (`url`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
