-- Banner Schema Update Migration
-- This migration removes title and description columns and adds categories column
-- Run this SQL script against your database

-- Add categories column
ALTER TABLE banner ADD COLUMN categories TEXT AFTER imageUrl;

-- Update existing banners to have empty categories array
UPDATE banner SET categories = '[]' WHERE categories IS NULL OR categories = '';

-- Remove title column
ALTER TABLE banner DROP COLUMN title;

-- Remove description column
ALTER TABLE banner DROP COLUMN description;

-- Verify the changes
DESCRIBE banner;
