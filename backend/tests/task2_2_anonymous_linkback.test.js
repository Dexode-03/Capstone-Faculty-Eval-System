'use strict';
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const Evaluation = require('../models/Evaluation');
const EvaluationSubmission = require('../models/EvaluationSubmission');

describe('Task 2.2: Anonymous Link-Back for Students', () => {

  // ── Tokens ──────────────────────────────────────────────────────────────
  const studentToken = jwt.sign(
    { id: 'STU-LINK-01', email: 'linkstudent@psu.edu.ph', role: 'student' },
    process.env.JWT_SECRET
  );
  const facultyToken = jwt.sign(
    { id: 'FAC-01', email: 'prof@psu.edu.ph', role: 'faculty' },
    process.env.JWT_SECRET
  );
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@psu.edu.ph', role: 'admin' },
    process.env.JWT_SECRET
  );

  // ── Original stubs ──────────────────────────────────────────────────────
  let origFindByStudentId;
  let origLegacyFindByStudentId;

  before(() => {
    origFindByStudentId       = EvaluationSubmission.findByStudentId;
    origLegacyFindByStudentId = Evaluation.findByStudentId;
  });

  after(() => {
    EvaluationSubmission.findByStudentId = origFindByStudentId;
    Evaluation.findByStudentId           = origLegacyFindByStudentId;
  });

  beforeEach(() => {
    // Default stub returns mock submission list
    EvaluationSubmission.findByStudentId = async (studentId) => {
      if (studentId === 'STU-LINK-01') {
        return [
          {
            submission_id: 101,
            faculty_id: 'FAC-MATH',
            academic_period_id: 1,
            evaluation_id: 501,
            submitted_at: new Date('2026-10-01T10:00:00Z'),
            rating: 4.8,
            comment: 'Great instructor, very thorough.',
            strengths: 'Clear explanation of calculus concepts.',
            weaknesses: 'Pacing can be fast occasionally.',
            sentiment: 'positive',
            sentiment_score: 0.85,
            created_at: new Date('2026-10-01T10:00:00Z'),
            faculty_name: 'Dr. Maria Santos',
            department: 'Mathematics',
          },
          {
            submission_id: 102,
            faculty_id: 'FAC-CS',
            academic_period_id: 1,
            evaluation_id: 502,
            submitted_at: new Date('2026-10-02T14:30:00Z'),
            rating: 3.5,
            comment: 'Average delivery.',
            strengths: 'Practical lab activities.',
            weaknesses: 'Needs clearer slides.',
            sentiment: 'neutral',
            sentiment_score: 0.1,
            created_at: new Date('2026-10-02T14:30:00Z'),
            faculty_name: 'Prof. Juan Dela Cruz',
            department: 'Computer Science',
          },
        ];
      }
      return [];
    };

    // Ensure deprecated legacy method throws if touched
    Evaluation.findByStudentId = async () => {
      throw new Error('Evaluation.findByStudentId must not be called — replaced by EvaluationSubmission');
    };
  });

  // ── 1. Authentication & Authorization ────────────────────────────────────
  it('1. GET /api/evaluation/my-evaluations rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/evaluation/my-evaluations');
    assert.equal(res.status, 401);
  });

  it('2. GET /api/evaluation/my-evaluations rejects faculty role with 403', async () => {
    const res = await request(app)
      .get('/api/evaluation/my-evaluations')
      .set('Authorization', `Bearer ${facultyToken}`);
    assert.equal(res.status, 403);
  });

  it('3. GET /api/evaluation/my-evaluations rejects admin role with 403', async () => {
    const res = await request(app)
      .get('/api/evaluation/my-evaluations')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 403);
  });

  // ── 2. Retrieval & Privacy / Anonymity ────────────────────────────────────
  it('4. GET /api/evaluation/my-evaluations returns student submissions successfully', async () => {
    let capturedStudentId = null;
    EvaluationSubmission.findByStudentId = async (id) => {
      capturedStudentId = id;
      return [
        {
          submission_id: 99,
          faculty_id: 'FAC-ENG',
          academic_period_id: 2,
          evaluation_id: 404,
          submitted_at: new Date('2026-10-03T09:00:00Z'),
          rating: 5,
          comment: 'Outstanding professor.',
          strengths: 'Very engaging.',
          weaknesses: null,
          sentiment: 'positive',
          sentiment_score: 0.95,
          faculty_name: 'Dr. Rizal',
          department: 'English',
        },
      ];
    };

    const res = await request(app)
      .get('/api/evaluation/my-evaluations')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(capturedStudentId, 'STU-LINK-01');
    assert(Array.isArray(res.body.evaluations));
    assert.equal(res.body.evaluations.length, 1);
    assert.equal(res.body.evaluations[0].faculty_name, 'Dr. Rizal');
    assert.equal(res.body.evaluations[0].rating, 5);
  });

  it('5. CRITICAL PRIVACY: response must NOT leak student identity fields', async () => {
    const res = await request(app)
      .get('/api/evaluation/my-evaluations')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    const evals = res.body.evaluations;
    assert(evals.length > 0);

    for (const item of evals) {
      assert.equal(item.student_id, undefined, 'student_id must NOT be in response');
      assert.equal(item.student_name, undefined, 'student_name must NOT be in response');
      assert.equal(item.email, undefined, 'student email must NOT be in response');
      assert.equal(item.section, undefined, 'student section must NOT be linked to submission row');
    }
  });

  // ── 3. Empty Submissions Handling ────────────────────────────────────────
  it('6. GET /api/evaluation/my-evaluations returns empty array when student has no submissions', async () => {
    const freshStudentToken = jwt.sign(
      { id: 'STU-FRESH', email: 'fresh@psu.edu.ph', role: 'student' },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get('/api/evaluation/my-evaluations')
      .set('Authorization', `Bearer ${freshStudentToken}`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.evaluations, []);
  });

  // ── 4. Error Handling ────────────────────────────────────────────────────
  it('7. GET /api/evaluation/my-evaluations returns 500 when database throws', async () => {
    EvaluationSubmission.findByStudentId = async () => {
      throw new Error('Database connection failed');
    };

    const res = await request(app)
      .get('/api/evaluation/my-evaluations')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 500);
    assert.match(res.body.message, /server error/i);
  });
});
