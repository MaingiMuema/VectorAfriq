-- DropForeignKey
ALTER TABLE `neighborhood` DROP FOREIGN KEY `Neighborhood_countyId_fkey`;

-- DropIndex
DROP INDEX `City_slug_idx` ON `city`;

-- DropIndex
DROP INDEX `County_slug_idx` ON `county`;

-- DropIndex
DROP INDEX `Neighborhood_slug_idx` ON `neighborhood`;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('USER', 'ADMIN', 'AGENT') NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX `City_name_idx` ON `City`(`name`);

-- CreateIndex
CREATE INDEX `County_name_idx` ON `County`(`name`);

-- CreateIndex
CREATE INDEX `Neighborhood_name_idx` ON `Neighborhood`(`name`);

-- AddForeignKey
ALTER TABLE `Neighborhood` ADD CONSTRAINT `Neighborhood_countyId_fkey` FOREIGN KEY (`countyId`) REFERENCES `County`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
