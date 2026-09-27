-- SEO Configuration Table
CREATE TABLE IF NOT EXISTS `seo_config` (
  `id` varchar(191) NOT NULL,
  `key` varchar(100) NOT NULL UNIQUE,
  `value` text,
  `description` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_config_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Page Meta Tags Table
CREATE TABLE IF NOT EXISTS `page_meta` (
  `id` varchar(191) NOT NULL,
  `path` varchar(500) NOT NULL UNIQUE,
  `title` varchar(255),
  `description` text,
  `keywords` text,
  `ogTitle` varchar(255),
  `ogDescription` text,
  `ogImage` varchar(500),
  `ogType` varchar(50) DEFAULT 'website',
  `twitterCard` varchar(50) DEFAULT 'summary_large_image',
  `twitterTitle` varchar(255),
  `twitterDescription` text,
  `twitterImage` varchar(500),
  `canonicalUrl` varchar(500),
  `noIndex` boolean NOT NULL DEFAULT false,
  `noFollow` boolean NOT NULL DEFAULT false,
  `priority` decimal(2,1) DEFAULT 0.5,
  `changeFreq` enum('always','hourly','daily','weekly','monthly','yearly','never') DEFAULT 'weekly',
  `structuredData` json,
  `customMeta` json,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_meta_path_key` (`path`),
  KEY `page_meta_isActive_idx` (`isActive`),
  KEY `page_meta_noIndex_idx` (`noIndex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEO Redirects Table
CREATE TABLE IF NOT EXISTS `seo_redirect` (
  `id` varchar(191) NOT NULL,
  `fromPath` varchar(500) NOT NULL,
  `toPath` varchar(500) NOT NULL,
  `statusCode` int NOT NULL DEFAULT 301,
  `isActive` boolean NOT NULL DEFAULT true,
  `hitCount` int NOT NULL DEFAULT 0,
  `lastHit` datetime(3),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_redirect_fromPath_key` (`fromPath`),
  KEY `seo_redirect_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEO Audit Log Table
CREATE TABLE IF NOT EXISTS `seo_audit` (
  `id` varchar(191) NOT NULL,
  `path` varchar(500) NOT NULL,
  `auditType` enum('meta_check','broken_links','performance','accessibility','seo_score') NOT NULL,
  `score` int,
  `issues` json,
  `recommendations` json,
  `auditData` json,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `seo_audit_path_idx` (`path`),
  KEY `seo_audit_auditType_idx` (`auditType`),
  KEY `seo_audit_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sitemap URLs Table
CREATE TABLE IF NOT EXISTS `sitemap_url` (
  `id` varchar(191) NOT NULL,
  `url` varchar(500) NOT NULL,
  `priority` decimal(2,1) DEFAULT 0.5,
  `changeFreq` enum('always','hourly','daily','weekly','monthly','yearly','never') DEFAULT 'weekly',
  `lastMod` datetime(3),
  `isActive` boolean NOT NULL DEFAULT true,
  `urlType` enum('static','dynamic','property','blog','category') DEFAULT 'static',
  `entityId` varchar(191),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sitemap_url_url_key` (`url`),
  KEY `sitemap_url_isActive_idx` (`isActive`),
  KEY `sitemap_url_urlType_idx` (`urlType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default SEO configuration
INSERT INTO `seo_config` (`id`, `key`, `value`, `description`, `isActive`) VALUES
('seo_site_name', 'SITE_NAME', 'VectorAfriq', 'Website name for SEO and social sharing', true),
('seo_site_url', 'SITE_URL', 'https://vectorafriqproperties.co.ke', 'Primary website URL', true),
('seo_default_title', 'DEFAULT_TITLE', 'VectorAfriq | Find Your Dream Property in Kenya', 'Default page title template', true),
('seo_default_description', 'DEFAULT_DESCRIPTION', 'Browse through a wide selection of properties for sale and rent in Kenya. Find houses, apartments, land, and commercial properties.', 'Default meta description', true),
('seo_default_keywords', 'DEFAULT_KEYWORDS', 'real estate, property, Kenya, houses for sale, apartments for rent, land for sale', 'Default meta keywords', true),
('seo_og_image', 'DEFAULT_OG_IMAGE', '/images/og-default.jpg', 'Default Open Graph image', true),
('seo_twitter_handle', 'TWITTER_HANDLE', '@vectorafriqproperties', 'Twitter handle for Twitter Cards', true),
('seo_facebook_app_id', 'FACEBOOK_APP_ID', '', 'Facebook App ID for Open Graph', true),
('seo_google_site_verification', 'GOOGLE_SITE_VERIFICATION', '', 'Google Search Console verification code', true),
('seo_bing_site_verification', 'BING_SITE_VERIFICATION', '', 'Bing Webmaster Tools verification code', true),
('seo_robots_txt', 'ROBOTS_TXT', 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /crm/\nDisallow: /api/\n\nSitemap: https://vectorafriqproperties.co.ke/sitemap.xml', 'Robots.txt content', true),
('seo_sitemap_enabled', 'SITEMAP_ENABLED', 'true', 'Enable automatic sitemap generation', true),
('seo_structured_data_enabled', 'STRUCTURED_DATA_ENABLED', 'true', 'Enable JSON-LD structured data', true),
('seo_auto_meta_enabled', 'AUTO_META_ENABLED', 'true', 'Enable automatic meta tag generation for properties', true),
('seo_canonical_enabled', 'CANONICAL_ENABLED', 'true', 'Enable canonical URLs', true)
ON DUPLICATE KEY UPDATE 
  `description` = VALUES(`description`),
  `updatedAt` = CURRENT_TIMESTAMP(3);

-- Insert default page meta tags
INSERT INTO `page_meta` (`id`, `path`, `title`, `description`, `keywords`, `priority`, `changeFreq`) VALUES
('meta_home', '/', 'VectorAfriq | Find Your Dream Property in Kenya', 'Browse through a wide selection of properties for sale and rent in Kenya. Find houses, apartments, land, and commercial properties.', 'real estate, property, Kenya, houses for sale, apartments for rent', 1.0, 'daily'),
('meta_properties', '/properties', 'Properties in Kenya | VectorAfriq', 'Browse through our wide selection of properties in Kenya', 'properties Kenya, real estate Kenya', 0.9, 'daily'),
('meta_properties_sale', '/properties-for-sale', 'Properties For Sale | VectorAfriq', 'Browse through our wide selection of properties for sale in Kenya', 'properties for sale Kenya, houses for sale', 0.9, 'daily'),
('meta_properties_rent', '/properties-for-rent', 'Properties For Rent | VectorAfriq', 'Browse through our wide selection of properties for rent in Kenya', 'properties for rent Kenya, rental properties', 0.9, 'daily'),
('meta_houses_sale', '/houses-for-sale', 'Houses For Sale | VectorAfriq', 'Browse through our wide selection of houses for sale in Kenya', 'houses for sale Kenya, homes for sale', 0.8, 'daily'),
('meta_houses_rent', '/houses-for-rent', 'Houses For Rent | VectorAfriq', 'Browse through our wide selection of houses for rent in Kenya', 'houses for rent Kenya, rental homes', 0.8, 'daily'),
('meta_apartments_sale', '/apartments-for-sale', 'Apartments For Sale | VectorAfriq', 'Browse through our wide selection of apartments for sale in Kenya', 'apartments for sale Kenya, flats for sale', 0.8, 'daily'),
('meta_apartments_rent', '/apartments-for-rent', 'Apartments For Rent | VectorAfriq', 'Browse through our wide selection of apartments for rent in Kenya', 'apartments for rent Kenya, flats for rent', 0.8, 'daily'),
('meta_land_sale', '/land-for-sale', 'Land For Sale | VectorAfriq', 'Browse through our wide selection of land for sale in Kenya', 'land for sale Kenya, plots for sale', 0.7, 'weekly'),
('meta_commercial_sale', '/commercial-property-for-sale', 'Commercial Properties For Sale | VectorAfriq', 'Browse through our wide selection of commercial properties for sale in Kenya', 'commercial property Kenya, office space for sale', 0.7, 'weekly'),
('meta_airbnb', '/airbnb', 'Airbnb Properties | VectorAfriq', 'Browse through our wide selection of airbnb properties in Kenya', 'airbnb Kenya, vacation rentals Kenya', 0.6, 'weekly'),
('meta_investment_guide', '/investment-guide', 'Property Investment Guide Kenya - VectorAfriq', 'Comprehensive guide to investing in Kenyan real estate. Learn about market trends, legal requirements, financing options, and investment strategies.', 'property investment Kenya, real estate investment guide', 0.5, 'monthly'),
('meta_privacy', '/privacy-policy', 'Privacy Policy | VectorAfriq', 'Privacy Policy for VectorAfriq - Learn how we collect, use, and protect your personal information.', 'privacy policy, data protection', 0.3, 'yearly')
ON DUPLICATE KEY UPDATE 
  `title` = VALUES(`title`),
  `description` = VALUES(`description`),
  `keywords` = VALUES(`keywords`),
  `updatedAt` = CURRENT_TIMESTAMP(3);

-- Insert default sitemap URLs
INSERT INTO `sitemap_url` (`id`, `url`, `priority`, `changeFreq`, `urlType`) VALUES
('sitemap_home', '/', 1.0, 'daily', 'static'),
('sitemap_properties', '/properties', 0.9, 'daily', 'static'),
('sitemap_properties_sale', '/properties-for-sale', 0.9, 'daily', 'static'),
('sitemap_properties_rent', '/properties-for-rent', 0.9, 'daily', 'static'),
('sitemap_houses_sale', '/houses-for-sale', 0.8, 'daily', 'static'),
('sitemap_houses_rent', '/houses-for-rent', 0.8, 'daily', 'static'),
('sitemap_apartments_sale', '/apartments-for-sale', 0.8, 'daily', 'static'),
('sitemap_apartments_rent', '/apartments-for-rent', 0.8, 'daily', 'static'),
('sitemap_land_sale', '/land-for-sale', 0.7, 'weekly', 'static'),
('sitemap_commercial_sale', '/commercial-property-for-sale', 0.7, 'weekly', 'static'),
('sitemap_airbnb', '/airbnb', 0.6, 'weekly', 'static'),
('sitemap_investment_guide', '/investment-guide', 0.5, 'monthly', 'static'),
('sitemap_privacy', '/privacy-policy', 0.3, 'yearly', 'static')
ON DUPLICATE KEY UPDATE 
  `priority` = VALUES(`priority`),
  `changeFreq` = VALUES(`changeFreq`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
