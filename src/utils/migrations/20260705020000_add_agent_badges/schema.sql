-- Migration: Add Agent Verification/Trust Badge System
-- Date: 2026-07-05
-- Description: Adds badge tier tracking to users and a payment table for badge upgrades.

-- 1. Add badge columns to the user table
ALTER TABLE `user`
  ADD COLUMN `badgeTier` ENUM('NONE','VERIFIED','TRUSTED','ELITE') NOT NULL DEFAULT 'NONE' AFTER `role`,
  ADD COLUMN `badgeUpdatedAt` DATETIME NULL AFTER `badgeTier`;

-- 2. Create the badge payment table for tracking M-Pesa payments
CREATE TABLE IF NOT EXISTS `agent_badge_payment` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `badgeTier` ENUM('TRUSTED','ELITE') NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `mpesaReceipt` VARCHAR(64) NULL DEFAULT NULL,
  `checkoutRequestId` VARCHAR(128) NULL DEFAULT NULL,
  `status` ENUM('PENDING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_badge_payment_user` (`userId`),
  INDEX `idx_badge_payment_checkout` (`checkoutRequestId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Seed default badge prices in the system setting table (if not present)
INSERT IGNORE INTO `systemsetting` (`key`, `value`, `type`, `category`, `description`, `createdAt`, `updatedAt`)
VALUES
  ('BADGE_TRUSTED_PRICE', '2500', 'NUMBER', 'Agent Badges', 'One-time M-Pesa fee (KES) for the Trusted badge', NOW(), NOW()),
  ('BADGE_ELITE_PRICE', '5000', 'NUMBER', 'Agent Badges', 'One-time M-Pesa fee (KES) for the Elite badge', NOW(), NOW()),
  ('BADGE_MIN_LISTINGS', '5', 'NUMBER', 'Agent Badges', 'Minimum active listings required to qualify for the free Verified badge', NOW(), NOW());
