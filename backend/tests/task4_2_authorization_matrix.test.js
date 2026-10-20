const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Evaluation = require('../models/Evaluation');
const EvaluationSubmission = require('../models/EvaluationSubmission');
const AcademicPeriod = require('../models/AcademicPeriod');
const EvaluationResponse = require('../models/EvaluationResponse');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { pool } = require('../config/db');

describe('Task 4.2: Authorization Matrix, Submission Validation, and Quality', () => {
  const adminToken = jwt.sign({ id: 'admin-1', email: 'admin@psu.edu.ph', role: 'admin' }, process.env.JWT_SECRET);
  const facultyToken = jwt.sign({ id: 'FAC-001', email: 'faculty@psu.edu.ph', role: 'faculty' }, process.env.JWT_SECRET);
  const otherFacultyToken = jwt.sign({ id: 'FAC-999', email: 'other@psu.edu.ph', role: 'faculty' }, process.env.JWT_SECRET);
  const studentToken = jwt.sign({ id: 'STU-001', email: 'student@psu.edu.ph', role: 'student' }, process.env.JWT_SECRET);

  let origFacultyFindById;
  let origFacultyFindAll;
  let origFacultyGetSubjectAssignments;
  let origFacultyGetEnrolledCount;
  let origEvaluationFindByFacultyId;
  let origEvaluationGetAverageRating;
  let origEvaluationFindAll;
  let origEvaluationResponseGetAveragesByFaculty;
  let origStudentIsEnrolledWithFaculty;
  let origAcademicPeriodGetActive;
  let origSubmissionExists;
  let origUserFindAll;
  let origUserGetDistinctFilterValues;
  let origSubjectFindAll;
  let origAcademicPeriodFindAll;
  let origPoolExecute;

  before(() => {
    origPoolExecute = pool.execute;
    pool.execute = async (sql) => {
      if (typeof sql === 'string' && sql.includes('SELECT DISTINCT department FROM faculty')) {
        return [[{ department: 'Computer Science' }]];
      }
      if (typeof sql === 'string' && sql.includes('SELECT DISTINCT section FROM students')) {
        return [[{ section: 'A' }]];
      }
      return [[]];
    };

    origFacultyFindById = Faculty.findById;
    origFacultyFindAll = Faculty.findAll;
    origFacultyGetSubjectAssignments = Faculty.getSubjectAssignments;
    origFacultyGetEnrolledCount = Faculty.getEnrolledStudentCount;
    origSubjectFindAll = Subject.findAll;
    origAcademicPeriodFindAll = AcademicPeriod.findAll;
    origEvaluationFindByFacultyId = Evaluation.findByFacultyId;
    origEvaluationGetAverageRating = Evaluation.getAverageRating;
    origEvaluationFindAll = Evaluation.findAll;
    origEvaluationResponseGetAveragesByFaculty = EvaluationResponse.getAveragesByFaculty;
    origStudentIsEnrolledWithFaculty = Student.isEnrolledWithFaculty;
    origAcademicPeriodGetActive = AcademicPeriod.getActive;
    origSubmissionExists = EvaluationSubmission.existsForStudentFacultyPeriod;
    origUserFindAll = User.findAllByRoleFiltered;
    origUserGetDistinctFilterValues = User.getDistinctFilterValues;

    Faculty.findById = async (id) => ({
      id,
      name: 'Dr. Test Faculty',
      email: 'faculty@psu.edu.ph',
      department: 'Computer Science',
    });
    Faculty.findAll = async () => [];
    Faculty.getAllEnrolledStudentCounts = async () => ({});
    Faculty.getSubjectAssignments = async () => [];
    Faculty.getEnrolledStudentCount = async () => 50;

    Evaluation.findByFacultyId = async () => [
      { id: 1, faculty_id: 'FAC-001', rating: 4.5, sentiment: 'positive', created_at: new Date() }
    ];
    Evaluation.getAverageRating = async () => '4.50';
    Evaluation.findAll = async () => [];
    EvaluationResponse.getAveragesByFaculty = async () => [];

    Student.isEnrolledWithFaculty = async () => true;
    AcademicPeriod.getActive = async () => ({
      id: 1,
      name: '1st Semester 2026-2027',
      is_active: 1,
      evaluation_open: 1,
    });
    AcademicPeriod.findAll = async () => [];
    Subject.findAll = async () => [];
    EvaluationSubmission.existsForStudentFacultyPeriod = async () => false;
    User.findAllByRoleFiltered = async () => [];
    User.getDistinctFilterValues = async () => ({
      departments: ['Computer Science'],
      subjects: [],
      yearLevels: [],
      sections: [],
    });
  });

  after(async () => {
    Faculty.findById = origFacultyFindById;
    Faculty.findAll = origFacultyFindAll;
    Faculty.getSubjectAssignments = origFacultyGetSubjectAssignments;
    Faculty.getEnrolledStudentCount = origFacultyGetEnrolledCount;
    Evaluation.findByFacultyId = origEvaluationFindByFacultyId;
    Evaluation.getAverageRating = origEvaluationGetAverageRating;
    Evaluation.findAll = origEvaluationFindAll;
    EvaluationResponse.getAveragesByFaculty = origEvaluationResponseGetAveragesByFaculty;
    Student.isEnrolledWithFaculty = origStudentIsEnrolledWithFaculty;
    AcademicPeriod.getActive = origAcademicPeriodGetActive;
    AcademicPeriod.findAll = origAcademicPeriodFindAll;
    Subject.findAll = origSubjectFindAll;
    EvaluationSubmission.existsForStudentFacultyPeriod = origSubmissionExists;
    User.findAllByRoleFiltered = origUserFindAll;
    User.getDistinctFilterValues = origUserGetDistinctFilterValues;
    pool.execute = origPoolExecute;
    await pool.end();
  });

  // ── 1. POST /api/evaluation/submit ──────────────────────────────
  describe('Matrix Row 1: POST /api/evaluation/submit', () => {
    it('No token -> 401 Unauthorized', async () => {
      const res = await request(app).post('/api/evaluation/submit').send({});
      assert.equal(res.status, 401);
    });

    it('Faculty role -> 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/evaluation/submit')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({});
      assert.equal(res.status, 403);
    });

    it('Admin role -> 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/evaluation/submit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      assert.equal(res.status, 403);
    });

    it('Student role with invalid payload -> 400 Bad Request (Validation enforced)', async () => {
      const res = await request(app)
        .post('/api/evaluation/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ faculty_id: 'FAC-001', responses: [] });
      assert.equal(res.status, 400);
      assert.match(res.body.message, /responses.*required/i);
    });
  });

  // ── 2. GET /api/evaluation/faculty/:id ──────────────────────────
  describe('Matrix Row 2: GET /api/evaluation/faculty/:id', () => {
    it('No token -> 401 Unauthorized', async () => {
      const res = await request(app).get('/api/evaluation/faculty/FAC-001');
      assert.equal(res.status, 401);
    });

    it('Student role -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/evaluation/faculty/FAC-001')
        .set('Authorization', `Bearer ${studentToken}`);
      assert.equal(res.status, 403);
    });

    it('Faculty role accessing other faculty -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/evaluation/faculty/FAC-001')
        .set('Authorization', `Bearer ${otherFacultyToken}`);
      assert.equal(res.status, 403);
    });

    it('Faculty role accessing own report -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/evaluation/faculty/FAC-001')
        .set('Authorization', `Bearer ${facultyToken}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.faculty.id, 'FAC-001');
    });

    it('Admin role accessing any faculty -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/evaluation/faculty/FAC-001')
        .set('Authorization', `Bearer ${adminToken}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.faculty.id, 'FAC-001');
    });
  });

  // ── 3. GET /api/evaluation/my-report ────────────────────────────
  describe('Matrix Row 3: GET /api/evaluation/my-report', () => {
    it('No token -> 401 Unauthorized', async () => {
      const res = await request(app).get('/api/evaluation/my-report');
      assert.equal(res.status, 401);
    });

    it('Student role -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/evaluation/my-report')
        .set('Authorization', `Bearer ${studentToken}`);
      assert.equal(res.status, 403);
    });

    it('Admin role -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/evaluation/my-report')
        .set('Authorization', `Bearer ${adminToken}`);
      assert.equal(res.status, 403);
    });

    it('Faculty role -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/evaluation/my-report')
        .set('Authorization', `Bearer ${facultyToken}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.faculty.id, 'FAC-001');
    });
  });

  // ── 4. GET /api/evaluation/analysis ─────────────────────────────
  describe('Matrix Row 4: GET /api/evaluation/analysis', () => {
    it('No token -> 401 Unauthorized', async () => {
      const res = await request(app).get('/api/evaluation/analysis');
      assert.equal(res.status, 401);
    });

    it('Student role -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/evaluation/analysis')
        .set('Authorization', `Bearer ${studentToken}`);
      assert.equal(res.status, 403);
    });

    it('Faculty role -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/evaluation/analysis')
        .set('Authorization', `Bearer ${facultyToken}`);
      assert.equal(res.status, 403);
    });

    it('Admin role -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/evaluation/analysis')
        .set('Authorization', `Bearer ${adminToken}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.overallHealth !== undefined);
    });
  });

  // ── 5. /api/auth/admin/accounts (all verbs) ─────────────────────
  describe('Matrix Row 5: /api/auth/admin/accounts (all verbs)', () => {
    it('GET /admin/accounts - No token -> 401 Unauthorized', async () => {
      const res = await request(app).get('/api/auth/admin/accounts?role=faculty');
      assert.equal(res.status, 401);
    });

    it('GET /admin/accounts - Student role -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/auth/admin/accounts?role=faculty')
        .set('Authorization', `Bearer ${studentToken}`);
      assert.equal(res.status, 403);
    });

    it('GET /admin/accounts - Faculty role -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/auth/admin/accounts?role=faculty')
        .set('Authorization', `Bearer ${facultyToken}`);
      assert.equal(res.status, 403);
    });

    it('GET /admin/accounts - Admin role -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/auth/admin/accounts?role=faculty')
        .set('Authorization', `Bearer ${adminToken}`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
    });

    it('POST /admin/accounts - Non-admin -> 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/auth/admin/accounts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});
      assert.equal(res.status, 403);
    });

    it('PUT /admin/accounts/:id - Non-admin -> 403 Forbidden', async () => {
      const res = await request(app)
        .put('/api/auth/admin/accounts/123')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({});
      assert.equal(res.status, 403);
    });

    it('DELETE /admin/accounts/:id - Non-admin -> 403 Forbidden', async () => {
      const res = await request(app)
        .delete('/api/auth/admin/accounts/123')
        .set('Authorization', `Bearer ${studentToken}`);
      assert.equal(res.status, 403);
    });
  });

  // ── 6. DELETE /api/evaluation/clear-all ──────────────────────────
  describe('Matrix Row 6: DELETE /api/evaluation/clear-all', () => {
    it('No token -> 401 Unauthorized', async () => {
      const res = await request(app).delete('/api/evaluation/clear-all');
      assert.equal(res.status, 401);
    });

    it('Student role -> 403 Forbidden', async () => {
      const res = await request(app)
        .delete('/api/evaluation/clear-all')
        .set('Authorization', `Bearer ${studentToken}`);
      assert.equal(res.status, 403);
    });

    it('Faculty role -> 403 Forbidden', async () => {
      const res = await request(app)
        .delete('/api/evaluation/clear-all')
        .set('Authorization', `Bearer ${facultyToken}`);
      assert.equal(res.status, 403);
    });

    it('Admin role when disabled by default -> 403 Forbidden (Bulk delete disabled by default)', async () => {
      const originalFlag = process.env.ALLOW_BULK_DELETE;
      delete process.env.ALLOW_BULK_DELETE;
      const res = await request(app)
        .delete('/api/evaluation/clear-all')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      assert.equal(res.status, 403);
      assert.match(res.body.message, /disabled on this server/i);
      process.env.ALLOW_BULK_DELETE = originalFlag;
    });

    it('Admin role when enabled but without password/phrase -> 400 Bad Request', async () => {
      const originalFlag = process.env.ALLOW_BULK_DELETE;
      process.env.ALLOW_BULK_DELETE = 'true';
      const res = await request(app)
        .delete('/api/evaluation/clear-all')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      assert.equal(res.status, 400);
      assert.match(res.body.message, /password.*required/i);
      if (originalFlag !== undefined) {
        process.env.ALLOW_BULK_DELETE = originalFlag;
      } else {
        delete process.env.ALLOW_BULK_DELETE;
      }
    });
  });
});
