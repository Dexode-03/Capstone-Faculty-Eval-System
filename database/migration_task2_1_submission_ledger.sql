-- =============================================================
-- Migration Task 2.1: Separate "who submitted" from "what was said"
-- Description:
--   1. Create evaluation_submissions identity ledger table.
--   2. Backfill ledger from existing evaluations rows.
--   3. Drop student_id FK and column from evaluations.
--   4. Drop now-redundant unique constraint from evaluations
--      (uniqueness now enforced on evaluation_submissions).
--   5. evaluation_submissions carries evaluation_id FK so a
--      student can still query their own submissions.
-- =============================================================

-- Step 1: Create the identity ledger table
CREATE TABLE IF NOT EXISTS `evaluation_submissions` (
  `id`                 INT(11)      NOT NULL AUTO_INCREMENT,
  `student_id`         VARCHAR(36)  NOT NULL,
  `faculty_id`         VARCHAR(36)  NOT NULL,
  `academic_period_id` INT(11)      NOT NULL,
  `evaluation_id`      INT(11)      NOT NULL,
  `submitted_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_submissions_student_faculty_period`
    (`student_id`, `faculty_id`, `academic_period_id`),
  UNIQUE KEY `uq_submissions_evaluation_id` (`evaluation_id`),
  KEY `idx_submissions_student_id` (`student_id`),
  KEY `idx_submissions_faculty_id` (`faculty_id`),
  KEY `idx_submissions_period_id`  (`academic_period_id`),
  CONSTRAINT `es_fk_student`
    FOREIGN KEY (`student_id`)         REFERENCES `students`         (`id`) ON DELETE CASCADE,
  CONSTRAINT `es_fk_faculty`
    FOREIGN KEY (`faculty_id`)         REFERENCES `faculty`          (`id`) ON DELETE CASCADE,
  CONSTRAINT `es_fk_period`
    FOREIGN KEY (`academic_period_id`) REFERENCES `academic_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `es_fk_evaluation`
    FOREIGN KEY (`evaluation_id`)      REFERENCES `evaluations`      (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 2: Backfill ledger from existing evaluations data
INSERT INTO `evaluation_submissions`
  (`student_id`, `faculty_id`, `academic_period_id`, `evaluation_id`, `submitted_at`)
SELECT
  `student_id`,
  `faculty_id`,
  `academic_period_id`,
  `id`,
  `created_at`
FROM `evaluations`
WHERE `student_id` IS NOT NULL
ON DUPLICATE KEY UPDATE `evaluation_id` = VALUES(`evaluation_id`);

-- Step 3: Drop the student_id foreign key constraint from evaluations
ALTER TABLE `evaluations`
  DROP FOREIGN KEY `fk_evaluations_student`;

-- Step 4: Drop student_id index (named student_id_old from prior migration)
ALTER TABLE `evaluations`
  DROP INDEX IF EXISTS `student_id`;

-- Step 5: Drop student_id column from evaluations
ALTER TABLE `evaluations`
  DROP COLUMN `student_id`;

-- Step 6: Drop legacy old-format columns if present
ALTER TABLE `evaluations`
  DROP COLUMN IF EXISTS `student_id_old`,
  DROP COLUMN IF EXISTS `faculty_id_old`;
