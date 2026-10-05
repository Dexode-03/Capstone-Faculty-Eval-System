const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const AcademicPeriod = require('../models/AcademicPeriod');
const Evaluation = require('../models/Evaluation');
const EvaluationSubmission = require('../models/EvaluationSubmission');
const EvaluationQuestion = require('../models/EvaluationQuestion');
const EvaluationResponse = require('../models/EvaluationResponse');
const { pool } = require('../config/db');

describe('Task 1.2: Validate Evaluation Submissions on the Server', () => {
  const studentToken = jwt.sign(
    { id: 'STU-001', email: 'student@psu.edu.ph', role: 'student' },
    process.env.JWT_SECRET
  );

  let originalFacultyFindById;
  let originalIsEnrolledWithFaculty;
  let originalFindActivePeriods;
  let originalExistsForStudentFacultyPeriod;
  let originalFindAllActiveQuestions;
  let originalEvaluationCreate;
  let originalResponseCreateBulk;
  let originalGetConnection;

  // Track transaction lifecycle
  let txBegan = false;
  let txCommitted = false;
  let txRolledBack = false;
  let txReleased = false;

  const mockConnection = {
    beginTransaction: async () => { txBegan = true; },
    commit: async () => { txCommitted = true; },
    rollback: async () => { txRolledBack = true; },
    release: () => { txReleased = true; },
    execute: async () => [{ insertId: 999 }],
  };

  before(() => {
    originalFacultyFindById = Faculty.findById;
    originalIsEnrolledWithFaculty = Student.isEnrolledWithFaculty;
    originalFindActivePeriods = AcademicPeriod.findActivePeriods;
    originalExistsForStudentFacultyPeriod = EvaluationSubmission.existsForStudentFacultyPeriod;
    originalFindAllActiveQuestions = EvaluationQuestion.findAllActive;
    originalEvaluationCreate = Evaluation.create;
    originalResponseCreateBulk = EvaluationResponse.createBulk;
    originalGetConnection = pool.getConnection;

    pool.getConnection = async () => mockConnection;
  });

  after(async () => {
    Faculty.findById = originalFacultyFindById;
    Student.isEnrolledWithFaculty = originalIsEnrolledWithFaculty;
    AcademicPeriod.findActivePeriods = originalFindActivePeriods;
    EvaluationSubmission.existsForStudentFacultyPeriod = originalExistsForStudentFacultyPeriod;
    EvaluationQuestion.findAllActive = originalFindAllActiveQuestions;
    Evaluation.create = originalEvaluationCreate;
    EvaluationResponse.createBulk = originalResponseCreateBulk;
    pool.getConnection = originalGetConnection;

    await pool.end();
  });

  beforeEach(() => {
    txBegan = false;
    txCommitted = false;
    txRolledBack = false;
    txReleased = false;

    // Default healthy mock behaviors
    Faculty.findById = async (id) => ({ id, name: 'Dr. Santos', department: 'CS' });
    Student.isEnrolledWithFaculty = async () => true;
    AcademicPeriod.findActivePeriods = async () => [
      { id: 1, academic_year: '2025-2026', semester: '1st', is_active: 1, evaluation_open: 1 }
    ];
    EvaluationSubmission.existsForStudentFacultyPeriod = async () => false;
    EvaluationSubmission.create = async () => ({ insertId: 1 });
    EvaluationQuestion.findAllActive = async () => [
      { id: 101, question: 'Explains concepts clearly', category: 'A. Management of Teaching and Learning', question_type: 'rating', sort_order: 1 },
      { id: 102, question: 'Comes to class prepared', category: 'A. Management of Teaching and Learning', question_type: 'rating', sort_order: 2 },
    ];
    Evaluation.create = async () => ({ insertId: 777 });
    EvaluationResponse.createBulk = async () => {};
  });

  it('1. Returns 403 when student is not enrolled with the faculty member', async () => {
    Student.isEnrolledWithFaculty = async () => false;

    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [
          { question_id: 101, rating: 5 },
          { question_id: 102, rating: 5 },
        ],
      });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /only evaluate faculty members for courses you are enrolled in/i);
    assert.equal(txBegan, false);
  });

  it('2. Returns 403 when evaluation period is closed (evaluation_open = 0)', async () => {
    AcademicPeriod.findActivePeriods = async () => [
      { id: 1, academic_year: '2025-2026', semester: '1st', is_active: 1, evaluation_open: 0 }
    ];

    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [
          { question_id: 101, rating: 5 },
          { question_id: 102, rating: 5 },
        ],
      });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /evaluation is currently closed/i);
    assert.equal(txBegan, false);
  });

  it('3. Returns 403 when no active period exists or multiple active periods exist', async () => {
    AcademicPeriod.findActivePeriods = async () => [];

    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [
          { question_id: 101, rating: 5 },
          { question_id: 102, rating: 5 },
        ],
      });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /evaluation is currently closed/i);
    assert.equal(txBegan, false);
  });

  it('4. Returns 409 when evaluation already exists for this student, faculty, and period', async () => {
    EvaluationSubmission.existsForStudentFacultyPeriod = async () => true;

    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [
          { question_id: 101, rating: 5 },
          { question_id: 102, rating: 5 },
        ],
      });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /already submitted an evaluation/i);
    assert.equal(txBegan, false);
  });

  it('5. Returns 400 when an active rating question is not answered', async () => {
    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [
          { question_id: 101, rating: 5 },
          // question 102 is missing
        ],
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /required for every active rating question/i);
    assert.equal(txBegan, false);
  });

  it('6. Returns 400 when a rating is outside the 1 to 5 range', async () => {
    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [
          { question_id: 101, rating: 6 },
          { question_id: 102, rating: 5 },
        ],
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /1 to 5|1 and 5/i);
    assert.equal(txBegan, false);
  });

  it('7. Rolls back transaction when an error occurs halfway during insertion', async () => {
    EvaluationResponse.createBulk = async () => {
      throw new Error('Database write failure during bulk responses insert');
    };

    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [
          { question_id: 101, rating: 5 },
          { question_id: 102, rating: 4 },
        ],
      });

    assert.equal(res.status, 500);
    assert.equal(txBegan, true);
    assert.equal(txRolledBack, true);
    assert.equal(txCommitted, false);
    assert.equal(txReleased, true);
  });

  it('8. Successfully submits evaluation and commits transaction (returns 201)', async () => {
    let capturedEvalParams = null;
    Evaluation.create = async (params, conn) => {
      capturedEvalParams = params;
      return { insertId: 888 };
    };

    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        strengths: 'Very clear explanations and approachable.',
        weaknesses: 'Pacing can be a bit fast at times.',
        responses: [
          { question_id: 101, rating: 5 },
          { question_id: 102, rating: 4 },
        ],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.message, 'Evaluation submitted successfully.');
    assert.equal(res.body.overallRating, 4.5);
    assert.ok(res.body.sentimentAnalysis);

    assert.equal(txBegan, true);
    assert.equal(txCommitted, true);
    assert.equal(txRolledBack, false);
    assert.equal(txReleased, true);

    // Verify academic_period_id was stamped on the evaluation
    assert.equal(capturedEvalParams.academic_period_id, 1);
  });
});
