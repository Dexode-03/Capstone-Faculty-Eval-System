-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: May 01, 2026 at 02:06 PM
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
-- Database: `faculty_evaluation_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password`, `email_verified`, `verification_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin User', 'admin@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', 1, NULL, '2026-03-14 05:03:09', '2026-03-15 12:54:27');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `student_id_new` int(11) DEFAULT NULL,
  `faculty_id_new` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_questions`
--

CREATE TABLE `evaluation_questions` (
  `id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `question_type` enum('rating','text') NOT NULL DEFAULT 'rating',
  `category_description` text DEFAULT NULL,
  `question` text NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluation_questions`
--

INSERT INTO `evaluation_questions` (`id`, `category`, `question_type`, `category_description`, `question`, `sort_order`, `is_active`, `created_at`) VALUES
(1, 'A. Management of Teaching and Learning', 'rating', 'Management of Teaching and Learning refers to the intentional and organized handling of classroom presence, clear communication of academic expectations, efficient use of time, and the purpose use of student-centered activities that promote critical thinking independent learning, reflection, decision-making, and continuous academic improvement through constructive feedback.', 'Comes to class on time.', 1, 1, '2026-04-29 11:26:03'),
(2, 'A. Management of Teaching and Learning', 'rating', NULL, 'Explains learning outcomes, expectation, grading system, and various requirements of the subject/course.', 2, 1, '2026-04-29 11:26:03'),
(3, 'A. Management of Teaching and Learning', 'rating', NULL, 'Maximizes the allocated time/learning hours effectively.', 3, 1, '2026-04-29 11:26:03'),
(4, 'A. Management of Teaching and Learning', 'rating', NULL, 'Facilitates students to think critically and creatively by providing appropriate learning activities.', 4, 1, '2026-04-29 11:26:03'),
(5, 'A. Management of Teaching and Learning', 'rating', NULL, 'Guides students to learn on their own, reflect on new ideas and experiences, and make decisions in accomplishing given tasks.', 5, 1, '2026-04-29 11:26:03'),
(6, 'A. Management of Teaching and Learning', 'rating', NULL, 'Communicates constructive feedback to students for their academic growth.', 6, 1, '2026-04-29 11:26:03'),
(7, 'B. Content Knowledge, Pedagogy and Technology', 'rating', 'Content Knowledge, Pedagogy, and Technology refer to a teacher\'s ability to demonstrate a strong grasp of subject matter, present complex concepts in a clear and accessible way, relate content to real-world contexts and current developments, engage students through appropriate instructional strategies and digital tools, and apply assessment methods aligned with intended learning outcomes.', 'Demonstrates extensive and broad knowledge of the subject/course.', 7, 1, '2026-04-29 11:26:03'),
(8, 'B. Content Knowledge, Pedagogy and Technology', 'rating', NULL, 'Simplifies complex ideas in the lesson for ease of understanding.', 8, 1, '2026-04-29 11:26:03'),
(9, 'B. Content Knowledge, Pedagogy and Technology', 'rating', NULL, 'Relates the subject matter to contemporary issues and developments in the discipline and/or daily life activities.', 9, 1, '2026-04-29 11:26:03'),
(10, 'B. Content Knowledge, Pedagogy and Technology', 'rating', NULL, 'Promotes active learning and student engagement by including ICT tools and platforms.', 10, 1, '2026-04-29 11:26:03'),
(11, 'B. Content Knowledge, Pedagogy and Technology', 'rating', NULL, 'Uses appropriate assessments (projects, exams, quizzes, assignments, etc.) aligned with the learning outcomes.', 11, 1, '2026-04-29 11:26:03'),
(12, 'C. Commitment and Transparency', 'rating', 'Commitment and Transparency refer to the teacher\'s consistent dedication to supporting student learning by acknowledging learner diversity, offering timely academic support and feedback, and upholding fairness and accountability through the use of clear and openly communicated performance criteria.', 'Recognizes and values the unique diversity and individual differences among students.', 12, 1, '2026-04-29 11:26:03'),
(13, 'C. Commitment and Transparency', 'rating', NULL, 'Assists students with their learning challenges during consulting hours.', 13, 1, '2026-04-29 11:26:03'),
(14, 'C. Commitment and Transparency', 'rating', NULL, 'Provides immediate feedback on student outputs and performance.', 14, 1, '2026-04-29 11:26:03'),
(15, 'C. Commitment and Transparency', 'rating', NULL, 'Provides transparent and clear criteria in rating students\' performance.', 15, 1, '2026-04-29 11:26:03'),
(16, 'Open-ended', 'text', 'Sagutan ang mga sumusunod na tanong. Maging makatuwiran sa pagbibigay ng mga puna.', 'Strengths of your Instructors / Professors teaching performance:', 16, 1, '2026-04-29 11:26:03'),
(17, 'Open-ended', 'text', NULL, 'Weaknesses of your Instructors / Professors teaching performance:', 17, 1, '2026-04-29 11:26:03');

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_responses`
--

CREATE TABLE `evaluation_responses` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `text_response` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faculty`
--

CREATE TABLE `faculty` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faculty`
--

INSERT INTO `faculty` (`id`, `name`, `email`, `password`, `department`, `subject_id`, `email_verified`, `verification_token`, `created_at`, `updated_at`) VALUES
(2, 'Dr. Maria Santos', 'faculty@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', 'Computer Science', 1, 1, NULL, '2026-03-14 05:03:09', '2026-05-01 10:37:09'),
(3, 'Prof. Juan Dela Cruz', 'faculty2@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', 'Information Technology', 3, 1, NULL, '2026-03-14 05:03:09', '2026-05-01 10:37:09');

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
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `year_level` varchar(20) NOT NULL,
  `section` varchar(50) NOT NULL,
  `department` varchar(255) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `name`, `email`, `password`, `year_level`, `section`, `department`, `subject_id`, `email_verified`, `verification_token`, `created_at`, `updated_at`) VALUES
(4, 'Raymond Heras', 'student1@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', '4th Year', 'A', 'Computer Science', 1, 1, NULL, '2026-03-14 05:03:09', '2026-05-01 11:10:36'),
(5, 'Hero Reyes', 'student2@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', '4th Year', 'B', 'Information Technology', 3, 1, NULL, '2026-03-14 05:03:09', '2026-05-01 11:10:24'),
(11, 'Mark Len', 'student3@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', '4th Year', 'B', 'Information Technology', 3, 1, NULL, '2026-03-15 03:45:05', '2026-05-01 11:10:51'),
(13, 'Jordan Dave Caparas', 'student4@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', '4th Year', 'B', 'Information Technology', 3, 1, NULL, '2026-03-15 04:01:06', '2026-05-01 11:11:04'),
(14, 'Junard Chua', 'student5@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', '4th Year', 'A', 'Information Technology', 3, 1, NULL, '2026-03-15 13:14:30', '2026-05-01 11:11:20');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `code`, `name`, `department`, `created_at`) VALUES
(1, 'CS101', 'Computer Programming 1', 'Computer Science', '2026-05-01 10:33:01'),
(2, 'CS102', 'Data Structures', 'Computer Science', '2026-05-01 10:33:01'),
(3, 'IT101', 'Information Assurance and Security', 'Information Technology', '2026-05-01 10:33:01'),
(4, 'IT102', 'Network Administration', 'Information Technology', '2026-05-01 10:33:01');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

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
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `faculty_subject_fk` (`subject_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `students_subject_fk` (`subject_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `evaluation_questions`
--
ALTER TABLE `evaluation_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `evaluation_responses`
--
ALTER TABLE `evaluation_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=137;

--
-- AUTO_INCREMENT for table `faculty`
--
ALTER TABLE `faculty`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluations_ibfk_2` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluation_responses`
--
ALTER TABLE `evaluation_responses`
  ADD CONSTRAINT `evaluation_responses_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `evaluation_questions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluation_responses_ibfk_3` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `faculty`
--
ALTER TABLE `faculty`
  ADD CONSTRAINT `faculty_subject_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_subject_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
