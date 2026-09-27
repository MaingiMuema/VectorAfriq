-- Add featured field to properties
ALTER TABLE `Property` ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false;