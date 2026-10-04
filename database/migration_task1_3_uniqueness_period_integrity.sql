-- =============================================================
-- Migration Task 1.3: Enforce uniqueness and period integrity
-- Description:
--   1. Backfill any evaluations with NULL academic_period_id to 1.
--   2. Alter evaluations.academic_period_id to INT(11) NOT NULL.
--   3. Add UNIQUE constraint on (student_id, faculty_id, academic_period_id).
--   4. Add triggers on academic_periods ensuring only one period is active.
-- =============================================================

-- Step 1: Backfill any NULL academic_period_id to 1
UPDATE `evaluations`
SET `academic_period_id` = 1
WHERE `academic_period_id` IS NULL;

-- Step 2: Make academic_period_id NOT NULL
ALTER TABLE `evaluations`
MODIFY COLUMN `academic_period_id` INT(11) NOT NULL;

-- Step 3: Add UNIQUE constraint on (student_id, faculty_id, academic_period_id)
ALTER TABLE `evaluations`
DROP INDEX IF EXISTS `uq_evaluations_student_faculty_period`;

ALTER TABLE `evaluations`
ADD CONSTRAINT `uq_evaluations_student_faculty_period`
UNIQUE (`student_id`, `faculty_id`, `academic_period_id`);

-- Step 4: Add trigger ensuring only one active academic period on INSERT
DROP TRIGGER IF EXISTS `trg_academic_periods_single_active_ins`;

DELIMITER //
CREATE TRIGGER `trg_academic_periods_single_active_ins`
BEFORE INSERT ON `academic_periods`
FOR EACH ROW
BEGIN
  IF NEW.is_active = 1 AND (SELECT COUNT(*) FROM `academic_periods` WHERE `is_active` = 1) > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one academic period can be active at a time';
  END IF;
END//
DELIMITER ;

-- Step 5: Add trigger ensuring only one active academic period on UPDATE
DROP TRIGGER IF EXISTS `trg_academic_periods_single_active_upd`;

DELIMITER //
CREATE TRIGGER `trg_academic_periods_single_active_upd`
BEFORE UPDATE ON `academic_periods`
FOR EACH ROW
BEGIN
  IF NEW.is_active = 1 AND (SELECT COUNT(*) FROM `academic_periods` WHERE `is_active` = 1 AND `id` <> NEW.id) > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one academic period can be active at a time';
  END IF;
END//
DELIMITER ;
