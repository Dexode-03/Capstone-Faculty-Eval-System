const { pool } = require('../config/db');

const Faculty = {
  // Get all faculty members with subject info
  findAll: async () => {
    const [rows] = await pool.execute(
      `SELECT f.*, s.id as subject_id, s.code as subject_code, s.name as subject_name
       FROM faculty f
       LEFT JOIN subjects s ON s.id = f.subject_id
       ORDER BY f.name ASC`
    );
    return rows;
  },

  // Find faculty by department
  findByDepartment: async (department) => {
    const [rows] = await pool.execute(
      `SELECT f.*, s.id as subject_id, s.code as subject_code, s.name as subject_name
       FROM faculty f
       LEFT JOIN subjects s ON s.id = f.subject_id
       WHERE f.department = ?
       ORDER BY f.name ASC`,
      [department]
    );
    return rows;
  },

  // Find faculty by ID with subject info
  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT f.*, s.id as subject_id, s.code as subject_code, s.name as subject_name
       FROM faculty f
       LEFT JOIN subjects s ON s.id = f.subject_id
       WHERE f.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Find faculty by email
  findByEmail: async (email) => {
    const [rows] = await pool.execute(
      `SELECT f.*, s.code as subject_code, s.name as subject_name
       FROM faculty f
       LEFT JOIN subjects s ON s.id = f.subject_id
       WHERE f.email = ?`,
      [email]
    );
    return rows[0];
  },

  // Find faculty by subject
  findBySubject: async (subject_id) => {
    const [rows] = await pool.execute(
      `SELECT f.*, s.code as subject_code, s.name as subject_name
       FROM faculty f
       LEFT JOIN subjects s ON s.id = f.subject_id
       WHERE f.subject_id = ?
       ORDER BY f.name ASC`,
      [subject_id]
    );
    return rows;
  },

  // Count total faculty
  count: async () => {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM faculty');
    return rows[0].count;
  },

  // Update faculty
  update: async (id, { name, department, subject_id }) => {
    const [result] = await pool.execute(
      'UPDATE faculty SET name = ?, department = ?, subject_id = ? WHERE id = ?',
      [name, department, subject_id || null, id]
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