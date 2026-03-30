-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 16, 2026 at 03:12 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `faculty_evaluation_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `faculty_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text NOT NULL,
  `sentiment` enum('positive','neutral','negative') NOT NULL,
  `sentiment_score` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluations`
--

INSERT INTO `evaluations` (`id`, `student_id`, `faculty_id`, `rating`, `comment`, `sentiment`, `sentiment_score`, `created_at`) VALUES
(1, 4, 1, 5, 'The professor explains concepts clearly and is very approachable.', 'positive', 3.00, '2026-03-14 05:03:09'),
(2, 4, 2, 4, 'Good lectures but sometimes the pace is too fast.', 'neutral', 1.00, '2026-03-14 05:03:09'),
(3, 5, 1, 5, 'Very helpful and supportive teacher. Best professor I have had.', 'positive', 5.00, '2026-03-14 05:03:09'),
(4, 5, 2, 3, 'The lectures are boring and hard to understand sometimes.', 'negative', -3.00, '2026-03-14 05:03:09'),
(5, 4, 1, 4, 'Great teaching style, uses real world examples.', 'positive', 2.00, '2026-03-14 05:03:09'),
(6, 5, 1, 3, 'Decent but could improve on pacing and clarity.', 'neutral', 0.00, '2026-03-14 05:03:09'),
(7, 4, 2, 4, 'good', 'positive', 3.00, '2026-03-14 05:07:55'),
(8, 4, 1, 5, 'The professor explains concepts clearly and is very approachable.', 'positive', 3.00, '2026-03-15 03:15:06'),
(9, 4, 2, 4, 'Good lectures but sometimes the pace is too fast.', 'neutral', 1.00, '2026-03-15 03:15:06'),
(10, 5, 1, 5, 'Very helpful and supportive teacher. Best professor I have had.', 'positive', 5.00, '2026-03-15 03:15:06'),
(11, 5, 2, 3, 'The lectures are boring and hard to understand sometimes.', 'negative', -3.00, '2026-03-15 03:15:06'),
(12, 4, 1, 4, 'Great teaching style, uses real world examples.', 'positive', 2.00, '2026-03-15 03:15:06'),
(13, 5, 1, 3, 'Decent but could improve on pacing and clarity.', 'neutral', 0.00, '2026-03-15 03:15:06');

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_questions`
--

CREATE TABLE `evaluation_questions` (
  `id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `question` text NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluation_questions`
--

INSERT INTO `evaluation_questions` (`id`, `category`, `question`, `sort_order`, `is_active`, `created_at`) VALUES
(1, 'Teaching Quality', 'The instructor explains concepts clearly and effectively.', 1, 1, '2026-03-15 03:14:42'),
(2, 'Teaching Quality', 'The instructor is well-prepared for each class session.', 2, 1, '2026-03-15 03:14:42'),
(3, 'Teaching Quality', 'The instructor uses relevant examples to illustrate key points.', 3, 1, '2026-03-15 03:14:42'),
(4, 'Communication', 'The instructor encourages student participation and questions.', 4, 1, '2026-03-15 03:14:42'),
(5, 'Communication', 'The instructor is approachable and available for consultation.', 5, 1, '2026-03-15 03:14:42'),
(6, 'Communication', 'The instructor provides clear and constructive feedback.', 6, 1, '2026-03-15 03:14:42'),
(7, 'Course Management', 'The course materials and resources are adequate and helpful.', 7, 1, '2026-03-15 03:14:42'),
(8, 'Course Management', 'The instructor manages class time effectively.', 8, 1, '2026-03-15 03:14:42'),
(9, 'Course Management', 'The grading criteria and policies are fair and transparent.', 9, 1, '2026-03-15 03:14:42'),
(10, 'Professionalism', 'The instructor demonstrates respect for students.', 10, 1, '2026-03-15 03:14:42'),
(11, 'Teaching Quality', 'The instructor explains concepts clearly and effectively.', 1, 1, '2026-03-15 03:15:06'),
(12, 'Teaching Quality', 'The instructor is well-prepared for each class session.', 2, 1, '2026-03-15 03:15:06'),
(13, 'Teaching Quality', 'The instructor uses relevant examples to illustrate key points.', 3, 1, '2026-03-15 03:15:06'),
(14, 'Communication', 'The instructor encourages student participation and questions.', 4, 1, '2026-03-15 03:15:06'),
(15, 'Communication', 'The instructor is approachable and available for consultation.', 5, 1, '2026-03-15 03:15:06'),
(16, 'Communication', 'The instructor provides clear and constructive feedback.', 6, 1, '2026-03-15 03:15:06'),
(17, 'Course Management', 'The course materials and resources are adequate and helpful.', 7, 1, '2026-03-15 03:15:06'),
(18, 'Course Management', 'The instructor manages class time effectively.', 8, 1, '2026-03-15 03:15:06'),
(19, 'Course Management', 'The grading criteria and policies are fair and transparent.', 9, 1, '2026-03-15 03:15:06'),
(20, 'Professionalism', 'The instructor demonstrates respect for students.', 10, 1, '2026-03-15 03:15:06');

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_responses`
--

CREATE TABLE `evaluation_responses` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faculty`
--

CREATE TABLE `faculty` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faculty`
--

INSERT INTO `faculty` (`id`, `user_id`, `name`, `department`, `created_at`, `updated_at`) VALUES
(1, 2, 'Dr. Maria Santos', 'Computer Science', '2026-03-14 05:03:09', '2026-03-14 05:03:09'),
(2, 3, 'Prof. Juan Dela Cruz', 'Information Technology', '2026-03-14 05:03:09', '2026-03-14 05:03:09'),
(3, 2, 'Dr. Maria Santos', 'Computer Science', '2026-03-15 03:15:06', '2026-03-15 03:15:06'),
(4, 3, 'Prof. Juan Dela Cruz', 'Information Technology', '2026-03-15 03:15:06', '2026-03-15 03:15:06');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','faculty','student') NOT NULL DEFAULT 'student',
  `year_level` varchar(20) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `year_level`, `section`, `department`, `email_verified`, `verification_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin User', 'admin@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', 'admin', NULL, NULL, NULL, 1, NULL, '2026-03-14 05:03:09', '2026-03-15 12:54:27'),
(2, 'Dr. Maria Santos', 'maria@fefas.com', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', 'faculty', NULL, NULL, NULL, 1, NULL, '2026-03-14 05:03:09', '2026-03-14 05:03:09'),
(3, 'Prof. Juan Dela Cruz', 'juan@fefas.com', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', 'faculty', NULL, NULL, NULL, 1, NULL, '2026-03-14 05:03:09', '2026-03-14 05:03:09'),
(4, 'Student One', 'student1@fefas.com', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', 'student', NULL, NULL, NULL, 1, NULL, '2026-03-14 05:03:09', '2026-03-14 05:03:09'),
(5, 'Student Two', 'student2@fefas.com', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', 'student', NULL, NULL, NULL, 1, NULL, '2026-03-14 05:03:09', '2026-03-14 05:03:09'),
(11, 'mark', 'mark@psu.edu.ph', '$2a$10$AcVyHRtL2ZpxLmHnynR1f.kuzJW.gPVwo/ZKuCUQHCBiJPp897u7G', 'student', '4th Year', '2-b', 'Information Technology', 0, '339b1e718b653b9684329edb9900b32d49477f6a3f2966994ebac2082b7dc947', '2026-03-15 03:45:05', '2026-03-15 03:45:05'),
(13, 'jordan dave caparas', 'jcaparas_21ur0195@psu.edu.ph', '$2a$10$tz82wbJpCAf22BN1fGVisOM2LmGY8TkjFxezRqHDX4lBTPg/Yjjr2', 'student', '4th Year', '4-B', 'Information Technology', 1, NULL, '2026-03-15 04:01:06', '2026-03-15 04:03:24'),
(14, 'Junard', 'jchua@psu.edu.ph', '$2a$10$zNlpXFZKnjje.a3/R44iEOCbJzoexBb7qwv5nz3FLMl2ydD0.VmE.', 'student', '4th Year', '0', 'Information Technology', 1, 'b46dd6d7fbcf811a2c2756c01b791cc568cc8fc9a4b6c8072ef69fc8ec3cfec5', '2026-03-15 13:14:30', '2026-03-15 13:16:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `faculty_id` (`faculty_id`);

--
-- Indexes for table `evaluation_questions`
--
ALTER TABLE `evaluation_questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `evaluation_responses`
--
ALTER TABLE `evaluation_responses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluation_id` (`evaluation_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `faculty`
--
ALTER TABLE `faculty`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `evaluation_questions`
--
ALTER TABLE `evaluation_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `evaluation_responses`
--
ALTER TABLE `evaluation_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `faculty`
--
ALTER TABLE `faculty`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluations_ibfk_2` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluation_responses`
--
ALTER TABLE `evaluation_responses`
  ADD CONSTRAINT `evaluation_responses_ibfk_1` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluation_responses_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `evaluation_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `faculty`
--
ALTER TABLE `faculty`
  ADD CONSTRAINT `faculty_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
