-- Add bedrooms column to neighborhood_guides table
-- This allows admins to specify which bedroom counts a guide should appear for
-- JSON array format: ["studio","1","2","3","4","5"] where "5" means 5+ bedrooms
-- Empty/null means the guide applies to all bedroom counts

ALTER TABLE `neighborhood_guides`
  ADD COLUMN IF NOT EXISTS `bedrooms` text DEFAULT NULL COMMENT 'JSON array of bedroom values this guide applies to (e.g. ["studio","1","2"]). Null = all bedrooms.';

CREATE INDEX IF NOT EXISTS `neighborhood_guides_bedrooms_idx` ON `neighborhood_guides` (`bedrooms`(100));
