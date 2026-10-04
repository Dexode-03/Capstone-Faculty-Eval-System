-- =============================================================
-- Migration Task 1.3 Rollback: Enforce uniqueness and period integrity
-- Description:
--   1. Drop triggers on academic_periods.
--   2. Ensure individual index for student_id foreign key constraint.
--   3. Drop composite UNIQUE constraint uq_evaluations_student_faculty_period.
--   4. Alter evaluations.academic_period_id back to INT(11) DEFAULT NULL.
-- =============================================================

-- Step 1: Drop triggers
DROP TRIGGER IF EXISTS `trg_academic_periods_single_active_ins`;
DROP TRIGGER IF EXISTS `trg_academic_periods_single_active_upd`;

-- Step 2: Ensure index for student_id foreign key exists
ALTER TABLE `evaluations`
ADD INDEX IF NOT EXISTS `fk_evaluations_student` (`student_id`);

-- Step 3: Drop UNIQUE constraint
ALTER TABLE `evaluations`
DROP INDEX IF EXISTS `uq_evaluations_student_faculty_period`;

-- Step 4: Revert academic_period_id to nullable
ALTER TABLE `evaluations`
MODIFY COLUMN `academic_period_id` INT(11) DEFAULT NULL;
