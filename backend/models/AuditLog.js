const { pool } = require('../config/db');

const AuditLog = {
  /**
   * Log an administrative or sensitive system action.
   * NEVER pass passwords, auth tokens, secrets, or raw student feedback/comment texts.
   *
   * @param {Object} entry
   * @param {string} entry.actor_role - e.g. 'admin', 'faculty', 'student', 'system'
   * @param {string|number} entry.actor_id - ID of user performing the action
   * @param {string} entry.action - action code (e.g. 'PERIOD_CREATE', 'PERIOD_ACTIVATE')
   * @param {string} [entry.target] - target resource/identifier (e.g. 'academic_period:2')
   * @param {Object|string} [entry.details] - metadata/diff (will be serialized to JSON)
   * @param {string} [entry.ip_address] - request IP address
   * @param {import('mysql2/promise').PoolConnection} [connection] - optional connection
   * @returns {Promise<Object>}
   */
  log: async ({ actor_role, actor_id, action, target = null, details = null, ip_address = null }, connection = null) => {
    try {
      const executor = connection || pool;
      let serializedDetails = details;
      if (details !== null && typeof details === 'object') {
        // Redact any accidentally passed sensitive keys
        const sanitized = { ...details };
        const sensitiveKeys = ['password', 'token', 'jwt', 'secret', 'comment', 'strengths', 'weaknesses'];
        for (const k of Object.keys(sanitized)) {
          if (sensitiveKeys.some(s => k.toLowerCase().includes(s))) {
            sanitized[k] = '[REDACTED]';
          }
        }
        serializedDetails = JSON.stringify(sanitized);
      }

      const [result] = await executor.execute(
        `INSERT INTO audit_log (actor_role, actor_id, action, target, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          String(actor_role || 'system'),
          String(actor_id || 'unknown'),
          String(action),
          target ? String(target) : null,
          serializedDetails ? String(serializedDetails) : null,
          ip_address ? String(ip_address) : null,
        ]
      );
      return result;
    } catch (err) {
      // Audit logging failures must not break the primary flow, but should be logged to stderr
      console.error('Failed to write audit log entry:', err.message);
      return null;
    }
  },

  /**
   * Fetch audit logs with pagination and optional filters (Admin read-only).
   */
  findAll: async ({ limit = 50, offset = 0, action = null, actor_role = null } = {}) => {
    const conditions = [];
    const params = [];

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    if (actor_role) {
      conditions.push('actor_role = ?');
      params.push(actor_role);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const [rows] = await pool.execute(
      `SELECT id, actor_role, actor_id, action, target, details, ip_address, created_at
       FROM audit_log
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM audit_log ${whereClause}`,
      params
    );

    return {
      logs: rows,
      total: countRows[0].total,
      limit: safeLimit,
      offset: safeOffset,
    };
  },
};

module.exports = AuditLog;
