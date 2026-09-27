-- CreateTable
CREATE TABLE `saved_search` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `criteria` JSON NOT NULL,
    `url` TEXT NOT NULL,
    `urlHash` CHAR(64) NOT NULL,
    `notificationsEnabled` BOOLEAN NOT NULL DEFAULT false,
    `matchCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SavedSearch_userId_urlHash_key`(`userId`, `urlHash`),
    INDEX `SavedSearch_userId_idx`(`userId`),
    INDEX `SavedSearch_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `saved_search` ADD CONSTRAINT `SavedSearch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
