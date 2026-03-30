const { pool } = require('../config/db');

const EvaluationResponse = {
  createBulk: async (evaluation_id, responses) => {
    if (!responses || responses.length === 0) return;
    const values = responses.map((r) => [evaluation_id, r.question_id, r.rating]);
    const placeholders = values.map(() => '(?, ?, ?)').join(', ');
    const flat = values.flat();
    await pool.execute(
      `INSERT INTO evaluation_responses (evaluation_id, question_id, rating) VALUES ${placeholders}`,
      flat
    );
  },

  findByEvaluationId: async (evaluation_id) => {
    const [rows] = await pool.execute(
      `SELECT er.*, eq.question, eq.category
       FROM evaluation_responses er
       JOIN evaluation_questions eq ON er.question_id = eq.id
       WHERE er.evaluation_id = ?
       ORDER BY eq.sort_order ASC`,
      [evaluation_id]
    );
    return rows;
  },

  getAveragesByFaculty: async (faculty_id) => {
    const [rows] = await pool.execute(
      `SELECT eq.id, eq.question, eq.category, AVG(er.rating) as avg_rating, COUNT(er.id) as total
       FROM evaluation_responses er
       JOIN evaluations e ON er.evaluation_id = e.id
       JOIN evaluation_questions eq ON er.question_id = eq.id
       WHERE e.faculty_id = ?
       GROUP BY eq.id, eq.question, eq.category
       ORDER BY eq.sort_order ASC`,
      [faculty_id]
    );
    return rows;
  },
};

module.exports = EvaluationResponse;
