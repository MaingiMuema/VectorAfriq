-- Add optional click-through links for banner images.
ALTER TABLE banner
  ADD COLUMN IF NOT EXISTS linkUrl VARCHAR(2048) NULL AFTER imageUrl;
