-- =============================================================
-- Phase 2 Migration: Semester System
-- Run this on your EXISTING faculty_evaluation_db database
-- AFTER running migration_phase3.sql
-- =============================================================

-- 1. Create academic_periods table
CREATE TABLE IF NOT EXISTS `academic_periods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `academic_year` varchar(20) NOT NULL,
  `semester` enum('1st','2nd') NOT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Add semester and year_level to subjects table
ALTER TABLE `subjects`
  ADD COLUMN `semester` enum('1st','2nd','both') DEFAULT 'both' AFTER `department`,
  ADD COLUMN `year_level` varchar(20) DEFAULT NULL AFTER `semester`;

-- 3. Add academic_period_id to evaluations table
ALTER TABLE `evaluations`
  ADD COLUMN `academic_period_id` int(11) DEFAULT NULL AFTER `faculty_id_new`,
  ADD CONSTRAINT `fk_evaluations_academic_period`
    FOREIGN KEY (`academic_period_id`) REFERENCES `academic_periods`(`id`);

-- 4. Insert a default academic period
INSERT INTO `academic_periods` (`academic_year`, `semester`, `is_active`, `start_date`, `end_date`) VALUES
('2025-2026', '2nd', 1, '2026-01-01', '2026-06-30');

-- Verify
SELECT 'Phase 2 migration complete.' AS status;
DESCRIBE `academic_periods`;
DESCRIBE `subjects`;
