-- Migration: Rate Cards System (Silver / Gold / Platinum)
-- Date: 2026-07-16
-- Description: Configurable rate card tiers & plans, agent subscriptions with
--              manual payment proof, listing quotas, and search visibility %.

-- 1. Agent subscription / visibility fields on user
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'rateCardTier');
SET @sql := IF(@col = 0,
  "ALTER TABLE `user` ADD COLUMN `rateCardTier` ENUM('NONE','SILVER','GOLD','PLATINUM') NOT NULL DEFAULT 'NONE' AFTER `badgeUpdatedAt`",
  "SELECT 'rateCardTier exists' AS info");
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'listingQuota');
SET @sql := IF(@col = 0,
  "ALTER TABLE `user` ADD COLUMN `listingQuota` INT NOT NULL DEFAULT 5 AFTER `rateCardTier`",
  "SELECT 'listingQuota exists' AS info");
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'rateCardPlanId');
SET @sql := IF(@col = 0,
  "ALTER TABLE `user` ADD COLUMN `rateCardPlanId` VARCHAR(64) NULL DEFAULT NULL AFTER `listingQuota`",
  "SELECT 'rateCardPlanId exists' AS info");
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'rateCardExpiresAt');
SET @sql := IF(@col = 0,
  "ALTER TABLE `user` ADD COLUMN `rateCardExpiresAt` DATETIME NULL DEFAULT NULL AFTER `rateCardPlanId`",
  "SELECT 'rateCardExpiresAt exists' AS info");
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2. Rate card tiers (Silver / Gold / Platinum)
CREATE TABLE IF NOT EXISTS `rate_card_tier` (
  `id` VARCHAR(64) NOT NULL,
  `slug` ENUM('SILVER','GOLD','PLATINUM') NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `subtitle` VARCHAR(128) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `features` JSON DEFAULT NULL,
  `visibilityPercent` INT NOT NULL DEFAULT 20,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `bgGradient` VARCHAR(256) DEFAULT NULL,
  `accentColor` VARCHAR(32) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_rate_card_tier_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Pricing plans under each tier
CREATE TABLE IF NOT EXISTS `rate_card_plan` (
  `id` VARCHAR(64) NOT NULL,
  `tierId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `listingLimit` INT NOT NULL,
  `monthlyPrice` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `annualPrice` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `features` JSON DEFAULT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rate_card_plan_tier` (`tierId`),
  KEY `idx_rate_card_plan_limit` (`listingLimit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Subscription / payment requests (manual till + proof)
CREATE TABLE IF NOT EXISTS `rate_card_subscription` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `planId` VARCHAR(64) NOT NULL,
  `tierSlug` ENUM('SILVER','GOLD','PLATINUM') NOT NULL,
  `billingCycle` ENUM('MONTHLY','ANNUAL') NOT NULL DEFAULT 'MONTHLY',
  `amount` DECIMAL(12,2) NOT NULL,
  `listingLimit` INT NOT NULL,
  `tillNumber` VARCHAR(64) DEFAULT NULL,
  `proofUrl` TEXT DEFAULT NULL,
  `mpesaCode` VARCHAR(64) DEFAULT NULL,
  `status` ENUM('PENDING','APPROVED','REJECTED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  `adminNotes` TEXT DEFAULT NULL,
  `reviewedBy` VARCHAR(191) DEFAULT NULL,
  `reviewedAt` DATETIME DEFAULT NULL,
  `startsAt` DATETIME DEFAULT NULL,
  `expiresAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rate_sub_user` (`userId`),
  KEY `idx_rate_sub_status` (`status`),
  KEY `idx_rate_sub_plan` (`planId`),
  KEY `idx_rate_sub_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Payment settings
INSERT IGNORE INTO `systemsetting` (`id`, `key`, `value`, `type`, `category`, `description`, `createdAt`, `updatedAt`)
VALUES
  ('setting_rate_card_till_number', 'RATE_CARD_TILL_NUMBER', '174379', 'STRING', 'Rate Cards', 'M-Pesa Till / Paybill number shown to agents for rate card payments', NOW(), NOW()),
  ('setting_rate_card_till_name', 'RATE_CARD_TILL_NAME', 'VectorAfriq Kenya', 'STRING', 'Rate Cards', 'Account name shown next to till number', NOW(), NOW()),
  ('setting_rate_card_payment_instructions', 'RATE_CARD_PAYMENT_INSTRUCTIONS', 'Pay via M-Pesa Buy Goods / Paybill using the till number below. Enter your registered email as the account reference, then upload a screenshot of the confirmation message.', 'STRING', 'Rate Cards', 'Instructions shown during rate card checkout', NOW(), NOW());

-- 6. Seed default tiers
INSERT IGNORE INTO `rate_card_tier`
  (`id`, `slug`, `name`, `subtitle`, `description`, `features`, `visibilityPercent`, `sortOrder`, `isActive`, `bgGradient`, `accentColor`, `createdAt`, `updatedAt`)
VALUES
  ('tier_silver_001', 'SILVER', 'Silver', 'Solid visibility',
   'Great for growing agents who need reliable exposure and a solid listing allowance.',
   '["Standard listing placement","CRM access","Agent profile page","Email support"]',
   20, 1, 1, 'from-slate-400 to-slate-600', '#94A3B8', NOW(), NOW()),
  ('tier_gold_001', 'GOLD', 'Gold', 'High visibility',
   'Higher placement share and larger listing packages for established agencies.',
   '["Priority placement share","CRM access","Featured agent badge eligibility","Priority email support"]',
   30, 2, 1, 'from-amber-400 to-amber-600', '#F59E0B', NOW(), NOW()),
  ('tier_platinum_001', 'PLATINUM', 'Platinum', 'Maximum exposure',
   'Top search visibility share and the largest listing packages for premium partners.',
   '["Highest placement share (50%)","Maximum listing packages","Priority support","Premium partner benefits"]',
   50, 3, 1, 'from-violet-500 to-purple-700', '#8B5CF6', NOW(), NOW());

-- 7. Seed default plans (monthly defaults as specified; annual = monthly × 10)
INSERT IGNORE INTO `rate_card_plan`
  (`id`, `tierId`, `name`, `listingLimit`, `monthlyPrice`, `annualPrice`, `features`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  -- Platinum
  ('plan_plat_10', 'tier_platinum_001', 'Platinum · 10 listings', 10, 1500.00, 15000.00,
   '["Up to 10 active listings","Platinum search visibility"]', 1, 1, NOW(), NOW()),
  ('plan_plat_100', 'tier_platinum_001', 'Platinum · 100 listings', 100, 5500.00, 55000.00,
   '["Up to 100 active listings","Platinum search visibility"]', 2, 1, NOW(), NOW()),
  ('plan_plat_1000', 'tier_platinum_001', 'Platinum · 1000 listings', 1000, 10000.00, 100000.00,
   '["Up to 1000 active listings","Platinum search visibility"]', 3, 1, NOW(), NOW()),
  -- Gold
  ('plan_gold_10', 'tier_gold_001', 'Gold · 10 listings', 10, 7000.00, 70000.00,
   '["Up to 10 active listings","Gold search visibility"]', 1, 1, NOW(), NOW()),
  ('plan_gold_100', 'tier_gold_001', 'Gold · 100 listings', 100, 1000.00, 10000.00,
   '["Up to 100 active listings","Gold search visibility"]', 2, 1, NOW(), NOW()),
  ('plan_gold_1000', 'tier_gold_001', 'Gold · 1000 listings', 1000, 7000.00, 70000.00,
   '["Up to 1000 active listings","Gold search visibility"]', 3, 1, NOW(), NOW()),
  -- Silver
  ('plan_silver_10', 'tier_silver_001', 'Silver · 10 listings', 10, 500.00, 5000.00,
   '["Up to 10 active listings","Silver search visibility"]', 1, 1, NOW(), NOW()),
  ('plan_silver_100', 'tier_silver_001', 'Silver · 100 listings', 100, 2600.00, 26000.00,
   '["Up to 100 active listings","Silver search visibility"]', 2, 1, NOW(), NOW()),
  ('plan_silver_500', 'tier_silver_001', 'Silver · 500 listings', 500, 5000.00, 50000.00,
   '["Up to 500 active listings","Silver search visibility"]', 3, 1, NOW(), NOW());
