-- Analytics Configuration Table
CREATE TABLE IF NOT EXISTS `analytics_config` (
  `id` varchar(191) NOT NULL,
  `key` varchar(100) NOT NULL UNIQUE,
  `value` text,
  `description` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `analytics_config_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Site Visitors Tracking Table
CREATE TABLE IF NOT EXISTS `site_visitor` (
  `id` varchar(191) NOT NULL,
  `sessionId` varchar(191) NOT NULL,
  `ipAddress` varchar(45),
  `userAgent` text,
  `referrer` text,
  `page` varchar(500) NOT NULL,
  `country` varchar(100),
  `city` varchar(100),
  `device` varchar(50),
  `browser` varchar(50),
  `os` varchar(50),
  `visitDuration` int DEFAULT 0,
  `isUnique` boolean NOT NULL DEFAULT false,
  `userId` varchar(191) NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `site_visitor_sessionId_idx` (`sessionId`),
  KEY `site_visitor_page_idx` (`page`),
  KEY `site_visitor_createdAt_idx` (`createdAt`),
  KEY `site_visitor_userId_idx` (`userId`),
  CONSTRAINT `SiteVisitor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Page Views Tracking Table
CREATE TABLE IF NOT EXISTS `page_view` (
  `id` varchar(191) NOT NULL,
  `visitorId` varchar(191) NOT NULL,
  `page` varchar(500) NOT NULL,
  `title` varchar(500),
  `loadTime` int DEFAULT 0,
  `scrollDepth` int DEFAULT 0,
  `timeOnPage` int DEFAULT 0,
  `exitPage` boolean NOT NULL DEFAULT false,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `page_view_visitorId_idx` (`visitorId`),
  KEY `page_view_page_idx` (`page`),
  KEY `page_view_createdAt_idx` (`createdAt`),
  CONSTRAINT `PageView_visitorId_fkey` FOREIGN KEY (`visitorId`) REFERENCES `site_visitor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property Views Tracking Table
CREATE TABLE IF NOT EXISTS `property_view` (
  `id` varchar(191) NOT NULL,
  `propertyId` varchar(191) NOT NULL,
  `visitorId` varchar(191) NOT NULL,
  `viewDuration` int DEFAULT 0,
  `source` varchar(100),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `property_view_propertyId_idx` (`propertyId`),
  KEY `property_view_visitorId_idx` (`visitorId`),
  KEY `property_view_createdAt_idx` (`createdAt`),
  CONSTRAINT `PropertyView_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PropertyView_visitorId_fkey` FOREIGN KEY (`visitorId`) REFERENCES `site_visitor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default analytics configuration
INSERT INTO `analytics_config` (`id`, `key`, `value`, `description`, `isActive`) VALUES
('analytics_ga_id', 'GOOGLE_ANALYTICS_ID', '', 'Google Analytics Measurement ID (GA4)', true),
('analytics_ga_enabled', 'GOOGLE_ANALYTICS_ENABLED', 'false', 'Enable/Disable Google Analytics tracking', true),
('analytics_gtm_id', 'GOOGLE_TAG_MANAGER_ID', '', 'Google Tag Manager Container ID', true),
('analytics_gtm_enabled', 'GOOGLE_TAG_MANAGER_ENABLED', 'false', 'Enable/Disable Google Tag Manager', true),
('analytics_visitor_tracking', 'VISITOR_TRACKING_ENABLED', 'true', 'Enable/Disable internal visitor tracking', true),
('analytics_property_tracking', 'PROPERTY_VIEW_TRACKING_ENABLED', 'true', 'Enable/Disable property view tracking', true),
('analytics_data_retention', 'DATA_RETENTION_DAYS', '365', 'Number of days to retain analytics data', true),
('analytics_ip_anonymization', 'IP_ANONYMIZATION_ENABLED', 'true', 'Enable IP address anonymization for privacy', true)
ON DUPLICATE KEY UPDATE 
  `description` = VALUES(`description`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
