/*
  Warnings:

  - The values [RESIDENTIAL,COMMERCIAL,INDUSTRIAL,LAND] on the enum `PropertyCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Property` MODIFY `category` ENUM('APARTMENTS', 'BUNGALOWS', 'COMMERCIAL_PLOTS', 'DUPLEX', 'HOUSES', 'PENTHOUSES', 'RESIDENTIAL_PLOTS', 'TOWNHOUSES') NOT NULL;