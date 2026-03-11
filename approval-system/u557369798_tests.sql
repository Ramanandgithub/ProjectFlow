-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 11, 2026 at 08:57 AM
-- Server version: 11.8.3-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u557369798_tests`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`u557369798_tests`@`127.0.0.1` PROCEDURE `sp_approve_project` (IN `p_project_id` BIGINT UNSIGNED, IN `p_admin_id` BIGINT UNSIGNED, IN `p_reason` TEXT)   BEGIN
    DECLARE v_project_exists INT DEFAULT 0;
    DECLARE v_current_status VARCHAR(20) DEFAULT '';
    DECLARE v_success        BOOLEAN DEFAULT FALSE;
    DECLARE v_message        VARCHAR(255) DEFAULT '';

    -- Error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT FALSE AS success, 'Database error occurred during approval.' AS message;
    END;

    START TRANSACTION;

    -- Check project exists
    SELECT COUNT(*), status
    INTO v_project_exists, v_current_status
    FROM projects
    WHERE id = p_project_id;

    IF v_project_exists = 0 THEN
        SET v_message = 'Project not found.';
        ROLLBACK;
    ELSEIF v_current_status = 'approved' THEN
        SET v_message = 'Project is already approved.';
        ROLLBACK;
    ELSE
        -- Update project status to approved
        UPDATE projects
        SET
            status     = 'approved',
            updated_at = NOW()
        WHERE id = p_project_id;

        -- Create approval record
        INSERT INTO approvals (project_id, admin_id, decision, reason, decided_at, created_at, updated_at)
        VALUES (p_project_id, p_admin_id, 'approved', p_reason, NOW(), NOW(), NOW());

        -- Log to audit_logs
        INSERT INTO audit_logs (user_id, project_id, action, notes, ip_address, performed_at, created_at, updated_at)
        VALUES (p_admin_id, p_project_id, 'approved', CONCAT('Project approved by admin ID: ', p_admin_id, '. Reason: ', IFNULL(p_reason, 'No reason provided')), NULL, NOW(), NOW(), NOW());

        SET v_success = TRUE;
        SET v_message = 'Project approved successfully.';
        COMMIT;
    END IF;

    SELECT v_success AS success, v_message AS message;
END$$

CREATE DEFINER=`u557369798_tests`@`127.0.0.1` PROCEDURE `sp_reject_project` (IN `p_project_id` BIGINT UNSIGNED, IN `p_admin_id` BIGINT UNSIGNED, IN `p_reason` TEXT)   BEGIN
    DECLARE v_project_exists INT DEFAULT 0;
    DECLARE v_current_status VARCHAR(20) DEFAULT '';
    DECLARE v_success        BOOLEAN DEFAULT FALSE;
    DECLARE v_message        VARCHAR(255) DEFAULT '';

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT FALSE AS success, 'Database error occurred during rejection.' AS message;
    END;

    START TRANSACTION;

    SELECT COUNT(*), status
    INTO v_project_exists, v_current_status
    FROM projects
    WHERE id = p_project_id;

    IF v_project_exists = 0 THEN
        SET v_message = 'Project not found.';
        ROLLBACK;
    ELSEIF v_current_status = 'rejected' THEN
        SET v_message = 'Project is already rejected.';
        ROLLBACK;
    ELSEIF p_reason IS NULL OR LENGTH(TRIM(p_reason)) = 0 THEN
        SET v_message = 'Rejection reason is required.';
        ROLLBACK;
    ELSE
        UPDATE projects
        SET
            status     = 'rejected',
            updated_at = NOW()
        WHERE id = p_project_id;

        INSERT INTO approvals (project_id, admin_id, decision, reason, decided_at, created_at, updated_at)
        VALUES (p_project_id, p_admin_id, 'rejected', p_reason, NOW(), NOW(), NOW());

        INSERT INTO audit_logs (user_id, project_id, action, notes, ip_address, performed_at, created_at, updated_at)
        VALUES (p_admin_id, p_project_id, 'rejected', CONCAT('Project rejected by admin ID: ', p_admin_id, '. Reason: ', p_reason), NULL, NOW(), NOW(), NOW());

        SET v_success = TRUE;
        SET v_message = 'Project rejected successfully.';
        COMMIT;
    END IF;

    SELECT v_success AS success, v_message AS message;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `approvals`
--

CREATE TABLE `approvals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `decision` enum('approved','rejected') NOT NULL,
  `reason` text DEFAULT NULL,
  `decided_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `approvals`
--

INSERT INTO `approvals` (`id`, `project_id`, `admin_id`, `decision`, `reason`, `decided_at`, `created_at`, `updated_at`) VALUES
(1, 10, 1, 'approved', 'Approved by administrator.', '2026-03-11 07:52:20', '2026-03-11 07:52:20', '2026-03-11 07:52:20'),
(2, 11, 1, 'rejected', 'test rejects', '2026-03-11 07:52:49', '2026-03-11 07:52:49', '2026-03-11 07:52:49');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(255) NOT NULL,
  `notes` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `performed_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `project_id`, `action`, `notes`, `ip_address`, `performed_at`, `created_at`, `updated_at`) VALUES
(1, 5, 10, 'submitted', 'Project submitted by user.', '127.0.0.1', '2026-03-11 01:25:19', '2026-03-11 01:25:19', '2026-03-11 01:25:19'),
(2, 5, 11, 'submitted', 'Project submitted by user.', '127.0.0.1', '2026-03-11 01:33:18', '2026-03-11 01:33:18', '2026-03-11 01:33:18'),
(3, 1, 10, 'approved', 'Project approved by admin ID: 1. Reason: Approved by administrator.', NULL, '2026-03-11 07:52:20', '2026-03-11 07:52:20', '2026-03-11 07:52:20'),
(4, 1, 11, 'rejected', 'Project rejected by admin ID: 1. Reason: test rejects', NULL, '2026-03-11 07:52:49', '2026-03-11 07:52:49', '2026-03-11 07:52:49'),
(5, 6, 12, 'submitted', 'Project submitted by user.', '127.0.0.1', '2026-03-11 08:13:07', '2026-03-11 08:13:07', '2026-03-11 08:13:07');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`) VALUES
(1, 'default', '{\"uuid\":\"0caccd9a-09e9-4b58-9a60-1007506c95ee\",\"displayName\":\"App\\\\Jobs\\\\SendProjectNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":3,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":\"60\",\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"App\\\\Jobs\\\\SendProjectNotification\",\"command\":\"O:32:\\\"App\\\\Jobs\\\\SendProjectNotification\\\":3:{s:7:\\\"project\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:18:\\\"App\\\\Models\\\\Project\\\";s:2:\\\"id\\\";i:10;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:5:\\\"event\\\";s:9:\\\"submitted\\\";s:6:\\\"reason\\\";N;}\",\"batchId\":null},\"createdAt\":1773212119,\"delay\":null}', 0, NULL, 1773212119, 1773212119),
(2, 'default', '{\"uuid\":\"86882561-f4ec-499d-95fb-5b38725fe9f1\",\"displayName\":\"App\\\\Jobs\\\\SendProjectNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":3,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":\"60\",\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"App\\\\Jobs\\\\SendProjectNotification\",\"command\":\"O:32:\\\"App\\\\Jobs\\\\SendProjectNotification\\\":3:{s:7:\\\"project\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:18:\\\"App\\\\Models\\\\Project\\\";s:2:\\\"id\\\";i:11;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:5:\\\"event\\\";s:9:\\\"submitted\\\";s:6:\\\"reason\\\";N;}\",\"batchId\":null},\"createdAt\":1773212598,\"delay\":null}', 0, NULL, 1773212598, 1773212598),
(3, 'default', '{\"uuid\":\"ec32c89e-cda6-42a0-8159-8a3f207a1dd4\",\"displayName\":\"App\\\\Jobs\\\\SendProjectNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":3,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":\"60\",\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"App\\\\Jobs\\\\SendProjectNotification\",\"command\":\"O:32:\\\"App\\\\Jobs\\\\SendProjectNotification\\\":3:{s:7:\\\"project\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:18:\\\"App\\\\Models\\\\Project\\\";s:2:\\\"id\\\";i:10;s:9:\\\"relations\\\";a:3:{i:0;s:4:\\\"user\\\";i:1;s:14:\\\"latestApproval\\\";i:2;s:20:\\\"latestApproval.admin\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:5:\\\"event\\\";s:8:\\\"approved\\\";s:6:\\\"reason\\\";s:26:\\\"Approved by administrator.\\\";}\",\"batchId\":null},\"createdAt\":1773215541,\"delay\":null}', 0, NULL, 1773215541, 1773215541),
(4, 'default', '{\"uuid\":\"721e668a-80ad-43ec-85e5-a714f7d46e17\",\"displayName\":\"App\\\\Jobs\\\\SendProjectNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":3,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":\"60\",\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"App\\\\Jobs\\\\SendProjectNotification\",\"command\":\"O:32:\\\"App\\\\Jobs\\\\SendProjectNotification\\\":3:{s:7:\\\"project\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:18:\\\"App\\\\Models\\\\Project\\\";s:2:\\\"id\\\";i:11;s:9:\\\"relations\\\";a:3:{i:0;s:4:\\\"user\\\";i:1;s:14:\\\"latestApproval\\\";i:2;s:20:\\\"latestApproval.admin\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:5:\\\"event\\\";s:8:\\\"rejected\\\";s:6:\\\"reason\\\";s:12:\\\"test rejects\\\";}\",\"batchId\":null},\"createdAt\":1773215570,\"delay\":null}', 0, NULL, 1773215570, 1773215570),
(5, 'default', '{\"uuid\":\"ed6b5a72-3a09-4f20-91ca-9676c7c45426\",\"displayName\":\"App\\\\Jobs\\\\SendProjectNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":3,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":\"60\",\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"App\\\\Jobs\\\\SendProjectNotification\",\"command\":\"O:32:\\\"App\\\\Jobs\\\\SendProjectNotification\\\":3:{s:7:\\\"project\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:18:\\\"App\\\\Models\\\\Project\\\";s:2:\\\"id\\\";i:12;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:5:\\\"event\\\";s:9:\\\"submitted\\\";s:6:\\\"reason\\\";N;}\",\"batchId\":null},\"createdAt\":1773216787,\"delay\":null}', 0, NULL, 1773216787, 1773216787);

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_03_10_112906_create_personal_access_tokens_table', 1),
(5, '2026_03_10_115046_create_projects_table', 2),
(6, '2026_03_10_115046_create_audit_logs_table', 3),
(7, '2026_03_10_115046_create_approvals_table', 4);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(6, 'App\\Models\\User', 1, 'auth_token', '45c11e9669635cf55a9482f9a34d7af4c23e63fb6b382807d00c413df7cb57ba', '[\"*\"]', '2026-03-11 08:18:14', NULL, '2026-03-11 08:14:10', '2026-03-11 08:18:14');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`files`)),
  `submitted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `title`, `description`, `status`, `user_id`, `files`, `submitted_at`, `created_at`, `updated_at`) VALUES
(1, 'Project 1 by Abhishek', 'This is a sample project description for project 1. It contains important details about the project scope, objectives, and expected outcomes.', 'approved', 2, NULL, '2026-02-10 00:17:16', '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(2, 'Project 2 by Abhishek', 'This is a sample project description for project 2. It contains important details about the project scope, objectives, and expected outcomes.', 'rejected', 2, NULL, '2026-02-11 00:17:16', '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(3, 'Project 3 by Abhishek', 'This is a sample project description for project 3. It contains important details about the project scope, objectives, and expected outcomes.', 'approved', 2, NULL, '2026-02-10 00:17:16', '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(4, 'Project 1 by Boby', 'This is a sample project description for project 1. It contains important details about the project scope, objectives, and expected outcomes.', 'approved', 3, NULL, '2026-03-09 00:17:16', '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(5, 'Project 2 by Boby', 'This is a sample project description for project 2. It contains important details about the project scope, objectives, and expected outcomes.', 'rejected', 3, NULL, '2026-02-25 00:17:16', '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(6, 'Project 3 by Boby', 'This is a sample project description for project 3. It contains important details about the project scope, objectives, and expected outcomes.', 'approved', 3, NULL, '2026-02-16 00:17:16', '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(7, 'Project 1 by Karan', 'This is a sample project description for project 1. It contains important details about the project scope, objectives, and expected outcomes.', 'rejected', 4, NULL, '2026-02-13 00:17:16', '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(8, 'Project 2 by Karan', 'This is a sample project description for project 2. It contains important details about the project scope, objectives, and expected outcomes.', 'approved', 4, NULL, '2026-02-23 00:17:16', '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(9, 'Project 3 by Karan', 'This is a sample project description for project 3. It contains important details about the project scope, objectives, and expected outcomes.', 'approved', 4, NULL, '2026-02-27 00:17:16', '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(10, 'E-Commerce Plateform', 'This is the test E Comm Project', 'approved', 5, '[{\"path\":\"projects\\/5\\/cymBkrSjLhzq9RLBZRYyvY9YqtoIbLvPxCCW0dqJ.jpg\",\"original_name\":\"WhatsApp Image 2026-03-09 at 1.51.24 PM.jpeg\",\"size\":84271,\"mime_type\":\"image\\/jpeg\"}]', '2026-03-11 01:25:19', '2026-03-11 01:25:19', '2026-03-11 07:52:20'),
(11, 'Test Projetcs', 'this is a test projects', 'rejected', 5, '[{\"path\":\"projects\\/5\\/b7zIK8L6MY9E5bcBFV14LUA2BktsxkWZXFbBUcA2.jpg\",\"original_name\":\"WhatsApp Image 2026-03-09 at 1.51.24 PM.jpeg\",\"size\":84271,\"mime_type\":\"image\\/jpeg\"}]', '2026-03-11 01:33:18', '2026-03-11 01:33:18', '2026-03-11 07:52:49'),
(12, 'Aman Test Project', 'this is jhjn  gh hsj gsjg sh sgs ghgj g', 'pending', 6, '[{\"path\":\"projects\\/6\\/DpxCfW7EwZ12Kukh3EEDAaI97O0f1XflDrBHQnOc.jpg\",\"original_name\":\"WhatsApp Image 2026-03-09 at 1.51.24 PM.jpeg\",\"size\":84271,\"mime_type\":\"image\\/jpeg\"}]', '2026-03-11 08:13:07', '2026-03-11 08:13:07', '2026-03-11 08:13:07');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `avatar` varchar(255) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `avatar`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin User', 'admin@gmail.com', NULL, '$2y$12$hd02Kn9GavQTWRHPJgkJkOXWq.WqmvsO.zN/VGqytXMzQwsHYmbIu', 'admin', NULL, NULL, '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(2, 'Abhishek', 'abhishek@gmail.com', NULL, '$2y$12$.HDtxrvJl7qWRRa0s9oqGumEL4jORLnkwt1Zmp7Vh86tCpzRVsai6', 'user', NULL, NULL, '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(3, 'Boby', 'boby@gmail.com', NULL, '$2y$12$pzqcrdU2xeygT0F37BQz0eHbq5tgiUG2XlwGkjh6j5UEIbnk7T6g2', 'user', NULL, NULL, '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(4, 'Karan', 'karan@gmail.com', NULL, '$2y$12$vgHEb8qrBBmHKbCNiQZMNOISAxQc7eTe8uGwXYj393ms3w7GLlV9y', 'user', NULL, NULL, '2026-03-11 00:17:16', '2026-03-11 00:17:16'),
(5, 'Ramanand', 'ramanand@gmail.com', NULL, '$2y$12$l5B3sWL9FXf1gBL1e0kSfeB4SYYtx37Nf0qzzwAvXHnYyvMUC2EaK', 'user', NULL, NULL, '2026-03-11 00:24:37', '2026-03-11 00:24:37'),
(6, 'Aman', 'aman@gmail.com', NULL, '$2y$12$KUUTt3ZqNjnxtUnyDIIYFuv8BLayD.HVtR6eBELY7GeCXvDby6XJu', 'user', NULL, NULL, '2026-03-11 08:11:58', '2026-03-11 08:11:58');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approvals`
--
ALTER TABLE `approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approvals_admin_id_foreign` (`admin_id`),
  ADD KEY `approvals_project_id_admin_id_index` (`project_id`,`admin_id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_project_id_action_index` (`project_id`,`action`),
  ADD KEY `audit_logs_user_id_index` (`user_id`),
  ADD KEY `audit_logs_performed_at_index` (`performed_at`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projects_user_id_status_index` (`user_id`,`status`),
  ADD KEY `projects_status_index` (`status`),
  ADD KEY `projects_created_at_index` (`created_at`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `approvals`
--
ALTER TABLE `approvals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `approvals`
--
ALTER TABLE `approvals`
  ADD CONSTRAINT `approvals_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `approvals_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
