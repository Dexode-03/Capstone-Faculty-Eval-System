'use strict';

const { pool } = require('../config/db');

let tableInitialized = false;

const initTable = async () => {
  if (tableInitialized) return;
  const sql = `
    CREATE TABLE IF NOT EXISTS privacy_consents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      user_role VARCHAR(20) NOT NULL DEFAULT 'student',
      consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
      ip_address VARCHAR(45) NULL,
      accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_consent (user_id, user_role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `;
  try {
    await pool.execute(sql);
    tableInitialized = true;
  } catch (err) {
    // If pool is not connected or in unit test mode, don't crash
    if (process.env.NODE_ENV !== 'test') {
      console.error('Privacy consents table init notice:', err.message);
    }
  }
};

const PrivacyConsent = {
  initTable,

  hasAccepted: async (userId, userRole = 'student') => {
    try {
      await initTable();
      const [rows] = await pool.execute(
        'SELECT id, accepted_at, consent_version FROM privacy_consents WHERE user_id = ? AND user_role = ? LIMIT 1',
        [String(userId), userRole]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch {
      return null;
    }
  },

  recordConsent: async ({ userId, userRole = 'student', consentVersion = '1.0', ipAddress = null }) => {
    await initTable();
    const [result] = await pool.execute(
      `INSERT INTO privacy_consents (user_id, user_role, consent_version, ip_address)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE accepted_at = CURRENT_TIMESTAMP, ip_address = VALUES(ip_address)`,
      [String(userId), userRole, consentVersion, ipAddress]
    );
    return result;
  },
};

module.exports = PrivacyConsent;
