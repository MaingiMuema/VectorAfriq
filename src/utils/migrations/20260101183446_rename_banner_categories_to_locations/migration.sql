-- Rename categories column to locations in banner table
ALTER TABLE banner CHANGE COLUMN categories locations JSON;



