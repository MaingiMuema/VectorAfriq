-- CreateTable
CREATE TABLE `banner` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NOT NULL,
    `linkUrl` VARCHAR(255) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `location` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `banner_location_idx`(`location`),
    INDEX `banner_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `banner` ADD CONSTRAINT `banner_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add initial banner data
INSERT INTO banner (id, title, description, imageUrl, linkUrl, location, userId, updatedAt) 
SELECT 
    UUID(),
    'Find Your Perfect Property',
    'Browse through our wide selection of properties',
    '/images/placeholder.png',
    '/request-property',
    'properties-listing',
    (SELECT id FROM User WHERE role = 'ADMIN' LIMIT 1),
    CURRENT_TIMESTAMP(3);