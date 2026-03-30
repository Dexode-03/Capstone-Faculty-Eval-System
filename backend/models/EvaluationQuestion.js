const { pool } = require('../config/db');

const EvaluationQuestion = {
  findAllActive: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM evaluation_questions WHERE is_active = TRUE ORDER BY sort_order ASC'
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM evaluation_questions WHERE id = ?', [id]);
    return rows[0];
  },
};

module.exports = EvaluationQuestion;
