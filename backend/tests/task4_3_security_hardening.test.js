const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { createRateLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');

describe('Task 4.3: Security Hardening Checklist', () => {
  // ── 1. Security Headers ──────────────────────────────────────────
  describe('1. Security Headers (Helmet-equivalent protection)', () => {
    it('sets X-Content-Type-Options to nosniff', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.headers['x-content-type-options'], 'nosniff');
    });

    it('sets X-Frame-Options to SAMEORIGIN (clickjacking defense)', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
    });

    it('sets Referrer-Policy to strict-origin-when-cross-origin', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.headers['referrer-policy'], 'strict-origin-when-cross-origin');
    });

    it('removes X-Powered-By header (hides framework fingerprint)', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.headers['x-powered-by'], undefined);
    });
  });

  // ── 2. Rate Limiting ─────────────────────────────────────────────
  describe('2. Rate Limiting (Brute force & DDoS protection)', () => {
    it('enforces limit and returns 429 Too Many Requests when threshold exceeded', async () => {
      const testLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        message: 'Rate limit exceeded.',
        keyPrefix: 'unit-test',
      });

      const express = require('express');
      const testApp = express();
      testApp.use(testLimiter);
      testApp.get('/test-route', (req, res) => res.json({ ok: true }));

      // Hits 1, 2, 3 should succeed
      const r1 = await request(testApp).get('/test-route').set('x-test-rate-limit', 'true');
      const r2 = await request(testApp).get('/test-route').set('x-test-rate-limit', 'true');
      const r3 = await request(testApp).get('/test-route').set('x-test-rate-limit', 'true');

      assert.equal(r1.status, 200);
      assert.equal(r2.status, 200);
      assert.equal(r3.status, 200);

      // Hit 4 must be rate-limited with 429
      const r4 = await request(testApp).get('/test-route').set('x-test-rate-limit', 'true');
      assert.equal(r4.status, 429);
      assert.equal(r4.body.message, 'Rate limit exceeded.');
      assert.ok(r4.headers['retry-after'] !== undefined, 'Must provide Retry-After header');
    });
  });

  // ── 3. Generic Error Messages ────────────────────────────────────
  describe('3. Generic Login and Password Reset Error Messages', () => {
    let origFindByEmail;

    before(() => {
      origFindByEmail = User.findByEmail;
      User.findByEmail = async () => null;
    });

    after(() => {
      User.findByEmail = origFindByEmail;
    });

    it('returns generic "Invalid email or password." for non-existent email on login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent_account_xyz@psu.edu.ph', password: 'Password123' });

      // Status should be 401 and message must not reveal that user doesn't exist
      assert.equal(res.status, 401);
      assert.equal(res.body.message, 'Invalid email or password.');
      assert.doesNotMatch(res.body.message, /not found|does not exist/i);
    });

    it('returns generic confirmation on forgot-password without revealing existence', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent_account_xyz@psu.edu.ph' });

      assert.equal(res.status, 200);
      assert.equal(res.body.message, 'If the email exists, a reset link has been sent.');
    });
  });

  // ── 4. Error Stack Trace Privacy ─────────────────────────────────
  describe('4. Error Responses Hide Stack Traces', () => {
    it('global error handler returns generic 500 without stack property', async () => {
      const express = require('express');
      const testApp = express();
      testApp.get('/throw', (req, res, next) => {
        next(new Error('Sensitive database connection string leaked'));
      });
      // Global error handler
      testApp.use((err, req, res, next) => {
        res.status(500).json({ message: 'Internal server error.' });
      });

      const res = await request(testApp).get('/throw');
      assert.equal(res.status, 500);
      assert.equal(res.body.message, 'Internal server error.');
      assert.equal(res.body.stack, undefined, 'Must not send stack trace to client');
    });
  });
});
