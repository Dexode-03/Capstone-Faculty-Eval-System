-- =============================================================
-- Migration Task 4.1: Schema Cleanup and Referential Integrity
-- Description:
--   1. Drop unused legacy columns from evaluations:
--      - student_id_new
--      - faculty_id_new
--   2. Clean up any orphaned (subject_id, faculty_id) combinations
--      in student_subjects where faculty_id does not match faculty_subjects.
--   3. Add index on faculty_subjects(subject_id, faculty_id).
--   4. Add composite foreign key constraint:
--      student_subjects(subject_id, faculty_id) -> faculty_subjects(subject_id, faculty_id)
--      with ON DELETE SET NULL ON UPDATE CASCADE.
-- =============================================================

-- ── 1. Drop unused legacy columns from evaluations ────────────
-- MariaDB 10.2+ / MySQL 8.0 support DROP COLUMN IF EXISTS
ALTER TABLE `evaluations`
  DROP COLUMN IF EXISTS `student_id_new`,
  DROP COLUMN IF EXISTS `faculty_id_new`;

-- ── 2. Add composite index on faculty_subjects for FK reference 
ALTER TABLE `faculty_subjects`
  ADD INDEX IF NOT EXISTS `idx_facsubj_subject_faculty` (`subject_id`, `faculty_id`);

-- ── 3. Clean up any orphan rows in student_subjects ───────────
-- If student_subjects has a non-NULL faculty_id that doesn't exist in faculty_subjects, set to NULL
UPDATE `student_subjects` ss
LEFT JOIN `faculty_subjects` fs
  ON fs.subject_id = ss.subject_id AND fs.faculty_id = ss.faculty_id
SET ss.faculty_id = NULL
WHERE ss.faculty_id IS NOT NULL AND fs.id IS NULL;

-- ── 4. Add composite foreign key constraint ───────────────────
-- Remove existing constraint if re-running
ALTER TABLE `student_subjects`
  DROP FOREIGN KEY IF EXISTS `fk_student_subjects_faculty_subject`;

ALTER TABLE `student_subjects`
  ADD CONSTRAINT `fk_student_subjects_faculty_subject`
  FOREIGN KEY (`subject_id`, `faculty_id`)
  REFERENCES `faculty_subjects` (`subject_id`, `faculty_id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
