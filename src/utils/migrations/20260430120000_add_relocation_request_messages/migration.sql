CREATE TABLE IF NOT EXISTS `relocation_request_messages` (
  `id` varchar(191) NOT NULL,
  `requestId` varchar(191) NOT NULL,
  `senderId` varchar(191) NOT NULL,
  `senderRole` enum('CUSTOMER','MOVER','ADMIN') NOT NULL,
  `message` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `relocation_request_messages_request_idx` (`requestId`, `createdAt`),
  KEY `relocation_request_messages_sender_idx` (`senderId`),
  CONSTRAINT `relocation_request_messages_requestId_fkey`
    FOREIGN KEY (`requestId`) REFERENCES `relocation_requests` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `relocation_request_messages_senderId_fkey`
    FOREIGN KEY (`senderId`) REFERENCES `user` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
