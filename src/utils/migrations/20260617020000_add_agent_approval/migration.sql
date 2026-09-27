-- Migration: Add agent_approval table for user-to-agent upgrade workflow
-- Users must get admin approval before becoming agents and uploading properties

CREATE TABLE IF NOT EXISTS `agent_approval` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `phone` VARCHAR(20) DEFAULT NULL,
  `company` VARCHAR(255) DEFAULT NULL,
  `licenseNumber` VARCHAR(100) DEFAULT NULL,
  `experience` VARCHAR(100) DEFAULT NULL,
  `specialization` VARCHAR(255) DEFAULT NULL,
  `message` TEXT DEFAULT NULL,
  `reviewNotes` TEXT DEFAULT NULL,
  `reviewedAt` DATETIME DEFAULT NULL,
  `reviewedBy` VARCHAR(36) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_agent_approval_userId` (`userId`),
  INDEX `idx_agent_approval_status` (`status`),
  INDEX `idx_agent_approval_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
