-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: faculty_evaluation_db_dev
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_periods`
--

DROP TABLE IF EXISTS `academic_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `academic_periods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `academic_year` varchar(20) NOT NULL,
  `semester` enum('1st','2nd') NOT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `evaluation_open` tinyint(1) DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_periods`
--

LOCK TABLES `academic_periods` WRITE;
/*!40000 ALTER TABLE `academic_periods` DISABLE KEYS */;
INSERT INTO `academic_periods` VALUES (1,'2023-2024','1st',1,1,'2023-08-14','2023-12-22','2026-05-18 14:43:55'),(2,'2023-2024','2nd',0,0,'2024-01-08','2024-05-31','2026-05-19 01:44:23'),(3,'2025-2026','2nd',0,0,'2026-01-01','2026-06-30','2026-05-19 02:04:21');
/*!40000 ALTER TABLE `academic_periods` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_academic_periods_single_active_ins`
BEFORE INSERT ON `academic_periods`
FOR EACH ROW
BEGIN
  IF NEW.is_active = 1 AND (SELECT COUNT(*) FROM `academic_periods` WHERE `is_active` = 1) > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one academic period can be active at a time';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_academic_periods_single_active_upd`
BEFORE UPDATE ON `academic_periods`
FOR EACH ROW
BEGIN
  IF NEW.is_active = 1 AND (SELECT COUNT(*) FROM `academic_periods` WHERE `is_active` = 1 AND `id` <> NEW.id) > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one academic period can be active at a time';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,'Admin User','admin@psu.edu.ph','$2a$10$6FqkT/bQ2tw3TRiM81XSy.YCg9U.HBgXx6cTlhZbvNhQH2CWV1jy.',1,NULL,'2026-03-14 05:03:09','2026-05-11 12:10:51');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `actor_role` varchar(20) NOT NULL,
  `actor_id` varchar(100) NOT NULL,
  `action` varchar(50) NOT NULL,
  `target` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor` (`actor_role`,`actor_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,'admin','admin-1','PERIOD_ACTIVATE','academic_period:2','{\"academic_year\":\"2023-2024\",\"semester\":\"2nd\"}','127.0.0.1','2026-10-08 08:58:35'),(2,'admin','admin-1','PERIOD_ACTIVATE','academic_period:1','{\"academic_year\":\"2023-2024\",\"semester\":\"1st\"}','127.0.0.1','2026-10-08 08:58:35'),(3,'admin','admin-1','QUESTION_CREATE','question:18','{\"category\":\"A. Management of Teaching and Learning\",\"question_type\":\"rating\",\"question\":\"Demonstrates clear expectations for class requirements.\"}','127.0.0.1','2026-10-08 09:04:10'),(4,'admin','admin-1','QUESTION_DEACTIVATE','question:18','{\"question\":\"Demonstrates clear expectations for class requirements.\"}','127.0.0.1','2026-10-08 09:04:10'),(5,'admin','admin-1','QUESTION_CREATE','question:19','{\"category\":\"A. Management of Teaching and Learning\",\"question_type\":\"rating\",\"question\":\"Demonstrates clear expectations for class requirements.\"}','127.0.0.1','2026-10-08 09:04:35'),(6,'admin','admin-1','QUESTION_DEACTIVATE','question:19','{\"question\":\"Demonstrates clear expectations for class requirements.\"}','127.0.0.1','2026-10-08 09:04:35'),(7,'admin','admin-1','REPORT_ACCESS_FACULTY','faculty:fac_082c7b','{\"faculty_name\":\"Dr. Elena Magno\",\"total_evaluations\":0}','127.0.0.1','2026-10-08 09:04:35'),(8,'admin','admin-1','RULE_CREATE','rule:20','{\"theme\":\"InnovativeTech\",\"rule_type\":\"strength\",\"recommendation_text\":\"Pioneering use of emerging AI tools in instruction recognized.\"}','127.0.0.1','2026-10-08 09:11:06'),(9,'admin','admin-1','RULE_CREATE','rule:21','{\"theme\":\"InnovativeTech\",\"rule_type\":\"strength\",\"recommendation_text\":\"Pioneering use of emerging robotics tools in instruction recognized.\"}','127.0.0.1','2026-10-08 09:11:42'),(10,'admin','admin-1','RULE_DELETE','rule:21','{\"theme\":\"InnovativeTech\",\"recommendation_text\":\"Pioneering use of emerging robotics tools in instruction recognized.\"}','127.0.0.1','2026-10-08 09:11:42'),(11,'admin','admin-1','REPORT_ACCESS_FACULTY','faculty:FAC-001','{\"faculty_name\":\"Dr. Test Faculty\",\"total_evaluations\":0}','127.0.0.1','2026-10-08 09:11:53'),(12,'admin','1','REPORT_ACCESS_FACULTY','faculty:FAC-SAFE-01','{\"faculty_name\":\"Prof. Anonymity Defender\",\"total_evaluations\":3}','127.0.0.1','2026-10-08 09:12:06'),(13,'admin','1','REPORT_ACCESS_FACULTY','faculty:FAC-SAFE-01','{\"faculty_name\":\"Prof. Anonymity Defender\",\"total_evaluations\":5}','127.0.0.1','2026-10-08 09:12:06'),(14,'admin','admin-1','PERIOD_ACTIVATE','academic_period:2','{\"academic_year\":\"2023-2024\",\"semester\":\"2nd\"}','127.0.0.1','2026-10-08 09:12:08'),(15,'admin','admin-1','PERIOD_ACTIVATE','academic_period:1','{\"academic_year\":\"2023-2024\",\"semester\":\"1st\"}','127.0.0.1','2026-10-08 09:12:08'),(16,'admin','admin-1','RULE_CREATE','rule:22','{\"theme\":\"InnovativeTech\",\"rule_type\":\"strength\",\"recommendation_text\":\"Pioneering use of emerging robotics tools in instruction recognized.\"}','127.0.0.1','2026-10-08 09:12:12'),(17,'admin','admin-1','RULE_DELETE','rule:22','{\"theme\":\"InnovativeTech\",\"recommendation_text\":\"Pioneering use of emerging robotics tools in instruction recognized.\"}','127.0.0.1','2026-10-08 09:12:12'),(18,'admin','admin-1','QUESTION_CREATE','question:20','{\"category\":\"A. Management of Teaching and Learning\",\"question_type\":\"rating\",\"question\":\"Demonstrates clear expectations for class requirements.\"}','127.0.0.1','2026-10-08 09:12:13'),(19,'admin','admin-1','QUESTION_DEACTIVATE','question:20','{\"question\":\"Demonstrates clear expectations for class requirements.\"}','127.0.0.1','2026-10-08 09:12:13'),(20,'admin','admin-1','REPORT_ACCESS_FACULTY','faculty:fac_082c7b','{\"faculty_name\":\"Dr. Elena Magno\",\"total_evaluations\":0}','127.0.0.1','2026-10-08 09:12:13');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_questions`
--

DROP TABLE IF EXISTS `evaluation_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `evaluation_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(100) NOT NULL,
  `question_type` enum('rating','text') NOT NULL DEFAULT 'rating',
  `category_description` text DEFAULT NULL,
  `question` text NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_questions`
--

LOCK TABLES `evaluation_questions` WRITE;
/*!40000 ALTER TABLE `evaluation_questions` DISABLE KEYS */;
INSERT INTO `evaluation_questions` VALUES (1,'A. Management of Teaching and Learning','rating','Management of Teaching and Learning refers to the intentional and organized handling of classroom presence, clear communication of academic expectations, efficient use of time, and the purpose use of student-centered activities that promote critical thinking independent learning, reflection, decision-making, and continuous academic improvement through constructive feedback.','Comes to class on time.',1,1,'2026-04-29 11:26:03'),(2,'A. Management of Teaching and Learning','rating',NULL,'Explains learning outcomes, expectation, grading system, and various requirements of the subject/course.',2,1,'2026-04-29 11:26:03'),(3,'A. Management of Teaching and Learning','rating',NULL,'Maximizes the allocated time/learning hours effectively.',3,1,'2026-04-29 11:26:03'),(4,'A. Management of Teaching and Learning','rating',NULL,'Facilitates students to think critically and creatively by providing appropriate learning activities.',4,1,'2026-04-29 11:26:03'),(5,'A. Management of Teaching and Learning','rating',NULL,'Guides students to learn on their own, reflect on new ideas and experiences, and make decisions in accomplishing given tasks.',5,1,'2026-04-29 11:26:03'),(6,'A. Management of Teaching and Learning','rating',NULL,'Communicates constructive feedback to students for their academic growth.',6,1,'2026-04-29 11:26:03'),(7,'B. Content Knowledge, Pedagogy and Technology','rating','Content Knowledge, Pedagogy, and Technology refer to a teacher\'s ability to demonstrate a strong grasp of subject matter, present complex concepts in a clear and accessible way, relate content to real-world contexts and current developments, engage students through appropriate instructional strategies and digital tools, and apply assessment methods aligned with intended learning outcomes.','Demonstrates extensive and broad knowledge of the subject/course.',7,1,'2026-04-29 11:26:03'),(8,'B. Content Knowledge, Pedagogy and Technology','rating',NULL,'Simplifies complex ideas in the lesson for ease of understanding.',8,1,'2026-04-29 11:26:03'),(9,'B. Content Knowledge, Pedagogy and Technology','rating',NULL,'Relates the subject matter to contemporary issues and developments in the discipline and/or daily life activities.',9,1,'2026-04-29 11:26:03'),(10,'B. Content Knowledge, Pedagogy and Technology','rating',NULL,'Promotes active learning and student engagement by including ICT tools and platforms.',10,1,'2026-04-29 11:26:03'),(11,'B. Content Knowledge, Pedagogy and Technology','rating',NULL,'Uses appropriate assessments (projects, exams, quizzes, assignments, etc.) aligned with the learning outcomes.',11,1,'2026-04-29 11:26:03'),(12,'C. Commitment and Transparency','rating','Commitment and Transparency refer to the teacher\'s consistent dedication to supporting student learning by acknowledging learner diversity, offering timely academic support and feedback, and upholding fairness and accountability through the use of clear and openly communicated performance criteria.','Recognizes and values the unique diversity and individual differences among students.',12,1,'2026-04-29 11:26:03'),(13,'C. Commitment and Transparency','rating',NULL,'Assists students with their learning challenges during consulting hours.',13,1,'2026-04-29 11:26:03'),(14,'C. Commitment and Transparency','rating',NULL,'Provides immediate feedback on student outputs and performance.',14,1,'2026-04-29 11:26:03'),(15,'C. Commitment and Transparency','rating',NULL,'Provides transparent and clear criteria in rating students\' performance.',15,1,'2026-04-29 11:26:03'),(16,'Open-ended','text','Sagutan ang mga sumusunod na tanong. Maging makatuwiran sa pagbibigay ng mga puna.','Strengths of your Instructors / Professors teaching performance:',16,1,'2026-04-29 11:26:03'),(17,'Open-ended','text',NULL,'Weaknesses of your Instructors / Professors teaching performance:',17,1,'2026-04-29 11:26:03'),(18,'A. Management of Teaching and Learning','rating',NULL,'Demonstrates clear expectations for class requirements.',18,0,'2026-10-08 09:04:10'),(19,'A. Management of Teaching and Learning','rating',NULL,'Demonstrates clear expectations for class requirements.',18,0,'2026-10-08 09:04:35'),(20,'A. Management of Teaching and Learning','rating',NULL,'Demonstrates clear expectations for class requirements.',18,0,'2026-10-08 09:12:13');
/*!40000 ALTER TABLE `evaluation_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_responses`
--

DROP TABLE IF EXISTS `evaluation_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `evaluation_responses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evaluation_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `text_response` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `evaluation_id` (`evaluation_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `evaluation_responses_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `evaluation_questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluation_responses_ibfk_3` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=324 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_responses`
--

LOCK TABLES `evaluation_responses` WRITE;
/*!40000 ALTER TABLE `evaluation_responses` DISABLE KEYS */;
INSERT INTO `evaluation_responses` VALUES (222,14,1,5,NULL),(223,14,2,5,NULL),(224,14,3,5,NULL),(225,14,4,5,NULL),(226,14,5,5,NULL),(227,14,6,5,NULL),(228,14,7,5,NULL),(229,14,8,5,NULL),(230,14,9,5,NULL),(231,14,10,5,NULL),(232,14,11,5,NULL),(233,14,12,5,NULL),(234,14,13,5,NULL),(235,14,14,5,NULL),(236,14,15,5,NULL),(237,14,16,NULL,'good teacher'),(238,14,17,NULL,'late'),(239,15,1,5,NULL),(240,15,2,5,NULL),(241,15,3,5,NULL),(242,15,4,5,NULL),(243,15,5,5,NULL),(244,15,6,5,NULL),(245,15,7,5,NULL),(246,15,8,5,NULL),(247,15,9,5,NULL),(248,15,10,5,NULL),(249,15,11,5,NULL),(250,15,12,5,NULL),(251,15,13,5,NULL),(252,15,14,5,NULL),(253,15,15,5,NULL),(254,15,16,NULL,'good'),(255,15,17,NULL,'bad'),(256,16,1,5,NULL),(257,16,2,5,NULL),(258,16,3,5,NULL),(259,16,4,5,NULL),(260,16,5,5,NULL),(261,16,6,5,NULL),(262,16,7,5,NULL),(263,16,8,5,NULL),(264,16,9,5,NULL),(265,16,10,5,NULL),(266,16,11,5,NULL),(267,16,12,5,NULL),(268,16,13,5,NULL),(269,16,14,5,NULL),(270,16,15,5,NULL),(271,16,16,NULL,'good'),(272,16,17,NULL,'bad'),(273,17,1,5,NULL),(274,17,2,5,NULL),(275,17,3,5,NULL),(276,17,4,5,NULL),(277,17,5,5,NULL),(278,17,6,5,NULL),(279,17,7,5,NULL),(280,17,8,5,NULL),(281,17,9,5,NULL),(282,17,10,5,NULL),(283,17,11,5,NULL),(284,17,12,5,NULL),(285,17,13,5,NULL),(286,17,14,5,NULL),(287,17,15,5,NULL),(288,17,16,NULL,'good'),(289,17,17,NULL,'bad'),(290,18,1,5,NULL),(291,18,2,5,NULL),(292,18,3,5,NULL),(293,18,4,5,NULL),(294,18,5,5,NULL),(295,18,6,5,NULL),(296,18,7,5,NULL),(297,18,8,5,NULL),(298,18,9,5,NULL),(299,18,10,5,NULL),(300,18,11,5,NULL),(301,18,12,5,NULL),(302,18,13,5,NULL),(303,18,14,5,NULL),(304,18,15,5,NULL),(305,18,16,NULL,'good'),(306,18,17,NULL,'good'),(307,45,1,5,NULL),(308,45,2,5,NULL),(309,45,3,5,NULL),(310,45,4,5,NULL),(311,45,5,5,NULL),(312,45,6,5,NULL),(313,45,7,5,NULL),(314,45,8,5,NULL),(315,45,9,5,NULL),(316,45,10,5,NULL),(317,45,11,5,NULL),(318,45,12,5,NULL),(319,45,13,5,NULL),(320,45,14,5,NULL),(321,45,15,5,NULL),(322,45,16,NULL,'good'),(323,45,17,NULL,'bad');
/*!40000 ALTER TABLE `evaluation_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_submissions`
--

DROP TABLE IF EXISTS `evaluation_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `evaluation_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(36) NOT NULL,
  `faculty_id` varchar(36) NOT NULL,
  `academic_period_id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_submissions_student_faculty_period` (`student_id`,`faculty_id`,`academic_period_id`),
  UNIQUE KEY `uq_submissions_evaluation_id` (`evaluation_id`),
  KEY `idx_submissions_student_id` (`student_id`),
  KEY `idx_submissions_faculty_id` (`faculty_id`),
  KEY `idx_submissions_period_id` (`academic_period_id`),
  CONSTRAINT `es_fk_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `es_fk_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`) ON DELETE CASCADE,
  CONSTRAINT `es_fk_period` FOREIGN KEY (`academic_period_id`) REFERENCES `academic_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `es_fk_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_submissions`
--

LOCK TABLES `evaluation_submissions` WRITE;
/*!40000 ALTER TABLE `evaluation_submissions` DISABLE KEYS */;
INSERT INTO `evaluation_submissions` VALUES (1,'std_6aa1b6','fac_670364',1,14,'2026-05-25 00:20:04'),(2,'std_8d3914','fac_670364',1,15,'2026-05-25 07:51:30'),(3,'std_cf054a','fac_670364',1,16,'2026-05-25 08:12:57'),(4,'std_a8e070','fac_670364',1,17,'2026-05-25 08:14:10'),(5,'std_0389aa','fac_670364',1,18,'2026-09-27 08:07:25'),(17,'std_b3f541','fac_fe44ef',1,45,'2026-10-06 14:45:24');
/*!40000 ALTER TABLE `evaluation_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluations`
--

DROP TABLE IF EXISTS `evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `anonymous_student_ref` varchar(255) DEFAULT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text NOT NULL,
  `strengths` text DEFAULT NULL,
  `weaknesses` text DEFAULT NULL,
  `sentiment` enum('positive','neutral','negative') NOT NULL,
  `sentiment_score` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `faculty_id` varchar(20) NOT NULL,
  `academic_period_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_evaluations_academic_period` (`academic_period_id`),
  KEY `fk_evaluations_faculty` (`faculty_id`),
  CONSTRAINT `fk_evaluations_academic_period` FOREIGN KEY (`academic_period_id`) REFERENCES `academic_periods` (`id`),
  CONSTRAINT `fk_evaluations_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluations`
--

LOCK TABLES `evaluations` WRITE;
/*!40000 ALTER TABLE `evaluations` DISABLE KEYS */;
INSERT INTO `evaluations` VALUES (14,'v1.aPVxB2lcc5czs-a6.YY-Y4ijZ0iBTAx4IFGfauw.JLvR5zCVPHoIBUns6YYKm5SP0GZQjN6Jktxr8oY-4oqp884Hiib5-Jdh',5,'good teacher late','good teacher','late','neutral',-0.01,'2026-05-25 00:20:04','fac_670364',1),(15,'v1.L12kRGcD350gVTtL.OrhxSbI-KaVV-t7kaKTLsw.a4WIkPGz0xRcFQeW0zvWiUHaPiRM3mFVfS-1aURLJqH8GGS1IbCjRbFe',5,'good bad','good','bad','neutral',0.00,'2026-05-25 07:51:30','fac_670364',1),(16,'v1.ACJlJm9yM2eqTWhw.8Or7vOc7mckufVqDvDBX0w.JuFOc9xdnbUKBEVYOOeFFfOs3xV6f4AmxxY3HQjWOMjj6lDACX-ywfGY',5,'good bad','good','bad','neutral',0.00,'2026-05-25 08:12:57','fac_670364',1),(17,'v1.PQgKDeD7T8EtEyRc.BqtQq9_4Haw4k2oo-0cLeQ.sI1MWc6DrB38xeVkFXT9xkH2jvEFjP2w1vWmWWzPKdrT0U1CfPToyTgM',5,'good bad','good','bad','neutral',0.00,'2026-05-25 08:14:10','fac_670364',1),(18,'v1.gFFKAoFwHTlCYBnv.NynfC-6vngACnRPtLVaDnQ.BwYa_l1WGBWGM4rrjXZnkC9XdUF8mHS7AglmaZ204fIgGeDMSvFSzJsf55Sx5ivLfS0smw',5,'good good','good','good','positive',0.67,'2026-09-27 08:07:25','fac_670364',1),(45,'v1.uvCQeKr84C-uNrxM.WA6JOBMBdKiM1Kb3dQX-VQ.nK1HQ2BQGhMyq1QGZArBZcMkB8krY58FcVT4vKrA4WFf-W43ls46lm50ki9ifD713NgROw',5,'good bad','good','bad','neutral',0.00,'2026-10-06 14:45:24','fac_fe44ef',1);
/*!40000 ALTER TABLE `evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculty`
--

DROP TABLE IF EXISTS `faculty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faculty` (
  `id_old` int(11) NOT NULL,
  `id` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculty`
--

LOCK TABLES `faculty` WRITE;
/*!40000 ALTER TABLE `faculty` DISABLE KEYS */;
INSERT INTO `faculty` VALUES (22,'fac_082c7b','Dr. Elena Magno','faculty13@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Engineering',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(29,'fac_0fdaaa','Prof. Fernando Valdez','faculty18@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Business Administration',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(10,'fac_217248','Dr. Patricia Villanueva','faculty7@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','Business Administration',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:45'),(26,'fac_34c61f','Prof. Luisa Manalo','faculty16@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Education',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(31,'fac_3f62b8','Prof. Marco Alejandro','faculty20@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Business Administration',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(19,'fac_45bf0e','Dr. Grace Soriano','faculty12@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Information Technology',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(27,'fac_4810ec','Dr. Antonio Evangelista','faculty17@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Education',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(30,'fac_48ad32','Dr. Beatriz Salcedo','faculty19@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Business Administration',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(8,'fac_598cb1','Dr. Lisa Garcia','faculty5@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','Information Technology',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:45'),(0,'fac_670364','Dr. Maria Santos','faculty@psu.edu.ph','$2a$10$SomgDnQE9LuHdxdktVcgTO74vhDGx7lfVSJwkWihoPObx92XGPWua','Computer Science',1,NULL,'2026-03-14 05:03:09','2026-10-08 07:42:04'),(14,'fac_7a0a37','Prof. Ricardo Bautista','faculty9@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Computer Science',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(9,'fac_8686b0','Prof. Miguel Torres','faculty6@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','Education',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:45'),(18,'fac_86942f','Prof. Dennis Pascual','faculty11@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Information Technology',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(3,'fac_9aee87','Prof. Juan Dela Cruz','faculty2@psu.edu.ph','$2a$10$SomgDnQE9LuHdxdktVcgTO74vhDGx7lfVSJwkWihoPObx92XGPWua','Information Technology',1,NULL,'2026-03-14 05:03:09','2026-10-08 07:42:04'),(7,'fac_9f621e','Prof. Carlo Mendoza','faculty4@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','Engineering',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:45'),(23,'fac_a2c646','Prof. Renato Ibarra','faculty14@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Engineering',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(11,'fac_e1bace','Prof. Roberto Aquino','faculty8@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','Engineering',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:45'),(15,'fac_edc2e6','Dr. Carmen Lim','faculty10@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Computer Science',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(25,'fac_f2770a','Dr. Rosario Dimaculangan','faculty15@psu.edu.ph','$2a$10$Jg1wFG.o6Gmnba2Jztsfp.6hoEcO.I0VWxFqSo7ZM8jjuTmP7y4Je','Education',1,NULL,'2026-05-19 02:04:20','2026-09-27 07:10:45'),(6,'fac_fe44ef','Dr. Ana Reyes','faculty3@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','Computer Science',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:45');
/*!40000 ALTER TABLE `faculty` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculty_subjects`
--

DROP TABLE IF EXISTS `faculty_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faculty_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `faculty_id_old` int(11) NOT NULL,
  `faculty_id` varchar(20) NOT NULL,
  `subject_id_old` int(11) NOT NULL,
  `subject_id` varchar(20) NOT NULL,
  `section` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subject_section` (`subject_id_old`,`section`),
  KEY `idx_faculty_id` (`faculty_id_old`),
  KEY `idx_subject_id` (`subject_id_old`),
  KEY `fk_faculty_subjects_faculty` (`faculty_id`),
  KEY `fk_faculty_subjects_subject` (`subject_id`),
  CONSTRAINT `fk_faculty_subjects_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_faculty_subjects_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=372 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculty_subjects`
--

LOCK TABLES `faculty_subjects` WRITE;
/*!40000 ALTER TABLE `faculty_subjects` DISABLE KEYS */;
INSERT INTO `faculty_subjects` VALUES (337,0,'fac_670364',1,'sub_74e21e','A'),(338,0,'fac_670364',2,'sub_676c26','A'),(339,14,'fac_7a0a37',1,'sub_74e21e','B'),(340,14,'fac_7a0a37',5,'sub_538337','B'),(341,6,'fac_fe44ef',2,'sub_676c26','B'),(342,6,'fac_fe44ef',5,'sub_538337','A'),(343,15,'fac_edc2e6',2,'sub_676c26','C'),(344,15,'fac_edc2e6',62,'sub_954b26','A'),(345,3,'fac_9aee87',3,'sub_9caf92','A'),(346,3,'fac_9aee87',4,'sub_08c2d6','A'),(347,3,'fac_9aee87',76,'sub_54bcb5','B'),(348,8,'fac_598cb1',3,'sub_9caf92','B'),(349,8,'fac_598cb1',6,'sub_2af4a9','A'),(350,8,'fac_598cb1',77,'sub_ff3a28','B'),(351,18,'fac_86942f',4,'sub_08c2d6','B'),(352,18,'fac_86942f',6,'sub_2af4a9','B'),(353,18,'fac_86942f',78,'sub_48c86b','A'),(354,19,'fac_45bf0e',3,'sub_9caf92','C'),(355,19,'fac_45bf0e',70,'sub_0537f5','A'),(356,7,'fac_9f621e',7,'sub_34a0a2','A'),(357,7,'fac_9f621e',8,'sub_e36abf','A'),(358,11,'fac_e1bace',7,'sub_34a0a2','B'),(359,11,'fac_e1bace',8,'sub_e36abf','B'),(360,22,'fac_082c7b',7,'sub_34a0a2','C'),(361,22,'fac_082c7b',79,'sub_4801f6','A'),(362,23,'fac_a2c646',8,'sub_e36abf','C'),(363,23,'fac_a2c646',81,'sub_a1f3e9','A'),(364,9,'fac_8686b0',9,'sub_93e09c','A'),(365,25,'fac_f2770a',9,'sub_93e09c','B'),(366,26,'fac_34c61f',9,'sub_93e09c','C'),(367,27,'fac_4810ec',9,'sub_93e09c','D'),(368,10,'fac_217248',10,'sub_e76efb','A'),(369,29,'fac_0fdaaa',10,'sub_e76efb','B'),(370,30,'fac_48ad32',10,'sub_e76efb','C'),(371,31,'fac_3f62b8',10,'sub_e76efb','D');
/*!40000 ALTER TABLE `faculty_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `id_mapping_faculty`
--

DROP TABLE IF EXISTS `id_mapping_faculty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `id_mapping_faculty` (
  `old_id` int(11) NOT NULL,
  `new_id` varchar(20) NOT NULL,
  PRIMARY KEY (`old_id`),
  UNIQUE KEY `new_id` (`new_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `id_mapping_faculty`
--

LOCK TABLES `id_mapping_faculty` WRITE;
/*!40000 ALTER TABLE `id_mapping_faculty` DISABLE KEYS */;
INSERT INTO `id_mapping_faculty` VALUES (22,'fac_082c7b'),(29,'fac_0fdaaa'),(10,'fac_217248'),(26,'fac_34c61f'),(31,'fac_3f62b8'),(19,'fac_45bf0e'),(27,'fac_4810ec'),(30,'fac_48ad32'),(8,'fac_598cb1'),(0,'fac_670364'),(14,'fac_7a0a37'),(9,'fac_8686b0'),(18,'fac_86942f'),(3,'fac_9aee87'),(7,'fac_9f621e'),(23,'fac_a2c646'),(11,'fac_e1bace'),(15,'fac_edc2e6'),(25,'fac_f2770a'),(6,'fac_fe44ef');
/*!40000 ALTER TABLE `id_mapping_faculty` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `id_mapping_students`
--

DROP TABLE IF EXISTS `id_mapping_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `id_mapping_students` (
  `old_id` int(11) NOT NULL,
  `new_id` varchar(20) NOT NULL,
  PRIMARY KEY (`old_id`),
  UNIQUE KEY `new_id` (`new_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `id_mapping_students`
--

LOCK TABLES `id_mapping_students` WRITE;
/*!40000 ALTER TABLE `id_mapping_students` DISABLE KEYS */;
INSERT INTO `id_mapping_students` VALUES (37,'std_0389aa'),(5,'std_0f2152'),(24,'std_520eb0'),(36,'std_5427e5'),(20,'std_6aa1b6'),(22,'std_6bcd68'),(106,'std_7770d3'),(13,'std_7987a4'),(45,'std_8d3914'),(14,'std_90d859'),(21,'std_a26dfb'),(30,'std_a8e070'),(31,'std_a96091'),(41,'std_acaee0'),(11,'std_acc9a3'),(23,'std_afd7b2'),(4,'std_b3f541'),(29,'std_cf054a');
/*!40000 ALTER TABLE `id_mapping_students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `id_mapping_subjects`
--

DROP TABLE IF EXISTS `id_mapping_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `id_mapping_subjects` (
  `old_id` int(11) NOT NULL,
  `new_id` varchar(20) NOT NULL,
  PRIMARY KEY (`old_id`),
  UNIQUE KEY `new_id` (`new_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `id_mapping_subjects`
--

LOCK TABLES `id_mapping_subjects` WRITE;
/*!40000 ALTER TABLE `id_mapping_subjects` DISABLE KEYS */;
INSERT INTO `id_mapping_subjects` VALUES (109,'sub_047ace'),(94,'sub_0535ef'),(70,'sub_0537f5'),(4,'sub_08c2d6'),(88,'sub_0915e8'),(99,'sub_0d4b8c'),(93,'sub_0f14b4'),(96,'sub_121791'),(65,'sub_1770c0'),(80,'sub_2423b4'),(6,'sub_2af4a9'),(7,'sub_34a0a2'),(103,'sub_36770a'),(66,'sub_372b69'),(82,'sub_3f2377'),(74,'sub_4056c6'),(104,'sub_415aa9'),(79,'sub_4801f6'),(78,'sub_48c86b'),(5,'sub_538337'),(84,'sub_5437d9'),(76,'sub_54bcb5'),(95,'sub_65ada8'),(2,'sub_676c26'),(1,'sub_74e21e'),(108,'sub_7b341e'),(87,'sub_7e48ff'),(75,'sub_8236f3'),(64,'sub_868665'),(9,'sub_93e09c'),(62,'sub_954b26'),(68,'sub_964f1b'),(92,'sub_986356'),(3,'sub_9caf92'),(81,'sub_a1f3e9'),(98,'sub_a2abf1'),(85,'sub_aa7b21'),(107,'sub_ad0b32'),(83,'sub_b26372'),(91,'sub_b46db5'),(69,'sub_b4a403'),(86,'sub_bb2772'),(100,'sub_c9ca75'),(97,'sub_cb32cf'),(73,'sub_ced3f7'),(110,'sub_d17626'),(61,'sub_d3afbb'),(90,'sub_d4735a'),(72,'sub_db09f8'),(63,'sub_dbbb09'),(67,'sub_dfbc69'),(102,'sub_e26fdd'),(8,'sub_e36abf'),(10,'sub_e76efb'),(106,'sub_eeead4'),(105,'sub_f00a02'),(89,'sub_f176f8'),(71,'sub_f27a60'),(101,'sub_f2e3ea'),(77,'sub_ff3a28');
/*!40000 ALTER TABLE `id_mapping_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (1,'student1@psu.edu.ph','ddf4f06bedafca3503773db0982c2c1399972753465950f1140e813ddb5ba0f9','2026-05-02 18:46:26','2026-05-02 10:31:26');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recommendation_rules`
--

DROP TABLE IF EXISTS `recommendation_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recommendation_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `theme` varchar(100) NOT NULL,
  `rule_type` enum('strength','weakness','rating','sentiment') NOT NULL DEFAULT 'weakness',
  `keywords` text DEFAULT NULL COMMENT 'Comma-separated keywords (English + Filipino)',
  `metric` varchar(50) DEFAULT 'keyword' COMMENT 'keyword, rating, sentiment_negative_pct, sentiment_positive_pct',
  `operator` enum('<','<=','=','>=','>','contains') NOT NULL DEFAULT 'contains',
  `threshold` decimal(5,2) DEFAULT NULL,
  `recommendation_text` text NOT NULL,
  `severity` enum('low','medium','high','positive') NOT NULL DEFAULT 'medium',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_rec_rules_active` (`is_active`),
  KEY `idx_rec_rules_type` (`rule_type`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recommendation_rules`
--

LOCK TABLES `recommendation_rules` WRITE;
/*!40000 ALTER TABLE `recommendation_rules` DISABLE KEYS */;
INSERT INTO `recommendation_rules` VALUES (1,'Rating','rating',NULL,'rating','<',2.50,'Overall rating is critically low ({rating}/5). Immediate faculty development intervention is recommended, including a review of teaching methodology and classroom engagement.','high',1,'2026-10-08 09:05:47'),(2,'Rating','rating',NULL,'rating','<',3.50,'Rating of {rating}/5 is below satisfactory. Focus on specific areas flagged in student feedback and consider peer mentoring from higher-rated colleagues.','medium',1,'2026-10-08 09:05:47'),(3,'Rating','rating',NULL,'rating','<',4.50,'Rating of {rating}/5 is good. Minor refinements based on student feedback can push performance to excellent.','low',1,'2026-10-08 09:05:47'),(4,'Rating','rating',NULL,'rating','>=',4.50,'Excellent overall rating ({rating}/5). This faculty member is a strong candidate for mentoring roles and teaching excellence recognition.','positive',1,'2026-10-08 09:05:47'),(5,'Sentiment Negative','sentiment',NULL,'sentiment_negative_pct','>',40.00,'High high-probability negative sentiment detected ({negative_pct}%). A structured faculty development plan and follow-up evaluation within the semester is strongly recommended.','high',1,'2026-10-08 09:05:47'),(6,'Sentiment Negative','sentiment',NULL,'sentiment_negative_pct','>',20.00,'Moderate high-probability negative sentiment present ({negative_pct}%). Review recurring complaints in student feedback and address specific concerns raised.','medium',1,'2026-10-08 09:05:47'),(7,'Sentiment Positive','sentiment',NULL,'sentiment_positive_pct','>',70.00,'Strong high-probability positive sentiment trend ({positive_pct}%). Consider nominating this faculty for teaching awards or a leadership role in curriculum development.','positive',1,'2026-10-08 09:05:47'),(8,'Clarity','weakness','unclear, confusing, labo, malabo','keyword','contains',NULL,'Clarity concerns detected. Suggest using more concrete examples, visual aids, and step-by-step explanations during lectures.','medium',1,'2026-10-08 09:05:47'),(9,'Pacing','weakness','fast, rushed, bilis, pacing','keyword','contains',NULL,'Pacing issues identified. Recommend incorporating structured pauses, comprehension checks, and allowing more time for student questions.','medium',1,'2026-10-08 09:05:47'),(10,'Engagement','weakness','boring, monotone, unengaging, nakakaantok','keyword','contains',NULL,'Student engagement is low. Recommend incorporating interactive activities, group discussions, and varied instructional methods.','medium',1,'2026-10-08 09:05:47'),(11,'Punctuality','weakness','late, absent, laging','keyword','contains',NULL,'Attendance and punctuality concerns noted. Faculty should ensure consistent class schedules and timely communication of any cancellations.','high',1,'2026-10-08 09:05:47'),(12,'Grading','weakness','grading, grades, feedback, tagal','keyword','contains',NULL,'Grading and feedback timeliness was mentioned. Ensure evaluations are returned promptly with constructive comments to support student improvement.','medium',1,'2026-10-08 09:05:47'),(13,'Fairness','weakness','unfair, bias, favoritism','keyword','contains',NULL,'Fairness concerns raised by students. Review grading criteria transparency and ensure equal treatment of all students.','high',1,'2026-10-08 09:05:47'),(14,'Respect','weakness','rude, bastos, masungit, disrespectful','keyword','contains',NULL,'Professionalism concerns raised. Faculty should foster a respectful and inclusive learning environment at all times.','high',1,'2026-10-08 09:05:47'),(15,'Supportiveness','strength','helpful, approachable, supportive, mabait, maalaga','keyword','contains',NULL,'Students consistently appreciate the supportive and approachable teaching style. Maintain this student-centered approach.','positive',1,'2026-10-08 09:05:47'),(16,'Expertise','strength','knowledgeable, expert, magaling, galing, husay','keyword','contains',NULL,'Strong subject matter expertise recognized. Consider sharing best practices through department-level knowledge sharing sessions.','positive',1,'2026-10-08 09:05:47'),(17,'Organization','strength','organized, prepared, structured','keyword','contains',NULL,'Students noted strong organization and preparedness. This is a key strength that positively impacts learning outcomes.','positive',1,'2026-10-08 09:05:47'),(18,'Engagement','strength','engaging, interactive, fun, masaya, saya, enjoy','keyword','contains',NULL,'High student engagement observed. The use of interactive and varied teaching methods is contributing to positive learning experiences.','positive',1,'2026-10-08 09:05:47'),(19,'Clarity','strength','clear, linaw','keyword','contains',NULL,'Clear and effective communication is a notable strength. Continue using examples and structured explanations.','positive',1,'2026-10-08 09:05:47'),(20,'InnovativeTech','strength','ai, robotic, automated','keyword','contains',NULL,'Pioneering use of emerging AI tools in instruction recognized.','positive',1,'2026-10-08 09:11:06');
/*!40000 ALTER TABLE `recommendation_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_subjects`
--

DROP TABLE IF EXISTS `student_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id_old` int(11) NOT NULL,
  `student_id` varchar(20) NOT NULL,
  `subject_id_old` int(11) NOT NULL,
  `subject_id` varchar(20) NOT NULL,
  `faculty_id_old` int(11) DEFAULT NULL,
  `faculty_id` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_subject` (`student_id_old`,`subject_id_old`),
  KEY `subject_id` (`subject_id_old`),
  KEY `fk_student_subjects_faculty` (`faculty_id_old`),
  KEY `fk_student_subjects_student` (`student_id`),
  KEY `fk_student_subjects_subject` (`subject_id`),
  KEY `fk_student_subjects_faculty2` (`faculty_id`),
  CONSTRAINT `fk_student_subjects_faculty2` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_student_subjects_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_student_subjects_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_subjects`
--

LOCK TABLES `student_subjects` WRITE;
/*!40000 ALTER TABLE `student_subjects` DISABLE KEYS */;
INSERT INTO `student_subjects` VALUES (15,20,'std_6aa1b6',1,'sub_74e21e',0,'fac_670364'),(16,21,'std_a26dfb',1,'sub_74e21e',14,'fac_7a0a37'),(17,22,'std_6bcd68',1,'sub_74e21e',0,'fac_670364'),(31,31,'std_a96091',3,'sub_9caf92',3,'fac_9aee87'),(38,36,'std_5427e5',7,'sub_34a0a2',7,'fac_9f621e'),(39,37,'std_0389aa',7,'sub_34a0a2',7,'fac_9f621e'),(43,41,'std_acaee0',9,'sub_93e09c',9,'fac_8686b0'),(133,45,'std_8d3914',10,'sub_e76efb',10,'fac_217248'),(134,4,'std_b3f541',1,'sub_74e21e',0,'fac_670364'),(135,5,'std_0f2152',76,'sub_54bcb5',3,'fac_9aee87'),(136,11,'std_acc9a3',77,'sub_ff3a28',8,'fac_598cb1'),(137,13,'std_7987a4',76,'sub_54bcb5',3,'fac_9aee87'),(138,14,'std_90d859',78,'sub_48c86b',18,'fac_86942f'),(140,29,'std_cf054a',4,'sub_08c2d6',3,'fac_9aee87'),(141,30,'std_a8e070',4,'sub_08c2d6',18,'fac_86942f'),(143,4,'std_b3f541',5,'sub_538337',6,'fac_fe44ef'),(144,23,'std_afd7b2',1,'sub_74e21e',14,'fac_7a0a37'),(145,23,'std_afd7b2',2,'sub_676c26',6,'fac_fe44ef'),(146,24,'std_520eb0',1,'sub_74e21e',0,'fac_670364'),(147,24,'std_520eb0',2,'sub_676c26',0,'fac_670364'),(151,5,'std_0f2152',3,'sub_9caf92',8,'fac_598cb1'),(152,5,'std_0f2152',6,'sub_2af4a9',18,'fac_86942f'),(153,11,'std_acc9a3',3,'sub_9caf92',8,'fac_598cb1'),(154,11,'std_acc9a3',4,'sub_08c2d6',18,'fac_86942f'),(155,13,'std_7987a4',3,'sub_9caf92',8,'fac_598cb1'),(156,13,'std_7987a4',6,'sub_2af4a9',18,'fac_86942f'),(157,14,'std_90d859',3,'sub_9caf92',3,'fac_9aee87'),(158,14,'std_90d859',4,'sub_08c2d6',3,'fac_9aee87'),(159,29,'std_cf054a',3,'sub_9caf92',3,'fac_9aee87');
/*!40000 ALTER TABLE `student_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id_old` int(11) NOT NULL,
  `id` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `year_level` varchar(20) NOT NULL,
  `section` varchar(50) NOT NULL,
  `department` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (37,'std_0389aa','Hannah Salazar','student22@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','1st Year','A','Engineering',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:44'),(5,'std_0f2152','Hero Reyes','student2@psu.edu.ph','$2a$10$SomgDnQE9LuHdxdktVcgTO74vhDGx7lfVSJwkWihoPObx92XGPWua','4th Year','B','Information Technology',1,NULL,'2026-03-14 05:03:09','2026-10-08 07:42:04'),(24,'std_520eb0','Olivia Reyes','student7@psu.edu.ph','$2a$10$bDRslMC.1A3oiXV3f1LUAei07b5p2moIFuxJGMsJv2Lf.FPwDjqO.','3rd Year','A','Business Administration',1,NULL,'2026-09-27 06:17:33','2026-09-27 07:10:44'),(36,'std_5427e5','Gabriel Castro','student21@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','2nd Year','A','Engineering',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:44'),(20,'std_6aa1b6','Daniel Ramos','student9@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','2nd Year','A','Computer Science',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:44'),(22,'std_6bcd68','Paolo Santos','student11@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','1st Year','A','Computer Science',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:44'),(106,'std_7770d3','Arjay Kasam','studentB@psu.edu.ph','$2a$10$N4tyUC3gUVDLkPlksaLc3.bdF/3FRznc5REWtTQ/12ao53Azs31xG','1st Year','B','Information Technology',0,'8be237a7af6decfd98bdac31d3ed8a1c4f1dd998a816e87f2fbe5fe0e9013f29','2026-05-25 08:01:27','2026-09-27 07:10:44'),(13,'std_7987a4','Jordan Dave Caparas','student4@psu.edu.ph','$2a$10$SomgDnQE9LuHdxdktVcgTO74vhDGx7lfVSJwkWihoPObx92XGPWua','4th Year','B','Information Technology',1,NULL,'2026-03-15 04:01:06','2026-10-08 07:42:04'),(45,'std_8d3914','Peter Gonzales','student30@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','2nd Year','A','Business Administration',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:44'),(14,'std_90d859','Junard Chua','student5@psu.edu.ph','$2a$10$SomgDnQE9LuHdxdktVcgTO74vhDGx7lfVSJwkWihoPObx92XGPWua','4th Year','A','Information Technology',1,NULL,'2026-03-15 13:14:30','2026-10-08 07:42:04'),(21,'std_a26dfb','Maria Lopez','student10@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','2nd Year','B','Computer Science',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:44'),(30,'std_a8e070','John Michael Rivera','student15@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','2nd Year','B','Information Technology',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:44'),(31,'std_a96091','Bianca Torres','student16@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','1st Year','A','Information Technology',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:44'),(41,'std_acaee0','Leo Santiago','student26@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','2nd Year','A','Education',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:44'),(11,'std_acc9a3','Mark Len','student3@psu.edu.ph','$2a$10$SomgDnQE9LuHdxdktVcgTO74vhDGx7lfVSJwkWihoPObx92XGPWua','4th Year','B','Information Technology',1,NULL,'2026-03-15 03:45:05','2026-10-08 07:42:04'),(23,'std_afd7b2','Nathan Cruz','student6@psu.edu.ph','$2a$10$bDRslMC.1A3oiXV3f1LUAei07b5p2moIFuxJGMsJv2Lf.FPwDjqO.','4th Year','B','Business Administration',1,NULL,'2026-09-27 06:17:33','2026-09-27 07:10:44'),(4,'std_b3f541','Raymond Heras','student1@psu.edu.ph','$2a$10$SomgDnQE9LuHdxdktVcgTO74vhDGx7lfVSJwkWihoPObx92XGPWua','4th Year','A','Computer Science',1,NULL,'2026-03-14 05:03:09','2026-10-08 07:42:04'),(29,'std_cf054a','Alyssa Mendoza','student14@psu.edu.ph','$2a$10$08kOnIXl4kV7KrkzFUsVz.tiqTLvbfNKs3gbB6A9fSQI1Iq7y94Wm','2nd Year','A','Information Technology',1,NULL,'2026-05-19 01:44:23','2026-09-27 07:10:44');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subjects` (
  `id_old` int(11) NOT NULL,
  `id` varchar(20) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `semester` enum('1st','2nd','both') DEFAULT 'both',
  `year_level` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (109,'sub_047ace','BA402','Business Research','Business Administration','both','4th Year','2026-05-24 23:57:48'),(94,'sub_0535ef','EDU301','Classroom Management','Education','both','3rd Year','2026-05-24 23:57:48'),(70,'sub_0537f5','IT103','Computer Hardware Servicing','Information Technology','both','1st Year','2026-05-24 23:57:48'),(4,'sub_08c2d6','IT102','Network Administration','Information Technology','both','1st Year','2026-05-01 10:33:01'),(88,'sub_0915e8','ENG403','Engineering Ethics','Engineering','both','4th Year','2026-05-24 23:57:48'),(99,'sub_0d4b8c','EDU403','Educational Leadership','Education','both','4th Year','2026-05-24 23:57:48'),(93,'sub_0f14b4','EDU203','Facilitating Learner-Centered Teaching','Education','both','2nd Year','2026-05-24 23:57:48'),(96,'sub_121791','EDU303','Teaching Internship Preparation','Education','both','3rd Year','2026-05-24 23:57:48'),(65,'sub_1770c0','CS302','Computer Networks','Computer Science','both','3rd Year','2026-05-24 23:57:48'),(80,'sub_2423b4','ENG103','Physics for Engineers','Engineering','both','1st Year','2026-05-24 23:57:48'),(6,'sub_2af4a9','IT201','Web Development','Information Technology','both','2nd Year','2026-05-19 01:44:23'),(7,'sub_34a0a2','ENG101','Engineering Mathematics','Engineering','both','1st Year','2026-05-19 01:44:23'),(103,'sub_36770a','BA202','Business Law','Business Administration','both','2nd Year','2026-05-24 23:57:48'),(66,'sub_372b69','CS303','Web Application Development','Computer Science','both','3rd Year','2026-05-24 23:57:48'),(82,'sub_3f2377','ENG203','Materials Science','Engineering','both','2nd Year','2026-05-24 23:57:48'),(74,'sub_4056c6','IT302','Database Administration','Information Technology','both','3rd Year','2026-05-24 23:57:48'),(104,'sub_415aa9','BA203','Managerial Accounting','Business Administration','both','2nd Year','2026-05-24 23:57:48'),(79,'sub_4801f6','ENG102','Engineering Drawing','Engineering','both','1st Year','2026-05-24 23:57:48'),(78,'sub_48c86b','IT403','Cybersecurity Operations','Information Technology','both','4th Year','2026-05-24 23:57:48'),(5,'sub_538337','CS201','Operating Systems','Computer Science','both','2nd Year','2026-05-19 01:44:23'),(84,'sub_5437d9','ENG302','Electrical Circuits','Engineering','both','3rd Year','2026-05-24 23:57:48'),(76,'sub_54bcb5','IT401','IT Project Management','Information Technology','both','4th Year','2026-05-24 23:57:48'),(95,'sub_65ada8','EDU302','Inclusive Education','Education','both','3rd Year','2026-05-24 23:57:48'),(2,'sub_676c26','CS102','Data Structures','Computer Science','both','1st Year','2026-05-01 10:33:01'),(1,'sub_74e21e','CS101','Computer Programming 1','Computer Science','both','1st Year','2026-05-01 10:33:01'),(108,'sub_7b341e','BA401','Strategic Management','Business Administration','both','4th Year','2026-05-24 23:57:48'),(87,'sub_7e48ff','ENG402','Project Management for Engineers','Engineering','both','4th Year','2026-05-24 23:57:48'),(75,'sub_8236f3','IT303','Cloud Computing','Information Technology','both','3rd Year','2026-05-24 23:57:48'),(64,'sub_868665','CS301','Software Engineering','Computer Science','both','3rd Year','2026-05-24 23:57:48'),(9,'sub_93e09c','EDU101','Principles of Teaching','Education','both','1st Year','2026-05-19 01:44:23'),(62,'sub_954b26','CS202','Database Systems','Computer Science','both','2nd Year','2026-05-24 23:57:48'),(68,'sub_964f1b','CS402','Capstone Project 1','Computer Science','both','4th Year','2026-05-24 23:57:48'),(92,'sub_986356','EDU202','Assessment of Learning','Education','both','2nd Year','2026-05-24 23:57:48'),(3,'sub_9caf92','IT101','Information Assurance and Security','Information Technology','both','1st Year','2026-05-01 10:33:01'),(81,'sub_a1f3e9','ENG202','Engineering Mechanics','Engineering','both','2nd Year','2026-05-24 23:57:48'),(98,'sub_a2abf1','EDU402','Action Research in Education','Education','both','4th Year','2026-05-24 23:57:48'),(85,'sub_aa7b21','ENG303','Control Systems','Engineering','both','3rd Year','2026-05-24 23:57:48'),(107,'sub_ad0b32','BA303','Entrepreneurship','Business Administration','both','3rd Year','2026-05-24 23:57:48'),(83,'sub_b26372','ENG301','Fluid Mechanics','Engineering','both','3rd Year','2026-05-24 23:57:48'),(91,'sub_b46db5','EDU201','Curriculum Development','Education','both','2nd Year','2026-05-24 23:57:48'),(69,'sub_b4a403','CS403','Information Security','Computer Science','both','4th Year','2026-05-24 23:57:48'),(86,'sub_bb2772','ENG401','Engineering Design Project','Engineering','both','4th Year','2026-05-24 23:57:48'),(100,'sub_c9ca75','BA102','Principles of Management','Business Administration','both','1st Year','2026-05-24 23:57:48'),(97,'sub_cb32cf','EDU401','Practice Teaching','Education','both','4th Year','2026-05-24 23:57:48'),(73,'sub_ced3f7','IT301','Mobile Application Development','Information Technology','both','3rd Year','2026-05-24 23:57:48'),(110,'sub_d17626','BA403','Business Ethics and Corporate Governance','Business Administration','both','4th Year','2026-05-24 23:57:48'),(61,'sub_d3afbb','CS103','Discrete Structures','Computer Science','both','1st Year','2026-05-24 23:57:48'),(90,'sub_d4735a','EDU103','Educational Technology','Education','both','1st Year','2026-05-24 23:57:48'),(72,'sub_db09f8','IT203','Human Computer Interaction','Information Technology','both','2nd Year','2026-05-24 23:57:48'),(63,'sub_dbbb09','CS203','Object-Oriented Programming','Computer Science','both','2nd Year','2026-05-24 23:57:48'),(67,'sub_dfbc69','CS401','Artificial Intelligence','Computer Science','both','4th Year','2026-05-24 23:57:48'),(102,'sub_e26fdd','BA201','Marketing Management','Business Administration','both','2nd Year','2026-05-24 23:57:48'),(8,'sub_e36abf','ENG201','Thermodynamics','Engineering','both','2nd Year','2026-05-19 01:44:23'),(10,'sub_e76efb','BA101','Financial Management','Business Administration','both','1st Year','2026-05-19 01:44:23'),(106,'sub_eeead4','BA302','Operations Management','Business Administration','both','3rd Year','2026-05-24 23:57:48'),(105,'sub_f00a02','BA301','Human Resource Management','Business Administration','both','3rd Year','2026-05-24 23:57:48'),(89,'sub_f176f8','EDU102','Child and Adolescent Development','Education','both','1st Year','2026-05-24 23:57:48'),(71,'sub_f27a60','IT202','Systems Integration and Architecture','Information Technology','both','2nd Year','2026-05-24 23:57:48'),(101,'sub_f2e3ea','BA103','Business Mathematics','Business Administration','both','1st Year','2026-05-24 23:57:48'),(77,'sub_ff3a28','IT402','Capstone Project','Information Technology','both','4th Year','2026-05-24 23:57:48');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'faculty_evaluation_db_dev'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-20 23:42:27
