ALTER TABLE `mover_profiles`
  ADD COLUMN IF NOT EXISTS `vehicleImageUrl` varchar(500) DEFAULT NULL AFTER `vehiclePlate`,
  ADD COLUMN IF NOT EXISTS `driversLicenseBackUrl` varchar(500) DEFAULT NULL AFTER `driversLicense`,
  ADD COLUMN IF NOT EXISTS `idBackUrl` varchar(500) DEFAULT NULL AFTER `idNumber`,
  MODIFY COLUMN `driversLicense` varchar(500) NOT NULL,
  MODIFY COLUMN `idNumber` varchar(500) NOT NULL;
