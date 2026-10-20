-- =============================================================
-- Migration Task 3B.10: Performance indexes
-- Description:
--   Add covering indexes for the most common query patterns:
--     1. evaluations by faculty_id + academic_period_id (reports, benchmarks)
--     2. evaluations by academic_period_id alone (period-scoped analytics)
--     3. evaluation_responses by evaluation_id (JOIN in every report query)
--     4. student_subjects by student_id + faculty_id (enrollment lookups)
--     5. evaluation_submissions by student_id + faculty_id (enrolled-instructor checks)
--     6. faculty by department (department-scoped reports)
--     7. students by department (department population queries)
--     8. academic_periods by is_active (active period lookup)
--     9. evaluation_questions by is_active + sort_order (question listing)
--
-- Existing indexes (already present):
--   evaluations: PK(id), KEY(student_id)*, KEY(faculty_id)
--     * student_id column may have been dropped by migration_task2_1
--   evaluation_responses: PK(id), KEY(evaluation_id), KEY(question_id)
--   evaluation_submissions: PK(id), UNIQUE(student_id,faculty_id,academic_period_id),
--     UNIQUE(evaluation_id), KEY(student_id), KEY(faculty_id), KEY(academic_period_id)
--   faculty_subjects: PK(id), UNIQUE(subject_id,section), KEY(faculty_id), KEY(subject_id)
--   student_subjects: PK(id), UNIQUE(student_id,subject_id)
--   faculty: PK(id), UNIQUE(email)
--   students: PK(id), UNIQUE(email)
--
-- All statements use IF NOT EXISTS or CREATE INDEX patterns
-- that are safe to re-run (MariaDB 10.5+ supports IF NOT EXISTS).
-- For MariaDB 10.4, these will error harmlessly if index exists.
-- =============================================================

-- ── UP ──────────────────────────────────────────────────────

-- 1. Composite index on evaluations for faculty+period lookups
--    Covers: findByFacultyAndPeriod, getDepartmentBenchmark, getPeriodAggregatesByFaculty
ALTER TABLE `evaluations`
  ADD INDEX IF NOT EXISTS `idx_eval_faculty_period` (`faculty_id`, `academic_period_id`);

-- 2. Index on evaluations for period-only scoped queries
--    Covers: analysis with period filter, period-scoped aggregations
ALTER TABLE `evaluations`
  ADD INDEX IF NOT EXISTS `idx_eval_period` (`academic_period_id`);

-- 3. Covering index on evaluation_responses for JOINs with question lookups
--    Covers: every report query that LEFT JOINs responses + questions
ALTER TABLE `evaluation_responses`
  ADD INDEX IF NOT EXISTS `idx_resp_eval_question` (`evaluation_id`, `question_id`);

-- 4. Index on student_subjects for enrollment checks by student+faculty
--    Covers: getEnrolledInstructors (WHERE student_id = ? and faculty lookup)
ALTER TABLE `student_subjects`
  ADD INDEX IF NOT EXISTS `idx_stsubj_student_faculty` (`student_id`, `faculty_id`);

-- 5. Index on faculty by department for department-scoped queries
--    Covers: getStatsByDepartment, getDepartmentBenchmark, filter by department
ALTER TABLE `faculty`
  ADD INDEX IF NOT EXISTS `idx_faculty_department` (`department`);

-- 6. Index on students by department for population counts
--    Covers: getStudentPopulationByDepartment
ALTER TABLE `students`
  ADD INDEX IF NOT EXISTS `idx_students_department` (`department`);

-- 7. Index on academic_periods for active period lookups
--    Covers: AcademicPeriod.getActive(), isEvaluationOpen()
ALTER TABLE `academic_periods`
  ADD INDEX IF NOT EXISTS `idx_acadperiod_active` (`is_active`);

-- 8. Covering index on evaluation_questions for active question listing
--    Covers: getQuestions() — WHERE is_active = 1 ORDER BY sort_order
ALTER TABLE `evaluation_questions`
  ADD INDEX IF NOT EXISTS `idx_evalq_active_sort` (`is_active`, `sort_order`);

-- 9. Index on evaluations by sentiment for sentiment overview queries
--    Covers: getSentimentOverview()
ALTER TABLE `evaluations`
  ADD INDEX IF NOT EXISTS `idx_eval_sentiment` (`sentiment`);

-- 10. Composite index on evaluation_submissions for faster student+faculty lookups
--     Already has individual indexes; adding the pair for existsForStudentFacultyPeriod
--     (This is already covered by the UNIQUE key, so this is just documenting it)
