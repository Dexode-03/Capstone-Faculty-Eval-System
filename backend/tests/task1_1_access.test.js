const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Ensure JWT_SECRET is set for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const Faculty = require('../models/Faculty');
const Evaluation = require('../models/Evaluation');
const EvaluationResponse = require('../models/EvaluationResponse');

describe('Task 1.1: Restrict Faculty Report Access (GET /api/evaluation/faculty/:id)', () => {
  const adminToken = jwt.sign({ id: 'admin-1', email: 'admin@psu.edu.ph', role: 'admin' }, process.env.JWT_SECRET);
  const faculty1Token = jwt.sign({ id: 'FAC-001', email: 'prof1@psu.edu.ph', role: 'faculty' }, process.env.JWT_SECRET);
  const faculty2Token = jwt.sign({ id: 'FAC-002', email: 'prof2@psu.edu.ph', role: 'faculty' }, process.env.JWT_SECRET);
  const studentToken = jwt.sign({ id: 'STU-001', email: 'student@psu.edu.ph', role: 'student' }, process.env.JWT_SECRET);

  let originalFindById;
  let originalFindByFacultyId;
  let originalGetAverageRating;
  let originalGetAveragesByFaculty;
  let originalGetSubjectAssignments;

  before(() => {
    originalFindById = Faculty.findById;
    originalFindByFacultyId = Evaluation.findByFacultyId;
    originalGetAverageRating = Evaluation.getAverageRating;
    originalGetAveragesByFaculty = EvaluationResponse.getAveragesByFaculty;
    originalGetSubjectAssignments = Faculty.getSubjectAssignments;

    Faculty.findById = async (id) => ({
      id,
      name: 'Dr. Test Faculty',
      email: 'faculty@psu.edu.ph',
      department: 'Computer Studies',
    });
    Faculty.getSubjectAssignments = async () => [];

    Evaluation.findByFacultyId = async () => [];
    Evaluation.getAverageRating = async () => '4.50';
    EvaluationResponse.getAveragesByFaculty = async () => [];
  });

const { pool } = require('../config/db');

  after(async () => {
    Faculty.findById = originalFindById;
    Faculty.getSubjectAssignments = originalGetSubjectAssignments;
    Evaluation.findByFacultyId = originalFindByFacultyId;
    Evaluation.getAverageRating = originalGetAverageRating;
    EvaluationResponse.getAveragesByFaculty = originalGetAveragesByFaculty;
    await pool.end();
  });

  it('1. Returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/evaluation/faculty/FAC-001');
    assert.equal(res.status, 401);
    assert.match(res.body.message, /no token provided/i);
  });

  it('2. Returns 403 when accessed with a student token', async () => {
    const res = await request(app)
      .get('/api/evaluation/faculty/FAC-001')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.status, 403);
    assert.match(res.body.message, /access denied|insufficient permissions/i);
  });

  it('3. Returns 403 when faculty requests another faculty member report', async () => {
    const res = await request(app)
      .get('/api/evaluation/faculty/FAC-002')
      .set('Authorization', `Bearer ${faculty1Token}`);
    assert.equal(res.status, 403);
    assert.match(res.body.message, /only view your own report/i);
  });

  it('4. Returns 200 when faculty requests their own report', async () => {
    const res = await request(app)
      .get('/api/evaluation/faculty/FAC-001')
      .set('Authorization', `Bearer ${faculty1Token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.faculty.id, 'FAC-001');
  });

  it('5. Returns 200 when admin requests any faculty report', async () => {
    const res = await request(app)
      .get('/api/evaluation/faculty/FAC-001')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.faculty.id, 'FAC-001');
  });
});
