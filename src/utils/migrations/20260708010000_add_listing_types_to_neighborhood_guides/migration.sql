-- Add listingTypes column to neighborhood_guides table
-- This allows admins to specify which listing types (sale, rent, airbnb) a guide should appear for
-- JSON array format: ["sale","rent","airbnb"]
-- Empty/null means the guide applies to all listing types

ALTER TABLE `neighborhood_guides`
  ADD COLUMN IF NOT EXISTS `listingTypes` text DEFAULT NULL COMMENT 'JSON array of listing types this guide applies to (e.g. ["sale","rent"]). Null = all types.';

CREATE INDEX IF NOT EXISTS `neighborhood_guides_listingTypes_idx` ON `neighborhood_guides` (`listingTypes`(100));
