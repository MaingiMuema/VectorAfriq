-- Migration: Add account active/deactivated status for users and agents
-- Date: 2026-07-16
-- Description: Allows admins to deactivate/reactivate user accounts.
--              Deactivated users are denied login and can appeal for reactivation.
-- Safe to re-run: skips columns/indexes that already exist.

-- 1. isActive
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user'
    AND COLUMN_NAME = 'isActive'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `user` ADD COLUMN `isActive` TINYINT(1) NOT NULL DEFAULT 1 AFTER `role`',
  'SELECT ''isActive already exists'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. deactivatedAt
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user'
    AND COLUMN_NAME = 'deactivatedAt'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `user` ADD COLUMN `deactivatedAt` DATETIME NULL DEFAULT NULL AFTER `isActive`',
  'SELECT ''deactivatedAt already exists'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. deactivatedBy
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user'
    AND COLUMN_NAME = 'deactivatedBy'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `user` ADD COLUMN `deactivatedBy` VARCHAR(191) NULL DEFAULT NULL AFTER `deactivatedAt`',
  'SELECT ''deactivatedBy already exists'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Index on isActive
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user'
    AND INDEX_NAME = 'idx_user_isActive'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_user_isActive` ON `user` (`isActive`)',
  'SELECT ''idx_user_isActive already exists'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Reactivation appeals table
CREATE TABLE IF NOT EXISTS `account_reactivation_request` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(191) NULL DEFAULT NULL,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NULL DEFAULT NULL,
  `message` TEXT NULL DEFAULT NULL,
  `status` ENUM('PENDING','REVIEWED','RESOLVED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_reactivation_email` (`email`),
  INDEX `idx_reactivation_status` (`status`),
  INDEX `idx_reactivation_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
