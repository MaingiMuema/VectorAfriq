-- Insert sample leads using existing property and user
INSERT INTO `lead` (
  `id`, 
  `type`, 
  `status`, 
  `description`, 
  `propertyId`, 
  `userId`, 
  `createdAt`, 
  `updatedAt`
)
VALUES 
-- Current month leads
(
  'cmm8zk6j45ng3tv',
  'PHONE',
  'GOLD',
  'Phone inquiry about 1 bedroom apartment',
  'cm6z35qtv0001u6tcgud069ao',
  'cm6yzj5vy0000u628zv6wkeom',
  NOW(),
  NOW()
),
(
  'cmm8zk6j45ng4tv',
  'EMAIL',
  'SILVER',
  'Email request for property viewing',
  'cm6z35qtv0001u6tcgud069ao',
  'cm6yzj5vy0000u628zv6wkeom',
  DATE_SUB(NOW(), INTERVAL 2 DAY),
  DATE_SUB(NOW(), INTERVAL 2 DAY)
),
(
  'cmm8zk6j45ng5tv',
  'CHAT',
  'BASIC',
  'Chat inquiry about property details',
  'cm6z35qtv0001u6tcgud069ao',
  'cm6yzj5vy0000u628zv6wkeom',
  DATE_SUB(NOW(), INTERVAL 5 DAY),
  DATE_SUB(NOW(), INTERVAL 5 DAY)
),
-- Previous month leads
(
  'cmm8zk6j45ng8tv',
  'PHONE',
  'GOLD',
  'Previous month phone inquiry',
  'cm6z35qtv0001u6tcgud069ao',
  'cm6yzj5vy0000u628zv6wkeom',
  DATE_SUB(NOW(), INTERVAL 1 MONTH),
  DATE_SUB(NOW(), INTERVAL 1 MONTH)
),
(
  'cmm8zk6j45ng9tv',
  'EMAIL',
  'SILVER',
  'Previous month email inquiry',
  'cm6z35qtv0001u6tcgud069ao',
  'cm6yzj5vy0000u628zv6wkeom',
  DATE_SUB(NOW(), INTERVAL 1 MONTH),
  DATE_SUB(NOW(), INTERVAL 1 MONTH)
),
(
  'cmm8zk6j45ng0tv',
  'CHAT',
  'BASIC',
  'Previous month chat inquiry',
  'cm6z35qtv0001u6tcgud069ao',
  'cm6yzj5vy0000u628zv6wkeom',
  DATE_SUB(NOW(), INTERVAL 1 MONTH),
  DATE_SUB(NOW(), INTERVAL 1 MONTH)
);

-- Insert sample revenue entries
INSERT INTO `revenue` (
  `id`,
  `amount`,
  `type`,
  `description`,
  `propertyId`,
  `userId`,
  `createdAt`,
  `updatedAt`
)
VALUES 
-- Current month revenue
(
  'cmm8zk6j45ng6tv',
  50000,
  'COMMISSION',
  'Commission from property sale',
  'cm6z35qtv0001u6tcgud069ao',
  'cm6yzj5vy0000u628zv6wkeom',
  NOW(),
  NOW()
),
(
  'cmm8zk6j45ng7tv',
  25000,
  'LISTING_FEE',
  'Listing fee for premium property',
  'cm6z35qtv0001u6tcgud069ao',
  'cm6yzj5vy0000u628zv6wkeom',
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  DATE_SUB(NOW(), INTERVAL 1 DAY)
),
-- Previous month revenue
(
  'cmm8zk6j45nga1v',
  40000,
  'COMMISSION',
  'Previous month commission',
  'cm6z35qtv0001u6tcgud069ao',
  'cm6yzj5vy0000u628zv6wkeom',
  DATE_SUB(NOW(), INTERVAL 1 MONTH),
  DATE_SUB(NOW(), INTERVAL 1 MONTH)
),
(
  'cmm8zk6j45nga2v',
  20000,
  'LISTING_FEE',
  'Previous month listing fee',
  'cm6z35qtv0001u6tcgud069ao',
  'cm6yzj5vy0000u628zv6wkeom',
  DATE_SUB(NOW(), INTERVAL 1 MONTH),
  DATE_SUB(NOW(), INTERVAL 1 MONTH)
);