-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 01, 2025 at 02:05 PM
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
('12cc476e226544719534025b963984bf', 'Hurlinghum', 'hurlinghum', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-04-01 17:28:04.000', '2025-04-01 17:28:04.000'),
('215833e764aa48758cb8f6a7fcf60c6a', 'Mlolongo', 'mlolongo', 'efde730d59f24f538a7829905438c43b', '2025-03-12 11:21:00.000', '2025-03-12 11:21:00.000'),
('4bb874b2b9904550aa21410a94e428ea', 'Kisaju', 'kisaju', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 17:27:25.000', '2025-04-01 17:27:25.000'),
('652f335e827a455b870544bedd2ea0ec', 'Nairobi City', 'nairobi-city', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-04-01 15:07:44.000', '2025-04-01 15:07:44.000'),
('8ea463b13f484aa8beb4f72cce933380', 'Kiambu', 'kiambu', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-03-25 13:17:45.000', '2025-03-25 13:17:45.000'),
('c5618d466f8f46bb928654335c7aa4eb', 'Isinya', 'isinya', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 17:27:35.000', '2025-04-01 17:27:35.000'),
('cm6yvzpkr0002u62sn6rmp5cs', 'Westlands', 'westlands', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-02-10 10:04:48.314', '2025-02-10 10:04:48.314'),
('d67b6bb8343042cb918a3809e222bf7a', 'Ongata Rongai', 'ongata-rongai', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 17:27:01.000', '2025-04-01 17:27:01.000'),
('dd301db3d91c4b7189ae6c3bff92cd70', 'Ngong Town', 'ngong-town', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:02:09.000', '2025-04-01 15:02:09.000'),
('e76fc397a7be4d838ee25607386ea40a', 'Kiserian', 'kiserian', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 17:26:43.000', '2025-04-01 17:26:43.000'),
('f2373da1cf7e4798adffdbc0de44ca2f', 'Kitengela', 'kitengela', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:27:58.000', '2025-03-26 14:27:58.000');

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
('cmmag8whiv003aa', 'VectorAfriq', '/api/images/companies/cm6yzj5vy0000u628zv6wkeom/1746761055346-pexels-photo-106399.jpeg', 'VectorAfriq', 'vectorafriqproperties1847@gmail.com', '0708015053', 'https://vectorafriqproperties.co.ke', 'Kitengela', '{\"facebook\":\"https://vector.com\"}', 'cm6yzj5vy0000u628zv6wkeom', '2025-05-09 06:37:24.000', '2025-05-09 06:40:06.000');

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
('a42c882e12054efeb23417692e3e4e51', 'Kajiado', 'kajiado', '2025-03-26 14:27:40.000', '2025-03-26 14:27:40.000'),
('c23e3781036043c3b0a824da8dba8a68', 'Mombasa', 'mombasa', '2025-03-25 13:17:07.000', '2025-03-25 13:17:07.000'),
('c8987a5f974d4282a0a468c2d574ae28', 'Nakuru', 'nakuru', '2025-03-25 13:16:57.000', '2025-03-25 13:16:57.000'),
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

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` varchar(191) NOT NULL,
  `fullName` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `propertyId` varchar(191) NOT NULL,
  `status` enum('NEW','READ','REPLIED','ARCHIVED') NOT NULL DEFAULT 'NEW',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `fullName`, `email`, `phone`, `message`, `propertyId`, `status`, `createdAt`, `updatedAt`) VALUES
('bS7Nm40DAx2DUZo4ObVBQ', 'test', 'm@gmail.com', '0112246573', 'Hi, I\'d like to know more about this property. Please get in touch with me.', 'cmm985sb6mo4lkp', 'NEW', '2025-04-29 08:15:08.920', '2025-04-29 08:15:08.000'),
('GApJpoKWDhqHmwXb4c54g', 'mark', 'mark@gmail.com', '0112246573', 'Hi, I\'d like to know more about this property. Please get in touch with me.', 'cmm985sb6mo4lkp', 'NEW', '2025-04-29 08:14:42.667', '2025-04-29 08:14:42.000');

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
('0497d331a57f436e9ff338ec3eb5ab36', 'Oltoroto', 'oltoroto', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:31:31.000', '2025-03-26 14:31:31.000'),
('04e11063f3f6431e8cc316afb4111d05', 'Kimuka', 'kimuka', 'dd301db3d91c4b7189ae6c3bff92cd70', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:03:10.000', '2025-04-01 15:03:10.000'),
('1002e38ed07e4e099c3121a8aa704fb4', 'Karen', 'karen', '652f335e827a455b870544bedd2ea0ec', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-04-01 15:09:29.000', '2025-04-01 15:09:29.000'),
('211d1e89e2ec4382a7d5bd2872873bb4', 'Yukos', 'yukos', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:29:10.000', '2025-03-26 14:29:10.000'),
('24ee9a2d4bca40efa60bde3f80448f2b', 'Kerarapon', 'kerarapon', 'dd301db3d91c4b7189ae6c3bff92cd70', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:07:21.000', '2025-04-01 15:07:21.000'),
('2d2411bafa0c43158295c0edcfadab2b', 'Upper Matasia', 'upper-matasia', 'dd301db3d91c4b7189ae6c3bff92cd70', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:03:55.000', '2025-04-01 15:03:55.000'),
('3a45613c468345429a9cc15cde726596', 'Syokimau', 'syokimau', '215833e764aa48758cb8f6a7fcf60c6a', 'efde730d59f24f538a7829905438c43b', '2025-03-12 11:21:32.000', '2025-03-12 11:21:32.000'),
('4156a76bc11f477f97128691d5cc0b37', 'Kimalat', 'kimalat', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:30:33.000', '2025-03-26 14:30:33.000'),
('42112ec6f53e4d41912b4a4cbb1d4ecb', 'KCA', 'kca', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:31:41.000', '2025-03-26 14:31:41.000'),
('4f38eda71755416fb13b0013a24db35c', 'Kileleshwa', 'kileleshwa', '652f335e827a455b870544bedd2ea0ec', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-04-01 15:08:49.000', '2025-04-01 15:08:49.000'),
('516e182922534ffeac89d3ea448b6b61', 'Acacia', 'acacia', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:28:16.000', '2025-03-26 14:28:16.000'),
('52df8590c163443da548be5004182950', 'Kibiko', 'kibiko', 'dd301db3d91c4b7189ae6c3bff92cd70', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:05:42.000', '2025-04-01 15:05:42.000'),
('5992690542af42719e9831697ab0ca9f', 'Police Sacco', 'police-sacco', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:29:00.000', '2025-03-26 14:29:00.000'),
('6221e2a6c0cd47dab2be02534be3a2bc', 'Oloolua Rd', 'oloolua-rd', 'dd301db3d91c4b7189ae6c3bff92cd70', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:04:40.000', '2025-04-01 15:04:40.000'),
('632974bb6a93440eb9a39ecaa0024eca', 'Milimani', 'milimani', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:28:29.000', '2025-03-26 14:28:29.000'),
('7124f67b52cf430bb1a779a54178f1bf', 'Lower Matasia', 'lower-matasia', 'dd301db3d91c4b7189ae6c3bff92cd70', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:06:06.000', '2025-04-01 15:06:06.000'),
('77292753ae284339a42bfb38abfa15dd', 'Muigai', 'muigai', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:28:47.000', '2025-03-26 14:28:47.000'),
('920c123cd2ab42a68ed80e4d393126aa', 'Bulbui', 'bulbui', 'dd301db3d91c4b7189ae6c3bff92cd70', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:02:50.000', '2025-04-01 15:02:50.000'),
('b28f7cb07b5949aa855f1c0143179ce7', 'Korompoi', 'korompoi', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:30:17.000', '2025-03-26 14:30:17.000'),
('b7c6f02abe354fcba3a219ecedae755e', 'Kilimani', 'kilimani', '652f335e827a455b870544bedd2ea0ec', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-04-01 15:08:35.000', '2025-04-01 15:08:35.000'),
('b84bf099fdef4341819e825ccca47bb0', 'Ngong 46', 'ngong-46', 'dd301db3d91c4b7189ae6c3bff92cd70', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:05:19.000', '2025-04-01 15:05:19.000'),
('bb1e95c8472a499988c3c74c584b5497', 'Westlands', 'westlands', '652f335e827a455b870544bedd2ea0ec', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-04-01 15:09:44.000', '2025-04-01 15:09:44.000'),
('cm6yw0hxe0004u62s8kg50lne', 'Parklands', 'parklands', 'cm6yvzpkr0002u62sn6rmp5cs', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-02-10 10:05:25.058', '2025-02-10 10:05:25.058'),
('d1b9112fcf114af6b47db5a5f43bf316', 'Olkeri', 'olkeri', 'dd301db3d91c4b7189ae6c3bff92cd70', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:03:32.000', '2025-04-01 15:03:32.000'),
('e6ddb0f877b94df4981db85c3b0af8b5', 'Lavington', 'lavington', '652f335e827a455b870544bedd2ea0ec', 'cm6yvzh1u0000u62sqfhq8oqy', '2025-04-01 15:09:07.000', '2025-04-01 15:09:07.000'),
('e756aa3467ad4a7ba8bfc9d4b93ca885', 'Kitengela CBD', 'kitengela-cbd', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:29:46.000', '2025-03-26 14:29:46.000'),
('e7f63d04a5af4ddc99f04588f66ae9c8', 'Zambia', 'zambia', 'dd301db3d91c4b7189ae6c3bff92cd70', 'a42c882e12054efeb23417692e3e4e51', '2025-04-01 15:04:12.000', '2025-04-01 15:04:12.000'),
('f49004404f2a4311b4f903eda4eb8ba3', 'Chuna', 'chuna', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:29:29.000', '2025-03-26 14:29:29.000'),
('f996460144a445b1a8301634da5b042e', 'Noonkopir', 'noonkopir', 'f2373da1cf7e4798adffdbc0de44ca2f', 'a42c882e12054efeb23417692e3e4e51', '2025-03-26 14:31:19.000', '2025-03-26 14:31:19.000');

-- --------------------------------------------------------

--
-- Table structure for table `partner`
--

CREATE TABLE `partner` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) NOT NULL,
  `logo` text NOT NULL,
  `link` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `partner`
--

INSERT INTO `partner` (`id`, `name`, `logo`, `link`, `createdAt`, `updatedAt`) VALUES
('a0939de6-2f1e-11f0-b65a-287fcf8a42ec', 'Partner4', '/api/images/partners/1747046899860-pexels-photo-106399.jpeg', 'https://Partner3.com', '2025-05-12 10:48:23', '2025-05-12 11:03:40'),
('de9fa8f5-2f21-11f0-b65a-287fcf8a42ec', 'Partner5', '/api/images/partners/1747048291641-pexels-photo-106399.jpeg', 'https://partner5.com', '2025-05-12 11:11:36', '2025-05-12 11:11:36'),
('e5a5d778-2f1c-11f0-b65a-287fcf8a42ec', 'Partner2', '/api/images/partners/1747046152771-pexels-photo-106399.jpeg', 'https://partner2.com', '2025-05-12 10:36:00', '2025-05-12 10:36:00'),
('f393f454-2f25-11f0-b65a-287fcf8a42ec', 'Partner6', '/api/images/partners/1747050043179-pexels-photo-106399.jpeg', 'https://Partner.com', '2025-05-12 11:40:49', '2025-05-12 11:40:49');

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
  `updatedAt` datetime(3) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `tag` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `post`
--

INSERT INTO `post` (`id`, `title`, `slug`, `content`, `image`, `excerpt`, `published`, `authorId`, `createdAt`, `updatedAt`, `category`, `tag`) VALUES
('', 'Test', 'test', 'Test<div><a href=\"http://localhost:3000/admin/blogs/new\" target=\"_blank\" rel=\"noopener noreferrer\">Test</a></div><div><br></div>', NULL, 'Test', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-15 14:57:50.000', '2025-04-15 14:57:50.000', NULL, NULL),
('15f4a97f-1b6a-11f0-87bd-80e82c2f894c', 'new', 'new', '<img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1744880274192%2F1744880284879-aml__1_-removebg-preview.png\">', '/blogs/blog-15f4a97f-1b6a-11f0-87bd-80e82c2f894c/1744880378332-download (5) (1)_page-0001.png', 'new', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 11:58:09.000', '2025-04-17 11:59:42.000', '[{\"id\":\"home-improvements\",\"name\":\"Home Improvements\"}]', '[]'),
('2a391094-1b75-11f0-87bd-80e82c2f894c', 'Article 1', 'article-1', '<h2>Hello</h2><img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1744885001310/1744885010411-a-cinematic-shot-of-a-modern-core-banking-solution-U8RV8kwMRt2WbAd3-VJT2Q-nXDe8Gt-SD-gQRNwv1McHg.jpeg\">', 'http://localhost:3000/api/images/blogs/blog-new/1744885046329-a-3d-liquid-gradient-image-illustration-with-the-t-URj61rnFSYaTWCLUOu91iA-2PcqeDLuSCmoDi1_h8P8ag.jpeg', 'Article 1', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 13:17:28.000', '2025-04-17 13:20:13.000', '[{\"id\":\"real-estate-news\",\"name\":\"Real Estate News\"}]', '[]'),
('307629ff-1b66-11f0-87bd-80e82c2f894c', 'test393', 'test393', '<img class=\"editor-image\" src=\"/api/images/blogs/blog-1744878592506/1744878600382-a-cinematic-shot-of-a-modern-core-banking-solution-U8RV8kwMRt2WbAd3-VJT2Q-nXDe8Gt-SD-gQRNwv1McHg.jpeg\">', NULL, 'test', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 11:30:16.000', '2025-04-17 11:30:16.000', '[{\"id\":\"legal-advice\",\"name\":\"Legal Advice\"}]', '[]'),
('603a8211-1b58-11f0-87bd-80e82c2f894c', 'test2222', 'test2222', '<img class=\"editor-image\" src=\"blob:http://localhost:3000/3be6465b-9be4-4477-bbb7-dc01174854a3\">', NULL, 'test', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 09:51:23.000', '2025-04-17 09:51:23.000', '[{\"id\":\"mortgage-financing\",\"name\":\"Mortgage & Financing\"}]', '[]'),
('98811173-1b6c-11f0-87bd-80e82c2f894c', 'test6767', 'test6767', '<img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1744881307991%2F1744881312111-download%20(5)%20(1)_page-0001.png\"><p></p><img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1744881313683%2F1744881350609-a-cinematic-shot-of-a-modern-core-banking-solution-U8RV8kwMRt2WbAd3-VJT2Q-nXDe8Gt-SD-gQRNwv1McHg.jpeg\">', '/blogs/blog-new/1744881363287-a-3d-liquid-gradient-image-illustration-with-the-t-URj61rnFSYaTWCLUOu91iA-2PcqeDLuSCmoDi1_h8P8ag.jpeg', 'test6767', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 12:16:07.000', '2025-04-17 12:16:07.000', '[{\"id\":\"property-guides\",\"name\":\"Property Guides & Advice\"}]', '[]'),
('991c26aa-1b71-11f0-87bd-80e82c2f894c', 'Properties', 'properties', '<h2>Properties</h2><img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1744883469929/1744883485708-a-diagram-of-credwave-s-anti-money-laundering-aml--79R_wcHzR72rzWb-ieSN5g-NFQAcz3vTRqxkjjks7A6PA-removebg-preview (1).png\">', 'http://localhost:3000/api/images/blogs/blog-new/1744883505988-a-cinematic-shot-of-a-modern-core-banking-solution-U8RV8kwMRt2WbAd3-VJT2Q-nXDe8Gt-SD-gQRNwv1McHg.jpeg', 'Properties', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 12:51:56.000', '2025-04-17 12:51:56.000', '[{\"id\":\"legal-advice\",\"name\":\"Legal Advice\"}]', '[]'),
('99f4605d-1b5a-11f0-87bd-80e82c2f894c', 'Test2872', 'test2872', '<img class=\"editor-image\" src=\"blob:http://localhost:3000/d2e4a575-a9cd-4923-89b7-690bb95bfe89\">', NULL, 'test', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 10:07:19.000', '2025-04-17 10:07:19.000', '[{\"id\":\"legal-advice\",\"name\":\"Legal Advice\"}]', '[]'),
('a9923819-2bee-11f0-8ccc-287fcf8a42ec', 'Test33', 'test33', '<p>test33</p><img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1746696395545/1746696431437-shulenet poster.png\">', 'http://localhost:3000/api/images/blogs/blog-new/1746696440587-shulenet poster.png', 'test33', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-05-08 12:27:29.000', '2025-05-08 12:27:29.000', '[{\"id\":\"property-guides\",\"name\":\"Property Guides & Advice\"}]', '[]'),
('b339e657-1b53-11f0-87bd-80e82c2f894c', 'Test', 'test-1744870675013', '<img class=\"editor-image\" src=\"blob:http://localhost:3000/53057488-f5fc-4430-b890-24d942666a78\" style=\"width: 818px\"><p></p><p></p><p>Hello</p><p></p><img class=\"editor-image\" src=\"blob:http://localhost:3000/7acdd30b-e43d-4a4f-a8e2-a7772c6a56ca\"><p></p><h2>H2</h2><ol><li><p>SJ</p></li><li><p>EE</p></li><li><p>E</p></li></ol><ul><li><p>S</p></li><li><p>S</p></li></ul><p></p><p><strong>ndbd</strong></p>', NULL, 'Test', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 09:17:55.000', '2025-04-17 09:17:55.000', '[{\"id\":\"real-estate-news\",\"name\":\"Real Estate News\"}]', '[]'),
('bba35333-1b44-11f0-87bd-80e82c2f894c', 'test', 'test-1744864246539', 'test', NULL, 'test', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 07:30:46.000', '2025-04-17 07:30:46.000', '[{\"id\":\"legal-advice\",\"name\":\"Legal Advice\"}]', '[]'),
('c273005d-1b76-11f0-87bd-80e82c2f894c', 'real estate', 'real-estate', '<img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1744885707671/1744885716291-aml__1_-removebg-preview.png\">', 'http://localhost:3000/api/images/blogs/blog-new/1744885730434-aml-removebg-preview.png', 'real estate', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 13:28:53.000', '2025-04-17 13:28:53.000', '[{\"id\":\"property-guides\",\"name\":\"Property Guides & Advice\"}]', '[]'),
('ddc3f345-1b56-11f0-87bd-80e82c2f894c', 'Test', 'test-1744872035021', '<img class=\"editor-image\" src=\"blob:http://localhost:3000/fb20e757-adda-41c7-8d64-568d7b3cd398\">', NULL, 'test', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 09:40:35.000', '2025-04-17 09:40:35.000', '[{\"id\":\"mortgage-financing\",\"name\":\"Mortgage & Financing\"}]', '[]'),
('de66b7e3-1b55-11f0-87bd-80e82c2f894c', 'test', 'test-1744871606591', '<img class=\"editor-image\" src=\"blob:http://localhost:3000/e200f83f-0608-4853-abbe-5cf5ad5f6541\"><p></p><p>test</p>', NULL, 'test', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 09:33:26.000', '2025-04-17 09:33:26.000', '[{\"id\":\"real-estate-news\",\"name\":\"Real Estate News\"}]', '[]'),
('e63e43cf-1b6d-11f0-87bd-80e82c2f894c', 'newness', 'newness', '<img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1744881904083%2F1744881909343-a-diagram-of-credwave-s-anti-money-laundering-aml--79R_wcHzR72rzWb-ieSN5g-NFQAcz3vTRqxkjjks7A6PA-removebg-preview.png\"><p>ssss</p><img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1744881912671%2F1744881917836-a-professional-setting-with-interconnected-digital-GBmQnl42QqybWGfjiSrMgg-LCn6Hf0yR2mqMJUyx3L2Tg.jpeg\">', '/blogs/blog-new/1744881925482-policy screen 3.png', 'newness', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 12:25:27.000', '2025-04-17 12:25:27.000', '[{\"id\":\"neighborhood-guides\",\"name\":\"Neighborhood Guides\"}]', '[]'),
('e6f88675-1b73-11f0-87bd-80e82c2f894c', 'properties', 'properties-1744884505812', '<img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1744884479569/1744884489980-a-cinematic-shot-of-a-modern-core-banking-solution-U8RV8kwMRt2WbAd3-VJT2Q-nXDe8Gt-SD-gQRNwv1McHg.jpeg\">', 'http://localhost:3000/api/images/blogs/blog-new/1744884503967-a-3d-liquid-gradient-image-illustration-with-the-t-URj61rnFSYaTWCLUOu91iA-2PcqeDLuSCmoDi1_h8P8ag.jpeg', 'properties', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 13:08:25.000', '2025-04-17 13:08:25.000', '[{\"id\":\"property-guides\",\"name\":\"Property Guides & Advice\"}]', '[]'),
('f06ef304-1b5b-11f0-87bd-80e82c2f894c', 'Test22321', 'test22321', '<img class=\"editor-image\" src=\"blob:http://localhost:3000/eaa4242c-fa27-4804-a659-030d517f79d5\" style=\"width: 425px\">', NULL, 'test', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 10:16:53.000', '2025-04-17 10:16:53.000', '[{\"id\":\"agent-advice\",\"name\":\"Agent Advice\"}]', '[]'),
('f2d3e432-1b62-11f0-87bd-80e82c2f894c', 'test67', 'test67', '<img class=\"editor-image\" src=\"/blogs/blog-1744877193060/1744877198666-aml (1).png\">', NULL, 'test2221', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 11:07:04.000', '2025-04-17 11:07:04.000', '[{\"id\":\"real-estate-news\",\"name\":\"Real Estate News\"}]', '[]'),
('f86a5768-1c6b-11f0-bcfd-80e82c2f894c', 'test', 'test-1744991048631', '<img class=\"editor-image\" src=\"http://localhost:3000/api/images/blogs/blog-1744991005544/1744991032394-a-professional-setting-with-interconnected-digital-GBmQnl42QqybWGfjiSrMgg-LCn6Hf0yR2mqMJUyx3L2Tg.jpeg\">', 'http://localhost:3000/api/images/blogs/blog-new/1744991045020-a-3d-liquid-gradient-image-illustration-with-the-t-URj61rnFSYaTWCLUOu91iA-2PcqeDLuSCmoDi1_h8P8ag.jpeg', 'test', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-18 18:44:10.000', '2025-04-18 18:44:10.000', '[{\"id\":\"neighborhood-guides\",\"name\":\"Neighborhood Guides\"}]', '[]'),
('fd778df0-1b60-11f0-87bd-80e82c2f894c', 'Test323', 'test323', '<img class=\"editor-image\" src=\"blob:http://localhost:3000/97eb1b51-b5a4-497c-9892-3a7c15880ba6\">', NULL, 'test2322', 1, 'cm6yzj5vy0000u628zv6wkeom', '2025-04-17 10:53:03.000', '2025-04-17 10:53:03.000', '[{\"id\":\"property-guides\",\"name\":\"Property Guides & Advice\"}]', '[]');

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
('cmm8od69jq6j1qj', '3 Bedroom Bungallow Master Ensuite', '✅Located 1.5 km off the tarmac, providing easy access while maintaining privacy and tranquility.\r\n✅ Spacious living area with large windows and stylish finishes.\r\n✅ Modern kitchen fitted with quality cabinets, ample counter space, and a pantry.\r\n✅ Three bedrooms, with two ensuite for added convenience.\r\n✅Contemporary bathrooms designed with modern fittings.\r\n✅Private garden, perfect for outdoor activities or relaxation.\r\n✅Ample parking to accommodate multiple vehicles.\r\n✅Detached DSQ, ideal for extra accommodation or staff quarters.\r\n✅Situated on its own compound in a gated community with reliable security and water supply.\r\n✅Located just a short drive from Kitengela town, this home is close to schools, shopping centers, and other essential amenities.\r\nContact us today to schedule a viewing or for more details.\r\nwww.vectorafriqproperties.co.ke || 0702 22 55 47', 7800000, NULL, 'BUNGALOWS', 'sale', 'Parklands, Westlands, Nairobi', 3, 3, 450.00, 450.00, '[\"/properties/1742899150852/1742899184027-1.jpg\",\"/properties/1742899150852/1742899184037-2.jpg\",\"/properties/1742899150852/1742899184045-3.jpg\",\"/properties/1742899150852/1742899184056-4.jpg\",\"/properties/1742899150852/1742899184064-5.jpg\",\"/properties/1742899150852/1742899184074-6.jpg\",\"/properties/1742899150852/1742899184085-7.jpg\",\"/properties/1742899150852/1742899184107-8.jpg\",\"/properties/1742899150852/1742899184139-9.jpg\"]', '{\"0\":\"Security\",\"1\":\"Water Storage\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":false,\"paymentTerms\":\"Cash basis\",\"address\":\"Kitengela\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":\"cm6yw0hxe0004u62s8kg50lne\"}}}', 'AVAILABLE', '2025-03-25 12:39:44.344', '2025-03-25 12:39:44.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm8odt2oc933sy', '3 BEDROOM MAISONETTES WITH SQ/GUEST ROOM AND TERRACE FOR SALE.', ' SELLING PRICE\r\n💰 Kes. 14.5M for cash\r\n💰 Kes. 14.8M for mortgage\r\n⚪All bedrooms ensuite \r\n⚪Spacious living area opening to the garden \r\n⚪Dining area\r\n⚪Spacious kitchen\r\n⚪Pantry \r\n⚪Laundry area\r\n⚪Well lit spacious rooms\r\n⚪Parking for 2 cars \r\n⚪Garden \r\n⚪Terrace on the first floor\r\n⚪Solar water heater\r\n⚪Gated community of 20 units\r\n⚪Amazing views of the Ngong hills \r\n⚪200m off tarmac\r\nCustomization of tiles, kitchen cabinets and wardrobes MDF, granite, and interior paint color are chosen by the client from our standard variety of finishes. Kindly note that additional customizations are done at clients\' costs.                                      📩 Contact Us Today!\r\n📞 Call/WhatsApp: 0702225547', 14500000, NULL, 'TOWNHOUSES', 'sale', 'Parklands, Westlands, Nairobi', 3, 3, 450.00, 450.00, '[\"/properties/1742900238707/1742900248280-1.jpg\",\"/properties/1742900238707/1742900248286-2.jpg\",\"/properties/1742900238707/1742900248293-3.jpg\",\"/properties/1742900238707/1742900248301-4.jpg\",\"/properties/1742900238707/1742900248306-5.jpg\",\"/properties/1742900238707/1742900248311-6.jpg\",\"/properties/1742900238707/1742900248315-7.jpg\",\"/properties/1742900238707/1742900248321-8.jpg\",\"/properties/1742900238707/1742900248325-9.jpg\",\"/properties/1742900238707/1742900248331-10.jpg\",\"/properties/1742900238707/1742900248336-11.jpg\",\"/properties/1742900238707/1742900248340-12.jpg\",\"/properties/1742900238707/1742900248343-13.jpg\",\"/properties/1742900238707/1742900248347-14.jpg\",\"/properties/1742900238707/1742900248351-15.jpg\",\"/properties/1742900238707/1742900248356-16.jpg\",\"/properties/1742900238707/1742900248364-17.jpg\",\"/properties/1742900238707/1742900248368-18.jpg\",\"/properties/1742900238707/1742900248373-19.jpg\"]', '{\"0\":\"Security\",\"1\":\"Garden\",\"2\":\"Pet Friendly\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":false,\"paymentTerms\":\" SELLING PRICE\\r\\n💰 Kes. 14.5M for cash\\r\\n💰 Kes. 14.8M for mortgage\",\"address\":\"Ngong\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"cm6yvzpkr0002u62sn6rmp5cs\",\"neighborhood\":\"cm6yw0hxe0004u62s8kg50lne\"}}}', 'AVAILABLE', '2025-03-25 12:57:28.526', '2025-03-25 12:57:28.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm8oewbl0yjtg1', 'Executive 5-Bedroom Villas + DSQ in Karen – For Sale', 'Live in **luxury and elegance** in the heart of **Karen**, just moments away from **Waterfront Mall**. These **exclusive villas** offer an unmatched blend of **space, comfort, and modern sophistication.**  \r\n💰 **Price:** Ksh. 170M  \r\n💵 **Rent:** USD 5,000/month  \r\n### **🏠 Key Features:**  \r\n✔️ **Set on 0.6 Acres** – Spacious & private living  \r\n✔️ **Expansive Lounge with Fireplace** – Cozy and elegant ambiance  \r\n✔️ **Separate Dining Area** – Opens up to the pool area for scenic views  \r\n✔️ **Fully Fitted Semi-Open Plan Kitchen** – Modern & functional  \r\n✔️ **Master Ensuite Bedroom** – Huge balcony, **walk-in closet with island & jacuzzi**  \r\n✔️ **Private Swimming Pool** – Ultimate luxury for relaxation  \r\n✔️ **Exclusive Living** – **Few units** in the compound for added privacy  \r\n📍 **Prime Location in Karen – Close to Top Schools, Malls & Social Amenities**  \r\n🏡 **Own or rent this magnificent home today!**  \r\n📞 **Call/WhatsApp:** 0702225547  \r\n🌍 **Visit us:** [www.vectorafriqproperties.co.ke]', 17000000, NULL, 'TOWNHOUSES', 'SALE', 'Westlands, Nairobi', 5, 4, 450.00, 450.00, '[\"/properties/1742902068791/1742902079477-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.24.jpg\",\"/properties/1742902068791/1742902079426-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.17%2520(1).jpg\",\"/properties/1742902068791/1742902079432-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.17.jpg\",\"/properties/1742902068791/1742902079437-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.18%2520(1).jpg\",\"/properties/1742902068791/1742902079440-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.18.jpg\",\"/properties/1742902068791/1742902079444-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.19%2520(1).jpg\",\"/properties/1742902068791/1742902079449-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.19.jpg\",\"/properties/1742902068791/1742902079452-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.20%2520(1).jpg\",\"/properties/1742902068791/1742902079455-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.20.jpg\",\"/properties/1742902068791/1742902079458-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.21%2520(1).jpg\",\"/properties/1742902068791/1742902079461-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.21.jpg\",\"/properties/1742902068791/1742902079463-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.22%2520(1).jpg\",\"/properties/1742902068791/1742902079466-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.22.jpg\",\"/properties/1742902068791/1742902079469-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.23%2520(1).jpg\",\"/properties/1742902068791/1742902079472-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.23.jpg\",\"/properties/1742902068791/1742902079475-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.24%2520(1).jpg\",\"/properties/1742902068791/1742902079482-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.25%2520(1).jpg\",\"/properties/1742902068791/1742902079485-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.25.jpg\",\"/properties/1742902068791/1742902079488-WhatsApp%2520Image%25202025-03-07%2520at%252016.56.26.jpg\"]', '[]', 'AVAILABLE', '2025-03-25 13:27:59.654', '2025-04-01 10:12:01.000', '83c907f66fb74285b5bd224e31cae0fe', 0),
('cmm8oidpl06asgh', 'stunning 3-bedroom bungalow', '🏡 3-Bedroom Bungalow for Sale in Kitengela – Ksh 6.5M! 🌿✨**  \r\nLooking for a **peaceful, modern, and spacious home** in **Kitengela**? This **stunning 3-bedroom bungalow** is the perfect blend of **serenity, comfort, and convenience.** Nestled in a **lush green environment**, it offers the ideal setting for your dream home!  \r\n### **🏠 Property Highlights:**  \r\n✅ **Spacious Kitchen** with Fitted Cabinets  \r\n✅ **Provision for Intercom, Internet & Satellite TV**  \r\n✅ **Built-Up Area: 145 SQM**  \r\n✅ **High-Quality Ceramic Tiles Flooring**  \r\n✅ **Reliable 24/7 Borehole Water Supply**  \r\n✅ **Open-Plan Kitchen for Modern Living**  \r\n✅ **Plot Size: 50x100ft (Freehold Title)**  \r\n💰 **Price: Ksh 6,500,000**  \r\n📍 **Location: Kitengela**  \r\nThis is your **chance to own a beautiful home** in a **secure and serene environment!**  \r\n📞 **Call us today for booking & viewing:** 0702 22 55 47  \r\n🌍 **Visit us:** [www.vectorafriqpropertiesltd.co.ke]', 6500000, NULL, 'TOWNHOUSES', 'SALE', 'Parklands, Westlands, Nairobi', 3, 3, 450.00, 450.00, '[\"/properties/1742907918544/1742907929603-WhatsApp%2520Image%25202023-04-14%2520at%252010.52.57%2520AM%2520(1).jpg\",\"/properties/1742907918544/1742907929565-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.48%2520(3).jpg\",\"/properties/1742907918544/1742907929571-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.48.jpg\",\"/properties/1742907918544/1742907929575-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.49%2520(1).jpg\",\"/properties/1742907918544/1742907929579-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.49%2520(2).jpg\",\"/properties/1742907918544/1742907929583-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.49.jpg\",\"/properties/1742907918544/1742907929587-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.50%2520(1).jpg\",\"/properties/1742907918544/1742907929591-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.50%2520(2).jpg\",\"/properties/1742907918544/1742907929599-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.50.jpg\",\"/properties/1742907918544/1742907929608-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.45.jpg\",\"/properties/1742907918544/1742907929612-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.47%2520(1).jpg\",\"/properties/1742907918544/1742907929617-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.47%2520(2).jpg\",\"/properties/1742907918544/1742907929621-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.47.jpg\",\"/properties/1742907918544/1742907929628-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.48%2520(1).jpg\",\"/properties/1742907918544/1742907929633-WhatsApp%2520Image%25202023-06-23%2520at%252010.35.48%2520(2).jpg\"]', '[]', 'AVAILABLE', '2025-03-25 15:05:29.797', '2025-04-01 10:13:37.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm8ooudqb6xi2x', '3 Bedroom Bangalow for Sale', 'wfae-fi0jefgi0erfg', 7500000, NULL, 'BUNGALOWS', 'SALE', 'Kiambu, Nairobi', 3, 3, 140.00, 140.00, '[\"/properties/1742918783298/1742918785127-155cf2f4-19ac-4eb1-a059-8e2f8cd3d7d7.jpeg\",\"/properties/1742918783298/1742918785112-7d1af019-834c-4736-ae4f-b1d4f8b25bc6.jpeg\",\"/properties/1742918783298/1742918785118-7d701093-6ea4-474f-a68c-c4d89acfaea4.jpeg\",\"/properties/1742918783298/1742918785123-18ec25fe-6037-444b-95ff-d09cce15b5dc.jpeg\",\"/properties/1742918783298/1742918785131-9515fda9-648b-4271-aa82-a641cf55babd.jpeg\",\"/properties/1742918783298/1742918785135-d1aa0ec4-8c96-462c-90b9-16558b05c492.jpeg\",\"/properties/1742918783298/1742918785139-d82da665-71bd-4dad-9360-db7bd2731ba3.jpeg\",\"/properties/1742918783298/1742918785143-ebd821d2-64be-4330-882b-f397bc561970.jpeg\"]', '[]', 'AVAILABLE', '2025-03-25 18:06:25.284', '2025-04-08 09:29:08.000', '7d1a502b6b754f47836521cb0cadec09', 0),
('cmm8pysllm1q08l', '3 Bedroom with DSQ', '📍 **Location:** Juja, just **900m off the tarmac**  \r\n🏠 **Plinth Area:** 192 sqm  \r\n💰 **Price:**  \r\n✅ **3BR All Ensuite Bungalow + Family/Study Room – Ksh 8M**  \r\n✅ **3BR + DSQ – Ksh 8.5M**  \r\n💰 **Deposit:** 50% | Balance payable upon completion  \r\n🚗 **Daily site visits available!**  \r\n### **🏠 Features:**  \r\n✔️ **Open-Plan Kitchen** with Pantry  \r\n✔️ **Spacious Lounge & Separate Dining Area**  \r\n✔️ **Laundry Area & In-Built Wardrobes**  \r\n✔️ **Master Bedroom with Walk-in Closet**  \r\n✔️ **Family/Study Room (Can be a 4th Bedroom!)**  \r\n✔️ **Front & Back Gardens**  \r\n✔️ **Ample Parking for 2 Cars**  \r\n✔️ **Water & Electricity Onsite**  \r\n✔️ **Cabro-Paved Driveways**  \r\n✔️ **Perimeter Wall, Electric Fence & CCTV**  \r\n✔️ **INTERCOM System for Security & Communication**  \r\n✔️ **Green Areas for Relaxation**  \r\n🚀 Secure your dream home today!  \r\n📞/📲 **Call or WhatsApp:** 0702225547 ', 8000000, 'Cash', 'BUNGALOWS', 'SALE', 'Westlands, Nairobi', 3, 3, 140.00, 2025.00, '[\"/properties/1742995952167/1742995964257-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.55_1.jpg\",\"/properties/1742995952167/1742995964171-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.48%2520(1)_1.jpg\",\"/properties/1742995952167/1742995964191-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.48_1.jpg\",\"/properties/1742995952167/1742995964197-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.49%2520(1)_1.jpg\",\"/properties/1742995952167/1742995964202-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.49_1.jpg\",\"/properties/1742995952167/1742995964206-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.50%2520(1)_1.jpg\",\"/properties/1742995952167/1742995964213-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.50_1.jpg\",\"/properties/1742995952167/1742995964216-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.51%2520(1)_1.jpg\",\"/properties/1742995952167/1742995964219-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.51_1.jpg\",\"/properties/1742995952167/1742995964223-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.52%2520(1)_1.jpg\",\"/properties/1742995952167/1742995964228-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.52%2520(2)_1.jpg\",\"/properties/1742995952167/1742995964232-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.52_1.jpg\",\"/properties/1742995952167/1742995964236-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.53_1.jpg\",\"/properties/1742995952167/1742995964240-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.54%2520(1)_1.jpg\",\"/properties/1742995952167/1742995964244-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.54%2520(2)_1.jpg\",\"/properties/1742995952167/1742995964248-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.54_1.jpg\",\"/properties/1742995952167/1742995964253-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.55%2520(1)_1.jpg\",\"/properties/1742995952167/1742995964260-WhatsApp%2520Image%25202025-03-20%2520at%252006.16.56_1.jpg\"]', '[]', 'AVAILABLE', '2025-03-26 15:32:44.508', '2025-04-01 10:13:01.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm8wuoupjmat1i', '3 Bedroom Bungalow with DSQ', '3-Bedroom Bungalow with DSQ for Sale \r\nKitengela, Acacia - Price: Ksh 7.8M\r\nDiscover your dream home in the serene and fast-growing Acacia neighborhood of Kitengela. This charming 3-bedroom bungalow with a detached servant\'s quarter (DSQ) offers a perfect blend of modern living and comfort.\r\nProperty Features:\r\n✅Located 1.5 km off the tarmac, providing easy access while maintaining privacy and tranquility.\r\n✅ Spacious living area with large windows and stylish finishes.\r\n✅ Modern kitchen fitted with quality cabinets, ample counter space, and a pantry.\r\n✅ Three bedrooms, with two ensuite for added convenience.\r\n✅Contemporary bathrooms designed with modern fittings.\r\n✅Private garden, perfect for outdoor activities or relaxation.\r\n✅Ample parking to accommodate multiple vehicles.\r\n✅Detached DSQ, ideal for extra accommodation or staff quarters.\r\n✅Situated on its own compound in a gated community with reliable security and water supply.\r\n✅Located just a short drive from Kitengela town, this home is close to schools, ', 7800000, 'Cash', 'BUNGALOWS', 'sale', 'Acacia, Kitengela, Kajiado', 3, 3, 140.00, 2025.00, '[\"/properties/1743412304729/1743412334104-3.jpg\",\"/properties/1743412304729/1743412334118-2.jpg\",\"/properties/1743412304729/1743412334127-1.jpg\",\"/properties/1743412304729/1743412334138-4.jpg\",\"/properties/1743412304729/1743412334146-5.jpg\",\"/properties/1743412304729/1743412334157-6.jpg\",\"/properties/1743412304729/1743412334174-7.jpg\",\"/properties/1743412304729/1743412334186-8.jpg\",\"/properties/1743412304729/1743412334204-9.jpg\"]', '{\"0\":\"Security\",\"1\":\"Parking\",\"2\":\"Pet Friendly\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":true,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"f2373da1cf7e4798adffdbc0de44ca2f\",\"neighborhood\":\"516e182922534ffeac89d3ea448b6b61\"}}}', 'AVAILABLE', '2025-03-31 11:12:14.456', '2025-03-31 11:12:20.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm8wz1hqm94dvr', '3 Bedroom Bungalow with Master Ensuite', '✅ 3 Spacious Bedrooms – Master en-suite with elegant finishes\r\n✅ Modern Open-Plan Kitchen – Fitted with cabinets and a pantry\r\n✅ Spacious Living & Dining Area – Large windows for natural light\r\n✅ Laundry Area – Dedicated space for washing & drying\r\n✅ Ample Parking – Cabro-paved driveway\r\n✅ Private Garden – Ideal for relaxation & outdoor activities\r\n✅ Secure Gated Community – Perimeter wall & 24/7 security\r\nPrice: Ksh 7,000,000', 7000000, 'Cash', 'BUNGALOWS', 'sale', 'Acacia, Kitengela, Kajiado', 3, 2, 140.00, 2025.00, '[\"/properties/1743419639927/1743419642344-1.jpg\",\"/properties/1743419639927/1743419642352-2.jpg\",\"/properties/1743419639927/1743419642358-3.jpg\",\"/properties/1743419639927/1743419642364-4.jpg\",\"/properties/1743419639927/1743419642368-5.jpg\",\"/properties/1743419639927/1743419642372-6.jpg\",\"/properties/1743419639927/1743419642376-7.jpg\",\"/properties/1743419639927/1743419642380-8.jpg\"]', '{\"0\":\"Security\",\"1\":\"Garden\",\"2\":\"Parking\",\"3\":\"Pet Friendly\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":false,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"f2373da1cf7e4798adffdbc0de44ca2f\",\"neighborhood\":\"516e182922534ffeac89d3ea448b6b61\"}}}', 'AVAILABLE', '2025-03-31 13:14:02.640', '2025-03-31 13:14:05.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm8zgxmh9xro5l', '3 bedroom detached Maisonettes plus Dsq', '-Detached staff quarters\r\n-Spacious ,modern, fully Fitted kitchen with pantry\r\n-Spacious lounge with separate dining area\r\n-Visitor’s cloakroom\r\n-En-suite master bedroom\r\n-160sqm plinth area\r\n-Cabro paved estate roads\r\n-Boreholes & Water treatment plant\r\nElectric fence & manned gates\r\nCall 0702225547 for viewing and Booking\r\n', 10000000, 'Cash', 'TOWNHOUSES', 'sale', 'Acacia, Kitengela, Kajiado', 3, 3, 160.00, 2025.00, '[\"/properties/1743570604390/1743570627240-319044000_558271942820606_1789368739792381794_n.jpg\",\"/properties/1743570604390/1743570627249-318510533_1278779126017028_8092019426304556928_n.jpg\",\"/properties/1743570604390/1743570627254-318642030_1130272604322642_5830752244121751016_n.jpg\",\"/properties/1743570604390/1743570627258-318779044_939853886976344_9008279269843780113_n.jpg\",\"/properties/1743570604390/1743570627262-318781803_1344005156416149_2126726217270149205_n.jpg\",\"/properties/1743570604390/1743570627267-318789845_899306824393991_9002328496565649519_n.jpg\",\"/properties/1743570604390/1743570627272-318855083_525895962926725_8561788396962767405_n.jpg\",\"/properties/1743570604390/1743570627277-319010303_924825185173130_2844805166278921248_n.jpg\",\"/properties/1743570604390/1743570627282-319027187_1415017052634607_8893592322448693233_n.jpg\",\"/properties/1743570604390/1743570627287-319027464_659794822496370_6323786464742825695_n.jpg\",\"/properties/1743570604390/1743570627293-319069029_1559452334496753_7423863788692151658_n.jpg\",\"/properties/1743570604390/1743570627298-319085422_1493549024474949_289442064416436301_n.jpg\",\"/properties/1743570604390/1743570627305-319175332_676089657359346_4388342805067094054_n.jpg\",\"/properties/1743570604390/1743570627310-319182627_673441700843844_6598685091026090087_n.jpg\",\"/properties/1743570604390/1743570627316-319184731_539396148089570_4318735055354266590_n.jpg\",\"/properties/1743570604390/1743570627323-319271604_5769483993089248_3492127632360116413_n.jpg\",\"/properties/1743570604390/1743570627328-319291580_5619216814839622_4574659096662335971_n.jpg\",\"/properties/1743570604390/1743570627336-319319001_457940849839168_6936771255005917543_n.jpg\",\"/properties/1743570604390/1743570627341-319324535_888951058775242_5742505253846217488_n.jpg\",\"/properties/1743570604390/1743570627345-319328273_822016029088411_8146890228203825118_n.jpg\",\"/properties/1743570604390/1743570627349-319369116_669050751378632_831346309829316131_n.jpg\",\"/properties/1743570604390/1743570627355-319397475_686101363139371_1950235643038165279_n.jpg\",\"/properties/1743570604390/1743570627362-319503064_459617879677352_1272992185426665073_n.jpg\",\"/properties/1743570604390/1743570627375-319527390_435788901935506_4213359205881607115_n.jpg\",\"/properties/1743570604390/1743570627382-319540909_3350278471887045_2418669205308974462_n.jpg\",\"/properties/1743570604390/1743570627387-319554748_5869812946373063_6507747937562277460_n.jpg\",\"/properties/1743570604390/1743570627394-319671897_1377684259705504_8876354806948837237_n.jpg\",\"/properties/1743570604390/1743570627401-319692792_460960519566225_8767973519444698930_n.jpg\",\"/properties/1743570604390/1743570627418-319888958_663294205253474_6988161025353108584_n.jpg\",\"/properties/1743570604390/1743570627423-320001994_555730682670779_125629824152819272_n.jpg\"]', '{\"0\":\"Pet Friendly\",\"1\":\"Balcony\",\"2\":\"Security\",\"3\":\"Garden\",\"4\":\"Parking\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":false,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"f2373da1cf7e4798adffdbc0de44ca2f\",\"neighborhood\":\"516e182922534ffeac89d3ea448b6b61\"}}}', 'AVAILABLE', '2025-04-02 07:10:27.599', '2025-04-02 07:17:27.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm8zh6jnnsrl44', '4 Bedroom all Ensuite Master Bdr with built-in wardrobes', 'Secure and serene neighborhood: Easy access to malls, schools, local shopping centers, entertainment joints, sport clubs, hospitals, etc.\r\nExclusive gated community: Just 3 km from Kitengela\r\nParking: Ample space for at least 4 cars\r\nLiving Room: Spacious with large windows providing plenty of natural light, separate dining area\r\nKitchen: Semi-enclosed with a large working surface, plenty of storage space, and a pantry\r\nBedrooms: 4 all en-suite with in-built wardrobes\r\nMaster Bedroom: En-suite with a walk-in closet\r\nAdditional Rooms: TV room, study room/office space, guest bedroom with cloakroom\r\n', 25000000, 'Cash', 'TOWNHOUSES', 'sale', 'Chuna, Kitengela, Kajiado', 4, 4, 190.00, 2025.00, '[\"/properties/1743571040006/1743571043665-829fc90c-eb9b-4a4d-996e-8c4f5b13112e.jpg\",\"/properties/1743571040006/1743571043670-8ecc0ff9-dbaa-4b19-9f92-29e9137647fe.jpg\",\"/properties/1743571040006/1743571043673-33ea68a2-8c57-4970-9bf9-404078e3bc1e.jpg\",\"/properties/1743571040006/1743571043677-40d262a6-f759-4510-b910-311cfe84698c.jpg\",\"/properties/1743571040006/1743571043680-950f2151-1559-4bcf-aab6-8ad5b85644dd.jpg\",\"/properties/1743571040006/1743571043683-5838fa11-37b0-4a19-9f1d-2ac2e3739a7a.jpg\",\"/properties/1743571040006/1743571043688-4985995d-c59c-496a-bde1-1b6b26af0cc3.jpg\",\"/properties/1743571040006/1743571043692-c425ffea-2131-4116-bd66-f0314707fc57.jpg\",\"/properties/1743571040006/1743571043696-ff342199-3258-4b90-beb7-01c446524d7d.jpg\"]', '{\"0\":\"Parking\",\"1\":\"Security\",\"2\":\"Garden\",\"3\":\"Pet Friendly\",\"4\":\"Balcony\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":false,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"f2373da1cf7e4798adffdbc0de44ca2f\",\"neighborhood\":\"f49004404f2a4311b4f903eda4eb8ba3\"}}}', 'AVAILABLE', '2025-04-02 07:17:23.845', '2025-04-02 07:17:28.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm8zhcl44fw7io', '4 Bedroom Master Bdr Ensuite with bath tab modern flat roof design', '•	Spacious lounge and dinning area\r\n•	Open plan kitchen fitted with upper and lower shelves and granite table tops\r\n•	Master bedroom  ensuite with a bath tab\r\n•	Modern flat roof design\r\n•	Own personal gate with well maintained lawn\r\n•	Cabro paved driveway\r\n•	Ample parking area for 2 cars\r\n•	Finest fittings for bathrooms and bedrooms\r\n•	Perimeter wall\r\n•	Adequate water supply\r\n•	24 hour security system \r\nPrice Guide : 9 500 000\r\nContact 0702225547', 9500000, 'Cash', 'TOWNHOUSES', 'sale', 'Acacia, Kitengela, Kajiado', 4, 4, 190.00, 2025.00, '[\"/properties/1743571285543/1743571325215-WhatsApp%20Image%202022-12-14%20at%2013.55.13.jpg\",\"/properties/1743571285543/1743571325221-WhatsApp%20Image%202022-12-14%20at%2013.55.16.jpg\",\"/properties/1743571285543/1743571325226-WhatsApp%20Image%202022-12-14%20at%2013.55.17.jpg\",\"/properties/1743571285543/1743571325229-WhatsApp%20Image%202022-12-14%20at%2013.55.18.jpg\",\"/properties/1743571285543/1743571325232-WhatsApp%20Image%202022-12-14%20at%2013.55.19%20(1).jpg\",\"/properties/1743571285543/1743571325236-WhatsApp%20Image%202022-12-14%20at%2013.55.19.jpg\",\"/properties/1743571285543/1743571325239-WhatsApp%20Image%202022-12-14%20at%2013.55.20%20(1).jpg\",\"/properties/1743571285543/1743571325243-WhatsApp%20Image%202022-12-14%20at%2013.55.20%20(2).jpg\",\"/properties/1743571285543/1743571325248-WhatsApp%20Image%202022-12-14%20at%2013.55.20.jpg\",\"/properties/1743571285543/1743571325252-WhatsApp%20Image%202022-12-14%20at%2013.55.21%20(1).jpg\",\"/properties/1743571285543/1743571325256-WhatsApp%20Image%202022-12-14%20at%2013.55.21.jpg\",\"/properties/1743571285543/1743571325261-WhatsApp%20Image%202022-12-14%20at%2013.55.22%20(1).jpg\",\"/properties/1743571285543/1743571325264-WhatsApp%20Image%202022-12-14%20at%2013.55.22.jpg\",\"/properties/1743571285543/1743571325268-WhatsApp%20Image%202022-12-14%20at%2013.55.23%20(1).jpg\",\"/properties/1743571285543/1743571325271-WhatsApp%20Image%202022-12-14%20at%2013.55.23.jpg\",\"/properties/1743571285543/1743571325275-WhatsApp%20Image%202022-12-14%20at%2013.55.24.jpg\",\"/properties/1743571285543/1743571325279-WhatsApp%20Image%202022-12-14%20at%2013.55.25%20(1).jpg\",\"/properties/1743571285543/1743571325282-WhatsApp%20Image%202022-12-14%20at%2013.55.25.jpg\",\"/properties/1743571285543/1743571325287-WhatsApp%20Image%202022-12-14%20at%2013.55.26%20(1).jpg\",\"/properties/1743571285543/1743571325292-WhatsApp%20Image%202022-12-14%20at%2013.55.26.jpg\",\"/properties/1743571285543/1743571325303-WhatsApp%20Image%202022-12-14%20at%2013.55.27%20(1).jpg\",\"/properties/1743571285543/1743571325310-WhatsApp%20Image%202022-12-14%20at%2013.55.27.jpg\",\"/properties/1743571285543/1743571325318-WhatsApp%20Image%202022-12-14%20at%2013.55.28.jpg\",\"/properties/1743571285543/1743571325325-WhatsApp%20Image%202022-12-14%20at%2013.55.29.jpg\",\"/properties/1743571285543/1743571325332-WhatsApp%20Image%202022-12-14%20at%2013.55.30%20(1).jpg\",\"/properties/1743571285543/1743571325353-WhatsApp%20Image%202022-12-14%20at%2013.55.30.jpg\",\"/properties/1743571285543/1743571325360-WhatsApp%20Image%202022-12-14%20at%2013.55.31%20(1).jpg\",\"/properties/1743571285543/1743571325365-WhatsApp%20Image%202022-12-14%20at%2013.55.31.jpg\",\"/properties/1743571285543/1743571325369-WhatsApp%20Image%202022-12-14%20at%2013.55.32%20(1).jpg\",\"/properties/1743571285543/1743571325373-WhatsApp%20Image%202022-12-14%20at%2013.55.32.jpg\",\"/properties/1743571285543/1743571325377-WhatsApp%20Image%202022-12-14%20at%2013.55.45%20(1).jpg\",\"/properties/1743571285543/1743571325382-WhatsApp%20Image%202022-12-14%20at%2013.55.45.jpg\",\"/properties/1743571285543/1743571325389-WhatsApp%20Image%202022-12-14%20at%2013.55.46%20(1).jpg\",\"/properties/1743571285543/1743571325394-WhatsApp%20Image%202022-12-14%20at%2013.55.46%20(2).jpg\",\"/properties/1743571285543/1743571325399-WhatsApp%20Image%202022-12-14%20at%2013.55.46.jpg\",\"/properties/1743571285543/1743571325404-WhatsApp%20Image%202022-12-14%20at%2013.55.47%20(1).jpg\",\"/properties/1743571285543/1743571325408-WhatsApp%20Image%202022-12-14%20at%2013.55.47.jpg\",\"/properties/1743571285543/1743571325411-WhatsApp%20Image%202022-12-14%20at%2013.55.48%20(1).jpg\",\"/properties/1743571285543/1743571325417-WhatsApp%20Image%202022-12-14%20at%2013.55.48%20(2).jpg\",\"/properties/1743571285543/1743571325421-WhatsApp%20Image%202022-12-14%20at%2013.55.48.jpg\",\"/properties/1743571285543/1743571325425-WhatsApp%20Image%202022-12-14%20at%2013.55.49%20(1).jpg\",\"/properties/1743571285543/1743571325428-WhatsApp%20Image%202022-12-14%20at%2013.55.49.jpg\",\"/properties/1743571285543/1743571325432-WhatsApp%20Image%202022-12-14%20at%2013.55.50%20(1).jpg\",\"/properties/1743571285543/1743571325436-WhatsApp%20Image%202022-12-14%20at%2013.55.50%20(2).jpg\",\"/properties/1743571285543/1743571325441-WhatsApp%20Image%202022-12-14%20at%2013.55.50.jpg\",\"/properties/1743571285543/1743571325447-WhatsApp%20Image%202022-12-14%20at%2013.55.51%20(1).jpg\",\"/properties/1743571285543/1743571325451-WhatsApp%20Image%202022-12-14%20at%2013.55.51.jpg\",\"/properties/1743571285543/1743571325457-WhatsApp%20Image%202022-12-14%20at%2013.55.52%20(1).jpg\",\"/properties/1743571285543/1743571325462-WhatsApp%20Image%202022-12-14%20at%2013.55.52.jpg\",\"/properties/1743571285543/1743571325471-WhatsApp%20Image%202022-12-14%20at%2013.55.53%20(1).jpg\",\"/properties/1743571285543/1743571325477-WhatsApp%20Image%202022-12-14%20at%2013.55.53%20(2).jpg\",\"/properties/1743571285543/1743571325490-WhatsApp%20Image%202022-12-14%20at%2013.55.53.jpg\",\"/properties/1743571285543/1743571325496-WhatsApp%20Image%202022-12-14%20at%2013.55.54.jpg\"]', '{\"0\":\"Security\",\"1\":\"Garden\",\"2\":\"Parking\",\"3\":\"Pet Friendly\",\"4\":\"Balcony\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":false,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"f2373da1cf7e4798adffdbc0de44ca2f\",\"neighborhood\":\"516e182922534ffeac89d3ea448b6b61\"}}}', 'AVAILABLE', '2025-04-02 07:22:05.669', '2025-04-02 07:22:08.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm8zhhdlhwjllm', '5 Bedroom Maisonette Master Ensuite Cabro paved driveway', '•	Large windows for natural lighting.\r\n•	High standard finishing\r\n•	High quality ceramic tiles flooring\r\n•	Master en-suite \r\n•	Spacious Lounge on ground floor plus a dining area\r\n•	Cabro paved driveway\r\n•	Private own compound \r\n•	Spacious kitchen with fitted cabinets\r\n•	Enough water storage \r\n•	24 hour security\r\nPrice Guide: Ksh 11,000,000\r\nCall 0702225547 for Viewing and Booking\r\n', 11000000, 'Cash', 'TOWNHOUSES', 'sale', 'Acacia, Kitengela, Kajiado', 5, 4, 220.00, 2025.00, '[\"/properties/1743571532583/1743571548952-WhatsApp%20Image%202023-01-21%20at%2012.01.45.jpg\",\"/properties/1743571532583/1743571548958-WhatsApp%20Image%202023-01-21%20at%2012.01.46%20(1).jpg\",\"/properties/1743571532583/1743571548963-WhatsApp%20Image%202023-01-21%20at%2012.01.46%20(2).jpg\",\"/properties/1743571532583/1743571548966-WhatsApp%20Image%202023-01-21%20at%2012.01.46.jpg\",\"/properties/1743571532583/1743571548969-WhatsApp%20Image%202023-01-21%20at%2012.01.47%20(1).jpg\",\"/properties/1743571532583/1743571548972-WhatsApp%20Image%202023-01-21%20at%2012.01.47.jpg\",\"/properties/1743571532583/1743571548975-WhatsApp%20Image%202023-01-21%20at%2012.01.48%20(1).jpg\",\"/properties/1743571532583/1743571548978-WhatsApp%20Image%202023-01-21%20at%2012.01.48.jpg\",\"/properties/1743571532583/1743571548983-WhatsApp%20Image%202023-01-21%20at%2012.01.49%20(1).jpg\",\"/properties/1743571532583/1743571548986-WhatsApp%20Image%202023-01-21%20at%2012.01.49.jpg\",\"/properties/1743571532583/1743571548990-WhatsApp%20Image%202023-01-21%20at%2012.01.50%20(1).jpg\",\"/properties/1743571532583/1743571548993-WhatsApp%20Image%202023-01-21%20at%2012.01.50%20(2).jpg\",\"/properties/1743571532583/1743571548997-WhatsApp%20Image%202023-01-21%20at%2012.01.50.jpg\",\"/properties/1743571532583/1743571549000-WhatsApp%20Image%202023-01-21%20at%2012.01.51%20(1).jpg\",\"/properties/1743571532583/1743571549003-WhatsApp%20Image%202023-01-21%20at%2012.01.51.jpg\",\"/properties/1743571532583/1743571549006-WhatsApp%20Image%202023-01-21%20at%2012.01.52%20(1).jpg\",\"/properties/1743571532583/1743571549009-WhatsApp%20Image%202023-01-21%20at%2012.01.52.jpg\",\"/properties/1743571532583/1743571549012-WhatsApp%20Image%202023-01-21%20at%2012.01.53%20(1).jpg\",\"/properties/1743571532583/1743571549014-WhatsApp%20Image%202023-01-21%20at%2012.01.53.jpg\",\"/properties/1743571532583/1743571549017-WhatsApp%20Image%202023-01-21%20at%2012.01.54%20(1).jpg\",\"/properties/1743571532583/1743571549020-WhatsApp%20Image%202023-01-21%20at%2012.01.54%20(2).jpg\",\"/properties/1743571532583/1743571549023-WhatsApp%20Image%202023-01-21%20at%2012.01.54.jpg\",\"/properties/1743571532583/1743571549026-WhatsApp%20Image%202023-01-21%20at%2012.01.55%20(1).jpg\",\"/properties/1743571532583/1743571549031-WhatsApp%20Image%202023-01-21%20at%2012.01.55.jpg\",\"/properties/1743571532583/1743571549034-WhatsApp%20Image%202023-01-21%20at%2012.01.56%20(1).jpg\",\"/properties/1743571532583/1743571549040-WhatsApp%20Image%202023-01-21%20at%2012.01.56.jpg\",\"/properties/1743571532583/1743571549046-WhatsApp%20Image%202023-01-21%20at%2012.01.57%20(1).jpg\",\"/properties/1743571532583/1743571549052-WhatsApp%20Image%202023-01-21%20at%2012.01.57.jpg\",\"/properties/1743571532583/1743571549058-WhatsApp%20Image%202023-01-21%20at%2012.01.58%20(1).jpg\",\"/properties/1743571532583/1743571549064-WhatsApp%20Image%202023-01-21%20at%2012.01.58.jpg\"]', '{\"0\":\"Security\",\"1\":\"Air Conditioning\",\"2\":\"Garden\",\"3\":\"Parking\",\"4\":\"Balcony\",\"5\":\"Pet Friendly\",\"6\":\"Storage\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":false,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"f2373da1cf7e4798adffdbc0de44ca2f\",\"neighborhood\":\"516e182922534ffeac89d3ea448b6b61\"}}}', 'AVAILABLE', '2025-04-02 07:25:49.206', '2025-04-02 07:25:52.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm90zq08ckh563', '3 Bedroom Maisonettes Master Ensuite with SQ', ' SELLING PRICE\r\n💰 Kes. 14.5M for cash\r\n💰 Kes. 14.8M for mortgage\r\n⚪All bedrooms ensuite \r\n⚪Spacious living area opening to the garden \r\n⚪Dining area\r\n⚪Spacious kitchen\r\n⚪Pantry \r\n⚪Laundry area\r\n⚪Well lit spacious rooms\r\n⚪Parking for 2 cars \r\n⚪Garden \r\n⚪Terrace on the first floor\r\n⚪Solar water heater\r\n⚪Gated community of 20 units\r\n⚪Amazing views of the Ngong hills \r\n⚪200m off tarmac\r\nCustomization of tiles, kitchen cabinets and wardrobes MDF, granite, and interior paint color are chosen by the client from our standard variety of finishes. Kindly note that additional customizations are done at clients\' costs.                                      📩 Contact Us Today!\r\n📞 Call/WhatsApp: 0702225547', 14500000, 'Cash and Mortgage', 'TOWNHOUSES', 'sale', 'Kibiko, Ngong Town, Kajiado', 3, 3, 215.00, 2025.00, '[\"/properties/1743662640415/1743662650823-4.jpg\",\"/properties/1743662640415/1743662650828-1.jpg\",\"/properties/1743662640415/1743662650832-2.jpg\",\"/properties/1743662640415/1743662650835-3.jpg\",\"/properties/1743662640415/1743662650839-5.jpg\",\"/properties/1743662640415/1743662650844-6.jpg\",\"/properties/1743662640415/1743662650848-7.jpg\",\"/properties/1743662640415/1743662650853-8.jpg\",\"/properties/1743662640415/1743662650857-9.jpg\",\"/properties/1743662640415/1743662650862-10.jpg\",\"/properties/1743662640415/1743662650868-11.jpg\",\"/properties/1743662640415/1743662650873-12.jpg\",\"/properties/1743662640415/1743662650879-13.jpg\",\"/properties/1743662640415/1743662650884-14.jpg\",\"/properties/1743662640415/1743662650887-15.jpg\",\"/properties/1743662640415/1743662650892-16.jpg\",\"/properties/1743662640415/1743662650896-17.jpg\",\"/properties/1743662640415/1743662650899-18.jpg\",\"/properties/1743662640415/1743662650903-19.jpg\"]', '{\"0\":\"Security\",\"1\":\"Garden\",\"2\":\"Parking\",\"3\":\"Balcony\",\"4\":\"Pet Friendly\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":false,\"paymentTerms\":\"Cash and Mortgage\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"dd301db3d91c4b7189ae6c3bff92cd70\",\"neighborhood\":\"52df8590c163443da548be5004182950\"}}}', 'AVAILABLE', '2025-04-03 08:44:11.054', '2025-04-07 10:58:12.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm985sb6mo4lkp', '4 - Bedroom Maisonettes plus DSQ ', 'Spacious Kitchen with Pantry.\r\n Front and Rear Wall Sliding Doors.\r\n Sunken Lounge\r\n Spacious Car Parking Space.\r\n Solar Water Heater.\r\n Large Master Bedroom with walk in closet.\r\n Laundry Area.\r\n Roof-top Terrace.\r\nEstate Common Amenities:\r\n Gated Community, secured by a Perimeter Wall, 2 Manned Gates & CCTV.\r\n Solar Street Lighting.\r\n Green Spaces.\r\n Reliable Borehole and County Water Supply.\r\n Internal Cabro Driveways\r\n Ample Parking Spaces.\r\n Kids Play Ground.\r\nThe Estate Features Marra Houses:\r\n Marra\r\n260sqm 4-Bedroom All Ensuite plus DSQ at Kes. 13.5M\r\nPayment Options:\r\n Cash Payment\r\n Flexible Payment/Milestone Based\r\n Mortgage Financing\r\n For More Details Contact: 0702225547 \r\n', 40000, 'Cash', 'BUNGALOWS', 'rent', 'Kimalat, Kitengela, Kajiado', 4, 4, 190.00, 2025.00, '[\"/properties/1744096096459/1744096099282-419858506_2555851214582297_6483186260045044897_n.jpg\",\"/properties/1744096096459/1744096099292-419817125_2555851194582299_8391772278064847444_n.jpg\",\"/properties/1744096096459/1744096099298-419858729_2555851381248947_5240822540078630040_n.jpg\",\"/properties/1744096096459/1744096099304-419858798_2555851351248950_2636622102842530972_n.jpg\",\"/properties/1744096096459/1744096099309-419861914_2555851164582302_2759823768914579507_n.jpg\"]', '{\"0\":\"Security\",\"1\":\"Air Conditioning\",\"2\":\"Storage\",\"3\":\"Parking\",\"4\":\"Garden\",\"5\":\"Pet Friendly\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":true,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"f2373da1cf7e4798adffdbc0de44ca2f\",\"neighborhood\":\"4156a76bc11f477f97128691d5cc0b37\"}}}', 'AVAILABLE', '2025-04-08 09:08:19.488', '2025-04-08 09:10:21.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmm9865hez61x28', '4 Bedroom Townhouse with Ensuite Bedrooms', '• En-suite bedrooms \r\n• Garden \r\n• 2 kitchen fitted with oven, microwave and cooker \r\n• Pantry\r\n• Sq\r\n• Family room\r\n• Lounge Dinning \r\n• Study \r\n• Guest cloak room\r\n• Front garden \r\n• 3 car parkings\r\nAsking 70M\r\nFor viewing call 0702225547\r\n', 15000, 'Cash', 'TOWNHOUSES', 'airbnb', 'Kitengela CBD, Kitengela, Kajiado', 4, 4, 190.00, 2025.00, '[\"/properties/1744096710533/1744096713825-416872132_2678574158964672_1155133583554784082_n.jpg\",\"/properties/1744096710533/1744096713831-415725232_2678574195631335_6182684056106713369_n.jpg\",\"/properties/1744096710533/1744096713834-416871996_2678574088964679_8624720816119933158_n.jpg\",\"/properties/1744096710533/1744096713837-416872643_2678574402297981_5161555391936702417_n.jpg\",\"/properties/1744096710533/1744096713841-416876563_2678574288964659_2668225954941512845_n.jpg\",\"/properties/1744096710533/1744096713846-416876627_2678574112298010_5842965222937609207_n.jpg\",\"/properties/1744096710533/1744096713850-416902301_2678574262297995_8884090654256143966_n.jpg\",\"/properties/1744096710533/1744096713854-416913305_2678574362297985_7560426213698044571_n.jpg\",\"/properties/1744096710533/1744096713858-416913351_2678574232297998_7023178020778937307_n.jpg\",\"/properties/1744096710533/1744096713862-417223311_2678574322297989_3494214467519927708_n.jpg\"]', '{\"0\":\"Security\",\"1\":\"Storage\",\"2\":\"Garden\",\"3\":\"Parking\",\"4\":\"Balcony\",\"5\":\"Pet Friendly\",\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"sqft\",\"negotiable\":true,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"f2373da1cf7e4798adffdbc0de44ca2f\",\"neighborhood\":\"e756aa3467ad4a7ba8bfc9d4b93ca885\"}}}', 'AVAILABLE', '2025-04-08 09:18:34.093', '2025-04-08 09:20:52.000', '83c907f66fb74285b5bd224e31cae0fe', 1),
('cmmb7gq3efxzong', 'Test', 'Test', 9995000, 'Cash', 'HOUSES', 'sale', 'Milimani, Kitengela, Kajiado', 1, 1, 1000.00, 2025.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"f2373da1cf7e4798adffdbc0de44ca2f\",\"neighborhood\":\"632974bb6a93440eb9a39ecaa0024eca\"}}}', 'AVAILABLE', '2025-05-28 07:46:10.000', '2025-05-28 07:46:10.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmmb7he9v4y0r2h', 'Test', 'Test', 1000000, 'Mortgage', 'BUNGALOWS', 'sale', 'Mlolongo, Machakos', 1, 1, 1000.00, 2025.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Mortgage\",\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-05-28 08:04:58.000', '2025-05-28 08:04:58.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmmb7hyry95nf2h', 'Test', 'Test', 999994, 'Mortgage', 'HOUSES', 'sale', 'Mlolongo, Machakos', 1, 1, 10000.00, 2025.00, '[]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Mortgage\",\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-05-28 08:20:55.000', '2025-05-28 08:20:55.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmmb7ivpx2ydoed', 'Test', 'Test', 999994, 'Mortgage', 'TOWNHOUSES', 'sale', 'Mlolongo, Machakos', 1, 1, 10000.00, 2025.00, '[\"/properties/1748411177693/1748411182487-shulenet poster3.png\",\"/properties/1748411177693/1748411185021-shulenet poster3.png\",\"/properties/1748411177693/1748411187592-shulenet poster.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Mortgage\",\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-05-28 08:46:32.000', '2025-05-28 08:46:32.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmmb7iz0wt2qpo2', 'Test', 'test', 1000000, 'Mortgage', 'HOUSES', 'sale', 'Kisaju, Kajiado', 1, 1, 1000.00, 2025.00, '[\"/properties/1748411341518/1748411343817-shulenet poster3.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Mortgage\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"4bb874b2b9904550aa21410a94e428ea\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-05-28 08:49:06.000', '2025-05-28 08:49:06.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmmb7j6qwiculbq', 'test', 'test', 1000000, 'Mortgage', 'PENTHOUSES', 'sale', 'Kisaju, Kajiado', 1, 1, 1000.00, 2025.00, '[\"/properties/1748411699758/1748411704509-pexels-photo-106399.jpeg\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Mortgage\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"4bb874b2b9904550aa21410a94e428ea\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-05-28 08:55:06.000', '2025-05-28 08:55:06.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmmb7jl3stmi7xt', 'test', 'test', 999994, 'Mortgage', 'RESIDENTIAL_PLOTS', 'sale', 'Kitengela, Kajiado', 1, 1, 100.00, 2025.00, '[\"/properties/1748412342093/1748412349694-shulenet poster3.png\",\"/properties/1748412342093/1748412352243-shulenet poster.png\",\"/properties/1748412342093/1748412355131-DREAMZ1.png\",\"/properties/1748412342093/1748412358458-ChatGPT Image May 23, 2025, 04_56_58 PM.png\",\"/properties/1748412342093/1748412361691-ChatGPT Image May 21, 2025, 01_26_16 PM.png\",\"/properties/1748412342093/1748412364326-ChatGPT Image May 21, 2025, 01_20_13 PM.png\",\"/properties/1748412342093/1748412366991-ChatGPT Image May 6, 2025, 07_13_33 AM.png\",\"/properties/1748412342093/1748412369505-ChatGPT Image May 5, 2025, 12_52_32 AM.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Mortgage\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"f2373da1cf7e4798adffdbc0de44ca2f\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-05-28 09:06:16.000', '2025-05-28 09:06:16.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmmb7jwod10yvc4', 'test', 'test', 10000000, NULL, 'PENTHOUSES', 'sale', 'Mlolongo, Machakos', 1, 1, 1000.00, 2025.00, '[\"/properties/1748412893114/1748412899176-ChatGPT Image May 23, 2025, 04_56_58 PM.png\",\"/properties/1748412893114/1748412903005-ChatGPT Image May 21, 2025, 01_26_16 PM.png\",\"/properties/1748412893114/1748412907178-ChatGPT Image May 21, 2025, 01_20_13 PM.png\",\"/properties/1748412893114/1748412909630-ChatGPT Image May 6, 2025, 07_13_33 AM.png\",\"/properties/1748412893114/1748412912132-ChatGPT Image May 5, 2025, 12_52_32 AM.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":null,\"address\":\"\",\"locationIds\":{\"county\":\"efde730d59f24f538a7829905438c43b\",\"city\":\"215833e764aa48758cb8f6a7fcf60c6a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-05-28 09:15:16.000', '2025-05-28 09:15:16.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmmb7kg1pl3x6yd', 'test', 'test', 999994, 'Installments', 'DUPLEX', 'sale', 'Kiserian, Kajiado', 1, 1, 1900.00, 2025.00, '[\"/properties/1748413790266/1748413797158-ChatGPT Image May 23, 2025, 04_58_13 PM.png\",\"/properties/1748413790266/1748413800574-ChatGPT Image May 23, 2025, 04_56_58 PM.png\",\"/properties/1748413790266/1748413804569-ChatGPT Image May 21, 2025, 01_26_16 PM.png\",\"/properties/1748413790266/1748413807342-ChatGPT Image May 21, 2025, 01_20_13 PM.png\",\"/properties/1748413790266/1748413809713-ChatGPT Image May 6, 2025, 07_13_33 AM.png\",\"/properties/1748413790266/1748413813045-ChatGPT Image May 5, 2025, 12_52_32 AM.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Installments\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"e76fc397a7be4d838ee25607386ea40a\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-05-28 09:30:20.000', '2025-05-28 09:30:20.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmmb7lk147p718l', 'Test', 'Test', 1000000, 'Cash', 'PENTHOUSES', 'sale', 'Ngong Town, Kajiado', 1, 1, 100.00, 2025.00, '[\"/properties/1748415658450/1748415665635-ChatGPT Image May 23, 2025, 04_56_58 PM.png\",\"/properties/1748415658450/1748415669036-ChatGPT Image May 23, 2025, 04_58_13 PM.png\",\"/properties/1748415658450/1748415672535-ChatGPT Image May 21, 2025, 01_26_16 PM.png\",\"/properties/1748415658450/1748415675004-ChatGPT Image May 21, 2025, 01_20_13 PM.png\",\"/properties/1748415658450/1748415677559-ChatGPT Image May 6, 2025, 07_13_33 AM.png\",\"/properties/1748415658450/1748415680227-ChatGPT Image May 5, 2025, 12_52_32 AM.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Cash\",\"address\":\"\",\"locationIds\":{\"county\":\"a42c882e12054efeb23417692e3e4e51\",\"city\":\"dd301db3d91c4b7189ae6c3bff92cd70\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-05-28 10:01:25.000', '2025-05-28 10:01:25.000', 'cm6yzj5vy0000u628zv6wkeom', 0),
('cmmb7mo4bj9c2lg', 'Test', 'Test', 9999500, 'Mortgage', 'PENTHOUSES', 'sale', 'Kiambu, Nairobi', 1, 1, 1000.00, 2025.00, '[\"/properties/1748417527610/1748417536060-ChatGPT Image May 23, 2025, 04_58_13 PM.png\",\"/properties/1748417527610/1748417539409-ChatGPT Image May 23, 2025, 04_56_58 PM.png\",\"/properties/1748417527610/1748417542924-ChatGPT Image May 21, 2025, 01_26_16 PM.png\",\"/properties/1748417527610/1748417545592-ChatGPT Image May 21, 2025, 01_20_13 PM.png\",\"/properties/1748417527610/1748417548120-ChatGPT Image May 6, 2025, 07_13_33 AM.png\",\"/properties/1748417527610/1748417552041-ChatGPT Image May 5, 2025, 12_52_32 AM.png\"]', '{\"metadata\":{\"yearBuilt\":2025,\"priceUnit\":\"total\",\"negotiable\":false,\"paymentTerms\":\"Mortgage\",\"address\":\"\",\"locationIds\":{\"county\":\"cm6yvzh1u0000u62sqfhq8oqy\",\"city\":\"8ea463b13f484aa8beb4f72cce933380\",\"neighborhood\":null}}}', 'AVAILABLE', '2025-05-28 10:32:35.000', '2025-05-28 10:32:36.000', 'cm6yzj5vy0000u628zv6wkeom', 0);

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
('7d1a502b6b754f47836521cb0cadec09', 'VectorAfriq KE', 'vectorafriqproperties1847@gmail.com', NULL, NULL, '$2a$10$wyVi760IrDSn6445hCd1N.Ma748Iy0X0Ix3m0cdHegYHnYJMjrqFW', 'ADMIN', '2025-03-25 17:45:41.000', '2025-03-25 17:45:41.000', NULL, NULL, NULL, NULL, NULL, NULL),
('83c907f66fb74285b5bd224e31cae0fe', 'kevie langat', 'kevinlangat1998@gmail.com', NULL, NULL, '$2a$10$IATPxmc8ZnIzVw6AjYKimeq/rMB4Cg04NVpsTJCNiz8H2tfxwqpJi', 'ADMIN', '2025-03-25 12:28:18.000', '2025-03-25 12:28:18.000', NULL, NULL, NULL, NULL, NULL, NULL),
('91cd9e824aa545fd8e2ed154c026e13d', 'Test Account', 'test@gmail.com', NULL, NULL, '$2a$10$SZsrvQG1sDg7CHuZU2EI...dc/Xa2tFIEPZlmm6vMbqbz28ZPV/7G', 'USER', '2025-03-25 09:09:40.000', '2025-03-25 09:09:40.000', NULL, NULL, NULL, NULL, NULL, NULL),
('c7b158b7f0734d1a8d4de8031eeda1b6', 'Alvin Warui', 'alvin@gmail.com', NULL, NULL, '$2a$10$KG7A.t24unYwKVrMf8jq5eTJqa.Ap.1oe.ejbtnjuUrlmOFn9KnFi', 'USER', '2025-03-12 11:28:46.000', '2025-03-12 11:28:46.000', NULL, NULL, NULL, NULL, NULL, NULL),
('cm6yzj5vy0000u628zv6wkeom', 'Mark Muema', 'manlikemaingi@gmail.com', NULL, NULL, '$2a$10$eKtigUQCn9OZoAl9S8DxcuslwlKAAUmRjtWcKbDbLQMB6iFbaP4r2', 'ADMIN', '2025-02-10 11:43:54.765', '2025-05-09 07:30:50.000', '0112246573', 'This is me', 'profiles/cm6yzj5vy0000u628zv6wkeom/1746763107929-pexels-photo-106399.jpeg', '[]', '[]', '{}');

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
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `messages_propertyId_idx` (`propertyId`),
  ADD KEY `messages_status_idx` (`status`),
  ADD KEY `messages_createdAt_idx` (`createdAt`);

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
-- Indexes for table `partner`
--
ALTER TABLE `partner`
  ADD PRIMARY KEY (`id`);

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
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_property` FOREIGN KEY (`propertyId`) REFERENCES `property` (`id`) ON DELETE CASCADE;

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
