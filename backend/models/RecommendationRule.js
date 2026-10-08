const { pool } = require('../config/db');

const RecommendationRule = {
  findAllActive: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM recommendation_rules WHERE is_active = 1 ORDER BY rule_type ASC, id ASC'
    );
    return rows;
  },

  findAll: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM recommendation_rules ORDER BY rule_type ASC, id ASC'
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT * FROM recommendation_rules WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  create: async ({ theme, rule_type, keywords, metric, operator, threshold, recommendation_text, severity, is_active = 1 }) => {
    const [result] = await pool.execute(
      `INSERT INTO recommendation_rules
         (theme, rule_type, keywords, metric, operator, threshold, recommendation_text, severity, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        theme,
        rule_type || 'weakness',
        keywords || null,
        metric || 'keyword',
        operator || 'contains',
        threshold !== undefined && threshold !== null ? threshold : null,
        recommendation_text,
        severity || 'medium',
        is_active ? 1 : 0,
      ]
    );
    return result;
  },

  update: async (id, { theme, rule_type, keywords, metric, operator, threshold, recommendation_text, severity, is_active }) => {
    const existing = await RecommendationRule.findById(id);
    if (!existing) return null;

    const [result] = await pool.execute(
      `UPDATE recommendation_rules
       SET theme = ?, rule_type = ?, keywords = ?, metric = ?, operator = ?, threshold = ?,
           recommendation_text = ?, severity = ?, is_active = ?
       WHERE id = ?`,
      [
        theme !== undefined ? theme : existing.theme,
        rule_type !== undefined ? rule_type : existing.rule_type,
        keywords !== undefined ? keywords : existing.keywords,
        metric !== undefined ? metric : existing.metric,
        operator !== undefined ? operator : existing.operator,
        threshold !== undefined ? threshold : existing.threshold,
        recommendation_text !== undefined ? recommendation_text : existing.recommendation_text,
        severity !== undefined ? severity : existing.severity,
        is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
        id,
      ]
    );
    return result;
  },

  delete: async (id) => {
    const [result] = await pool.execute(
      'DELETE FROM recommendation_rules WHERE id = ?',
      [id]
    );
    return result;
  },
};

module.exports = RecommendationRule;
