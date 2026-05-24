-- =============================================================
-- Phase 5 Migration: Populate Year Levels and Semesters in Subjects
-- Run this on your EXISTING faculty_evaluation_db database
-- =============================================================

-- Populate year_level and semester for Computer Science subjects
UPDATE `subjects` 
SET `semester` = '1st', `year_level` = '1st Year' 
WHERE `code` = 'CS101';

UPDATE `subjects` 
SET `semester` = '2nd', `year_level` = '1st Year' 
WHERE `code` = 'CS102';

UPDATE `subjects` 
SET `semester` = '1st', `year_level` = '2nd Year' 
WHERE `code` = 'CS201';

-- Populate year_level and semester for Information Technology subjects
UPDATE `subjects` 
SET `semester` = '1st', `year_level` = '1st Year' 
WHERE `code` = 'IT101';

UPDATE `subjects` 
SET `semester` = '2nd', `year_level` = '1st Year' 
WHERE `code` = 'IT102';

UPDATE `subjects` 
SET `semester` = '1st', `year_level` = '2nd Year' 
WHERE `code` = 'IT201';

-- Populate year_level and semester for Engineering subjects
UPDATE `subjects` 
SET `semester` = '1st', `year_level` = '1st Year' 
WHERE `code` = 'ENG101';

UPDATE `subjects` 
SET `semester` = '2nd', `year_level` = '2nd Year' 
WHERE `code` = 'ENG201';

-- Populate year_level and semester for Education subjects
UPDATE `subjects` 
SET `semester` = '1st', `year_level` = '1st Year' 
WHERE `code` = 'EDU101';

-- Populate year_level and semester for Business Administration subjects
UPDATE `subjects` 
SET `semester` = '1st', `year_level` = '1st Year' 
WHERE `code` = 'BA101';

-- Verify the changes
SELECT 'Phase 5 migration complete: Subjects year levels and semesters populated.' AS status;
SELECT `code`, `name`, `department`, `semester`, `year_level` FROM `subjects`;
