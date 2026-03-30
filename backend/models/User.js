const { pool } = require('../config/db');

const User = {
  // Create a new user
  create: async ({ name, email, password, role, verification_token, year_level, section, department }) => {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, verification_token, year_level, section, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, role, verification_token, year_level || null, section || null, department || null]
    );
    return result;
  },

  // Find user by email
  findByEmail: async (email) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT id, name, email, role, year_level, section, department, email_verified, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  // Find user by verification token
  findByVerificationToken: async (token) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE verification_token = ?', [token]);
    return rows[0];
  },

  // Verify user email
  verifyEmail: async (id) => {
    const [result] = await pool.execute(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = ?',
      [id]
    );
    return result;
  },

  // Update user password
  updatePassword: async (email, password) => {
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [password, email]
    );
    return result;
  },

  // Count users by role
  countByRole: async (role) => {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', [role]);
    return rows[0].count;
  },
};

module.exports = User;
