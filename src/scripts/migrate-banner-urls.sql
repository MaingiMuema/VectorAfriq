-- Migration script to update banner image URLs from "banners" to "media" path
-- This fixes adblocker issues by avoiding the word "banners" in URLs

-- Update any existing banner imageUrl that contains "/api/images/banners/" to use "/api/images/media/"
UPDATE banner 
SET imageUrl = REPLACE(imageUrl, '/api/images/banners/', '/api/images/media/')
WHERE imageUrl LIKE '%/api/images/banners/%';

-- Verify the changes
SELECT id, title, imageUrl 
FROM banner 
WHERE imageUrl LIKE '%/api/images/media/%';
