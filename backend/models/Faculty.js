const { pool } = require('../config/db');

const Faculty = {
  // Create a new faculty member
  create: async ({ user_id, name, department }) => {
    const [result] = await pool.execute(
      'INSERT INTO faculty (user_id, name, department) VALUES (?, ?, ?)',
      [user_id, name, department]
    );
    return result;
  },

  // Get all faculty members
  findAll: async () => {
    const [rows] = await pool.execute('SELECT * FROM faculty ORDER BY name ASC');
    return rows;
  },

  // Find faculty by department
  findByDepartment: async (department) => {
    const [rows] = await pool.execute('SELECT * FROM faculty WHERE department = ? ORDER BY name ASC', [department]);
    return rows;
  },

  // Find faculty by ID
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM faculty WHERE id = ?', [id]);
    return rows[0];
  },

  // Count total faculty
  count: async () => {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM faculty');
    return rows[0].count;
  },

  // Update faculty
  update: async (id, { name, department }) => {
    const [result] = await pool.execute(
      'UPDATE faculty SET name = ?, department = ? WHERE id = ?',
      [name, department, id]
    );
    return result;
  },

  // Delete faculty
  delete: async (id) => {
    const [result] = await pool.execute('DELETE FROM faculty WHERE id = ?', [id]);
    return result;
  },
};

module.exports = Faculty;
