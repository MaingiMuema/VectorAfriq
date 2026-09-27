-- CreateTable
CREATE TABLE `SystemSetting` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `type` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `SystemSetting_key_key`(`key`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO `SystemSetting` (`id`, `key`, `value`, `type`, `category`, `description`, `createdAt`, `updatedAt`)
VALUES
  (UUID(), 'site.name', 'Property Finder', 'STRING', 'general', 'Website name', NOW(), NOW()),
  (UUID(), 'site.description', 'Find your perfect property', 'STRING', 'general', 'Website description', NOW(), NOW()),
  (UUID(), 'contact.email', 'support@example.com', 'STRING', 'contact', 'Support email address', NOW(), NOW()),
  (UUID(), 'contact.phone', '+1234567890', 'STRING', 'contact', 'Support phone number', NOW(), NOW()),
  (UUID(), 'social.facebook', '', 'STRING', 'social', 'Facebook page URL', NOW(), NOW()),
  (UUID(), 'social.twitter', '', 'STRING', 'social', 'Twitter profile URL', NOW(), NOW()),
  (UUID(), 'social.instagram', '', 'STRING', 'social', 'Instagram profile URL', NOW(), NOW()),
  (UUID(), 'features.blog', 'true', 'BOOLEAN', 'features', 'Enable blog feature', NOW(), NOW()),
  (UUID(), 'features.propertyAlerts', 'true', 'BOOLEAN', 'features', 'Enable property alerts', NOW(), NOW()),
  (UUID(), 'features.favorites', 'true', 'BOOLEAN', 'features', 'Enable favorites feature', NOW(), NOW()),
  (UUID(), 'seo.googleAnalytics', '', 'STRING', 'seo', 'Google Analytics ID', NOW(), NOW()),
  (UUID(), 'seo.metaDescription', 'Find and list properties for sale and rent', 'STRING', 'seo', 'Default meta description', NOW(), NOW()),
  (UUID(), 'listing.imagesLimit', '10', 'NUMBER', 'listing', 'Maximum number of images per listing', NOW(), NOW()),
  (UUID(), 'listing.expiryDays', '30', 'NUMBER', 'listing', 'Days until listing expires', NOW(), NOW()),
  (UUID(), 'currency.code', 'USD', 'STRING', 'currency', 'Default currency code', NOW(), NOW()),
  (UUID(), 'currency.symbol', '$', 'STRING', 'currency', 'Currency symbol', NOW(), NOW());