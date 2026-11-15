'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const DataArchiveService = require('../services/dataArchiveService');
const AcademicPeriod = require('../models/AcademicPeriod');
const Evaluation = require('../models/Evaluation');
const EvaluationResponse = require('../models/EvaluationResponse');
const EvaluationSubmission = require('../models/EvaluationSubmission');
const User = require('../models/User');
const { pool } = require('../config/db');

describe('Task 7: Data Migration & Archiving Engine', () => {
  let testPeriodId;
  let testFacultyId;
  let testStudentId;
  let adminId;
  let adminPassword = 'AdminPassword123!';

  before(async () => {
    // 1. Ensure a known admin exists with known hashed password in admins table
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const [existingAdmin] = await pool.execute('SELECT * FROM admins WHERE email = ?', ['admin@psu.edu.ph']);
    if (existingAdmin.length > 0) {
      adminId = existingAdmin[0].id;
      await pool.execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, adminId]);
    } else {
      const [insAdmin] = await pool.execute(
        'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
        ['Test Administrator', 'admin@psu.edu.ph', hashedPassword]
      );
      adminId = insAdmin.insertId;
    }

    // 2. Create closed test period (2020-2021 1st Semester)
    const existing = await AcademicPeriod.findByYearAndSemester('2020-2021', '1st');
    if (existing) {
      testPeriodId = existing.id;
    } else {
      const res = await AcademicPeriod.create({
        academic_year: '2020-2021',
        semester: '1st',
        is_active: 0,
        start_date: '2020-08-01',
        end_date: '2020-12-15'
      });
      testPeriodId = res.insertId;
    }

    // 3. Find any test faculty and student
    const [facs] = await pool.execute('SELECT id FROM faculty LIMIT 1');
    testFacultyId = facs[0]?.id || 1;

    const [students] = await pool.execute('SELECT id FROM students LIMIT 1');
    testStudentId = students[0]?.id || 1;

    // 4. Clean any existing evaluations in this test period
    const [evals] = await pool.execute('SELECT id FROM evaluations WHERE academic_period_id = ?', [testPeriodId]);
    if (evals.length > 0) {
      const eIds = evals.map(e => e.id).join(',');
      await pool.execute(`DELETE FROM evaluation_responses WHERE evaluation_id IN (${eIds})`);
      await pool.execute('DELETE FROM evaluation_submissions WHERE academic_period_id = ?', [testPeriodId]);
      await pool.execute('DELETE FROM evaluations WHERE academic_period_id = ?', [testPeriodId]);
    }

    // 5. Insert sample evaluations
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const evalRes = await Evaluation.create({
        anonymous_student_ref: 'ANON_ARCHIVE_TEST_01',
        faculty_id: testFacultyId,
        rating: 4.85,
        comment: 'Great historical professor with clear pedagogical examples.',
        sentiment: 'positive',
        sentiment_score: 0.95,
        academic_period_id: testPeriodId
      }, conn);

      const insertedEvalId = evalRes.insertId;

      await EvaluationResponse.createBulk(insertedEvalId, [
        { question_id: 1, rating: 5 },
        { question_id: 2, rating: 4 },
        { question_id: 16, text_response: 'Strong mastery of topics' }
      ], conn);

      await EvaluationSubmission.create({
        student_id: testStudentId,
        faculty_id: testFacultyId,
        academic_period_id: testPeriodId,
        evaluation_id: insertedEvalId
      }, conn);

      await conn.commit();
    } finally {
      conn.release();
    }
  });

  it('1. Exports a complete period archive with valid SHA-256 checksum', async () => {
    const archive = await DataArchiveService.exportPeriodArchive(testPeriodId);

    assert.ok(archive, 'Archive object exists');
    assert.equal(archive.academic_period.id, testPeriodId);
    assert.equal(archive.academic_period.academic_year, '2020-2021');
    assert.ok(archive.evaluations.length >= 1, 'Contains exported evaluations');
    assert.ok(archive.evaluation_responses.length >= 1, 'Contains evaluation responses');
    assert.ok(archive.evaluation_submissions.length >= 1, 'Contains submission ledger');
    assert.ok(typeof archive.checksum === 'string' && archive.checksum.length === 64, 'Has SHA-256 hex checksum');
  });

  it('2. Rejects wiping an active academic period', async () => {
    const active = await AcademicPeriod.getActive();
    if (active) {
      await assert.rejects(
        async () => {
          await DataArchiveService.wipePeriodEvaluations(active.id, adminId, adminPassword);
        },
        /Cannot wipe evaluations from an ACTIVE academic period/
      );
    }
  });

  it('3. Successfully wipes closed historical period evaluations and cascades to responses & submissions', async () => {
    const result = await DataArchiveService.wipePeriodEvaluations(testPeriodId, adminId, adminPassword);
    assert.ok(result.message.includes('Successfully purged'));
    assert.ok(result.deleted.evaluations >= 1);

    // Verify database table is now 0 for this period
    const [evalCheck] = await pool.execute('SELECT COUNT(*) as c FROM evaluations WHERE academic_period_id = ?', [testPeriodId]);
    assert.equal(evalCheck[0].c, 0, 'Evaluations count is 0 after wipe');

    const [subCheck] = await pool.execute('SELECT COUNT(*) as c FROM evaluation_submissions WHERE academic_period_id = ?', [testPeriodId]);
    assert.equal(subCheck[0].c, 0, 'Submissions count is 0 after wipe');
  });

  it('4. Rejects restoring corrupted or tampered archive payload', async () => {
    const archive = await DataArchiveService.exportPeriodArchive(testPeriodId);
    // Tamper with content without updating checksum
    const tampered = JSON.parse(JSON.stringify(archive));
    tampered.evaluations.push({ id: 99999, comment: 'Hacked' });

    await assert.rejects(
      async () => {
        await DataArchiveService.restorePeriodArchive(tampered, adminId);
      },
      /Archive checksum verification failed/
    );
  });

  it('5. Restores evaluations, responses, and submissions atomically from valid archive payload', async () => {
    // Generate valid archive payload
    const mockArchive = {
      version: '1.0',
      academic_period: {
        id: testPeriodId,
        academic_year: '2020-2021',
        semester: '1st'
      },
      evaluations: [
        {
          id: 1,
          anonymous_student_ref: 'ANON_RESTORE_01',
          faculty_id: testFacultyId,
          rating: 4.75,
          comment: 'Restored comment test',
          sentiment: 'positive',
          sentiment_score: 0.88,
          created_at: new Date()
        }
      ],
      evaluation_responses: [
        {
          id: 1,
          evaluation_id: 1,
          question_id: 1,
          rating: 5,
          text_response: null
        }
      ],
      evaluation_submissions: [
        {
          id: 1,
          student_id: testStudentId,
          faculty_id: testFacultyId,
          evaluation_id: 1
        }
      ]
    };

    const result = await DataArchiveService.restorePeriodArchive(mockArchive, adminId);
    assert.ok(result.message.includes('Successfully restored'));
    assert.equal(result.restored.evaluations, 1);
    assert.equal(result.restored.evaluation_responses, 1);

    // Verify in DB
    const [evalCheck] = await pool.execute('SELECT * FROM evaluations WHERE academic_period_id = ?', [testPeriodId]);
    assert.equal(evalCheck.length, 1);
    assert.equal(evalCheck[0].comment, 'Restored comment test');
  });

  after(async () => {
    // Clean up test period to release connections and restore DB state
    const [evals] = await pool.execute('SELECT id FROM evaluations WHERE academic_period_id = ?', [testPeriodId]);
    if (evals.length > 0) {
      const eIds = evals.map(e => e.id).join(',');
      await pool.execute(`DELETE FROM evaluation_responses WHERE evaluation_id IN (${eIds})`);
      await pool.execute('DELETE FROM evaluation_submissions WHERE academic_period_id = ?', [testPeriodId]);
      await pool.execute('DELETE FROM evaluations WHERE academic_period_id = ?', [testPeriodId]);
    }
    await pool.end();
  });
});
