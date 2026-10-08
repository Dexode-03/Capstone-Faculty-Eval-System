const AuditLog = require('../models/AuditLog');

/**
 * GET /api/audit-logs
 * Fetch audit logs (Admin only, read-only)
 */
const getLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { limit, offset, action, actor_role } = req.query;
    const result = await AuditLog.findAll({
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
      action: action || null,
      actor_role: actor_role || null,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error fetching audit logs.' });
  }
};

module.exports = { getLogs };
