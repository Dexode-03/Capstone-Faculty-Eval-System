const { pool } = require('../config/db');

const PasswordReset = {
  // Create a password reset token
  create: async ({ email, token, expires_at }) => {
    // Remove any existing reset tokens for this email
    await pool.execute('DELETE FROM password_resets WHERE email = ?', [email]);

    const [result] = await pool.execute(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, token, expires_at]
    );
    return result;
  },

  // Find by token (only if not expired)
  findByToken: async (token) => {
    const [rows] = await pool.execute(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    return rows[0];
  },

  // Delete token after use
  deleteByEmail: async (email) => {
    const [result] = await pool.execute('DELETE FROM password_resets WHERE email = ?', [email]);
    return result;
  },
};

module.exports = PasswordReset;
