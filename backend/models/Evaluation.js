const { pool } = require('../config/db');

const Evaluation = {
  // Create a new evaluation
  create: async ({ student_id, faculty_id, rating, comment, sentiment, sentiment_score }) => {
    const [result] = await pool.execute(
      'INSERT INTO evaluations (student_id, faculty_id, rating, comment, sentiment, sentiment_score) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, faculty_id, rating, comment, sentiment, sentiment_score]
    );
    return result;
  },

  // Get evaluations by faculty ID — includes strengths/weaknesses from open-ended responses
  findByFacultyId: async (faculty_id) => {
    const [rows] = await pool.execute(
      `SELECT e.*, s.name as student_name,
              MAX(CASE WHEN eq.sort_order = 16 THEN er.text_response END) as strengths,
              MAX(CASE WHEN eq.sort_order = 17 THEN er.text_response END) as weaknesses
       FROM evaluations e
       JOIN students s ON e.student_id = s.id
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

  // Get evaluations by student ID
  findByStudentId: async (student_id) => {
    const [rows] = await pool.execute(
      `SELECT e.*, f.name as faculty_name, f.department
       FROM evaluations e
       JOIN faculty f ON e.faculty_id = f.id
       WHERE e.student_id = ?
       ORDER BY e.created_at DESC`,
      [student_id]
    );
    return rows;
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
      `SELECT e.*, s.name as student_name, f.name as faculty_name, f.department,
              MAX(CASE WHEN eq.sort_order = 16 THEN er.text_response END) as strengths,
              MAX(CASE WHEN eq.sort_order = 17 THEN er.text_response END) as weaknesses
       FROM evaluations e
       JOIN students s ON e.student_id = s.id
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

  // Get student population vs evaluated count grouped by department and year level
  getStudentPopulationByDepartment: async () => {
    const [rows] = await pool.execute(
      `SELECT
         s.department,
         s.year_level,
         COUNT(DISTINCT s.id) as total_students,
         COUNT(DISTINCT e.student_id) as evaluated_students
       FROM students s
       LEFT JOIN evaluations e ON e.student_id = s.id
       GROUP BY s.department, s.year_level
       ORDER BY s.department ASC, s.year_level ASC`
    );
    return rows;
  },

  // Delete all evaluations (admin reset)
  deleteAll: async () => {
    const [result] = await pool.execute('DELETE FROM evaluations');
    return result;
  },
};

module.exports = Evaluation;