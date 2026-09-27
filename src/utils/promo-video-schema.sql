-- Promo Video Generator — job queue table.
-- Created by: node --env-file=.env src/scripts/init-promo-video.js
CREATE TABLE IF NOT EXISTS `promo_video_job` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NULL,
  `prompt` TEXT NOT NULL,
  `model` VARCHAR(128) NOT NULL,
  `format` VARCHAR(16) NOT NULL DEFAULT 'landscape',
  `uploadedAssets` TEXT NULL,
  `status` ENUM('queued','claimed','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  `progress` INT NOT NULL DEFAULT 0,
  `step` VARCHAR(255) NULL,
  `script` TEXT NULL,
  `assets` TEXT NULL,
  `videoFile` VARCHAR(255) NULL,
  `videoFileVertical` VARCHAR(255) NULL,
  `errorMessage` TEXT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `maxAttempts` INT NOT NULL DEFAULT 2,
  `claimedAt` DATETIME(3) NULL,
  `heartbeatAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  `createdBy` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_promo_video_job_status` (`status`),
  KEY `idx_promo_video_job_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
