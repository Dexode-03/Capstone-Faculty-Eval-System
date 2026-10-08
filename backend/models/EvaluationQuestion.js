const { pool } = require('../config/db');

const EvaluationQuestion = {
  findAllActive: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM evaluation_questions WHERE is_active = TRUE ORDER BY sort_order ASC'
    );
    return rows;
  },

  findAll: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM evaluation_questions ORDER BY sort_order ASC, id ASC'
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM evaluation_questions WHERE id = ?', [id]);
    return rows[0] || null;
  },

  countResponses: async (id) => {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM evaluation_responses WHERE question_id = ?',
      [id]
    );
    return rows[0].count;
  },

  create: async ({ category, question_type, category_description = null, question, sort_order = 0, is_active = 1 }) => {
    const [result] = await pool.execute(
      `INSERT INTO evaluation_questions
         (category, question_type, category_description, question, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [category, question_type, category_description, question, sort_order, is_active ? 1 : 0]
    );
    return result;
  },

  update: async (id, { category, question_type, category_description, question, sort_order, is_active }) => {
    const existing = await EvaluationQuestion.findById(id);
    if (!existing) return null;

    const [result] = await pool.execute(
      `UPDATE evaluation_questions
       SET category = ?, question_type = ?, category_description = ?, question = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [
        category !== undefined ? category : existing.category,
        question_type !== undefined ? question_type : existing.question_type,
        category_description !== undefined ? category_description : existing.category_description,
        question !== undefined ? question : existing.question,
        sort_order !== undefined ? sort_order : existing.sort_order,
        is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
        id,
      ]
    );
    return result;
  },

  deactivate: async (id) => {
    const [result] = await pool.execute(
      'UPDATE evaluation_questions SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result;
  },

  reorder: async (orderPairs) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const { id, sort_order } of orderPairs) {
        await connection.execute(
          'UPDATE evaluation_questions SET sort_order = ? WHERE id = ?',
          [sort_order, id]
        );
      }
      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },
};

module.exports = EvaluationQuestion;
