-- CreateTable
CREATE TABLE `lead` (
  `id` varchar(191) NOT NULL,
  `type` ENUM('PHONE', 'EMAIL', 'CHAT') NOT NULL,
  `status` ENUM('GOLD', 'SILVER', 'BASIC') NOT NULL DEFAULT 'BASIC',
  `description` text NOT NULL,
  `propertyId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Lead_userId_fkey` (`userId`),
  KEY `Lead_propertyId_fkey` (`propertyId`),
  CONSTRAINT `Lead_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Lead_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revenue` (
  `id` varchar(191) NOT NULL,
  `amount` double NOT NULL,
  `type` ENUM('COMMISSION', 'LISTING_FEE', 'OTHER') NOT NULL,
  `description` text,
  `propertyId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Revenue_userId_fkey` (`userId`),
  KEY `Revenue_propertyId_fkey` (`propertyId`),
  CONSTRAINT `Revenue_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Revenue_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;