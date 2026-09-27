-- Migration: Add description column to reportedcontent table
-- Run this against the propertyfinder database

ALTER TABLE `reportedcontent`
  ADD COLUMN `description` text DEFAULT NULL AFTER `reason`;

-- Verify the change
DESCRIBE `reportedcontent`;
