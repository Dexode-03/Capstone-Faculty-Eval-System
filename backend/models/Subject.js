const crypto = require('crypto');
const { pool } = require('../config/db');

// Generate unique subject ID in format: sub_xxxxxx (6 hex chars)
const generateSubjectId = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = `sub_${crypto.randomBytes(3).toString('hex')}`;
    const [rows] = await pool.execute('SELECT id FROM subjects WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) exists = false;
  }
  return id;
};

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
  create: async ({ code, name, department, semester, year_level }) => {
    const id = await generateSubjectId();
    const [result] = await pool.execute(
      'INSERT INTO subjects (id, code, name, department, semester, year_level) VALUES (?, ?, ?, ?, ?, ?)',
      [id, code, name, department, semester || 'both', year_level || null]
    );
    return { ...result, insertId: id };
  },

  // Update a subject
  update: async (id, { code, name, department, semester, year_level }) => {
    const [result] = await pool.execute(
      'UPDATE subjects SET code = ?, name = ?, department = ?, semester = ?, year_level = ? WHERE id = ?',
      [code, name, department, semester || 'both', year_level || null, id]
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
