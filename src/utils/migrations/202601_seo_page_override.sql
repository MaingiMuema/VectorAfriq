-- ============================================================
-- Phase 0.1 — render-time metadata override store
-- Agent-applied SEO changes land here, never in `page_meta`
-- (page_meta stays admin-owned and always wins — see src/lib/seo/overrides.ts)
-- ============================================================

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
