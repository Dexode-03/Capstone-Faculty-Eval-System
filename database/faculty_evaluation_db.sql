-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: May 01, 2026 at 04:57 PM
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

-- Table structure for table `academic_periods`
--

CREATE TABLE `academic_periods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `academic_year` varchar(20) NOT NULL,
  `semester` enum('1st','2nd') NOT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `academic_periods`
--

INSERT INTO `academic_periods` (`academic_year`, `semester`, `is_active`, `start_date`, `end_date`) VALUES
('2025-2026', '2nd', 1, '2026-01-01', '2026-06-30');

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
  `student_id` varchar(36) NOT NULL,
  `anonymous_student_ref` varchar(255) DEFAULT NULL,
  `faculty_id` varchar(36) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text NOT NULL,
  `strengths` text DEFAULT NULL,
  `weaknesses` text DEFAULT NULL,
  `sentiment` enum('positive','neutral','negative') NOT NULL,
  `sentiment_score` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `student_id_new` varchar(36) DEFAULT NULL,
  `faculty_id_new` varchar(36) DEFAULT NULL,
  `academic_period_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluations`
--

INSERT INTO `evaluations` (`id`, `student_id`, `anonymous_student_ref`, `faculty_id`, `rating`, `comment`, `strengths`, `weaknesses`, `sentiment`, `sentiment_score`, `created_at`, `student_id_new`, `faculty_id_new`) VALUES
(13, '23-AS-0005', 'v1.q436BzTdxl1jiyM2.Cjq3ND8YiB0MPNcMbd0jjg.Y04Ytb--FZWukOzS6pnFhIwBcJ4T-zH3MHsEcQuE2xdWPmfb2eRrgXI6', 'ASIN-000002', 4, 'No comments provided.', NULL, NULL, 'neutral', 0.00, '2026-05-01 14:36:19', NULL, NULL);

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

--
-- Dumping data for table `evaluation_responses`
--

INSERT INTO `evaluation_responses` (`id`, `evaluation_id`, `question_id`, `rating`, `text_response`) VALUES
(205, 13, 1, 1, NULL),
(206, 13, 2, 4, NULL),
(207, 13, 3, 3, NULL),
(208, 13, 4, 4, NULL),
(209, 13, 5, 5, NULL),
(210, 13, 6, 5, NULL),
(211, 13, 7, 5, NULL),
(212, 13, 8, 5, NULL),
(213, 13, 9, 2, NULL),
(214, 13, 10, 3, NULL),
(215, 13, 11, 5, NULL),
(216, 13, 12, 4, NULL),
(217, 13, 13, 5, NULL),
(218, 13, 14, 4, NULL),
(219, 13, 15, 4, NULL),
(220, 13, 16, NULL, ''),
(221, 13, 17, NULL, '');

-- --------------------------------------------------------

--
-- Table structure for table `faculty`
--

CREATE TABLE `faculty` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faculty`
--

INSERT INTO `faculty` (`id`, `name`, `email`, `password`, `department`, `email_verified`, `verification_token`, `created_at`, `updated_at`) VALUES
('ASIN-000001', 'Dr. Maria Santos', 'faculty@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', 'Computer Science', 1, NULL, '2026-03-14 05:03:09', '2026-05-01 10:37:09'),
('ASIN-000002', 'Prof. Juan Dela Cruz', 'faculty2@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', 'Information Technology', 1, NULL, '2026-03-14 05:03:09', '2026-05-01 10:37:09');

-- --------------------------------------------------------

--
-- Table structure for table `faculty_subjects`
--

CREATE TABLE `faculty_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `faculty_id` varchar(36) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `section` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subject_section` (`subject_id`, `section`),
  KEY `idx_faculty_id` (`faculty_id`),
  KEY `idx_subject_id` (`subject_id`),
  FOREIGN KEY (`faculty_id`) REFERENCES `faculty`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faculty_subjects`
--

INSERT INTO `faculty_subjects` (`faculty_id`, `subject_id`, `section`) VALUES
('ASIN-000001', 1, NULL),
('ASIN-000002', 3, NULL);

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
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `year_level` varchar(20) NOT NULL,
  `section` varchar(50) NOT NULL,
  `department` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `name`, `email`, `password`, `year_level`, `section`, `department`, `email_verified`, `verification_token`, `created_at`, `updated_at`) VALUES
('23-AS-0001', 'Raymond Heras', 'student1@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', '4th Year', 'A', 'Computer Science', 1, NULL, '2026-03-14 05:03:09', '2026-05-01 11:10:36'),
('23-AS-0002', 'Hero Reyes', 'student2@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', '4th Year', 'B', 'Information Technology', 1, NULL, '2026-03-14 05:03:09', '2026-05-01 11:10:24'),
('23-AS-0003', 'Mark Len', 'student3@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', '4th Year', 'B', 'Information Technology', 1, NULL, '2026-03-15 03:45:05', '2026-05-01 11:10:51'),
('23-AS-0004', 'Jordan Dave Caparas', 'student4@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', '4th Year', 'B', 'Information Technology', 1, NULL, '2026-03-15 04:01:06', '2026-05-01 11:11:04'),
('23-AS-0005', 'Junard Chua', 'student5@psu.edu.ph', '$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.', '4th Year', 'A', 'Information Technology', 1, NULL, '2026-03-15 13:14:30', '2026-05-01 11:11:20');

-- --------------------------------------------------------

--
-- Table structure for table `student_subjects`
--

CREATE TABLE `student_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(36) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `faculty_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_subject` (`student_id`, `subject_id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`faculty_id`) REFERENCES `faculty`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_subjects`
--

INSERT INTO `student_subjects` (`student_id`, `subject_id`) VALUES
('23-AS-0001', 1),
('23-AS-0002', 3),
('23-AS-0003', 3),
('23-AS-0004', 3),
('23-AS-0005', 3);

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `semester` enum('1st','2nd','both') DEFAULT 'both',
  `year_level` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `code`, `name`, `department`, `semester`, `year_level`, `created_at`) VALUES
(1, 'CS101', 'Computer Programming 1', 'Computer Science', 'both', '1st Year', '2026-05-01 10:33:01'),
(2, 'CS102', 'Data Structures', 'Computer Science', 'both', '1st Year', '2026-05-01 10:33:01'),
(3, 'IT101', 'Information Assurance and Security', 'Information Technology', 'both', '1st Year', '2026-05-01 10:33:01'),
(4, 'IT102', 'Network Administration', 'Information Technology', 'both', '1st Year', '2026-05-01 10:33:01'),
(5, 'CS201', 'Operating Systems', 'Computer Science', 'both', '2nd Year', '2026-05-01 10:33:01'),
(6, 'IT201', 'Web Development', 'Information Technology', 'both', '2nd Year', '2026-05-01 10:33:01'),
(7, 'ENG101', 'Engineering Mathematics', 'Engineering', 'both', '1st Year', '2026-05-01 10:33:01'),
(8, 'ENG201', 'Thermodynamics', 'Engineering', 'both', '2nd Year', '2026-05-01 10:33:01'),
(9, 'EDU101', 'Principles of Teaching', 'Education', 'both', '1st Year', '2026-05-01 10:33:01'),
(10, 'BA101', 'Financial Management', 'Business Administration', 'both', '1st Year', '2026-05-01 10:33:01'),
(11, 'CS103', 'Discrete Structures', 'Computer Science', 'both', '1st Year', '2026-05-01 10:33:01'),
(12, 'CS202', 'Database Systems', 'Computer Science', 'both', '2nd Year', '2026-05-01 10:33:01'),
(13, 'CS203', 'Object-Oriented Programming', 'Computer Science', 'both', '2nd Year', '2026-05-01 10:33:01'),
(14, 'CS301', 'Software Engineering', 'Computer Science', 'both', '3rd Year', '2026-05-01 10:33:01'),
(15, 'CS302', 'Computer Networks', 'Computer Science', 'both', '3rd Year', '2026-05-01 10:33:01'),
(16, 'CS303', 'Web Application Development', 'Computer Science', 'both', '3rd Year', '2026-05-01 10:33:01'),
(17, 'CS401', 'Artificial Intelligence', 'Computer Science', 'both', '4th Year', '2026-05-01 10:33:01'),
(18, 'CS402', 'Capstone Project 1', 'Computer Science', 'both', '4th Year', '2026-05-01 10:33:01'),
(19, 'CS403', 'Information Security', 'Computer Science', 'both', '4th Year', '2026-05-01 10:33:01'),
(20, 'IT103', 'Computer Hardware Servicing', 'Information Technology', 'both', '1st Year', '2026-05-01 10:33:01'),
(21, 'IT202', 'Systems Integration and Architecture', 'Information Technology', 'both', '2nd Year', '2026-05-01 10:33:01'),
(22, 'IT203', 'Human Computer Interaction', 'Information Technology', 'both', '2nd Year', '2026-05-01 10:33:01'),
(23, 'IT301', 'Mobile Application Development', 'Information Technology', 'both', '3rd Year', '2026-05-01 10:33:01'),
(24, 'IT302', 'Database Administration', 'Information Technology', 'both', '3rd Year', '2026-05-01 10:33:01'),
(25, 'IT303', 'Cloud Computing', 'Information Technology', 'both', '3rd Year', '2026-05-01 10:33:01'),
(26, 'IT401', 'IT Project Management', 'Information Technology', 'both', '4th Year', '2026-05-01 10:33:01'),
(27, 'IT402', 'Capstone Project', 'Information Technology', 'both', '4th Year', '2026-05-01 10:33:01'),
(28, 'IT403', 'Cybersecurity Operations', 'Information Technology', 'both', '4th Year', '2026-05-01 10:33:01'),
(29, 'ENG102', 'Engineering Drawing', 'Engineering', 'both', '1st Year', '2026-05-01 10:33:01'),
(30, 'ENG103', 'Physics for Engineers', 'Engineering', 'both', '1st Year', '2026-05-01 10:33:01'),
(31, 'ENG202', 'Engineering Mechanics', 'Engineering', 'both', '2nd Year', '2026-05-01 10:33:01'),
(32, 'ENG203', 'Materials Science', 'Engineering', 'both', '2nd Year', '2026-05-01 10:33:01'),
(33, 'ENG301', 'Fluid Mechanics', 'Engineering', 'both', '3rd Year', '2026-05-01 10:33:01'),
(34, 'ENG302', 'Electrical Circuits', 'Engineering', 'both', '3rd Year', '2026-05-01 10:33:01'),
(35, 'ENG303', 'Control Systems', 'Engineering', 'both', '3rd Year', '2026-05-01 10:33:01'),
(36, 'ENG401', 'Engineering Design Project', 'Engineering', 'both', '4th Year', '2026-05-01 10:33:01'),
(37, 'ENG402', 'Project Management for Engineers', 'Engineering', 'both', '4th Year', '2026-05-01 10:33:01'),
(38, 'ENG403', 'Engineering Ethics', 'Engineering', 'both', '4th Year', '2026-05-01 10:33:01'),
(39, 'EDU102', 'Child and Adolescent Development', 'Education', 'both', '1st Year', '2026-05-01 10:33:01'),
(40, 'EDU103', 'Educational Technology', 'Education', 'both', '1st Year', '2026-05-01 10:33:01'),
(41, 'EDU201', 'Curriculum Development', 'Education', 'both', '2nd Year', '2026-05-01 10:33:01'),
(42, 'EDU202', 'Assessment of Learning', 'Education', 'both', '2nd Year', '2026-05-01 10:33:01'),
(43, 'EDU203', 'Facilitating Learner-Centered Teaching', 'Education', 'both', '2nd Year', '2026-05-01 10:33:01'),
(44, 'EDU301', 'Classroom Management', 'Education', 'both', '3rd Year', '2026-05-01 10:33:01'),
(45, 'EDU302', 'Inclusive Education', 'Education', 'both', '3rd Year', '2026-05-01 10:33:01'),
(46, 'EDU303', 'Teaching Internship Preparation', 'Education', 'both', '3rd Year', '2026-05-01 10:33:01'),
(47, 'EDU401', 'Practice Teaching', 'Education', 'both', '4th Year', '2026-05-01 10:33:01'),
(48, 'EDU402', 'Action Research in Education', 'Education', 'both', '4th Year', '2026-05-01 10:33:01'),
(49, 'EDU403', 'Educational Leadership', 'Education', 'both', '4th Year', '2026-05-01 10:33:01'),
(50, 'BA102', 'Principles of Management', 'Business Administration', 'both', '1st Year', '2026-05-01 10:33:01'),
(51, 'BA103', 'Business Mathematics', 'Business Administration', 'both', '1st Year', '2026-05-01 10:33:01'),
(52, 'BA201', 'Marketing Management', 'Business Administration', 'both', '2nd Year', '2026-05-01 10:33:01'),
(53, 'BA202', 'Business Law', 'Business Administration', 'both', '2nd Year', '2026-05-01 10:33:01'),
(54, 'BA203', 'Managerial Accounting', 'Business Administration', 'both', '2nd Year', '2026-05-01 10:33:01'),
(55, 'BA301', 'Human Resource Management', 'Business Administration', 'both', '3rd Year', '2026-05-01 10:33:01'),
(56, 'BA302', 'Operations Management', 'Business Administration', 'both', '3rd Year', '2026-05-01 10:33:01'),
(57, 'BA303', 'Entrepreneurship', 'Business Administration', 'both', '3rd Year', '2026-05-01 10:33:01'),
(58, 'BA401', 'Strategic Management', 'Business Administration', 'both', '4th Year', '2026-05-01 10:33:01'),
(59, 'BA402', 'Business Research', 'Business Administration', 'both', '4th Year', '2026-05-01 10:33:01'),
(60, 'BA403', 'Business Ethics and Corporate Governance', 'Business Administration', 'both', '4th Year', '2026-05-01 10:33:01');

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
  ADD UNIQUE KEY `email` (`email`);

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
  ADD UNIQUE KEY `email` (`email`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `evaluation_questions`
--
ALTER TABLE `evaluation_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `evaluation_responses`
--
ALTER TABLE `evaluation_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=222;

--
-- VARCHAR primary key for table `faculty`
--
ALTER TABLE `faculty`
  MODIFY `id` varchar(36) NOT NULL;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- VARCHAR primary key for table `students`
--
ALTER TABLE `students`
  MODIFY `id` varchar(36) NOT NULL;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

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


COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
