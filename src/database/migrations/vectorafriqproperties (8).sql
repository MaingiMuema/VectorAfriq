-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 05, 2025 at 07:32 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `vectorafriqproperties`
--

-- --------------------------------------------------------

--
-- Table structure for table `account`
--

CREATE TABLE `account` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `provider` varchar(191) NOT NULL,
  `providerAccountId` varchar(191) NOT NULL,
  `refresh_token` text DEFAULT NULL,
  `access_token` text DEFAULT NULL,
  `expires_at` int(11) DEFAULT NULL,
  `token_type` varchar(191) DEFAULT NULL,
  `scope` varchar(191) DEFAULT NULL,
  `id_token` text DEFAULT NULL,
  `session_state` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `blogcategory`
--

CREATE TABLE `blogcategory` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `city`
--

CREATE TABLE `city` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `countyId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `city`
--

INSERT INTO `city` (`id`, `name`, `slug`, `countyId`, `createdAt`, `updatedAt`) VALUES
('215833e764aa48758cb8f6a7fcf60c6a', 'Mlolongo', 'mlolongo', 'efde730d59f24f538a7829905438c43b', '2025-03-12 11:21:00.000', '2025-03-12 11:21:00.000'),
('cm6yvzpkr0002u62sn6rmp5cs', 'Westlands', 'westlands', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-02-10 10:04:48.314', '2025-02-10 10:04:48.314');

-- --------------------------------------------------------

--
-- Table structure for table `company`
--

CREATE TABLE `company` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `logo` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `socialMedia` text DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company`
--

INSERT INTO `company` (`id`, `name`, `logo`, `description`, `email`, `phone`, `website`, `address`, `socialMedia`, `userId`, `createdAt`, `updatedAt`) VALUES
('cmm8sc6jgsng3tv', 'VectorAfriq', '/companies/cmm8sc6jgsng3tv/1743140412172-property1.jpg', 'Best platform to get properties.', 'info@vectorafriqproperties.co.ke', '0112246573', 'https://vectorafriqproperties.co.ke', 'Nairobi, Kenya', '{}', 'cm6yzj5vy0000u628zv6wkeom', '2025-03-28 08:23:02.289', '2025-03-28 08:40:12.000');

-- --------------------------------------------------------

--
-- Table structure for table `county`
--

CREATE TABLE `county` (
  `id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `county`
--

INSERT INTO `county` (`id`, `name`, `slug`, `createdAt`, `updatedAt`) VALUES
('cm6yvzh1u0000u62sqfhq8oqy', 'Nairobi', 'nairobi', '2025-02-10 10:04:37.265', '2025-02-10 10:04:37.265'),
('efde730d59f24f538a7829905438c43b', 'Machakos', 'machakos', '2025-03-12 11:20:20.000', '2025-03-12 11:20:20.000');

-- --------------------------------------------------------

--
-- Table structure for table `favorite`
--

CREATE TABLE `favorite` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `propertyId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead`
--

CREATE TABLE `lead` (
  `id` varchar(191) NOT NULL,
  `type` enum('PHONE','EMAIL','CHAT') NOT NULL,
  `status` enum('GOLD','SILVER','BASIC') NOT NULL DEFAULT 'BASIC',
  `description` text NOT NULL,
  `propertyId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lead`
--

INSERT INTO `lead` (`id`, `type`, `status`, `description`, `propertyId`, `userId`, `createdAt`, `updatedAt`) VALUES
('cmm8zk6j45ng0tv', 'CHAT', 'BASIC', 'Previous month chat inquiry', 'cm6z35qtv0001u6tcgud069ao', 'cm6yzj5vy0000u628zv6wkeom', '2025-03-02 06:34:04.000', '2025-03-02 06:34:04.000'),
('cmm8zk6j45ng3tv', 'PHONE', 'GOLD', 'Phone inquiry about 1 bedroom apartment', 'cm6z35qtv0001u6tcgud069ao', 'cm6yzj5vy0000u628zv6wkeom', '2025-04-02 06:34:04.000', '2025-04-02 06:34:04.000'),
('cmm8zk6j45ng4tv', 'EMAIL', 'SILVER', 'Email request for property viewing', 'cm6z35qtv0001u6tcgud069ao', 'cm6yzj5vy0000u628zv6wkeom', '2025-03-31 06:34:04.000', '2025-03-31 06:34:04.000'),
('cmm8zk6j45ng5tv', 'CHAT', 'BASIC', 'Chat inquiry about property details', 'cm6z35qtv0001u6tcgud069ao', 'cm6yzj5vy0000u628zv6wkeom', '2025-03-28 06:34:04.000', '2025-03-28 06:34:04.000'),
('cmm8zk6j45ng8tv', 'PHONE', 'GOLD', 'Previous month phone inquiry', 'cm6z35qtv0001u6tcgud069ao', 'cm6yzj5vy0000u628zv6wkeom', '2025-03-02 06:34:04.000', '2025-03-02 06:34:04.000'),
('cmm8zk6j45ng9tv', 'EMAIL', 'SILVER', 'Previous month email inquiry', 'cm6z35qtv0001u6tcgud069ao', 'cm6yzj5vy0000u628zv6wkeom', '2025-03-02 06:34:04.000', '2025-03-02 06:34:04.000');

-- --------------------------------------------------------

--
-- Table structure for table `neighborhood`
--

CREATE TABLE `neighborhood` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `cityId` varchar(191) NOT NULL,
  `countyId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `neighborhood`
--

INSERT INTO `neighborhood` (`id`, `name`, `slug`, `cityId`, `countyId`, `createdAt`, `updatedAt`) VALUES
('3a45613c468345429a9cc15cde726596', 'Syokimau', 'syokimau', '215833e764aa48758cb8f6a7fcf60c6a', 'efde730d59f24f538a7829905438c43b', '2025-03-12 11:21:32.000', '2025-03-12 11:21:32.000'),
('cm6yw0hxe0004u62s8kg50lne', 'Parklands', 'parklands', 'cm6yvzpkr0002u62sn6rmp5cs', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-02-10 10:05:25.058', '2025-02-10 10:05:25.058');

-- --------------------------------------------------------

--
-- Table structure for table `post`
--

CREATE TABLE `post` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `image` varchar(191) DEFAULT NULL,
  `excerpt` text DEFAULT NULL,
  `published` tinyint(1) NOT NULL DEFAULT 0,
  `authorId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `property`
--

CREATE TABLE `property` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `price` double NOT NULL,
  `paymentTerms` enum('Cash','Mortgage','Installments','Cash and Mortgage','Rent to Own') DEFAULT NULL,
  `category` enum('APARTMENTS','BUNGALOWS','COMMERCIAL_PLOTS','DUPLEX','HOUSES','PENTHOUSES','RESIDENTIAL_PLOTS','TOWNHOUSES') NOT NULL,
  `type` varchar(191) NOT NULL,
  `location` varchar(191) NOT NULL,
  `bedrooms` int(11) NOT NULL,
  `bathrooms` int(11) NOT NULL,
  `floorSize` decimal(10,2) DEFAULT NULL,
  `plotSize` decimal(10,2) DEFAULT NULL,
  `images` text NOT NULL,
  `features` text NOT NULL,
  `status` enum('AVAILABLE','PENDING','SOLD','RENTED') NOT NULL DEFAULT 'AVAILABLE',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `featured` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property`
--

INSERT INTO `property` (`id`, `title`, `description`, `price`, `paymentTerms`, `category`, `type`, `location`, `bedrooms`, `bathrooms`, `floorSize`, `plotSize`, `images`, `features`, `status`, `createdAt`, `updatedAt`, `userId`, `featured`) VALUES
('', 'Test', 'Test', 1000, NULL, 'BUNGALOWS', 'rent', 'Parklands, Westlands, Nairobi', 10, 10, 100.00, 100.00, '[]', '{\"0\":\"Parking\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":true,\"paymentTerms\":null,\"address\":\"Nairobi, Kenya\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":\"cm6yw0hxe0004u62s8kg50lne\"}}}', 'AVAILABLE', '2025-03-15 20:04:10.241', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cm6z35qtv0001u6tcgud069ao', '1 Bedroom Apartment', 'Apartment', 1000, NULL, 'APARTMENTS', 'sale', 'Parklands, Westlands, Nairobi', 1, 1, 100.00, 100.00, '[\"/properties/cm6z35qtv0001u6tcgud069ao/1739193927236-signup page.png\"]', '{\"0\":\"Garden\",\"1\":\"Parking\",\"2\":\"Furnished\",\"3\":\"Elevator\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":\"cm6yw0hxe0004u62s8kg50lne\"}}}', 'AVAILABLE', '2025-02-10 13:25:27.183', '2025-02-10 13:26:02.423', 'cm6yzj5vy0000u628zv6wkeom', 1),
('cmm8agnhckvuziy', 'Test', 'Test', 1000, NULL, 'BUNGALOWS', 'rent', 'Parklands, Westlands, Nairobi', 10, 10, 100.00, 100.00, '[\"/properties/cmm8agnhckvuziy/1742058500024-Screenshot 2024-03-09 210952.png\",\"/properties/cmm8agnhckvuziy/1742058500028-Screenshot 2024-03-09 210952.png\"]', '{\"0\":\"Parking\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":true,\"paymentTerms\":null,\"address\":\"Nairobi, Kenya\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":\"cm6yw0hxe0004u62s8kg50lne\"}}}', 'AVAILABLE', '2025-03-15 20:08:19.994', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8ah9azzdvr8u', 'Test 2', 'Test 2', 50000, NULL, 'BUNGALOWS', 'sale', 'Parklands, Westlands, Nairobi', 4, 5, 5000.00, 5000.00, '[\"/properties/cmm8ah9azzdvr8u/1742059518260-UIPAGE.png\",\"/properties/cmm8ah9azzdvr8u/1742059518267-Screenshot 2024-03-09 210952.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":true,\"paymentTerms\":null,\"address\":\"Test 2\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":\"cm6yw0hxe0004u62s8kg50lne\"}}}', 'AVAILABLE', '2025-03-15 20:25:18.193', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 1),
('cmm8g85kues0fnc', 'test', 'test', 9999, NULL, 'BUNGALOWS', 'sale', 'Syokimau, Mlolongo, Machakos', 10, 10, 10000.00, 10000.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":true,\"paymentTerms\":null,\"address\":\"test\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":\"3a45613c468345429a9cc15cde726596\"}}}', 'AVAILABLE', '2025-03-19 20:57:04.844', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8gac4nt0smgv', 'test', 'test', 1000, NULL, 'APARTMENTS', 'sale', 'Mlolongo, Machakos', 10, 10, 10.00, 10.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":true,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-19 21:58:09.697', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8gb7hlpa1f88', 'test3', 'test3', 10000, NULL, 'APARTMENTS', 'sale', 'Parklands, Westlands, Nairobi', 10, 10, 1000.00, 1000.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":true,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":\"cm6yw0hxe0004u62s8kg50lne\"}}}', 'AVAILABLE', '2025-03-19 22:22:32.810', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8ggojqtqcxmx', 'test4', 'test4', 999, NULL, 'BUNGALOWS', 'sale', 'Syokimau, Mlolongo, Machakos', 10, 10, 10.00, 10.00, '[\"/properties/cmm8ggojqtqcxmx/1742421346863-Screenshot 2024-03-20 021923.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"test4\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":\"3a45613c468345429a9cc15cde726596\"}}}', 'AVAILABLE', '2025-03-20 00:55:46.811', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8imvi69o1wjh', 'test6', 'test6', 9999, NULL, 'APARTMENTS', 'sale', 'Mlolongo, Machakos', 10, 9, 10.00, 10.00, '[\"/properties/e98ce4e3-181e-47e4-9284-b1c9775bfc03/1742551727774-Screenshot2024-03-20021923.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"\",\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-21 13:24:41.454', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8k5mwy3ic2li', 'test7', 'test7', 10000, NULL, 'PENTHOUSES', 'rent', 'Mlolongo, Machakos', 10, 10, 10000.00, 10000.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 14:57:39.586', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8k6dz3mbgk8c', 'test8', 'test8', 999, NULL, 'PENTHOUSES', 'sale', 'Mlolongo, Machakos', 10, 10, 10.00, 10.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 15:18:42.039', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8k8ofpjfpfj4', 'test9', 'test9', 10000, NULL, 'APARTMENTS', 'sale', 'Westlands, Nairobi', 10, 10, 10.00, 10.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 16:22:49.366', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8kaqkb48jhxd', 'test10', 'test10', 999, NULL, 'HOUSES', 'sale', 'Syokimau, Mlolongo, Machakos', 10, 8, 100.00, 100.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":\"3a45613c468345429a9cc15cde726596\"}}}', 'AVAILABLE', '2025-03-22 17:20:27.862', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8kb266k5r39j', 'test11', 'test11', 9, NULL, 'BUNGALOWS', 'sale', 'Mlolongo, Machakos', 10, 9, 10.00, 10.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 17:29:29.423', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8kbir6u919ax', 'test12', 'test12', 133330, NULL, 'COMMERCIAL_PLOTS', 'rent', 'Mlolongo, Machakos', 10, 10, 110.00, 110.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 17:42:23.145', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8kc0sm0wziiy', 'test13', 'test13', 996, NULL, 'RESIDENTIAL_PLOTS', 'sale', 'Mlolongo, Machakos', 10, 10, 10.00, 10.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 17:56:24.795', '0000-00-00 00:00:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8kc82fo09lv4', 'test15', 'test15', 11110, NULL, 'APARTMENTS', 'sale', 'Westlands, Nairobi', 10, 9, 10.00, 10.00, '[\"/properties/1742655710876/1742655717522-Screenshot%202024-03-09%20202546.png\",\"/properties/1742655710876/1742655719470-Screenshot%202024-03-09%20210952.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 18:02:04.118', '2025-03-22 18:02:04.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8kcg1p08v0d3', 'test16', 'test16', 122220, NULL, 'RESIDENTIAL_PLOTS', 'sale', 'Westlands, Nairobi', 10, 10, 10.00, 10.00, '[\"/properties/1742656082170/1742656091372-Screenshot%202024-03-09%20210952.png\",\"/properties/1742656082170/1742656093582-Screenshot%202024-03-20%20021923.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 18:08:16.406', '2025-03-22 18:08:16.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8kexxjdt9k05', 'Test17', 'Test17', 9999, NULL, 'APARTMENTS', 'sale', 'Mlolongo, Machakos', 10, 10, 10.00, 10.00, '[\"/properties/1742660222460/1742660228043-connectOpenAi,%20Pinecone,%2011labs.png\",\"/properties/1742660222460/1742660229369-ConnectSupabase.png\",\"/properties/1742660222460/1742660230518-error1.png\",\"/properties/1742660222460/1742660231695-login.png\",\"/properties/1742660222460/1742660233194-loginpage.png\",\"/properties/1742660222460/1742660246773-logout.png\",\"/properties/1742660222460/1742660248145-logoutpage.png\",\"/properties/1742660222460/1742660267406-pinecone%20data%20input.png\",\"/properties/1742660222460/1742660268800-Screenshot%202024-03-09%20202546.png\",\"/properties/1742660222460/1742660270427-Screenshot%202024-03-09%20210952.png\",\"/properties/1742660222460/1742660272205-Screenshot%202024-03-20%20021923.png\",\"/properties/1742660222460/1742660273615-signup%20page.png\",\"/properties/1742660222460/1742660287967-SignUp.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"Test17\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 19:18:10.063', '2025-03-22 19:18:10.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8kfdzd08ri3e', 'Test19', 'Test19', 100000, NULL, 'HOUSES', 'sale', 'Mlolongo, Machakos', 10, 10, 10.00, 10.00, '[\"/properties/1742661025148/1742661031384-connectOpenAi,%20Pinecone,%2011labs.png\",\"/properties/1742661025148/1742661032832-ConnectSupabase.png\",\"/properties/1742661025148/1742661034051-error1.png\",\"/properties/1742661025148/1742661035233-login.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 19:30:38.921', '2025-03-22 19:30:38.000', 'cm6yzj5vy0000u628zv6wkeom', 1),
('cmm8kknc7howtwi', 'Test20', 'Test20', 9999, NULL, 'COMMERCIAL_PLOTS', 'airbnb', 'Westlands, Nairobi', 10, 10, 10.00, 10.00, '[\"/properties/1742669833515/1742669838545-Screenshot%202024-03-09%20202546.png\",\"/properties/1742669833515/1742669840223-Screenshot%202024-03-09%20210952.png\",\"/properties/1742669833515/1742669843106-Screenshot%202024-03-20%20021923.png\",\"/properties/1742669833515/1742669845168-signup%20page.png\",\"/properties/1742669833515/1742669869911-SignUp.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-22 21:57:53.598', '2025-03-22 21:57:53.000', 'cm6yzj5vy0000u628zv6wkeom', 1),
('cmm8lcdqv181kli', 'TEST21', 'TEST21', 9999, NULL, 'BUNGALOWS', 'sale', 'Mlolongo, Machakos', 10, 10, 10.00, 10.00, '[\"/properties/1742716404880/1742716408991-Screenshot%202024-03-09%20202546.png\",\"/properties/1742716404880/1742716410738-Screenshot%202024-03-09%20210952.png\",\"/properties/1742716404880/1742716412987-Screenshot%202024-03-20%20021923.png\",\"/properties/1742716404880/1742716414528-signup%20page.png\",\"/properties/1742716404880/1742716453127-SignUp.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-23 10:54:15.242', '2025-03-23 10:54:15.000', 'cm6yzj5vy0000u628zv6wkeom', 1),
('cmm8lcpv6y2an89', 'Test22', 'Test22', 999, NULL, 'APARTMENTS', 'SALE', 'Mlolongo, Machakos', 10, 10, 10.00, 10.00, '[]', '[]', 'AVAILABLE', '2025-03-23 11:03:40.725', '2025-03-26 15:51:22.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8ld702zitn04', 'Test23', 'Test23', 1111110, NULL, 'BUNGALOWS', 'rent', 'Mlolongo, Machakos', 10, 10, 10.00, 10.00, '[\"/properties/1742717777994/1742717783768-Screenshot%202024-03-09%20210952.png\",\"/properties/1742717777994/1742717785620-Screenshot%202024-03-20%20021923.png\",\"/properties/1742717777994/1742717787053-signup%20page.png\",\"/properties/1742717777994/1742717817269-SignUp.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-23 11:17:00.205', '2025-03-23 11:17:00.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8pini6jk5ewv', 'test31', 'test31', 10000, 'Cash', 'PENTHOUSES', 'sale', 'Parklands, Westlands, Nairobi', 10, 10, 10000.00, 2025.00, '[\"/properties/1742968830481/1742968839415-Aminiblock.png\",\"/properties/1742968830481/1742968841670-Brandlogs.png\",\"/properties/1742968830481/1742968844547-Credwave.png\",\"/properties/1742968830481/1742968847488-explorer.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":true,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":\"cm6yw0hxe0004u62s8kg50lne\"}}}', 'AVAILABLE', '2025-03-26 09:00:52.971', '2025-03-26 09:00:53.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8pxwqqtf2hgj', 'Test33', 'Test33', 1000, 'Cash and Mortgage', 'RESIDENTIAL_PLOTS', 'sale', 'Westlands, Nairobi', 10, 9, 10.00, 2025.00, '[\"/properties/1742994466773/1742994472686-VectorAfriq.png\",\"/properties/1742994466773/1742994475000-zeno-s.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Cash and Mortgage\",\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-26 16:07:58.211', '2025-03-26 16:07:58.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8sgwz2mgodcq', 'test34', 'test34', 9999, 'Mortgage', 'DUPLEX', 'sale', 'Westlands, Nairobi', 10, 10, 10.00, 2025.00, '[\"/properties/1743147308022/1743147312748-Screenshot%202024-03-09%20210952.png\",\"/properties/1743147308022/1743147315198-Screenshot%202024-03-20%20021923.png\",\"/properties/1743147308022/1743147317470-Screenshot%202024-03-09%20202546.png\",\"/properties/1743147308022/1743147319617-signup%20page.png\",\"/properties/1743147308022/1743147324425-SignUp.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Mortgage\",\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-28 10:35:34.056', '2025-03-28 10:35:34.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8sh09l4zo1x0', 'Test 35', 'Test 35', 99999, 'Installments', 'HOUSES', 'rent', 'Westlands, Nairobi', 10, 10, 9.00, 2025.00, '[\"/properties/1743147462939/1743147472186-Screenshot%202024-03-20%20021923.png\",\"/properties/1743147462939/1743147473722-signup%20page.png\",\"/properties/1743147462939/1743147480301-Screenshot%202024-03-09%20202546.png\",\"/properties/1743147462939/1743147482016-Screenshot%202024-03-09%20210952.png\",\"/properties/1743147462939/1743147484063-SignUp.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Installments\",\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-28 10:38:07.629', '2025-03-28 10:38:07.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8siqlfw2kgul', 'Test35', 'Test35', 99999, 'Installments', 'BUNGALOWS', 'sale', 'Westlands, Nairobi', 2, 2, 200.00, 2025.00, '[\"/properties/1743150365097/1743150374918-Screenshot%202024-03-09%20210952.png\",\"/properties/1743150365097/1743150376661-SignUp.png\",\"/properties/1743150365097/1743150378297-Screenshot%202024-03-09%20202546.png\",\"/properties/1743150365097/1743150379990-Screenshot%202024-03-20%20021923.png\",\"/properties/1743150365097/1743150381473-signup%20page.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Installments\",\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-03-28 11:26:35.707', '2025-03-28 11:26:35.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8sjayfsosr3g', 'Test36', 'Test36', 199999, 'Installments', 'PENTHOUSES', 'SALE', 'Westlands, Nairobi', 5, 5, 500.00, 2025.00, '[\"/properties/cmm8sjayfsosr3g/1743493736365-property1.jpg\",\"/properties/1743151116222/1743151335917-SignUp.png\",\"/properties/1743151116222/1743151134651-Screenshot%2525252525202024-03-20%252525252520021923.png\"]', '[]', 'AVAILABLE', '2025-03-28 11:42:25.629', '2025-04-01 10:49:35.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8sqyiqfosx2u', 'Test35', 'Test35', 200000, 'Installments', 'DUPLEX', 'SALE', 'Westlands, Nairobi', 5, 5, 50000.00, 2025.00, '[\"/properties/1743164073585/1743164096742-UIPAGE.png\",\"/properties/1743164073585/1743164185614-SignUp.png\",\"/properties/1743164073585/1743164194156-UI.png\",\"/properties/1743164073585/1743164190683-SUPABASEAUTH.png\"]', '[]', 'AVAILABLE', '2025-03-28 15:16:42.332', '2025-04-01 10:49:59.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmm8xpo4hx8zxvk', 'Test37', 'Test37', 10000, NULL, 'HOUSES', 'sale', 'Mlolongo, Machakos', 3, 2, 5000.00, 2025.00, '[\"/properties/1743464360144/1743464366668-property1.jpg\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-04-01 02:39:28.583', '2025-04-01 02:39:28.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('m8ideeof0p40x', 'Test 4', 'Test 4', 10000, NULL, 'APARTMENTS', 'SALE', '3a45613c468345429a9cc15cde726596, 215833e764aa48758cb8f6a7fcf60c6a, efde730d59f24f538a7829905438c43b', 10, 10, 10.00, 10.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"address\":\"Test 4\"},\"features\":[]}', 'AVAILABLE', '2025-03-21 08:59:27.000', '2025-03-21 08:59:27.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('m8idkww1z2zlu', 'Test 4', 'Test 4', 10000, NULL, 'APARTMENTS', 'SALE', '3a45613c468345429a9cc15cde726596, 215833e764aa48758cb8f6a7fcf60c6a, efde730d59f24f538a7829905438c43b', 10, 10, 10.00, 10.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"address\":\"Test 4\"},\"features\":[]}', 'AVAILABLE', '2025-03-21 09:04:30.000', '2025-03-21 09:04:30.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('m8ifok3vo6blx', 'Test5', 'Test5', 100000, NULL, 'COMMERCIAL_PLOTS', 'SALE', '3a45613c468345429a9cc15cde726596, 215833e764aa48758cb8f6a7fcf60c6a, efde730d59f24f538a7829905438c43b', 100, 10, 100.00, 100.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"address\":\"\"},\"features\":[]}', 'AVAILABLE', '2025-03-21 10:03:20.000', '2025-03-21 10:03:20.000', 'cm6yzj5vy0000u628zv6wkeom', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reportedcontent`
--

CREATE TABLE `reportedcontent` (
  `id` varchar(191) NOT NULL,
  `reporterId` varchar(191) NOT NULL,
  `contentType` varchar(191) NOT NULL,
  `contentId` varchar(191) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('PENDING','REVIEWED','RESOLVED','DISMISSED') NOT NULL DEFAULT 'PENDING',
  `notes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `revenue`
--

CREATE TABLE `revenue` (
  `id` varchar(191) NOT NULL,
  `amount` double NOT NULL,
  `type` enum('COMMISSION','LISTING_FEE','OTHER') NOT NULL,
  `description` text DEFAULT NULL,
  `propertyId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `revenue`
--

INSERT INTO `revenue` (`id`, `amount`, `type`, `description`, `propertyId`, `userId`, `createdAt`, `updatedAt`) VALUES
('cmm8zk6j45ng6tv', 50000, 'COMMISSION', 'Commission from property sale', 'cm6z35qtv0001u6tcgud069ao', 'cm6yzj5vy0000u628zv6wkeom', '2025-04-02 06:34:04.000', '2025-04-02 06:34:04.000'),
('cmm8zk6j45ng7tv', 25000, 'LISTING_FEE', 'Listing fee for premium property', 'cm6z35qtv0001u6tcgud069ao', 'cm6yzj5vy0000u628zv6wkeom', '2025-04-01 06:34:04.000', '2025-04-01 06:34:04.000'),
('cmm8zk6j45nga1v', 40000, 'COMMISSION', 'Previous month commission', 'cm6z35qtv0001u6tcgud069ao', 'cm6yzj5vy0000u628zv6wkeom', '2025-03-02 06:34:04.000', '2025-03-02 06:34:04.000'),
('cmm8zk6j45nga2v', 20000, 'LISTING_FEE', 'Previous month listing fee', 'cm6z35qtv0001u6tcgud069ao', 'cm6yzj5vy0000u628zv6wkeom', '2025-03-02 06:34:04.000', '2025-03-02 06:34:04.000');

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

CREATE TABLE `session` (
  `id` varchar(191) NOT NULL,
  `sessionToken` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `expires` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `systemsetting`
--

CREATE TABLE `systemsetting` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `value` text NOT NULL,
  `type` enum('STRING','NUMBER','BOOLEAN','JSON') NOT NULL,
  `category` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `systemsetting`
--

INSERT INTO `systemsetting` (`id`, `key`, `value`, `type`, `category`, `description`, `createdAt`, `updatedAt`) VALUES
('36f45d4e-e792-11ef-93af-80ce629bfa99', 'site.name', 'Property Finder', 'STRING', 'general', 'Website name', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f466a7-e792-11ef-93af-80ce629bfa99', 'site.description', 'Find your perfect property', 'STRING', 'general', 'Website description', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46794-e792-11ef-93af-80ce629bfa99', 'contact.email', 'support@vectorafriqproperties.co.ke', 'STRING', 'contact', 'Support email address', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46887-e792-11ef-93af-80ce629bfa99', 'contact.phone', '+254 723310245', 'STRING', 'contact', 'Support phone number', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f4692c-e792-11ef-93af-80ce629bfa99', 'social.facebook', '', 'STRING', 'social', 'Facebook page URL', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46a09-e792-11ef-93af-80ce629bfa99', 'social.twitter', '', 'STRING', 'social', 'Twitter profile URL', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46abd-e792-11ef-93af-80ce629bfa99', 'social.instagram', '', 'STRING', 'social', 'Instagram profile URL', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46b6d-e792-11ef-93af-80ce629bfa99', 'features.blog', 'true', 'BOOLEAN', 'features', 'Enable blog feature', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46c1f-e792-11ef-93af-80ce629bfa99', 'features.propertyAlerts', 'true', 'BOOLEAN', 'features', 'Enable property alerts', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46d0b-e792-11ef-93af-80ce629bfa99', 'features.favorites', 'true', 'BOOLEAN', 'features', 'Enable favorites feature', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46dc6-e792-11ef-93af-80ce629bfa99', 'seo.googleAnalytics', '', 'STRING', 'seo', 'Google Analytics ID', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46e76-e792-11ef-93af-80ce629bfa99', 'seo.metaDescription', 'Find and list properties for sale and rent', 'STRING', 'seo', 'Default meta description', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46f44-e792-11ef-93af-80ce629bfa99', 'listing.imagesLimit', '10', 'NUMBER', 'listing', 'Maximum number of images per listing', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f46fff-e792-11ef-93af-80ce629bfa99', 'listing.expiryDays', '30', 'NUMBER', 'listing', 'Days until listing expires', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f470cf-e792-11ef-93af-80ce629bfa99', 'currency.code', 'KSh', 'STRING', 'currency', 'Default currency code', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000'),
('36f4713a-e792-11ef-93af-80ce629bfa99', 'currency.symbol', 'KES', 'STRING', 'currency', 'Currency symbol', '2025-02-10 12:34:24.000', '2025-02-10 12:34:24.000');

-- --------------------------------------------------------

--
-- Table structure for table `tag`
--

CREATE TABLE `tag` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaction`
--

CREATE TABLE `transaction` (
  `id` varchar(191) NOT NULL,
  `propertyId` varchar(191) NOT NULL,
  `buyerId` varchar(191) NOT NULL,
  `sellerId` varchar(191) NOT NULL,
  `type` enum('SALE','RENT') NOT NULL,
  `amount` double NOT NULL,
  `status` enum('PENDING','COMPLETED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `paymentMethod` varchar(191) DEFAULT NULL,
  `paymentStatus` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `emailVerified` datetime(3) DEFAULT NULL,
  `image` varchar(191) DEFAULT NULL,
  `password` varchar(191) DEFAULT NULL,
  `role` enum('USER','ADMIN','AGENT') NOT NULL DEFAULT 'USER',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `avatar` text DEFAULT NULL,
  `specialization` text DEFAULT NULL,
  `languages` text DEFAULT NULL,
  `socialMedia` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `email`, `emailVerified`, `image`, `password`, `role`, `createdAt`, `updatedAt`, `phone`, `bio`, `avatar`, `specialization`, `languages`, `socialMedia`) VALUES
('c7b158b7f0734d1a8d4de8031eeda1b6', 'Alvin Warui', 'alvin@gmail.com', NULL, NULL, '$2a$10$KG7A.t24unYwKVrMf8jq5eTJqa.Ap.1oe.ejbtnjuUrlmOFn9KnFi', 'AGENT', '2025-03-12 11:28:46.000', '2025-03-12 11:28:46.000', NULL, NULL, NULL, NULL, NULL, NULL),
('cm6yzj5vy0000u628zv6wkeom', 'Mark Maingi', 'manlikemaingi@gmail.com', NULL, NULL, '$2a$10$eKtigUQCn9OZoAl9S8DxcuslwlKAAUmRjtWcKbDbLQMB6iFbaP4r2', 'ADMIN', '2025-02-10 11:43:54.765', '2025-03-28 07:58:58.000', '0112246573', 'I\'m a web developer with good understanding of both frontend and backend', '/profiles/cm6yzj5vy0000u628zv6wkeom/1743137852149-Mark.jpeg', '[]', '[]', '{\"twitter\":\"https://twitter.com/manlikemaingi\",\"linkedin\":\"https://ke.linkedin.com/manlikemaingi\"}');

-- --------------------------------------------------------

--
-- Table structure for table `verificationtoken`
--

CREATE TABLE `verificationtoken` (
  `identifier` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `expires` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `_blogcategorytopost`
--

CREATE TABLE `_blogcategorytopost` (
  `A` varchar(191) NOT NULL,
  `B` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `_posttotag`
--

CREATE TABLE `_posttotag` (
  `A` varchar(191) NOT NULL,
  `B` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('0dace4fc-aa75-469d-951d-ef23366fd5d6', '722eb1116ba8f9126529f9a6c95b22d936c5ea138488ee843da7ff20ce7a88b1', '2025-02-10 09:34:24.530', '20250210074337_transactions', NULL, NULL, '2025-02-10 09:34:24.510', 1),
('0e7d92b5-cb8e-4e7e-b175-b63c3f1cc766', 'c95802164e87d598d655003cfcd2cc724314ab7ccaeef31fafd4dc17d7139dbb', '2025-02-10 09:34:24.839', '20250210104200_add_transactions', NULL, NULL, '2025-02-10 09:34:24.533', 1),
('474edfbe-409c-48d0-b1f0-9e66eb36dad2', '2c192fd06df888cbed711247756e2f9534b666f14bf02e13399c4e5da1fd8694', '2025-02-10 09:34:24.967', '20250210112502_add_reported_content', NULL, NULL, '2025-02-10 09:34:24.842', 1),
('6f30cd77-20f5-4261-976c-3a2d5c6a88b7', '59573077a09a2c5802ca6ef96220ef45179af016dbcfd795fcaec364cac013e5', '2025-02-10 09:34:23.788', '20250202141942_add_blogs', NULL, NULL, '2025-02-10 09:34:23.522', 1),
('99ae39d5-fb58-4ed6-bade-5d3f5cfb035a', '6a4dce5c8b2f75debac91ef2846a013f3a02bab95bbfbc02eea7dfc052f2fd6f', '2025-02-10 11:23:17.533', '20250210142103_update_property_categories', NULL, NULL, '2025-02-10 11:23:17.198', 1),
('9c949c2c-b1a5-42da-8aca-e9e63e21aa56', '531e8752ac61e035690581e9c26252905de9b72c7be25a5c412307444ac36f2e', '2025-02-10 13:10:52.170', '20250210162000_add_featured_to_properties', NULL, NULL, '2025-02-10 13:10:52.128', 1),
('d1005a50-3b34-447f-904f-12c4df139ad9', '7babb1e4c5c05899e98c7d63f7b28901fabfdf2a0c02d7c127ad4b0db3f5571f', '2025-02-10 09:34:23.517', '20250114134507_add_locations', NULL, NULL, '2025-02-10 09:34:23.118', 1),
('d86dc900-059a-4eaf-9b97-bd72ff96acbe', 'aa4ffd9dba0047aea474b9c89d2a9bcd37cd9eeb66e55cd13b20f0e95571ce09', '2025-02-10 09:34:23.114', '20241212215845_init', NULL, NULL, '2025-02-10 09:34:22.209', 1),
('de18e99d-5a0d-4354-bf51-0f0dc3a88fa6', 'f87d373aa2d5a0b5c7f0a92daf11ce763a907cd3a194f4b6f927e739b696bc5b', '2025-02-10 09:34:24.450', '20250202170800_add_blogs', NULL, NULL, '2025-02-10 09:34:23.791', 1),
('ffdd7c81-8303-4c1d-8a90-dfdc0be52e94', 'ce2d0fc488d71493c561b4ab69bcb1e56ffee950cd4a11d8db535d5ceea085e5', '2025-02-10 09:34:24.507', '20250202175400_add_settings', NULL, NULL, '2025-02-10 09:34:24.458', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account`
--
ALTER TABLE `account`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Account_provider_providerAccountId_key` (`provider`,`providerAccountId`),
  ADD KEY `Account_userId_fkey` (`userId`);

--
-- Indexes for table `blogcategory`
--
ALTER TABLE `blogcategory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `BlogCategory_slug_key` (`slug`);

--
-- Indexes for table `city`
--
ALTER TABLE `city`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `City_slug_key` (`slug`),
  ADD UNIQUE KEY `City_name_countyId_key` (`name`,`countyId`),
  ADD KEY `City_countyId_idx` (`countyId`),
  ADD KEY `City_name_idx` (`name`);

--
-- Indexes for table `company`
--
ALTER TABLE `company`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Company_userId_fkey` (`userId`);

--
-- Indexes for table `county`
--
ALTER TABLE `county`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `County_slug_key` (`slug`),
  ADD KEY `County_name_idx` (`name`);

--
-- Indexes for table `favorite`
--
ALTER TABLE `favorite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Favorite_userId_propertyId_key` (`userId`,`propertyId`),
  ADD KEY `Favorite_propertyId_fkey` (`propertyId`);

--
-- Indexes for table `lead`
--
ALTER TABLE `lead`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Lead_userId_fkey` (`userId`),
  ADD KEY `Lead_propertyId_fkey` (`propertyId`);

--
-- Indexes for table `neighborhood`
--
ALTER TABLE `neighborhood`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Neighborhood_slug_key` (`slug`),
  ADD KEY `Neighborhood_cityId_idx` (`cityId`),
  ADD KEY `Neighborhood_countyId_idx` (`countyId`),
  ADD KEY `Neighborhood_name_idx` (`name`);

--
-- Indexes for table `post`
--
ALTER TABLE `post`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Post_slug_key` (`slug`),
  ADD KEY `Post_authorId_idx` (`authorId`);

--
-- Indexes for table `property`
--
ALTER TABLE `property`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Property_category_idx` (`category`),
  ADD KEY `Property_location_idx` (`location`),
  ADD KEY `Property_price_idx` (`price`),
  ADD KEY `Property_userId_fkey` (`userId`);

--
-- Indexes for table `reportedcontent`
--
ALTER TABLE `reportedcontent`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ReportedContent_reporterId_idx` (`reporterId`),
  ADD KEY `ReportedContent_contentType_contentId_idx` (`contentType`,`contentId`),
  ADD KEY `ReportedContent_status_idx` (`status`);

--
-- Indexes for table `revenue`
--
ALTER TABLE `revenue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Revenue_userId_fkey` (`userId`),
  ADD KEY `Revenue_propertyId_fkey` (`propertyId`);

--
-- Indexes for table `session`
--
ALTER TABLE `session`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Session_sessionToken_key` (`sessionToken`),
  ADD KEY `Session_userId_fkey` (`userId`);

--
-- Indexes for table `systemsetting`
--
ALTER TABLE `systemsetting`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `SystemSetting_key_key` (`key`);

--
-- Indexes for table `tag`
--
ALTER TABLE `tag`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Tag_slug_key` (`slug`);

--
-- Indexes for table `transaction`
--
ALTER TABLE `transaction`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Transaction_propertyId_idx` (`propertyId`),
  ADD KEY `Transaction_buyerId_idx` (`buyerId`),
  ADD KEY `Transaction_sellerId_idx` (`sellerId`),
  ADD KEY `Transaction_status_idx` (`status`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`);

--
-- Indexes for table `verificationtoken`
--
ALTER TABLE `verificationtoken`
  ADD UNIQUE KEY `VerificationToken_token_key` (`token`),
  ADD UNIQUE KEY `VerificationToken_identifier_token_key` (`identifier`,`token`);

--
-- Indexes for table `_blogcategorytopost`
--
ALTER TABLE `_blogcategorytopost`
  ADD UNIQUE KEY `_BlogCategoryToPost_AB_unique` (`A`,`B`),
  ADD KEY `_BlogCategoryToPost_B_index` (`B`);

--
-- Indexes for table `_posttotag`
--
ALTER TABLE `_posttotag`
  ADD UNIQUE KEY `_PostToTag_AB_unique` (`A`,`B`),
  ADD KEY `_PostToTag_B_index` (`B`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account`
--
ALTER TABLE `account`
  ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `city`
--
ALTER TABLE `city`
  ADD CONSTRAINT `City_countyId_fkey` FOREIGN KEY (`countyId`) REFERENCES `county` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `company`
--
ALTER TABLE `company`
  ADD CONSTRAINT `Company_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `favorite`
--
ALTER TABLE `favorite`
  ADD CONSTRAINT `Favorite_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lead`
--
ALTER TABLE `lead`
  ADD CONSTRAINT `Lead_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Lead_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `neighborhood`
--
ALTER TABLE `neighborhood`
  ADD CONSTRAINT `Neighborhood_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `city` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Neighborhood_countyId_fkey` FOREIGN KEY (`countyId`) REFERENCES `county` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `post`
--
ALTER TABLE `post`
  ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `property`
--
ALTER TABLE `property`
  ADD CONSTRAINT `Property_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reportedcontent`
--
ALTER TABLE `reportedcontent`
  ADD CONSTRAINT `ReportedContent_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `revenue`
--
ALTER TABLE `revenue`
  ADD CONSTRAINT `Revenue_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Revenue_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `session`
--
ALTER TABLE `session`
  ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `transaction`
--
ALTER TABLE `transaction`
  ADD CONSTRAINT `Transaction_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Transaction_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Transaction_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `_blogcategorytopost`
--
ALTER TABLE `_blogcategorytopost`
  ADD CONSTRAINT `_BlogCategoryToPost_A_fkey` FOREIGN KEY (`A`) REFERENCES `blogcategory` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `_BlogCategoryToPost_B_fkey` FOREIGN KEY (`B`) REFERENCES `post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `_posttotag`
--
ALTER TABLE `_posttotag`
  ADD CONSTRAINT `_PostToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `_PostToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `tag` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
