/*
  Warnings:

  - A unique constraint covering the columns `[name,countyId]` on the table `City` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `City_name_countyId_key` ON `City`(`name`, `countyId`);
