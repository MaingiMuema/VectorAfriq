-- Migration script to remove location and linkUrl columns from banner table
-- This makes banners display as slideshow on all pages without location-based filtering
-- Note: userId field is kept for tracking which admin created each banner

-- Remove the location column (if it exists)
ALTER TABLE banner DROP COLUMN IF EXISTS location;

-- Remove the linkUrl column (if it exists)
ALTER TABLE banner DROP COLUMN IF EXISTS linkUrl;

-- Remove the location index (if it exists)
DROP INDEX IF EXISTS banner_location_idx ON banner;

-- Verify the updated table structure
DESCRIBE banner;

-- Show current banner data
SELECT id, title, description, active, userId, createdAt FROM banner;
