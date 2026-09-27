-- Service pages table for admin-manageable SEO-friendly URLs
CREATE TABLE IF NOT EXISTS `service_pages` (
  `id` varchar(191) NOT NULL,
  `configKey` varchar(191) NOT NULL COMMENT 'References the slug in services-config.ts (e.g. property-valuation)',
  `slug` varchar(191) NOT NULL COMMENT 'Current URL slug (e.g. property-valuation-services)',
  `previousSlugs` text COMMENT 'JSON array of old slugs for 301 redirect tracking',
  `title` varchar(191) NOT NULL,
  `shortTitle` varchar(191) NOT NULL,
  `metaTitle` varchar(200) NOT NULL COMMENT 'SEO title tag (max 60 chars recommended)',
  `metaDescription` varchar(320) NOT NULL COMMENT 'SEO meta description (max 160 chars recommended)',
  `ogTitle` varchar(200) DEFAULT NULL COMMENT 'Open Graph title override',
  `ogDescription` varchar(320) DEFAULT NULL COMMENT 'Open Graph description override',
  `canonicalUrl` varchar(500) DEFAULT NULL COMMENT 'Custom canonical URL if different from page URL',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_pages_slug_unique` (`slug`),
  UNIQUE KEY `service_pages_configKey_unique` (`configKey`),
  KEY `service_pages_isActive_idx` (`isActive`),
  KEY `service_pages_sortOrder_idx` (`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed with current service pages (preserving existing slugs)
INSERT IGNORE INTO `service_pages` (`id`, `configKey`, `slug`, `title`, `shortTitle`, `metaTitle`, `metaDescription`, `isActive`, `sortOrder`, `createdAt`)
VALUES
  ('sp-valuation', 'property-valuation', 'property-valuation', 'Property Valuation', 'Valuation', 'Property Valuation Services | VectorAfriq Kenya', 'Professional property valuation services in Kenya. Certified valuers for market, mortgage, forced sale, and investment valuations via VectorAfriq.', 1, 1, NOW()),
  ('sp-survey', 'survey-mapping', 'survey-mapping', 'Survey & Mapping', 'Survey', 'Survey & Mapping Services | VectorAfriq Kenya', 'Professional survey and mapping services in Kenya. Boundary surveys, beacon placement, subdivision, and topographic mapping via VectorAfriq.', 1, 2, NOW()),
  ('sp-legal', 'legal-conveyancing', 'legal-conveyancing', 'Legal / Conveyancing', 'Legal', 'Legal & Conveyancing Services | VectorAfriq Kenya', 'Professional legal and conveyancing services in Kenya. Title verification, sale agreements, land search, and ownership transfer via VectorAfriq.', 1, 3, NOW()),
  ('sp-mortgage', 'mortgage-assistance', 'mortgage-assistance', 'Mortgage Assistance', 'Mortgage', 'Mortgage Assistance Services | VectorAfriq Kenya', 'Mortgage assistance services in Kenya. Expert mortgage advisory, bank comparison, pre-approval guidance, and property valuation for mortgage via VectorAfriq.', 1, 4, NOW()),
  ('sp-architecture', 'architectural-construction', 'architectural-construction', 'Architectural & Construction Services', 'Architecture', 'Architectural & Construction Services | VectorAfriq Kenya', 'Architectural and construction services in Kenya. Architect design, structural engineering, quantity surveying, and construction supervision via VectorAfriq.', 1, 5, NOW()),
  ('sp-movers', 'movers', 'movers', 'Movers', 'Movers', 'Professional Movers & Relocation Services | VectorAfriq Kenya', 'Professional moving and relocation services in Kenya. Verified movers, instant pricing, real-time tracking via VectorAfriq.', 1, 6, NOW()),
  ('sp-management', 'property-management', 'property-management', 'Property Management', 'Management', 'Property Management Services | VectorAfriq Kenya', 'Professional property management services in Kenya. Tenant screening, rent collection, maintenance, and reporting via VectorAfriq.', 1, 7, NOW()),
  ('sp-diaspora', 'diaspora-services', 'diaspora-services', 'Diaspora Services', 'Diaspora', 'Diaspora Property Services | VectorAfriq Kenya', 'Property services for Kenyans abroad. Remote property buying, selling, management, and investment advisory via VectorAfriq.', 1, 8, NOW());
