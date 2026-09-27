-- Create OTP table
CREATE TABLE `otp` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `code` varchar(6) NOT NULL,
  `type` enum('LOGIN','VERIFICATION') NOT NULL DEFAULT 'LOGIN',
  `expires` datetime(3) NOT NULL,
  `used` boolean NOT NULL DEFAULT false,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `OTP_userId_idx` (`userId`),
  KEY `OTP_code_idx` (`code`),
  KEY `OTP_expires_idx` (`expires`),
  FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;