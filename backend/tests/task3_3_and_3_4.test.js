const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const { pool } = require('../config/db');

describe('Task 3.3: Question Management & Task 3.4: Audit Log', () => {
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

  let createdQuestionId = null;

  it('allows admin to create a new evaluation question', async () => {
    const res = await request(app)
      .post('/api/evaluation-questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        category: 'A. Management of Teaching and Learning',
        question_type: 'rating',
        question: 'Demonstrates clear expectations for class requirements.',
        sort_order: 18,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.id);
    createdQuestionId = res.body.id;

    // Verify audit log
    const [audit] = await pool.execute(
      'SELECT * FROM audit_log WHERE action = "QUESTION_CREATE" AND target = ?',
      [`question:${createdQuestionId}`]
    );
    assert.equal(audit.length, 1);
    assert.equal(audit[0].actor_role, 'admin');
  });

  it('prevents non-admin from creating questions', async () => {
    const res = await request(app)
      .post('/api/evaluation-questions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        category: 'A. Management of Teaching and Learning',
        question_type: 'rating',
        question: 'Unauthorized question attempt',
      });

    assert.equal(res.status, 403);
  });

  it('allows admin to deactivate a question (soft-delete)', async () => {
    assert.ok(createdQuestionId);

    const res = await request(app)
      .put(`/api/evaluation-questions/${createdQuestionId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify it is deactivated in DB
    const [rows] = await pool.execute(
      'SELECT is_active FROM evaluation_questions WHERE id = ?',
      [createdQuestionId]
    );
    assert.equal(rows[0].is_active, 0);

    // Verify active listing for students does NOT include it
    const activeRes = await request(app)
      .get('/api/evaluation/questions')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(activeRes.status, 200);
    const found = activeRes.body.questions.find((q) => q.id === createdQuestionId);
    assert.equal(found, undefined);
  });

  it('prevents editing question text/type when historical responses exist', async () => {
    // Question 1 has existing responses from seed evaluations
    const res = await request(app)
      .put('/api/evaluation-questions/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        question: 'Altered historical question text that would invalidate past ratings',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /cannot edit text or type/i);
  });

  it('allows admin to query audit logs with pagination', async () => {
    const res = await request(app)
      .get('/api/audit-logs?limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.logs));
    assert.ok(res.body.logs.length > 0);
    assert.ok(res.body.total >= 1);
  });

  it('prevents non-admin from viewing audit logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 403);
  });

  it('logs admin access to faculty report in audit log', async () => {
    const res = await request(app)
      .get('/api/evaluation/faculty/fac_082c7b')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);

    const [audit] = await pool.execute(
      'SELECT * FROM audit_log WHERE action = "REPORT_ACCESS_FACULTY" AND target = "faculty:fac_082c7b" ORDER BY id DESC LIMIT 1'
    );
    assert.equal(audit.length, 1);
    assert.equal(audit[0].actor_role, 'admin');
  });
});
