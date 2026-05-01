const { pool } = require('../config/db');

const Subject = {
  // Get all subjects
  findAll: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM subjects ORDER BY department ASC, code ASC'
    );
    return rows;
  },

  // Find subject by ID
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT * FROM subjects WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Find subject by code
  findByCode: async (code) => {
    const [rows] = await pool.execute(
      'SELECT * FROM subjects WHERE code = ?',
      [code]
    );
    return rows[0];
  },

  // Find subjects by department
  findByDepartment: async (department) => {
    const [rows] = await pool.execute(
      'SELECT * FROM subjects WHERE department = ? ORDER BY code ASC',
      [department]
    );
    return rows;
  },

  // Create a new subject
  create: async ({ code, name, department }) => {
    const [result] = await pool.execute(
      'INSERT INTO subjects (code, name, department) VALUES (?, ?, ?)',
      [code, name, department]
    );
    return result;
  },

  // Update a subject
  update: async (id, { code, name, department }) => {
    const [result] = await pool.execute(
      'UPDATE subjects SET code = ?, name = ?, department = ? WHERE id = ?',
      [code, name, department, id]
    );
    return result;
  },

  // Delete a subject
  delete: async (id) => {
    const [result] = await pool.execute(
      'DELETE FROM subjects WHERE id = ?',
      [id]
    );
    return result;
  },

  // Count total subjects
  count: async () => {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM subjects');
    return rows[0].count;
  },
};

module.exports = Subject;
