const { pool } = require('../config/db');

const EvaluationResponse = {
  createBulk: async (evaluation_id, responses) => {
    if (!responses || responses.length === 0) return;

    // Each response is either a rated question { question_id, rating }
    // or an open-ended question { question_id, text_response }.
    // We must never pass undefined to mysql2 — use null instead.
    const values = responses.map(r => [
      evaluation_id,
      r.question_id,
      r.rating       !== undefined ? r.rating       : null,
      r.text_response !== undefined ? r.text_response : null,
    ]);

    const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
    const flat = values.flat();

    await pool.execute(
      `INSERT INTO evaluation_responses
         (evaluation_id, question_id, rating, text_response)
       VALUES ${placeholders}`,
      flat
    );
  },

  findByEvaluationId: async (evaluation_id) => {
    const [rows] = await pool.execute(
      `SELECT er.*, eq.question, eq.category, eq.question_type
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
      `SELECT eq.id, eq.question, eq.category, eq.question_type,
              AVG(er.rating) as avg_rating, COUNT(er.id) as total
       FROM evaluation_responses er
       JOIN evaluations e ON er.evaluation_id = e.id
       JOIN evaluation_questions eq ON er.question_id = eq.id
       WHERE e.faculty_id = ?
         AND eq.question_type = 'rating'
         AND er.rating IS NOT NULL
       GROUP BY eq.id, eq.question, eq.category, eq.question_type
       ORDER BY eq.sort_order ASC`,
      [faculty_id]
    );
    return rows;
  },
  // Delete all evaluation responses (admin reset)
  deleteAll: async () => {
    const [result] = await pool.execute('DELETE FROM evaluation_responses');
    return result;
  },
};

module.exports = EvaluationResponse;