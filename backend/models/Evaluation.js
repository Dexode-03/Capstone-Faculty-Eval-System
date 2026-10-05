const { pool } = require('../config/db');

const Evaluation = {
  /**
   * Create a new evaluation content row.
   * student_id is NO LONGER stored here — it lives in evaluation_submissions.
   * Call EvaluationSubmission.create() in the same transaction after this.
   */
  create: async ({ anonymous_student_ref, faculty_id, rating, comment, strengths, weaknesses, sentiment, sentiment_score, academic_period_id }, connection = null) => {
    const executor = connection || pool;
    const [result] = await executor.execute(
      `INSERT INTO evaluations
         (anonymous_student_ref, faculty_id, rating, comment, strengths, weaknesses, sentiment, sentiment_score, academic_period_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [anonymous_student_ref || null, faculty_id, rating, comment, strengths || null, weaknesses || null, sentiment, sentiment_score, academic_period_id || null]
    );
    return result;
  },

  // Get evaluations by faculty ID — includes strengths/weaknesses from open-ended responses
  findByFacultyId: async (faculty_id) => {
    const [rows] = await pool.execute(
      `SELECT e.id, e.faculty_id, e.rating, e.comment, e.sentiment, e.sentiment_score, e.created_at,
              COALESCE(e.strengths, MAX(CASE WHEN eq.sort_order = 16 THEN er.text_response END)) as strengths,
              COALESCE(e.weaknesses, MAX(CASE WHEN eq.sort_order = 17 THEN er.text_response END)) as weaknesses
       FROM evaluations e
       LEFT JOIN evaluation_responses er ON er.evaluation_id = e.id
       LEFT JOIN evaluation_questions eq
              ON eq.id = er.question_id AND eq.question_type = 'text'
       WHERE e.faculty_id = ?
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [faculty_id]
    );
    return rows;
  },

  /**
   * @deprecated Moved to EvaluationSubmission.findByStudentId().
   * student_id is no longer stored in evaluations.
   */
  findByStudentId: async (_student_id) => {
    throw new Error('Evaluation.findByStudentId is removed. Use EvaluationSubmission.findByStudentId() instead.');
  },

  // Count total evaluations
  count: async () => {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM evaluations');
    return rows[0].count;
  },

  // Get sentiment overview counts
  getSentimentOverview: async () => {
    const [rows] = await pool.execute(
      `SELECT sentiment, COUNT(*) as count
       FROM evaluations
       GROUP BY sentiment`
    );
    return rows;
  },

  // Get average rating for a faculty member
  getAverageRating: async (faculty_id) => {
    const [rows] = await pool.execute(
      'SELECT AVG(rating) as avg_rating FROM evaluations WHERE faculty_id = ?',
      [faculty_id]
    );
    return rows[0].avg_rating;
  },

  // Get all evaluations (for admin/system analysis) — includes strengths/weaknesses
  findAll: async () => {
    const [rows] = await pool.execute(
      `SELECT e.id, e.faculty_id, e.rating, e.comment, e.sentiment, e.sentiment_score, e.created_at,
              f.name as faculty_name, f.department,
              COALESCE(e.strengths, MAX(CASE WHEN eq.sort_order = 16 THEN er.text_response END)) as strengths,
              COALESCE(e.weaknesses, MAX(CASE WHEN eq.sort_order = 17 THEN er.text_response END)) as weaknesses
       FROM evaluations e
       JOIN faculty f ON e.faculty_id = f.id
       LEFT JOIN evaluation_responses er ON er.evaluation_id = e.id
       LEFT JOIN evaluation_questions eq
              ON eq.id = er.question_id AND eq.question_type = 'text'
       GROUP BY e.id
       ORDER BY e.created_at DESC`
    );
    return rows;
  },

  // Get stats grouped by department
  getStatsByDepartment: async () => {
    const [rows] = await pool.execute(
      `SELECT f.department,
              COUNT(e.id) as total_evaluations,
              ROUND(AVG(e.rating), 1) as avg_rating,
              SUM(CASE WHEN e.sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
              SUM(CASE WHEN e.sentiment = 'neutral'  THEN 1 ELSE 0 END) as neutral,
              SUM(CASE WHEN e.sentiment = 'negative' THEN 1 ELSE 0 END) as negative
       FROM evaluations e
       JOIN faculty f ON e.faculty_id = f.id
       GROUP BY f.department
       ORDER BY total_evaluations DESC`
    );
    return rows;
  },

  /**
   * @deprecated Moved to EvaluationSubmission.getStudentPopulationByDepartment().
   * student_id is no longer stored in evaluations.
   */
  getStudentPopulationByDepartment: async () => {
    throw new Error('Evaluation.getStudentPopulationByDepartment is removed. Use EvaluationSubmission.getStudentPopulationByDepartment() instead.');
  },

  // Delete all evaluations (admin reset)
  deleteAll: async (connection = null) => {
    const executor = connection || pool;
    const [result] = await executor.execute('DELETE FROM evaluations');
    return result;
  },

  /**
   * @deprecated Moved to EvaluationSubmission.existsForStudentFacultyPeriod().
   * student_id is no longer stored in evaluations.
   */
  existsForStudentFacultyPeriod: async (_student_id, _faculty_id, _academic_period_id) => {
    throw new Error('Evaluation.existsForStudentFacultyPeriod is removed. Use EvaluationSubmission.existsForStudentFacultyPeriod() instead.');
  },
};

module.exports = Evaluation;