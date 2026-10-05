'use strict';
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const Evaluation = require('../models/Evaluation');
const EvaluationSubmission = require('../models/EvaluationSubmission');
const EvaluationResponse = require('../models/EvaluationResponse');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const AcademicPeriod = require('../models/AcademicPeriod');
const EvaluationQuestion = require('../models/EvaluationQuestion');
const { pool } = require('../config/db');

describe('Task 2.1: Separate "Who Submitted" from "What Was Said"', () => {

  // ── Tokens ──────────────────────────────────────────────────────────────
  const studentToken = jwt.sign(
    { id: 'STU-T21', email: 'student21@psu.edu.ph', role: 'student' },
    process.env.JWT_SECRET
  );
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@psu.edu.ph', role: 'admin' },
    process.env.JWT_SECRET
  );

  // ── Stubs ────────────────────────────────────────────────────────────────
  let orig = {};
  let txBegan = false, txCommitted = false, txRolledBack = false, txReleased = false;
  let submissionCreateCalled = false;
  let submissionCreateArgs = null;

  const mockConnection = {
    beginTransaction: async () => { txBegan = true; },
    commit:           async () => { txCommitted = true; },
    rollback:         async () => { txRolledBack = true; },
    release:          ()       => { txReleased = true; },
    execute:          async (sql, params) => {
      // Simulate successful INSERT returning insertId
      if (sql.includes('INSERT INTO evaluations')) return [{ insertId: 9001 }];
      if (sql.includes('INSERT INTO evaluation_submissions')) {
        submissionCreateCalled = true;
        return [{ insertId: 1 }];
      }
      if (sql.includes('INSERT INTO evaluation_responses')) return [{ affectedRows: 1 }];
      return [{}];
    },
  };

  before(() => {
    // Stash originals
    orig.facultyFindById             = Faculty.findById;
    orig.isEnrolledWithFaculty       = Student.isEnrolledWithFaculty;
    orig.findActivePeriods           = AcademicPeriod.findActivePeriods;
    orig.submissionExists            = EvaluationSubmission.existsForStudentFacultyPeriod;
    orig.submissionCreate            = EvaluationSubmission.create;
    orig.submissionFindByStudent     = EvaluationSubmission.findByStudentId;
    orig.submissionDeleteAll         = EvaluationSubmission.deleteAll;
    orig.submissionPopulation        = EvaluationSubmission.getStudentPopulationByDepartment;
    orig.evaluationCreate            = Evaluation.create;
    orig.evaluationDeleteAll         = Evaluation.deleteAll;
    orig.responseCreateBulk          = EvaluationResponse.createBulk;
    orig.responseDeleteAll           = EvaluationResponse.deleteAll;
    orig.findAllActiveQuestions      = EvaluationQuestion.findAllActive;
    orig.getConnection               = pool.getConnection;
  });

  after(async () => {
    // Restore all originals
    Faculty.findById                                    = orig.facultyFindById;
    Student.isEnrolledWithFaculty                       = orig.isEnrolledWithFaculty;
    AcademicPeriod.findActivePeriods                    = orig.findActivePeriods;
    EvaluationSubmission.existsForStudentFacultyPeriod  = orig.submissionExists;
    EvaluationSubmission.create                         = orig.submissionCreate;
    EvaluationSubmission.findByStudentId                = orig.submissionFindByStudent;
    EvaluationSubmission.deleteAll                      = orig.submissionDeleteAll;
    EvaluationSubmission.getStudentPopulationByDepartment = orig.submissionPopulation;
    Evaluation.create                                   = orig.evaluationCreate;
    Evaluation.deleteAll                                = orig.evaluationDeleteAll;
    EvaluationResponse.createBulk                       = orig.responseCreateBulk;
    EvaluationResponse.deleteAll                        = orig.responseDeleteAll;
    EvaluationQuestion.findAllActive                    = orig.findAllActiveQuestions;
    pool.getConnection                                  = orig.getConnection;
    await pool.end();
  });

  // ── Helper: set up a full happy-path submission stub ───────────────────
  function stubHappyPath() {
    txBegan = false; txCommitted = false; txRolledBack = false;
    txReleased = false; submissionCreateCalled = false; submissionCreateArgs = null;

    Faculty.findById = async () => ({ id: 'FAC-001', name: 'Test Faculty', department: 'CS' });
    Student.isEnrolledWithFaculty = async () => true;
    AcademicPeriod.findActivePeriods = async () => [{ id: 1, is_active: 1, evaluation_open: 1, semester: '1st' }];
    EvaluationSubmission.existsForStudentFacultyPeriod = async () => false;
    EvaluationQuestion.findAllActive = async () => [
      { id: 1, question_type: 'rating', question: 'Q1', is_active: true, sort_order: 1 },
    ];

    Evaluation.create = async (_data, _conn) => ({ insertId: 9001 });

    EvaluationSubmission.create = async (data, _conn) => {
      submissionCreateCalled = true;
      submissionCreateArgs = data;
      return { insertId: 1 };
    };

    EvaluationResponse.createBulk = async () => {};
    pool.getConnection = async () => mockConnection;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Duplicate check now uses EvaluationSubmission, not Evaluation
  // ─────────────────────────────────────────────────────────────────────────
  it('1. Returns 409 when EvaluationSubmission ledger reports a duplicate', async () => {
    Faculty.findById = async () => ({ id: 'FAC-001', name: 'Test', department: 'CS' });
    Student.isEnrolledWithFaculty = async () => true;
    AcademicPeriod.findActivePeriods = async () => [{ id: 1, is_active: 1, evaluation_open: 1 }];

    // Ledger says duplicate
    EvaluationSubmission.existsForStudentFacultyPeriod = async () => true;

    // Old model must NOT be consulted — it would throw
    Evaluation.existsForStudentFacultyPeriod = async () => {
      throw new Error('Should not be called — student_id removed from evaluations');
    };

    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [{ question_id: 1, rating: 4 }],
      });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /already submitted/i);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Submission inserts into BOTH tables atomically
  // ─────────────────────────────────────────────────────────────────────────
  it('2. Successful submission creates evaluation_submissions ledger entry in same transaction', async () => {
    stubHappyPath();

    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [{ question_id: 1, rating: 4 }],
        strengths: 'Great teacher',
        weaknesses: '',
      });

    assert.equal(res.status, 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.ok(submissionCreateCalled, 'EvaluationSubmission.create must be called');
    assert.ok(txBegan,     'Transaction must be started');
    assert.ok(txCommitted, 'Transaction must be committed');
    assert.equal(txRolledBack, false, 'Transaction must not be rolled back');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Submission ledger entry contains correct identity fields
  // ─────────────────────────────────────────────────────────────────────────
  it('3. Ledger entry contains student_id, faculty_id, period, and evaluation_id', async () => {
    stubHappyPath();

    await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [{ question_id: 1, rating: 3 }],
      });

    assert.ok(submissionCreateArgs, 'EvaluationSubmission.create must have been called');
    assert.equal(submissionCreateArgs.student_id,         'STU-T21');
    assert.equal(submissionCreateArgs.faculty_id,         'FAC-001');
    assert.equal(submissionCreateArgs.academic_period_id, 1);
    assert.equal(submissionCreateArgs.evaluation_id,      9001);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Evaluation content row no longer contains student_id
  // ─────────────────────────────────────────────────────────────────────────
  it('4. Evaluation.create is called WITHOUT student_id', async () => {
    stubHappyPath();

    let evalCreateArgs = null;
    Evaluation.create = async (data, _conn) => {
      evalCreateArgs = data;
      return { insertId: 9001 };
    };

    await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faculty_id: 'FAC-001',
        responses: [{ question_id: 1, rating: 5 }],
      });

    assert.ok(evalCreateArgs, 'Evaluation.create must have been called');
    assert.equal(
      evalCreateArgs.student_id,
      undefined,
      'student_id must NOT be passed to Evaluation.create'
    );
    assert.ok(evalCreateArgs.faculty_id, 'faculty_id must still be passed');
    assert.ok(evalCreateArgs.anonymous_student_ref !== undefined, 'anonymous_student_ref must still be passed');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. GET /api/evaluation/my-evaluations uses EvaluationSubmission model
  // ─────────────────────────────────────────────────────────────────────────
  it('5. GET /my-evaluations returns data sourced from EvaluationSubmission.findByStudentId', async () => {
    const fakeSubmissions = [
      {
        submission_id: 1,
        faculty_id: 'FAC-001',
        academic_period_id: 1,
        evaluation_id: 9001,
        submitted_at: new Date().toISOString(),
        rating: 4,
        comment: 'Good',
        strengths: 'Excellent',
        weaknesses: null,
        sentiment: 'positive',
        sentiment_score: 0.8,
        created_at: new Date().toISOString(),
        faculty_name: 'Dr. Test',
        department: 'CS',
      },
    ];

    EvaluationSubmission.findByStudentId = async (sid) => {
      assert.equal(sid, 'STU-T21');
      return fakeSubmissions;
    };

    // Old deprecated method must not be called
    Evaluation.findByStudentId = async () => {
      throw new Error('Evaluation.findByStudentId must not be called after Task 2.1');
    };

    const res = await request(app)
      .get('/api/evaluation/my-evaluations')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.evaluations.length, 1);
    assert.equal(res.body.evaluations[0].faculty_id, 'FAC-001');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Clear-all deletes ledger before content (FK order)
  // ─────────────────────────────────────────────────────────────────────────
  it('6. DELETE /clear-all deletes evaluation_submissions BEFORE evaluations', async () => {
    process.env.ALLOW_BULK_DELETE = 'true';
    const bcrypt = require('bcryptjs');
    const hashedPw = await bcrypt.hash('adminpass', 1);

    const { pool: dbPool } = require('../config/db');
    const origPoolQuery = dbPool.execute;

    // Capture admin lookup
    dbPool.execute = async (sql, params) => {
      if (sql.includes('SELECT id, password, email FROM admins')) {
        return [[{ id: 1, password: hashedPw, email: 'admin@psu.edu.ph' }]];
      }
      return origPoolQuery.call(dbPool, sql, params);
    };

    const deleteOrder = [];
    EvaluationSubmission.deleteAll = async (_conn) => { deleteOrder.push('submissions'); return { affectedRows: 0 }; };
    EvaluationResponse.deleteAll   = async (_conn) => { deleteOrder.push('responses');  return { affectedRows: 0 }; };
    Evaluation.deleteAll           = async (_conn) => { deleteOrder.push('evaluations'); return { affectedRows: 0 }; };
    Evaluation.count               = async ()      => 0;
    pool.getConnection             = async ()      => mockConnection;

    const res = await request(app)
      .delete('/api/evaluation/clear-all')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        password: 'adminpass',
        confirmation_phrase: 'DELETE ALL EVALUATIONS',
        backup_confirmed: true,
      });

    dbPool.execute = origPoolQuery;
    process.env.ALLOW_BULK_DELETE = 'false';

    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.deepEqual(deleteOrder, ['submissions', 'responses', 'evaluations'],
      `Delete order was: ${deleteOrder.join(' → ')}`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. EvaluationSubmission model: existsForStudentFacultyPeriod works live
  // ─────────────────────────────────────────────────────────────────────────
  it('7. EvaluationSubmission.existsForStudentFacultyPeriod returns false for unknown student', async () => {
    const exists = await orig.submissionExists('NONEXISTENT-STUDENT', 'NONEXISTENT-FACULTY', 99999);
    assert.equal(exists, false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. EvaluationSubmission.findByStudentId returns empty array for unknown
  // ─────────────────────────────────────────────────────────────────────────
  it('8. EvaluationSubmission.findByStudentId returns [] for unknown student', async () => {
    const rows = await orig.submissionFindByStudent('NONEXISTENT-STUDENT-2');
    assert.ok(Array.isArray(rows));
    assert.equal(rows.length, 0);
  });

});
