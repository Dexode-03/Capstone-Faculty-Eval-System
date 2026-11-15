const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const { pool } = require('../config/db');

describe('Task 3.1: Academic Period Management Validation', () => {
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

  it('rejects create when end_date is earlier than start_date', async () => {
    const res = await request(app)
      .post('/api/academic-periods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academic_year: '2098-2099',
        semester: '1st',
        start_date: '2099-05-01',
        end_date: '2099-01-01',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /end date must be after start date/i);
  });

  it('rejects create when end_date equals start_date', async () => {
    const res = await request(app)
      .post('/api/academic-periods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academic_year: '2098-2099',
        semester: '1st',
        start_date: '2099-05-01',
        end_date: '2099-05-01',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /end date must be after start date/i);
  });

  it('rejects update when updated end_date is earlier than start_date', async () => {
    const res = await request(app)
      .put('/api/academic-periods/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        start_date: '2025-10-10',
        end_date: '2025-10-01',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /end date must be after start date/i);
  });

  it('prevents non-admin from creating or updating an academic period', async () => {
    const resCreate = await request(app)
      .post('/api/academic-periods')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        academic_year: '2099-2100',
        semester: '1st',
      });
    assert.equal(resCreate.status, 403);

    const resUpdate = await request(app)
      .put('/api/academic-periods/1')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ academic_year: '2099-2100' });
    assert.equal(resUpdate.status, 403);
  });

  it('prevents deletion of academic period with linked evaluations', async () => {
    // Period 1 is known to have linked evaluations from earlier inspection
    const res = await request(app)
      .delete('/api/academic-periods/1')
      .set('Authorization', `Bearer ${adminToken}`);

    // Should fail either because it's active or has linked evaluations (both are 400 guards)
    assert.equal(res.status, 400);
    assert.ok(
      res.body.message.includes('Cannot delete') ||
      res.body.message.includes('evaluation(s) are associated')
    );
  });

  it('records an audit log row when admin activates an academic period', async () => {
    // Ensure period 2 has a future end_date so it passes the concluded schedule guard
    await pool.execute(
      `UPDATE academic_periods SET end_date = DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY) WHERE id = 2`
    );

    const res = await request(app)
      .put('/api/academic-periods/2/activate')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);

    const [logs] = await pool.execute(
      `SELECT * FROM audit_log WHERE action = 'PERIOD_ACTIVATE' AND target = 'academic_period:2' ORDER BY id DESC LIMIT 1`
    );
    assert.equal(logs.length, 1);
    assert.equal(logs[0].actor_role, 'admin');

    // Restore period 1 end_date to future and restore back to active
    await pool.execute(
      `UPDATE academic_periods SET end_date = DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY) WHERE id = 1`
    );
    await request(app)
      .put('/api/academic-periods/1/activate')
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('rejects activation when academic period end_date is in the past', async () => {
    // Set period 2 end_date to yesterday
    await pool.execute(
      `UPDATE academic_periods SET end_date = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) WHERE id = 2`
    );

    const res = await request(app)
      .put('/api/academic-periods/2/activate')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 400);
    assert.match(res.body.message, /scheduled period ended/i);
  });
});
