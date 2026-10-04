const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const { pool } = require('../config/db');
const Evaluation = require('../models/Evaluation');
const EvaluationResponse = require('../models/EvaluationResponse');

describe('Task 1.4: Lock Down clear-all Route', () => {
  const adminId = 1;
  const adminEmail = 'admin@psu.edu.ph';
  const adminPasswordPlain = 'admin123';

  const adminToken = jwt.sign(
    { id: adminId, email: adminEmail, role: 'admin' },
    process.env.JWT_SECRET
  );

  const studentToken = jwt.sign(
    { id: 'std_test', email: 'student@psu.edu.ph', role: 'student' },
    process.env.JWT_SECRET
  );

  let originalAllowBulkDelete;
  let originalPoolExecute;

  before(async () => {
    originalAllowBulkDelete = process.env.ALLOW_BULK_DELETE;
  });

  after(() => {
    process.env.ALLOW_BULK_DELETE = originalAllowBulkDelete;
  });

  it('1. Returns 403 Forbidden by default when ALLOW_BULK_DELETE is not set or false', async () => {
    delete process.env.ALLOW_BULK_DELETE;

    const res = await request(app)
      .delete('/api/evaluation/clear-all')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        password: adminPasswordPlain,
        confirmation_phrase: 'DELETE ALL EVALUATIONS',
        backup_confirmed: true,
      });

    assert.equal(res.status, 403);
    assert.ok(
      res.body.message.includes('Bulk deletion is disabled on this server'),
      `Expected disabled message, got: ${res.body.message}`
    );
  });

  it('2. Returns 403 when accessed by non-admin user (student)', async () => {
    process.env.ALLOW_BULK_DELETE = 'true';

    const res = await request(app)
      .delete('/api/evaluation/clear-all')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        password: adminPasswordPlain,
        confirmation_phrase: 'DELETE ALL EVALUATIONS',
        backup_confirmed: true,
      });

    assert.equal(res.status, 403);
  });

  it('3. Returns 400 when admin password is not provided', async () => {
    process.env.ALLOW_BULK_DELETE = 'true';

    const res = await request(app)
      .delete('/api/evaluation/clear-all')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        confirmation_phrase: 'DELETE ALL EVALUATIONS',
        backup_confirmed: true,
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.message.includes('Admin password re-entry is required'));
  });

  it('4. Returns 401 when admin password is wrong', async () => {
    process.env.ALLOW_BULK_DELETE = 'true';

    // Mock pool.execute to return admin row with known hash
    const hashedPassword = await bcrypt.hash('correctPassword', 10);
    originalPoolExecute = pool.execute;
    pool.execute = async (sql, params) => {
      if (typeof sql === 'string' && sql.includes('FROM admins WHERE id = ?')) {
        return [[{ id: adminId, email: adminEmail, password: hashedPassword }]];
      }
      return originalPoolExecute.apply(pool, [sql, params]);
    };

    try {
      const res = await request(app)
        .delete('/api/evaluation/clear-all')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'wrongPassword',
          confirmation_phrase: 'DELETE ALL EVALUATIONS',
          backup_confirmed: true,
        });

      assert.equal(res.status, 401);
      assert.ok(res.body.message.includes('Invalid admin password'));
    } finally {
      pool.execute = originalPoolExecute;
    }
  });

  it('5. Returns 400 when typed confirmation phrase does not match', async () => {
    process.env.ALLOW_BULK_DELETE = 'true';

    const hashedPassword = await bcrypt.hash('correctPassword', 10);
    originalPoolExecute = pool.execute;
    pool.execute = async (sql, params) => {
      if (typeof sql === 'string' && sql.includes('FROM admins WHERE id = ?')) {
        return [[{ id: adminId, email: adminEmail, password: hashedPassword }]];
      }
      return originalPoolExecute.apply(pool, [sql, params]);
    };

    try {
      const res = await request(app)
        .delete('/api/evaluation/clear-all')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'correctPassword',
          confirmation_phrase: 'wrong phrase',
          backup_confirmed: true,
        });

      assert.equal(res.status, 400);
      assert.ok(res.body.message.includes('Typed confirmation phrase does not match'));
    } finally {
      pool.execute = originalPoolExecute;
    }
  });

  it('6. Returns 400 when backup confirmation is missing', async () => {
    process.env.ALLOW_BULK_DELETE = 'true';

    const hashedPassword = await bcrypt.hash('correctPassword', 10);
    originalPoolExecute = pool.execute;
    pool.execute = async (sql, params) => {
      if (typeof sql === 'string' && sql.includes('FROM admins WHERE id = ?')) {
        return [[{ id: adminId, email: adminEmail, password: hashedPassword }]];
      }
      return originalPoolExecute.apply(pool, [sql, params]);
    };

    try {
      const res = await request(app)
        .delete('/api/evaluation/clear-all')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'correctPassword',
          confirmation_phrase: 'DELETE ALL EVALUATIONS',
          // backup_confirmed omitted
        });

      assert.equal(res.status, 400);
      assert.ok(res.body.message.includes('backup'));
    } finally {
      pool.execute = originalPoolExecute;
    }
  });

  it('7. Successfully executes with all safeguards met (mocked DB, no real data deleted)', async () => {
    process.env.ALLOW_BULK_DELETE = 'true';

    const hashedPassword = await bcrypt.hash('correctPassword', 10);
    originalPoolExecute = pool.execute;
    const origGetConnection = pool.getConnection;
    const origEvalCount = Evaluation.count;
    const origEvalDeleteAll = Evaluation.deleteAll;
    const origRespDeleteAll = EvaluationResponse.deleteAll;

    let txBegan = false;
    let txCommitted = false;
    let txRolledBack = false;
    let mockEvalDeleted = false;
    let mockRespDeleted = false;

    pool.execute = async (sql, params) => {
      if (typeof sql === 'string' && sql.includes('FROM admins WHERE id = ?')) {
        return [[{ id: adminId, email: adminEmail, password: hashedPassword }]];
      }
      return originalPoolExecute.apply(pool, [sql, params]);
    };

    Evaluation.count = async () => 42;
    EvaluationResponse.deleteAll = async () => { mockRespDeleted = true; };
    Evaluation.deleteAll = async () => { mockEvalDeleted = true; };

    const mockConn = {
      beginTransaction: async () => { txBegan = true; },
      commit: async () => { txCommitted = true; },
      rollback: async () => { txRolledBack = true; },
      release: () => {},
    };
    pool.getConnection = async () => mockConn;

    try {
      const res = await request(app)
        .delete('/api/evaluation/clear-all')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'correctPassword',
          confirmation_phrase: 'DELETE ALL EVALUATIONS',
          backup_confirmed: true,
          backup_timestamp: new Date().toISOString(),
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.deletedCount, 42);
      assert.ok(txBegan, 'Transaction should have begun');
      assert.ok(txCommitted, 'Transaction should have committed');
      assert.equal(txRolledBack, false, 'Transaction should not have rolled back');
      assert.ok(mockRespDeleted, 'Response delete should have been called');
      assert.ok(mockEvalDeleted, 'Evaluation delete should have been called');
    } finally {
      pool.execute = originalPoolExecute;
      pool.getConnection = origGetConnection;
      Evaluation.count = origEvalCount;
      Evaluation.deleteAll = origEvalDeleteAll;
      EvaluationResponse.deleteAll = origRespDeleteAll;
    }
  });
});
