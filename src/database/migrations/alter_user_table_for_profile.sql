-- Add new columns to user table for profile information
ALTER TABLE `user` 
ADD COLUMN `phone` varchar(191) DEFAULT NULL,
ADD COLUMN `bio` text DEFAULT NULL,
ADD COLUMN `avatar` text DEFAULT NULL,
ADD COLUMN `specialization` text DEFAULT NULL,
ADD COLUMN `languages` text DEFAULT NULL,
ADD COLUMN `socialMedia` text DEFAULT NULL;