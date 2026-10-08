const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const { pool } = require('../config/db');
const { generateRecommendations } = require('../utils/sentimentAnalyzer');

describe('Task 3.2: Database-Backed Recommendation Rules', () => {
  after(async () => {
    await pool.end();
  });

  const adminToken = jwt.sign(
    { id: 'admin-1', email: 'admin@psu.edu.ph', role: 'admin' },
    process.env.JWT_SECRET
  );
  const studentToken = jwt.sign(
    { id: 'STU-001', email: 'student@psu.edu.ph', role: 'student' },
    process.env.JWT_SECRET
  );

  const sampleEvaluations = [
    {
      id: 1,
      rating: 4.8,
      comment: 'Very approachable and helpful professor.',
      strengths: 'helpful, approachable, knowledgeable',
      weaknesses: '',
      sentiment: 'positive',
      sentiment_score: 0.85,
    },
    {
      id: 2,
      rating: 4.6,
      comment: 'Great teaching and very organized.',
      strengths: 'organized, clear',
      weaknesses: '',
      sentiment: 'positive',
      sentiment_score: 0.80,
    },
    {
      id: 3,
      rating: 4.7,
      comment: 'Explains lessons well and very supportive.',
      strengths: 'supportive, mabait',
      weaknesses: '',
      sentiment: 'positive',
      sentiment_score: 0.90,
    },
  ];

  it('generates identical recommendations using seeded DB rules vs hardcoded fallback (Snapshot parity)', async () => {
    // 1. Generate with fallback (dbRules = null)
    const fallbackRecs = generateRecommendations(sampleEvaluations, null);

    // 2. Fetch seeded DB rules
    const [dbRules] = await pool.execute(
      'SELECT * FROM recommendation_rules WHERE is_active = 1 ORDER BY rule_type ASC, id ASC'
    );
    assert.ok(dbRules.length > 0);

    // 3. Generate with DB rules
    const dbRecs = generateRecommendations(sampleEvaluations, dbRules);

    // Assert parity
    assert.deepEqual(dbRecs, fallbackRecs);
  });

  it('allows admin to fetch all recommendation rules via API', async () => {
    const res = await request(app)
      .get('/api/recommendation-rules')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.rules));
    assert.ok(res.body.rules.length >= 19);
  });

  it('prevents non-admin from accessing recommendation rules API', async () => {
    const res = await request(app)
      .get('/api/recommendation-rules')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 403);
  });

  it('changing a rule in the database modifies recommendation output dynamically without redeploy', async () => {
    // Insert a custom dynamic rule
    const customRuleRes = await request(app)
      .post('/api/recommendation-rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        theme: 'InnovativeTech',
        rule_type: 'strength',
        keywords: 'robotics, automated, innovation',
        recommendation_text: 'Pioneering use of emerging robotics tools in instruction recognized.',
        severity: 'positive',
      });

    assert.equal(customRuleRes.status, 201);
    const ruleId = customRuleRes.body.id;

    // Verify audit log for rule creation
    const [audit] = await pool.execute(
      'SELECT * FROM audit_log WHERE action = "RULE_CREATE" AND target = ?',
      [`rule:${ruleId}`]
    );
    assert.equal(audit.length, 1);

    // Evaluations containing the new keyword "robotics"
    const techEvaluations = [
      {
        id: 10,
        rating: 4.8,
        comment: 'Great use of robotics tools in class!',
        strengths: 'robotics',
        weaknesses: '',
        sentiment: 'positive',
        sentiment_score: 0.9,
      },
    ];

    // Fetch updated rules from DB
    const [updatedRules] = await pool.execute(
      'SELECT * FROM recommendation_rules WHERE is_active = 1'
    );
    const recs = generateRecommendations(techEvaluations, updatedRules);

    const match = recs.some((r) => r.includes('Pioneering use of emerging robotics tools in instruction recognized.'));
    assert.ok(match, 'Expected new DB rule to trigger dynamically in recommendations');

    // Clean up created rule
    const delRes = await request(app)
      .delete(`/api/recommendation-rules/${ruleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(delRes.status, 200);
  });
});
