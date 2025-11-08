-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 08, 2025 at 06:22 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `callmaker_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `signals`
--

CREATE TABLE `signals` (
  `id` int(11) NOT NULL,
  `coin_name` varchar(50) NOT NULL,
  `entry_price` float NOT NULL,
  `target_price` float NOT NULL,
  `stop_loss` float NOT NULL,
  `note` text DEFAULT NULL,
  `chart_image` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `signals`
--

INSERT INTO `signals` (`id`, `coin_name`, `entry_price`, `target_price`, `stop_loss`, `note`, `chart_image`, `status`, `created_by`, `created_at`) VALUES
(1, 'BTC/USDT', 42500.5, 43800, 41800, 'Bullish breakout expected after consolidation', NULL, 'approved', 5, '2025-11-02 07:49:04'),
(2, 'ETH/USDT', 2250.75, 2350, 2180, 'Strong support at 2200, targeting resistance', NULL, 'approved', 5, '2025-11-02 07:49:04'),
(3, 'ADA/USDT', 0.485, 0.52, 0.465, 'Potential 8% gain from current levels', NULL, 'pending', 5, '2025-11-02 07:49:04'),
(4, 'SOL/USDT', 98.5, 105, 92, 'Breaking key resistance level', NULL, 'rejected', 5, '2025-11-02 07:49:04'),
(5, 'XRP/USDT', 0.625, 0.68, 0.59, 'Legal clarity driving momentum', NULL, 'approved', 6, '2025-11-02 07:49:04'),
(6, 'BTC/USDT', 42500.5, 43800, 41800, 'Bullish breakout expected after consolidation', NULL, 'approved', NULL, '2025-11-02 07:58:36'),
(7, 'ETH/USDT', 2250.75, 2350, 2180, 'Strong support at 2200, targeting resistance', NULL, 'approved', NULL, '2025-11-02 07:58:36'),
(8, 'ADA/USDT', 0.485, 0.52, 0.465, 'Potential 8% gain from current levels', NULL, 'pending', NULL, '2025-11-02 07:58:36'),
(9, 'SOL/USDT', 98.5, 105, 92, 'Breaking key resistance level', NULL, 'rejected', NULL, '2025-11-02 07:58:36'),
(10, 'XRP/USDT', 0.625, 0.68, 0.59, 'Legal clarity driving momentum', NULL, 'approved', NULL, '2025-11-02 07:58:36'),
(12, 'ETH/USDT', 2250.75, 2350, 2180, 'Strong support at 2200, targeting resistance', NULL, 'approved', NULL, '2025-11-02 07:59:07'),
(13, 'ADA/USDT', 0.485, 0.52, 0.465, 'Potential 8% gain from current levels', NULL, 'approved', NULL, '2025-11-02 07:59:07'),
(14, 'SOL/USDT', 98.5, 105, 92, 'Breaking key resistance level', NULL, 'rejected', NULL, '2025-11-02 07:59:07'),
(15, 'XRP/USDT', 0.625, 0.68, 0.59, 'Legal clarity driving momentum', NULL, 'approved', NULL, '2025-11-02 07:59:07'),
(16, 'BTC/USDT', 1, 2, 0.5, '', NULL, 'rejected', 5, '2025-11-02 12:44:12'),
(17, 'ETH/USDT', 300, 310, 290, 'gass', NULL, 'approved', 5, '2025-11-03 01:57:44');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','callmaker','user') DEFAULT 'user',
  `fullname` varchar(100) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `fullname`, `createdAt`, `updatedAt`) VALUES
(1, 'testuser', '$2b$10$kZ.kvaQwQKQwzFU.AyZvs.6t.T08E6B7XYvgo4qE0n2Qne2w4Y45S', 'user', 'Test User', '2025-11-01 09:15:24', '2025-11-01 09:15:24'),
(2, 'admin', '$2b$10$aUQU9kg8b5po/w8lQIF9musuJfboakuQjp0tkpDc5t3yhkbQIfkXS', 'admin', 'Administrator', '2025-11-01 16:18:18', '2025-11-01 16:18:18'),
(3, 'callmaker1', '$2b$10$lZKfDoVXFjeulkfMRCNe1uYKrSdXT6BnYYpMhZoVI0yUlrV9idkpG', 'user', 'Callmaker One', '2025-11-02 07:47:00', '2025-11-02 07:47:00'),
(4, 'trader_user', '$2b$10$UAoL677EzSdr9K8.1uOs.eO/nlf3WAR3PDM.ivlxuD/nXxP6sw8EK', 'user', 'Trader User', '2025-11-02 07:49:04', '2025-11-02 07:49:04'),
(5, 'pro_callmaker', '$2b$10$AwAfaxn9ERZ11/pD4iBEQuRdfu/DOQzD1t9nZlkPMfmT6Buv3sEHu', 'callmaker', 'Professional Callmaker', '2025-11-02 07:49:04', '2025-11-02 07:49:04'),
(6, 'system_admin', '$2b$10$.zFTqDPFJC8B87vJMPywE.FAW5GAtmGyCs9/XX3XXdzoK/mmuYIMW', 'admin', 'System Administrator', '2025-11-02 07:49:04', '2025-11-02 07:49:04');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `signals`
--
ALTER TABLE `signals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `username_2` (`username`),
  ADD UNIQUE KEY `username_3` (`username`),
  ADD UNIQUE KEY `username_4` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `signals`
--
ALTER TABLE `signals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `signals`
--
ALTER TABLE `signals`
  ADD CONSTRAINT `signals_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
