ALTER TABLE `mover_profiles`
  ADD COLUMN IF NOT EXISTS `driversLicenseBackUrl` varchar(500) DEFAULT NULL AFTER `driversLicense`,
  ADD COLUMN IF NOT EXISTS `idBackUrl` varchar(500) DEFAULT NULL AFTER `idNumber`;
