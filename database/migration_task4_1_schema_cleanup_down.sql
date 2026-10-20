-- =============================================================
-- Migration Task 4.1 DOWN: Rollback Schema Cleanup
-- =============================================================

-- ── 1. Drop composite foreign key from student_subjects ───────
ALTER TABLE `student_subjects`
  DROP FOREIGN KEY IF EXISTS `fk_student_subjects_faculty_subject`;

-- ── 2. Drop composite index from faculty_subjects ─────────────
ALTER TABLE `faculty_subjects`
  DROP INDEX IF EXISTS `idx_facsubj_subject_faculty`;

-- ── 3. Re-add legacy columns to evaluations ───────────────────
ALTER TABLE `evaluations`
  ADD COLUMN IF NOT EXISTS `student_id_new` varchar(36) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `faculty_id_new` varchar(36) DEFAULT NULL;
