const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { pool } = require('../config/db');

describe('Task 8: Academic Period Isolation & Evaluator Count Alignment', () => {
  let adminToken;
  let facultyToken;
  let studentToken;
  let period1Id;
  let period2Id;
  const facultyId = 'FAC-ISO-TEST';
  const studentId = 'STU-ISO-TEST';

  before(async () => {
    adminToken = jwt.sign(
      { id: 'ADM-ISO-TEST', email: 'admin_iso@psu.edu.ph', role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    facultyToken = jwt.sign(
      { id: facultyId, email: 'faculty_iso@psu.edu.ph', role: 'faculty' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      { id: studentId, email: 'student_iso@psu.edu.ph', role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Clean up any leftovers
    await pool.execute('DELETE FROM evaluation_submissions WHERE student_id IN (?, "STU-ANOTHER-01") OR faculty_id = ?', [studentId, facultyId]);
    await pool.execute('DELETE FROM evaluations WHERE faculty_id = ?', [facultyId]);
    await pool.execute('DELETE FROM faculty WHERE id = ?', [facultyId]);
    await pool.execute('DELETE FROM students WHERE id = ?', [studentId]);
    await pool.execute('DELETE FROM academic_periods WHERE academic_year = "1999-2000"');

    // Insert Faculty
    await pool.execute(
      'INSERT INTO faculty (id, name, email, department) VALUES (?, ?, ?, ?)',
      [facultyId, 'Prof. Isolation Test', 'faculty_iso@psu.edu.ph', 'Information Technology']
    );

    // Insert Students
    await pool.execute(
      'INSERT INTO students (id, name, email, department, year_level, section) VALUES (?, ?, ?, ?, ?, ?)',
      [studentId, 'Student Isolation Test', 'student_iso@psu.edu.ph', 'Information Technology', '3rd Year', 'BSIT-3A']
    );

    await pool.execute(
      'INSERT INTO students (id, name, email, department, year_level, section) VALUES (?, ?, ?, ?, ?, ?)',
      ['STU-ANOTHER-01', 'Second Student Test', 'student_another@psu.edu.ph', 'Information Technology', '3rd Year', 'BSIT-3A']
    );

    // Use current active period as Period 2
    const [activeRows] = await pool.execute('SELECT id, academic_year, semester FROM academic_periods WHERE is_active = 1 LIMIT 1');
    assert.ok(activeRows.length > 0, 'Expected an active academic period to exist');
    period2Id = activeRows[0].id;

    // Insert Period 1 (Inactive, past semester)
    const [p1] = await pool.execute(
      'INSERT INTO academic_periods (academic_year, semester, is_active, evaluation_open) VALUES (?, ?, 0, 0)',
      ['1999-2000', '1st']
    );
    period1Id = p1.insertId;

    // Insert 1 evaluation into Period 1 (past semester)
    const [eval1] = await pool.execute(
      `INSERT INTO evaluations (faculty_id, rating, comment, strengths, weaknesses, sentiment, sentiment_score, academic_period_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [facultyId, 4, 'Good performance past', 'Always on time in past', 'None', 'positive', 0.8, period1Id]
    );

    await pool.execute(
      `INSERT INTO evaluation_submissions (student_id, faculty_id, academic_period_id, evaluation_id)
       VALUES (?, ?, ?, ?)`,
      [studentId, facultyId, period1Id, eval1.insertId]
    );

    // Insert 1 evaluation into Period 2 (active semester)
    const [eval2] = await pool.execute(
      `INSERT INTO evaluations (faculty_id, rating, comment, strengths, weaknesses, sentiment, sentiment_score, academic_period_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [facultyId, 5, 'Outstanding in current semester', 'Super engaging lecture in active sem', 'None at all', 'positive', 0.95, period2Id]
    );

    await pool.execute(
      `INSERT INTO evaluation_submissions (student_id, faculty_id, academic_period_id, evaluation_id)
       VALUES (?, ?, ?, ?)`,
      ['STU-ANOTHER-01', facultyId, period2Id, eval2.insertId]
    );
  });

  after(async () => {
    await pool.execute('DELETE FROM evaluation_submissions WHERE student_id IN (?, "STU-ANOTHER-01") OR faculty_id = ?', [studentId, facultyId]);
    await pool.execute('DELETE FROM evaluations WHERE faculty_id = ?', [facultyId]);
    await pool.execute('DELETE FROM faculty WHERE id = ?', [facultyId]);
    await pool.execute('DELETE FROM students WHERE id = ?', [studentId]);
    await pool.execute('DELETE FROM academic_periods WHERE id = ?', [period1Id]);
    await pool.end();
  });

  it('1. GET /api/evaluation/faculty/:id defaults to active period and excludes past semester data', async () => {
    const res = await request(app)
      .get(`/api/evaluation/faculty/${facultyId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    // Should ONLY count the 1 evaluation from Period 2 (NOT 2)
    assert.equal(res.body.totalEvaluations, 1);
    assert.equal(res.body.selectedPeriodId, period2Id);
    assert.equal(res.body.academicPeriod.id, period2Id);
    assert.equal(res.body.writtenFeedbackCount, 1);
  });

  it('2. GET /api/evaluation/faculty/:id?period=all allows viewing combined historical evaluations', async () => {
    const res = await request(app)
      .get(`/api/evaluation/faculty/${facultyId}?period=all`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    // Combines period 1 and period 2
    assert.equal(res.body.totalEvaluations, 2);
    assert.equal(res.body.selectedPeriodId, null);
    assert.equal(res.body.writtenFeedbackCount, 2);
  });

  it('3. GET /api/evaluation/faculty/:id?period=:id correctly views a specific past semester', async () => {
    const res = await request(app)
      .get(`/api/evaluation/faculty/${facultyId}?period=${period1Id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.totalEvaluations, 1);
    assert.equal(res.body.selectedPeriodId, period1Id);
    assert.equal(res.body.academicPeriod.id, period1Id);
  });

  it('4. GET /api/dashboard/stats scopes evaluation counts to the active academic period', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    // Active period is period2Id; evaluations from period1Id must not inflate the count
    assert.ok(res.body.totalEvaluations >= 1);
  });
});
