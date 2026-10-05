const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const path = require('path');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const { pool } = require('../config/db');
const AcademicPeriod = require('../models/AcademicPeriod');
const Evaluation = require('../models/Evaluation');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const EvaluationQuestion = require('../models/EvaluationQuestion');
const { runMigrationFile } = require('../scripts/runMigration');

describe('Task 1.3: Database Uniqueness, Period Integrity, and Migrations', () => {
  const adminToken = jwt.sign(
    { id: 'ADM-001', email: 'admin@psu.edu.ph', role: 'admin' },
    process.env.JWT_SECRET
  );

  const testStudentId = 'std_a26dfb';
  const testFacultyId = 'fac_082c7b';

  const studentToken = jwt.sign(
    { id: testStudentId, email: 'student10@psu.edu.ph', role: 'student' },
    process.env.JWT_SECRET
  );

  let activePeriodId;
  let isPhase2Schema = false;

  before(async () => {
    const [cols] = await pool.execute("SHOW COLUMNS FROM evaluations LIKE 'student_id'");
    isPhase2Schema = cols.length === 0;

    if (!isPhase2Schema) {
      // Ensure migrations are in UP state
      const upFile = path.resolve(__dirname, '../../database/migration_task1_3_uniqueness_period_integrity.sql');
      await runMigrationFile(upFile);
    }

    // Get active period
    const activePeriod = await AcademicPeriod.getActive();
    assert.ok(activePeriod, 'Expected an active academic period to exist');
    activePeriodId = activePeriod.id;

    // Ensure evaluation is open on active period
    await AcademicPeriod.toggleEvaluation(true);

    // Clean up any stray test evaluations for this student
    if (isPhase2Schema) {
      await pool.execute('DELETE FROM evaluation_submissions WHERE student_id = ?', [testStudentId]);
    } else {
      await pool.execute('DELETE FROM evaluations WHERE student_id = ?', [testStudentId]);
    }
  });

  after(async () => {
    try {
      if (isPhase2Schema) {
        await pool.execute('DELETE FROM evaluation_submissions WHERE student_id = ?', [testStudentId]);
      } else {
        await pool.execute('DELETE FROM evaluations WHERE student_id = ?', [testStudentId]);
      }
      await pool.execute('DELETE FROM academic_periods WHERE academic_year = ?', ['3000-3001']);
    } catch (_) {}
    await pool.end();
  });

  it('1. Rejects inserting an evaluation with NULL academic_period_id at the DB level', async () => {
    await assert.rejects(
      async () => {
        if (isPhase2Schema) {
          await pool.execute(
            `INSERT INTO evaluation_submissions (student_id, faculty_id, academic_period_id, evaluation_id)
             VALUES (?, ?, NULL, 999999)`,
            [testStudentId, testFacultyId]
          );
        } else {
          await pool.execute(
            `INSERT INTO evaluations (student_id_old, faculty_id_old, student_id, faculty_id, rating, comment, sentiment, academic_period_id)
             VALUES (1, 1, ?, ?, 5, 'Great teacher', 'positive', NULL)`,
            [testStudentId, testFacultyId]
          );
        }
      },
      (err) => {
        return err.code === 'ER_BAD_NULL_ERROR' || err.message.includes('cannot be null');
      }
    );
  });

  it('2. Fails at the DB level when inserting duplicate (student_id, faculty_id, academic_period_id)', async () => {
    if (isPhase2Schema) {
      await pool.execute('DELETE FROM evaluation_submissions WHERE student_id = ?', [testStudentId]);

      // Create two distinct evaluation records to avoid triggering 1:1 uq_submissions_evaluation_id
      const [res1] = await pool.execute(
        `INSERT INTO evaluations (faculty_id, rating, comment, sentiment, academic_period_id)
         VALUES (?, 5, 'Integrity Test Eval 1', 'positive', ?)`,
        [testFacultyId, activePeriodId]
      );
      const [res2] = await pool.execute(
        `INSERT INTO evaluations (faculty_id, rating, comment, sentiment, academic_period_id)
         VALUES (?, 4, 'Integrity Test Eval 2', 'positive', ?)`,
        [testFacultyId, activePeriodId]
      );
      const evalId1 = res1.insertId;
      const evalId2 = res2.insertId;

      await pool.execute(
        `INSERT INTO evaluation_submissions (student_id, faculty_id, academic_period_id, evaluation_id)
         VALUES (?, ?, ?, ?)`,
        [testStudentId, testFacultyId, activePeriodId, evalId1]
      );

      await assert.rejects(
        async () => {
          await pool.execute(
            `INSERT INTO evaluation_submissions (student_id, faculty_id, academic_period_id, evaluation_id)
             VALUES (?, ?, ?, ?)`,
            [testStudentId, testFacultyId, activePeriodId, evalId2]
          );
        },
        (err) => err.code === 'ER_DUP_ENTRY' || err.errno === 1062
      );

      await pool.execute('DELETE FROM evaluation_submissions WHERE student_id = ?', [testStudentId]);
      await pool.execute('DELETE FROM evaluations WHERE id IN (?, ?)', [evalId1, evalId2]);
    } else {
      // Insert initial record
      await pool.execute('DELETE FROM evaluations WHERE student_id = ?', [testStudentId]);
      await pool.execute(
        `INSERT INTO evaluations (student_id_old, faculty_id_old, student_id, faculty_id, rating, comment, sentiment, academic_period_id)
         VALUES (1, 1, ?, ?, 5, 'Initial evaluation', 'positive', ?)`,
        [testStudentId, testFacultyId, activePeriodId]
      );

      // Attempt direct duplicate insertion at DB level
      await assert.rejects(
        async () => {
          await pool.execute(
            `INSERT INTO evaluations (student_id_old, faculty_id_old, student_id, faculty_id, rating, comment, sentiment, academic_period_id)
             VALUES (1, 1, ?, ?, 4, 'Duplicate evaluation', 'positive', ?)`,
            [testStudentId, testFacultyId, activePeriodId]
          );
        },
        (err) => {
          return err.code === 'ER_DUP_ENTRY' || err.errno === 1062;
        }
      );

      // Clean up
      await pool.execute('DELETE FROM evaluations WHERE student_id = ?', [testStudentId]);
    }
  });

  it('3. App maps ER_DUP_ENTRY from DB level to HTTP 409 response', async () => {
    if (isPhase2Schema) {
      // Handled in Task 2.1 test suite
      return;
    }
    // Mock the pre-check to simulate a concurrent race condition where the pre-check passes
    // but the DB transaction catches ER_DUP_ENTRY
    const origExists = Evaluation.existsForStudentFacultyPeriod;
    const origEnrolled = Student.isEnrolledWithFaculty;
    const origFacultyFind = Faculty.findById;
    const origQuestions = EvaluationQuestion.findAllActive;

    Student.isEnrolledWithFaculty = async () => true;
    Faculty.findById = async () => ({ id: testFacultyId, name: 'Dr. Elena Magno' });
    EvaluationQuestion.findAllActive = async () => [
      { id: 1, question_type: 'rating', question: 'Teaching quality' }
    ];
    // Pre-check returns false (simulating race condition)
    Evaluation.existsForStudentFacultyPeriod = async () => false;

    // Insert an initial record so the DB has it
    await pool.execute('DELETE FROM evaluations WHERE student_id = ?', [testStudentId]);
    await pool.execute(
      `INSERT INTO evaluations (student_id_old, faculty_id_old, student_id, faculty_id, rating, comment, sentiment, academic_period_id)
       VALUES (1, 1, ?, ?, 5, 'First submit', 'positive', ?)`,
      [testStudentId, testFacultyId, activePeriodId]
    );

    try {
      const res = await request(app)
        .post('/api/evaluation/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          faculty_id: testFacultyId,
          responses: [{ question_id: 1, rating: 5 }],
          strengths: 'Very clear explanations and thorough examples.',
          weaknesses: 'Pacing was occasionally fast.',
        });

      assert.equal(res.status, 409);
      assert.ok(
        res.body.message.includes('already submitted an evaluation'),
        `Expected duplicate message, got: ${res.body.message}`
      );
    } finally {
      Evaluation.existsForStudentFacultyPeriod = origExists;
      Student.isEnrolledWithFaculty = origEnrolled;
      Faculty.findById = origFacultyFind;
      EvaluationQuestion.findAllActive = origQuestions;
      await pool.execute('DELETE FROM evaluations WHERE student_id = ?', [testStudentId]);
    }
  });

  it('4. DB trigger prevents inserting a second active academic period', async () => {
    await assert.rejects(
      async () => {
        await pool.execute(
          `INSERT INTO academic_periods (academic_year, semester, is_active)
           VALUES ('3000-3001', '1st', 1)`
        );
      },
      (err) => {
        return err.message.includes('Only one academic period can be active at a time');
      }
    );
  });

  it('5. DB trigger prevents updating an inactive period to active without deactivating the current active period', async () => {
    const [inactives] = await pool.execute('SELECT id FROM academic_periods WHERE is_active = 0 LIMIT 1');
    assert.ok(inactives.length > 0, 'Expected at least one inactive period');
    const inactiveId = inactives[0].id;

    await assert.rejects(
      async () => {
        await pool.execute(
          'UPDATE academic_periods SET is_active = 1 WHERE id = ?',
          [inactiveId]
        );
      },
      (err) => {
        return err.message.includes('Only one academic period can be active at a time');
      }
    );
  });

  it('6. AcademicPeriod.setActive atomically transitions the active period', async () => {
    const [inactives] = await pool.execute('SELECT id FROM academic_periods WHERE is_active = 0 LIMIT 1');
    const targetId = inactives[0].id;

    // Switch to target
    await AcademicPeriod.setActive(targetId);
    let current = await AcademicPeriod.getActive();
    assert.equal(current.id, targetId);

    // Verify only ONE period is active
    const [activeCount] = await pool.execute('SELECT COUNT(*) as c FROM academic_periods WHERE is_active = 1');
    assert.equal(activeCount[0].c, 1);

    // Switch back to original active period
    await AcademicPeriod.setActive(activePeriodId);
    current = await AcademicPeriod.getActive();
    assert.equal(current.id, activePeriodId);
    await AcademicPeriod.toggleEvaluation(true);
  });

  it('7. Rejects creating a duplicate academic period via API (409 Conflict)', async () => {
    const current = await AcademicPeriod.getActive();

    const res = await request(app)
      .post('/api/academic-periods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academic_year: current.academic_year,
        semester: current.semester,
      });

    assert.equal(res.status, 409);
    assert.ok(res.body.message.includes('already exists'));
  });

  it('8. Migration DOWN and UP scripts execute cleanly and are reversible', async () => {
    if (isPhase2Schema) {
      // Phase 1 migration test is skipped when schema has advanced to Phase 2 decoupled ledger
      return;
    }
    const downFile = path.resolve(__dirname, '../../database/migration_task1_3_uniqueness_period_integrity_down.sql');
    const upFile = path.resolve(__dirname, '../../database/migration_task1_3_uniqueness_period_integrity.sql');

    // Run DOWN
    await runMigrationFile(downFile);

    // Verify DOWN state: academic_period_id is nullable, unique constraint is removed
    const [colsDown] = await pool.execute('DESCRIBE evaluations');
    const periodColDown = colsDown.find((c) => c.Field === 'academic_period_id');
    assert.equal(periodColDown.Null, 'YES');

    const [keysDown] = await pool.execute(
      "SHOW INDEX FROM evaluations WHERE Key_name = 'uq_evaluations_student_faculty_period'"
    );
    assert.equal(keysDown.length, 0);

    // Run UP
    await runMigrationFile(upFile);

    // Verify UP state: academic_period_id is NOT NULL, unique constraint is present
    const [colsUp] = await pool.execute('DESCRIBE evaluations');
    const periodColUp = colsUp.find((c) => c.Field === 'academic_period_id');
    assert.equal(periodColUp.Null, 'NO');

    const [keysUp] = await pool.execute(
      "SHOW INDEX FROM evaluations WHERE Key_name = 'uq_evaluations_student_faculty_period'"
    );
    assert.ok(keysUp.length > 0);
  });
});
