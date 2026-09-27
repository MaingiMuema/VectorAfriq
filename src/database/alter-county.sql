-- First, drop foreign key constraints that reference county.id
ALTER TABLE city
DROP FOREIGN KEY IF EXISTS City_countyId_fkey;

ALTER TABLE neighborhood
DROP FOREIGN KEY IF EXISTS Neighborhood_countyId_fkey;

-- Modify columns in county table
ALTER TABLE county
MODIFY COLUMN id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
MODIFY COLUMN name VARCHAR(191) NOT NULL,
MODIFY COLUMN slug VARCHAR(191) NOT NULL,
MODIFY COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
MODIFY COLUMN updatedAt DATETIME(3) NOT NULL;

-- Drop and recreate indexes if they exist
DROP INDEX IF EXISTS County_slug_key ON county;
DROP INDEX IF EXISTS County_name_idx ON county;

-- Add indexes back
ALTER TABLE county
ADD UNIQUE INDEX County_slug_key (slug),
ADD INDEX County_name_idx (name);

-- Update related tables to match UUID format
ALTER TABLE city
MODIFY COLUMN countyId CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL;

ALTER TABLE neighborhood
MODIFY COLUMN countyId CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL;

-- Recreate foreign key constraints
ALTER TABLE city
ADD CONSTRAINT City_countyId_fkey 
FOREIGN KEY (countyId) REFERENCES county(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE neighborhood
ADD CONSTRAINT Neighborhood_countyId_fkey 
FOREIGN KEY (countyId) REFERENCES county(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add these indexes back if they don't exist
ALTER TABLE city
ADD INDEX IF NOT EXISTS City_countyId_idx (countyId);

ALTER TABLE neighborhood
ADD INDEX IF NOT EXISTS Neighborhood_countyId_idx (countyId);