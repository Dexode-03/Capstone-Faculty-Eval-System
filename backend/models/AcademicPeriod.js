const { pool } = require('../config/db');

const AcademicPeriod = {
  // Get all academic periods
  findAll: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_periods ORDER BY academic_year DESC, semester DESC'
    );
    return rows;
  },

  // Get active academic period
  getActive: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_periods WHERE is_active = 1 LIMIT 1'
    );
    return rows[0] || null;
  },

  // Find by ID
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_periods WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // Create a new academic period
  create: async ({ academic_year, semester, start_date, end_date }) => {
    const [result] = await pool.execute(
      'INSERT INTO academic_periods (academic_year, semester, start_date, end_date) VALUES (?, ?, ?, ?)',
      [academic_year, semester, start_date || null, end_date || null]
    );
    return result;
  },

  // Update an academic period
  update: async (id, { academic_year, semester, start_date, end_date }) => {
    const [result] = await pool.execute(
      'UPDATE academic_periods SET academic_year = ?, semester = ?, start_date = ?, end_date = ? WHERE id = ?',
      [academic_year, semester, start_date || null, end_date || null, id]
    );
    return result;
  },

  // Set a period as active (deactivates all others)
  setActive: async (id) => {
    // Deactivate all
    await pool.execute('UPDATE academic_periods SET is_active = 0');
    // Activate the selected one
    const [result] = await pool.execute(
      'UPDATE academic_periods SET is_active = 1 WHERE id = ?',
      [id]
    );
    return result;
  },

  // Delete an academic period
  delete: async (id) => {
    const [result] = await pool.execute(
      'DELETE FROM academic_periods WHERE id = ?',
      [id]
    );
    return result;
  },

  // Toggle evaluation_open on the active period
  toggleEvaluation: async (open) => {
    const [result] = await pool.execute(
      'UPDATE academic_periods SET evaluation_open = ? WHERE is_active = 1',
      [open ? 1 : 0]
    );
    return result;
  },

  // Check if evaluation is currently open
  isEvaluationOpen: async () => {
    const [rows] = await pool.execute(
      'SELECT evaluation_open FROM academic_periods WHERE is_active = 1 LIMIT 1'
    );
    return rows.length > 0 && rows[0].evaluation_open === 1;
  },
};

module.exports = AcademicPeriod;
