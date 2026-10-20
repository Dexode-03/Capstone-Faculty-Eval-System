-- =============================================================
-- Migration Task 3B.10 DOWN: Remove performance indexes
-- =============================================================

ALTER TABLE `evaluations`
  DROP INDEX IF EXISTS `idx_eval_faculty_period`;

ALTER TABLE `evaluations`
  DROP INDEX IF EXISTS `idx_eval_period`;

ALTER TABLE `evaluation_responses`
  DROP INDEX IF EXISTS `idx_resp_eval_question`;

ALTER TABLE `student_subjects`
  DROP INDEX IF EXISTS `idx_stsubj_student_faculty`;

ALTER TABLE `faculty`
  DROP INDEX IF EXISTS `idx_faculty_department`;

ALTER TABLE `students`
  DROP INDEX IF EXISTS `idx_students_department`;

ALTER TABLE `academic_periods`
  DROP INDEX IF EXISTS `idx_acadperiod_active`;

ALTER TABLE `evaluation_questions`
  DROP INDEX IF EXISTS `idx_evalq_active_sort`;

ALTER TABLE `evaluations`
  DROP INDEX IF EXISTS `idx_eval_sentiment`;
