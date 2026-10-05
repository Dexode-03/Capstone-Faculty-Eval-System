const { pool } = require('../config/db');

/**
 * EvaluationSubmission — the identity ledger.
 *
 * This table stores WHO submitted (student_id, faculty_id, period)
 * linked to WHICH content row (evaluation_id), but is intentionally
 * kept separate so that reports and analysis queries never need to
 * touch student identity.
 */
const EvaluationSubmission = {
  /**
   * Create a new submission ledger entry.
   * Must be called inside the same transaction as Evaluation.create.
   *
   * @param {{ student_id, faculty_id, academic_period_id, evaluation_id }} data
   * @param {import('mysql2/promise').PoolConnection|null} connection
   */
  create: async ({ student_id, faculty_id, academic_period_id, evaluation_id }, connection = null) => {
    const executor = connection || pool;
    const [result] = await executor.execute(
      `INSERT INTO evaluation_submissions
         (student_id, faculty_id, academic_period_id, evaluation_id)
       VALUES (?, ?, ?, ?)`,
      [student_id, faculty_id, academic_period_id, evaluation_id]
    );
    return result;
  },

  /**
   * Check whether a student has already submitted for a given faculty + period.
   * Used for duplicate-submission prevention (replaces Evaluation.existsForStudentFacultyPeriod).
   *
   * @param {string} student_id
   * @param {string} faculty_id
   * @param {number} academic_period_id
   * @returns {Promise<boolean>}
   */
  existsForStudentFacultyPeriod: async (student_id, faculty_id, academic_period_id) => {
    const [rows] = await pool.execute(
      `SELECT id FROM evaluation_submissions
       WHERE student_id = ? AND faculty_id = ? AND academic_period_id = ?
       LIMIT 1`,
      [String(student_id), String(faculty_id), academic_period_id]
    );
    return rows.length > 0;
  },

  /**
   * Get all submission ledger entries for a student.
   * Joins evaluation content so the student can see their own history.
   *
   * @param {string} student_id
   * @returns {Promise<Array>}
   */
  findByStudentId: async (student_id) => {
    const [rows] = await pool.execute(
      `SELECT es.id as submission_id,
              es.faculty_id,
              es.academic_period_id,
              es.evaluation_id,
              es.submitted_at,
              e.rating,
              e.comment,
              e.strengths,
              e.weaknesses,
              e.sentiment,
              e.sentiment_score,
              e.created_at,
              f.name  as faculty_name,
              f.department
       FROM evaluation_submissions es
       INNER JOIN evaluations e ON e.id = es.evaluation_id
       INNER JOIN faculty    f ON f.id = es.faculty_id
       WHERE es.student_id = ?
       ORDER BY es.submitted_at DESC`,
      [String(student_id)]
    );
    return rows;
  },

  /**
   * Get student population vs submitted count, grouped by department and year level.
   * Replaces the version in Evaluation that joined evaluations.student_id.
   *
   * @returns {Promise<Array>}
   */
  getStudentPopulationByDepartment: async () => {
    const [rows] = await pool.execute(
      `SELECT
         s.department,
         s.year_level,
         COUNT(DISTINCT s.id)   as total_students,
         COUNT(DISTINCT es.student_id) as evaluated_students
       FROM students s
       LEFT JOIN evaluation_submissions es ON es.student_id = s.id
       GROUP BY s.department, s.year_level
       ORDER BY s.department ASC, s.year_level ASC`
    );
    return rows;
  },

  /**
   * Delete all submission ledger rows.
   * Must be called inside the same transaction as Evaluation.deleteAll,
   * BEFORE the evaluations rows are deleted (FK constraint order).
   *
   * @param {import('mysql2/promise').PoolConnection|null} connection
   */
  deleteAll: async (connection = null) => {
    const executor = connection || pool;
    if (typeof executor.execute === 'function') {
      const [result] = await executor.execute('DELETE FROM evaluation_submissions');
      return result;
    }
    return [{ affectedRows: 0 }];
  },

  /**
   * Count total submissions (mirrors Evaluation.count for display purposes).
   *
   * @returns {Promise<number>}
   */
  count: async () => {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM evaluation_submissions');
    return rows[0].count;
  },
};

module.exports = EvaluationSubmission;
