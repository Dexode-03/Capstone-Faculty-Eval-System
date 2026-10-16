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
      `SELECT e.id, e.faculty_id, e.rating, e.comment, e.sentiment, e.sentiment_score, e.created_at, e.academic_period_id,
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

  // Get all evaluations (for admin/system analysis) with optional parameterized filters (Task 3B.5 / FR-28)
  findAll: async (filters = {}) => {
    const { period, department, faculty, subject, year_level, section } = filters || {};
    const params = [];
    const whereClauses = [];

    const isSet = v => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim().toLowerCase() !== 'all';

    // Filter by academic period
    if (isSet(period)) {
      whereClauses.push('e.academic_period_id = ?');
      params.push(period);
    }

    // Filter by department
    if (isSet(department)) {
      whereClauses.push('f.department = ?');
      params.push(department);
    }

    // Filter by faculty ID
    if (isSet(faculty)) {
      whereClauses.push('e.faculty_id = ?');
      params.push(faculty);
    }

    // Filter by subject (subject_id or subject code)
    if (isSet(subject)) {
      whereClauses.push(`(
        e.id IN (
          SELECT es_sub.evaluation_id
          FROM evaluation_submissions es_sub
          INNER JOIN student_subjects ss_sub ON ss_sub.student_id = es_sub.student_id
          INNER JOIN subjects s_sub ON s_sub.id = ss_sub.subject_id
          WHERE (ss_sub.subject_id = ? OR s_sub.code = ?)
        )
      )`);
      params.push(subject, subject);
    }

    // Filter by year level
    if (isSet(year_level)) {
      whereClauses.push(`(
        e.id IN (
          SELECT es_sub.evaluation_id
          FROM evaluation_submissions es_sub
          INNER JOIN students st_sub ON st_sub.id = es_sub.student_id
          WHERE st_sub.year_level = ?
        )
      )`);
      params.push(year_level);
    }

    // Filter by section
    if (isSet(section)) {
      whereClauses.push(`(
        e.id IN (
          SELECT es_sub.evaluation_id
          FROM evaluation_submissions es_sub
          INNER JOIN students st_sub ON st_sub.id = es_sub.student_id
          WHERE st_sub.section = ?
        )
      )`);
      params.push(section);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT e.id, e.faculty_id, e.rating, e.comment, e.sentiment, e.sentiment_score, e.created_at, e.academic_period_id,
             f.name as faculty_name, f.department,
             COALESCE(e.strengths, MAX(CASE WHEN eq.sort_order = 16 THEN er.text_response END)) as strengths,
             COALESCE(e.weaknesses, MAX(CASE WHEN eq.sort_order = 17 THEN er.text_response END)) as weaknesses
      FROM evaluations e
      JOIN faculty f ON e.faculty_id = f.id
      LEFT JOIN evaluation_responses er ON er.evaluation_id = e.id
      LEFT JOIN evaluation_questions eq
             ON eq.id = er.question_id AND eq.question_type = 'text'
      ${whereSql}
      GROUP BY e.id, f.name, f.department, e.created_at, e.academic_period_id
      ORDER BY e.created_at DESC
    `;

    const [rows] = await pool.execute(query, params);
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

  /**
   * Get department benchmark average, excluding faculty with fewer evaluations than minThreshold (Task 3B.3 / FR-15).
   * @param {string} department
   * @param {number|string|null} academic_period_id
   * @param {number} minThreshold
   */
  getDepartmentBenchmark: async (department, academic_period_id = null, minThreshold = 5) => {
    let query = `
      SELECT 
        AVG(e.rating) as avg_rating,
        COUNT(e.id) as total_evaluations,
        COUNT(DISTINCT e.faculty_id) as qualifying_faculty_count
      FROM evaluations e
      JOIN faculty f ON e.faculty_id = f.id
      WHERE f.department = ?
    `;
    const params = [department];

    if (academic_period_id) {
      query += ` AND e.academic_period_id = ?
        AND e.faculty_id IN (
          SELECT sub_e.faculty_id
          FROM evaluations sub_e
          WHERE sub_e.academic_period_id = ?
          GROUP BY sub_e.faculty_id
          HAVING COUNT(sub_e.id) >= ?
        )`;
      params.push(academic_period_id, academic_period_id, minThreshold);
    } else {
      query += `
        AND e.faculty_id IN (
          SELECT sub_e.faculty_id
          FROM evaluations sub_e
          GROUP BY sub_e.faculty_id
          HAVING COUNT(sub_e.id) >= ?
        )`;
      params.push(minThreshold);
    }

    const [rows] = await pool.execute(query, params);
    const row = rows[0] || {};
    const avg = (row.avg_rating !== null && row.avg_rating !== undefined)
      ? parseFloat(parseFloat(row.avg_rating).toFixed(2))
      : null;
    return {
      department,
      averageRating: avg,
      totalEvaluations: parseInt(row.total_evaluations, 10) || 0,
      qualifyingFacultyCount: parseInt(row.qualifying_faculty_count, 10) || 0,
    };
  },

  /**
   * Get evaluations by faculty ID and academic period ID.
   * @param {string} faculty_id
   * @param {number|string} academic_period_id
   */
  findByFacultyAndPeriod: async (faculty_id, academic_period_id) => {
    const [rows] = await pool.execute(
      `SELECT e.id, e.faculty_id, e.rating, e.comment, e.sentiment, e.sentiment_score, e.created_at, e.academic_period_id,
              COALESCE(e.strengths, MAX(CASE WHEN eq.sort_order = 16 THEN er.text_response END)) as strengths,
              COALESCE(e.weaknesses, MAX(CASE WHEN eq.sort_order = 17 THEN er.text_response END)) as weaknesses
       FROM evaluations e
       LEFT JOIN evaluation_responses er ON er.evaluation_id = e.id
       LEFT JOIN evaluation_questions eq
              ON eq.id = er.question_id AND eq.question_type = 'text'
       WHERE e.faculty_id = ? AND e.academic_period_id = ?
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [faculty_id, academic_period_id]
    );
    return rows;
  },

  /**
   * Get period-by-period aggregate metrics for a faculty member (Task 3B.3 / FR-19).
   * @param {string} faculty_id
   */
  getPeriodAggregatesByFaculty: async (faculty_id) => {
    const [rows] = await pool.execute(
      `SELECT 
         ap.id as academic_period_id,
         COALESCE(ap.academic_year, 'Unassigned') as academic_year,
         COALESCE(ap.semester, '') as semester,
         COALESCE(ap.is_active, 0) as is_active,
         COUNT(e.id) as total_evaluations,
         ROUND(AVG(e.rating), 2) as avg_rating,
         SUM(CASE WHEN e.sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
         SUM(CASE WHEN e.sentiment = 'neutral'  THEN 1 ELSE 0 END) as neutral,
         SUM(CASE WHEN e.sentiment = 'negative' THEN 1 ELSE 0 END) as negative
       FROM evaluations e
       LEFT JOIN academic_periods ap ON e.academic_period_id = ap.id
       WHERE e.faculty_id = ?
       GROUP BY ap.id, ap.academic_year, ap.semester, ap.is_active
       ORDER BY ap.academic_year DESC, ap.semester DESC, ap.id DESC`,
      [faculty_id]
    );
    return rows;
  },
};

module.exports = Evaluation;