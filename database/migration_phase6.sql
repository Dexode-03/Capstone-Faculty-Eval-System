-- =============================================================
-- Phase 6 Migration: Database Normalization & Section Alignment
-- Run this on your EXISTING database to:
-- 1. Drop redundant year_level and semester columns from faculty_subjects
-- 2. Drop redundant student_id column and indices from faculty_subjects
-- 3. Distribute appropriate distinct sections (A, B, C, D) among faculty members
-- 4. Establish a UNIQUE constraint on (subject_id, section) to prevent duplicate assignments
-- =============================================================

-- ── 1. Delete redundant evaluation linkage rows ──
-- Student enrollments are now fully resolved dynamically based on sections!
DELETE FROM `faculty_subjects` WHERE `student_id` IS NOT NULL;

-- ── 2. Drop Redundant Columns & Constraints ──
-- Drop year_level and semester
ALTER TABLE `faculty_subjects`
DROP COLUMN `year_level`,
DROP COLUMN `semester`;

-- Drop student foreign key constraint
ALTER TABLE `faculty_subjects` DROP FOREIGN KEY `fk_faculty_subjects_student`;

-- Create standard indexes to support key columns during index drop
CREATE INDEX `idx_faculty_id` ON `faculty_subjects`(`faculty_id`);
CREATE INDEX `idx_subject_id` ON `faculty_subjects`(`subject_id`);

-- Drop unique composite key unique_faculty_subject_student
ALTER TABLE `faculty_subjects` DROP INDEX `unique_faculty_subject_student`;

-- Drop student_id column
ALTER TABLE `faculty_subjects` DROP COLUMN `student_id`;

-- ── 3. Assign Distinct Sections to Master Assignments ──
UPDATE `faculty_subjects` SET `section` = 'A' WHERE `faculty_id` = 10 AND `subject_id` = 10;
UPDATE `faculty_subjects` SET `section` = 'B' WHERE `faculty_id` = 29 AND `subject_id` = 10;
UPDATE `faculty_subjects` SET `section` = 'C' WHERE `faculty_id` = 30 AND `subject_id` = 10;
UPDATE `faculty_subjects` SET `section` = 'D' WHERE `faculty_id` = 31 AND `subject_id` = 10;
UPDATE `faculty_subjects` SET `section` = 'A' WHERE `faculty_id` = 2 AND `subject_id` = 1;
UPDATE `faculty_subjects` SET `section` = 'B' WHERE `faculty_id` = 14 AND `subject_id` = 1;
UPDATE `faculty_subjects` SET `section` = 'A' WHERE `faculty_id` = 2 AND `subject_id` = 2;
UPDATE `faculty_subjects` SET `section` = 'B' WHERE `faculty_id` = 6 AND `subject_id` = 2;
UPDATE `faculty_subjects` SET `section` = 'C' WHERE `faculty_id` = 15 AND `subject_id` = 2;
UPDATE `faculty_subjects` SET `section` = 'A' WHERE `faculty_id` = 6 AND `subject_id` = 5;
UPDATE `faculty_subjects` SET `section` = 'B' WHERE `faculty_id` = 14 AND `subject_id` = 5;
UPDATE `faculty_subjects` SET `section` = 'A' WHERE `faculty_id` = 9 AND `subject_id` = 9;
UPDATE `faculty_subjects` SET `section` = 'B' WHERE `faculty_id` = 25 AND `subject_id` = 9;
UPDATE `faculty_subjects` SET `section` = 'C' WHERE `faculty_id` = 26 AND `subject_id` = 9;
UPDATE `faculty_subjects` SET `section` = 'D' WHERE `faculty_id` = 27 AND `subject_id` = 9;
UPDATE `faculty_subjects` SET `section` = 'A' WHERE `faculty_id` = 7 AND `subject_id` = 7;
UPDATE `faculty_subjects` SET `section` = 'B' WHERE `faculty_id` = 11 AND `subject_id` = 7;
UPDATE `faculty_subjects` SET `section` = 'C' WHERE `faculty_id` = 22 AND `subject_id` = 7;
UPDATE `faculty_subjects` SET `section` = 'A' WHERE `faculty_id` = 7 AND `subject_id` = 8;
UPDATE `faculty_subjects` SET `section` = 'B' WHERE `faculty_id` = 11 AND `subject_id` = 8;
UPDATE `faculty_subjects` SET `section` = 'C' WHERE `faculty_id` = 23 AND `subject_id` = 8;
UPDATE `faculty_subjects` SET `section` = 'A' WHERE `faculty_id` = 3 AND `subject_id` = 3;
UPDATE `faculty_subjects` SET `section` = 'B' WHERE `faculty_id` = 8 AND `subject_id` = 3;
UPDATE `faculty_subjects` SET `section` = 'C' WHERE `faculty_id` = 19 AND `subject_id` = 3;
UPDATE `faculty_subjects` SET `section` = 'A' WHERE `faculty_id` = 3 AND `subject_id` = 4;
UPDATE `faculty_subjects` SET `section` = 'B' WHERE `faculty_id` = 18 AND `subject_id` = 4;
UPDATE `faculty_subjects` SET `section` = 'A' WHERE `faculty_id` = 8 AND `subject_id` = 6;
UPDATE `faculty_subjects` SET `section` = 'B' WHERE `faculty_id` = 18 AND `subject_id` = 6;

-- ── 4. Align Student Enrollments (student_subjects) ──
-- Align student_subjects to the faculty member assigned to the student's section
UPDATE `student_subjects` ss
INNER JOIN `students` st ON st.id = ss.student_id
INNER JOIN `faculty_subjects` fs ON fs.subject_id = ss.subject_id 
  AND fs.section = st.section 
SET ss.faculty_id = fs.faculty_id;

-- ── 5. Add UNIQUE constraint on (subject_id, section) ──
ALTER TABLE `faculty_subjects`
ADD UNIQUE KEY `unique_subject_section` (`subject_id`, `section`);

-- Verify results
SELECT 'Phase 6 migration successfully completed.' AS status;
DESCRIBE `faculty_subjects`;
