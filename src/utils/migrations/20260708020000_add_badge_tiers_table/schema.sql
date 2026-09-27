-- Migration: Agent Badge Tiers Configuration Table
-- Date: 2026-07-08
-- Description: Adds a dedicated table for badge tier configuration (name, description, features, price, etc.)

-- 1. Create the agent_badge_tier table
CREATE TABLE IF NOT EXISTS `agent_badge_tier` (
  `id` VARCHAR(64) NOT NULL,
  `tier` ENUM('NONE','VERIFIED','TRUSTED','ELITE') NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `subtitle` VARCHAR(128) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `features` JSON DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `autoAssignEnabled` BOOLEAN NOT NULL DEFAULT FALSE,
  `minListings` INT NOT NULL DEFAULT 5,
  `bgGradient` VARCHAR(256) DEFAULT NULL,
  `iconColor` VARCHAR(32) DEFAULT NULL,
  `accentColor` VARCHAR(32) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_badge_tier` (`tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Seed default badge tiers
INSERT IGNORE INTO `agent_badge_tier` (`id`, `tier`, `name`, `subtitle`, `description`, `features`, `price`, `sortOrder`, `isActive`, `autoAssignEnabled`, `minListings`, `bgGradient`, `iconColor`, `accentColor`, `createdAt`, `updatedAt`)
VALUES
  ('badge_verified_001', 'VERIFIED', 'Verified', 'Basic Checks', 'Basic profile checks completed — contact details and listings verified by VectorAfriq.',
   '["Profile completeness check","Minimum active listings","Contact details verified","Email verification"]',
   0.00, 1, TRUE, TRUE, 5,
   'from-blue-500 to-blue-600', 'white', '#3B82F6', NOW(), NOW()),
  ('badge_trusted_001', 'TRUSTED', 'Trusted', 'License & Background', 'License & background verified — identity and credentials confirmed by VectorAfriq.',
   '["Everything in Verified","License validation","Background check","Identity confirmation","Professional credentials verified"]',
   2500.00, 2, TRUE, FALSE, 0,
   'from-emerald-500 to-emerald-600', 'white', '#10B981', NOW(), NOW()),
  ('badge_elite_001', 'ELITE', 'Elite', 'Full Vetting & Performance', 'Full vetting & performance review — comprehensive background check, license validation, and client satisfaction tracking.',
   '["Everything in Trusted","Comprehensive vetting","Performance review","Client satisfaction tracking","Priority listing placement","Elite badge on all properties"]',
   5000.00, 3, TRUE, FALSE, 0,
   'from-amber-500 to-orange-500', 'white', '#F59E0B', NOW(), NOW());

-- 3. Remove old badge price settings (they are now in the agent_badge_tier table)
DELETE FROM `systemsetting` WHERE `key` IN ('BADGE_TRUSTED_PRICE', 'BADGE_ELITE_PRICE', 'BADGE_MIN_LISTINGS');
