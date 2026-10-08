const RecommendationRule = require('../models/RecommendationRule');
const AuditLog = require('../models/AuditLog');

/**
 * GET /api/recommendation-rules
 * List all recommendation rules (Admin only)
 */
const getAllRules = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const rules = await RecommendationRule.findAll();
    res.json({ success: true, rules });
  } catch (error) {
    console.error('Error fetching recommendation rules:', error);
    res.status(500).json({ message: 'Server error fetching recommendation rules.' });
  }
};

/**
 * POST /api/recommendation-rules
 * Create a new rule (Admin only)
 */
const createRule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const {
      theme,
      rule_type,
      keywords,
      metric,
      operator,
      threshold,
      recommendation_text,
      severity,
      is_active,
    } = req.body;

    if (!theme || !recommendation_text) {
      return res.status(400).json({ message: 'theme and recommendation_text are required.' });
    }

    const result = await RecommendationRule.create({
      theme,
      rule_type,
      keywords,
      metric,
      operator,
      threshold,
      recommendation_text,
      severity,
      is_active,
    });

    await AuditLog.log({
      actor_role: 'admin',
      actor_id: req.user.id,
      action: 'RULE_CREATE',
      target: `rule:${result.insertId}`,
      details: { theme, rule_type, metric, recommendation_text },
      ip_address: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Recommendation rule created successfully.',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Error creating recommendation rule:', error);
    res.status(500).json({ message: 'Server error creating recommendation rule.' });
  }
};

/**
 * PUT /api/recommendation-rules/:id
 * Update an existing rule (Admin only)
 */
const updateRule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { id } = req.params;
    const existing = await RecommendationRule.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Rule not found.' });
    }

    await RecommendationRule.update(id, req.body);

    await AuditLog.log({
      actor_role: 'admin',
      actor_id: req.user.id,
      action: 'RULE_UPDATE',
      target: `rule:${id}`,
      details: { previous: { theme: existing.theme }, updated: req.body },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'Recommendation rule updated successfully.' });
  } catch (error) {
    console.error('Error updating recommendation rule:', error);
    res.status(500).json({ message: 'Server error updating recommendation rule.' });
  }
};

/**
 * DELETE /api/recommendation-rules/:id
 * Delete a rule (Admin only)
 */
const deleteRule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { id } = req.params;
    const existing = await RecommendationRule.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Rule not found.' });
    }

    await RecommendationRule.delete(id);

    await AuditLog.log({
      actor_role: 'admin',
      actor_id: req.user.id,
      action: 'RULE_DELETE',
      target: `rule:${id}`,
      details: { theme: existing.theme, recommendation_text: existing.recommendation_text },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'Recommendation rule deleted successfully.' });
  } catch (error) {
    console.error('Error deleting recommendation rule:', error);
    res.status(500).json({ message: 'Server error deleting recommendation rule.' });
  }
};

module.exports = {
  getAllRules,
  createRule,
  updateRule,
  deleteRule,
};
