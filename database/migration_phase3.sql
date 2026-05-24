-- =============================================================
-- Phase 3 Migration: Section-Aware Faculty-Subject Assignments
-- Run this on your EXISTING faculty_evaluation_db database
-- =============================================================

-- Add section, year_level, and semester columns to faculty_subjects
ALTER TABLE `faculty_subjects`
  ADD COLUMN `section` varchar(50) DEFAULT NULL AFTER `subject_id`,
  ADD COLUMN `year_level` varchar(20) DEFAULT NULL AFTER `section`,
  ADD COLUMN `semester` enum('1st','2nd','both') DEFAULT 'both' AFTER `year_level`;

-- Verify the changes
SELECT 'Migration complete. faculty_subjects now has section, year_level, semester columns.' AS status;
DESCRIBE `faculty_subjects`;
