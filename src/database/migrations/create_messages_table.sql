-- Create messages table for property inquiries
CREATE TABLE IF NOT EXISTS `messages` (
  `id` varchar(191) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `propertyId` varchar(191) NOT NULL,
  `status` enum('NEW','READ','REPLIED') NOT NULL DEFAULT 'NEW',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Messages_propertyId_fkey` (`propertyId`),
  KEY `Messages_status_idx` (`status`),
  KEY `Messages_createdAt_idx` (`createdAt`),
  CONSTRAINT `Messages_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data based on the provided example
INSERT INTO `messages` (`id`, `fullName`, `email`, `phone`, `message`, `propertyId`, `status`, `createdAt`, `updatedAt`) VALUES
('bS7Nm40DAx2DUZo4ObVBQ', 'Test User', 'm@gmail.com', '0112246573', 'Hi, I\'d like to know more about this property. Please provide more details about the amenities and viewing schedule.', 'cmm985sb6mo4lkp', 'NEW', '2025-04-29 08:15:08.920', '2025-04-29 08:15:08.000');