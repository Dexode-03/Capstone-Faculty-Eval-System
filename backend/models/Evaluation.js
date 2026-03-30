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

  // Get evaluations by faculty ID
  findByFacultyId: async (faculty_id) => {
    const [rows] = await pool.execute(
      `SELECT e.*, u.name as student_name
       FROM evaluations e
       JOIN users u ON e.student_id = u.id
       WHERE e.faculty_id = ?
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

  // Get all evaluations (for admin)
  findAll: async () => {
    const [rows] = await pool.execute(
      `SELECT e.*, u.name as student_name, f.name as faculty_name, f.department
       FROM evaluations e
       JOIN users u ON e.student_id = u.id
       JOIN faculty f ON e.faculty_id = f.id
       ORDER BY e.created_at DESC`
    );
    return rows;
  },
};

module.exports = Evaluation;
