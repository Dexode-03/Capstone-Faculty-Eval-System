-- =============================================================
-- Rollback Task 2.1: Restore student_id to evaluations
-- =============================================================

-- Step 1: Re-add student_id column to evaluations
ALTER TABLE `evaluations`
  ADD COLUMN `student_id` VARCHAR(36) DEFAULT NULL
    AFTER `id`;

-- Step 2: Restore student_id values from the ledger
UPDATE `evaluations` e
  INNER JOIN `evaluation_submissions` es ON es.evaluation_id = e.id
SET e.student_id = es.student_id;

-- Step 3: Make student_id NOT NULL again
ALTER TABLE `evaluations`
  MODIFY COLUMN `student_id` VARCHAR(36) NOT NULL;

-- Step 4: Re-add foreign key constraint
ALTER TABLE `evaluations`
  ADD CONSTRAINT `evaluations_ibfk_1`
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

-- Step 5: Restore unique constraint on evaluations
ALTER TABLE `evaluations`
  ADD CONSTRAINT `uq_evaluations_student_faculty_period`
    UNIQUE (`student_id`, `faculty_id`, `academic_period_id`);

-- Step 6: Drop the ledger table
DROP TABLE IF EXISTS `evaluation_submissions`;
