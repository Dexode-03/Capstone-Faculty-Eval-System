'use strict';
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const app = require('../server');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Evaluation = require('../models/Evaluation');
const EvaluationResponse = require('../models/EvaluationResponse');
const AcademicPeriod = require('../models/AcademicPeriod');
const { pool } = require('../config/db');

describe('Task 2.3: Evaluation Response Threshold & Anonymity Safeguards', () => {

  // ── Tokens ──────────────────────────────────────────────────────────────
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@psu.edu.ph', role: 'admin' },
    process.env.JWT_SECRET
  );
  const facultyToken = jwt.sign(
    { id: 'FAC-SAFE-01', email: 'profsafeguard@psu.edu.ph', role: 'faculty' },
    process.env.JWT_SECRET
  );

  // ── Stubs ───────────────────────────────────────────────────────────────
  let origFacultyFindById;
  let origFacultyGetSubjectAssignments;
  let origSubjectFindById;
  let origEvalFindByFacultyId;
  let origEvalGetAverageRating;
  let origRespGetAveragesByFaculty;
  let origPeriodGetActive;
  let origPoolExecute;
  let origEnvThreshold;

  const sampleEvaluations = (count) => {
    const list = [];
    for (let i = 1; i <= count; i++) {
      list.push({
        id: i,
        rating: 4.5,
        comment: `Feedback comment #${i}`,
        strengths: `Strength detail #${i}`,
        weaknesses: `Weakness detail #${i}`,
        sentiment: i % 2 === 0 ? 'positive' : 'neutral',
        sentiment_score: 0.7,
        created_at: new Date('2026-10-01T12:00:00Z'),
      });
    }
    return list;
  };

  before(() => {
    origFacultyFindById              = Faculty.findById;
    origFacultyGetSubjectAssignments = Faculty.getSubjectAssignments;
    origSubjectFindById              = Subject.findById;
    origEvalFindByFacultyId          = Evaluation.findByFacultyId;
    origEvalGetAverageRating         = Evaluation.getAverageRating;
    origRespGetAveragesByFaculty     = EvaluationResponse.getAveragesByFaculty;
    origPeriodGetActive              = AcademicPeriod.getActive;
    origPoolExecute                  = pool.execute;
    origEnvThreshold                 = process.env.MIN_EVALUATION_THRESHOLD;

    Faculty.findById = async (id) => ({
      id,
      name: 'Prof. Anonymity Defender',
      email: 'profsafeguard@psu.edu.ph',
      department: 'Computer Studies',
      subject_ids: '101',
      subject_codes: 'CS101',
      subject_names: 'Intro to Computing',
    });
    Faculty.getSubjectAssignments = async () => [
      { subject_id: 101, subject_code: 'CS101', subject_name: 'Intro to Computing', section: 'BSIT-3A' },
    ];
    Subject.findById = async (id) => ({
      id,
      code: 'CS101',
      name: 'Intro to Computing',
      department: 'Computer Studies',
    });
    Evaluation.getAverageRating = async () => '4.60';
    EvaluationResponse.getAveragesByFaculty = async () => [
      {
        question_id: 1,
        question_text: 'Explains concepts clearly',
        category: 'Teaching Methodology',
        average: '4.60',
        total: '10',
      },
    ];
  });

  after(async () => {
    Faculty.findById                 = origFacultyFindById;
    Faculty.getSubjectAssignments    = origFacultyGetSubjectAssignments;
    Subject.findById                 = origSubjectFindById;
    Evaluation.findByFacultyId       = origEvalFindByFacultyId;
    Evaluation.getAverageRating      = origEvalGetAverageRating;
    EvaluationResponse.getAveragesByFaculty = origRespGetAveragesByFaculty;
    AcademicPeriod.getActive         = origPeriodGetActive;
    pool.execute                     = origPoolExecute;
    process.env.MIN_EVALUATION_THRESHOLD = origEnvThreshold;
    await pool.end();
  });

  beforeEach(() => {
    delete process.env.MIN_EVALUATION_THRESHOLD;
  });

  // ── 1. GET /api/evaluation/faculty/:id under threshold ─────────────────────
  it('1. GET /api/evaluation/faculty/:id masks comments, sentiment, and recommendations when count < 5', async () => {
    Evaluation.findByFacultyId = async () => sampleEvaluations(3);

    const res = await request(app)
      .get('/api/evaluation/faculty/FAC-SAFE-01')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.totalEvaluations, 3);
    assert.equal(res.body.thresholdReached, false);
    assert.equal(res.body.minThreshold, 5);
    assert.match(res.body.thresholdMessage, /threshold not met/i);

    // Comments and qualitative feedback MUST be empty
    assert.deepEqual(res.body.recentFeedback, []);
    assert.deepEqual(res.body.allFeedback, []);

    // Sentiment breakdown MUST be zeroes
    assert.deepEqual(res.body.sentimentOverview, { positive: 0, neutral: 0, negative: 0 });

    // Prescriptive recommendations MUST be empty
    assert.deepEqual(res.body.recommendations, []);

    // Aggregate rating and question averages remain available
    assert.equal(res.body.averageRating, '4.6');
    assert.equal(res.body.questionAverages.length, 1);
  });

  // ── 2. GET /api/evaluation/faculty/:id at or above threshold ───────────────
  it('2. GET /api/evaluation/faculty/:id exposes feedback, sentiment, and recommendations when count >= 5', async () => {
    Evaluation.findByFacultyId = async () => sampleEvaluations(5);

    const res = await request(app)
      .get('/api/evaluation/faculty/FAC-SAFE-01')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.totalEvaluations, 5);
    assert.equal(res.body.thresholdReached, true);
    assert.equal(res.body.thresholdMessage, null);

    // Feedback comments are exposed
    assert.equal(res.body.recentFeedback.length, 5);
    assert.equal(res.body.allFeedback.length, 5);
    assert.equal(res.body.allFeedback[0].strengths, 'Strength detail #1');

    // Sentiment overview contains calculated distribution
    assert.equal(res.body.sentimentOverview.positive > 0 || res.body.sentimentOverview.neutral > 0, true);

    // Recommendations are generated
    assert.ok(Array.isArray(res.body.recommendations));
  });

  // ── 3. GET /api/evaluation/my-report under threshold ───────────────────────
  it('3. GET /api/evaluation/my-report masks comments and sentiment for faculty own report when count < 5', async () => {
    Evaluation.findByFacultyId = async () => sampleEvaluations(2);

    const res = await request(app)
      .get('/api/evaluation/my-report')
      .set('Authorization', `Bearer ${facultyToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.thresholdReached, false);
    assert.deepEqual(res.body.recentFeedback, []);
    assert.deepEqual(res.body.sentimentOverview, { positive: 0, neutral: 0, negative: 0 });
    assert.deepEqual(res.body.recommendations, []);
  });

  // ── 4. GET /api/evaluation/my-report at or above threshold ─────────────────
  it('4. GET /api/evaluation/my-report unmasks comments and sentiment for faculty own report when count >= 5', async () => {
    Evaluation.findByFacultyId = async () => sampleEvaluations(6);

    const res = await request(app)
      .get('/api/evaluation/my-report')
      .set('Authorization', `Bearer ${facultyToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.thresholdReached, true);
    assert.equal(res.body.recentFeedback.length, 6);
    assert.equal(res.body.allFeedback.length, 6);
  });

  // ── 5. Subject Section Report under threshold ─────────────────────────────
  it('5. GET subject-section-report conceals comments when respondent count < threshold', async () => {
    AcademicPeriod.getActive = async () => ({ id: 1, academic_year: '2025-2026', semester: '1st' });

    pool.execute = async (sql) => {
      if (sql.includes('COUNT(DISTINCT st.id)')) {
        return [[{ enrolled_count: 35 }]];
      }
      if (sql.includes('COUNT(DISTINCT es.student_id)')) {
        return [[{ respondent_count: 3 }]]; // 3 < 5
      }
      if (sql.includes('SELECT q.id, q.category')) {
        return [[]];
      }
      if (sql.includes('e.strengths')) {
        return [[
          { strengths: 'Super energetic and helpful', weaknesses: 'Gives pop quizzes' },
          { strengths: 'Always available', weaknesses: 'None' },
        ]];
      }
      return [[]];
    };

    const res = await request(app)
      .get('/api/evaluation/faculty/FAC-SAFE-01/subject-section-report?subject_id=101&section=BSIT-3A')
      .set('Authorization', `Bearer ${facultyToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.respondentCount, 3);
    assert.equal(res.body.thresholdReached, false);
    assert.deepEqual(res.body.comments, []);
    assert.match(res.body.thresholdMessage, /threshold not met/i);
  });

  // ── 6. Subject Section Report at or above threshold ───────────────────────
  it('6. GET subject-section-report exposes comments when respondent count >= threshold', async () => {
    AcademicPeriod.getActive = async () => ({ id: 1, academic_year: '2025-2026', semester: '1st' });

    pool.execute = async (sql) => {
      if (sql.includes('COUNT(DISTINCT st.id)')) {
        return [[{ enrolled_count: 35 }]];
      }
      if (sql.includes('COUNT(DISTINCT es.student_id)')) {
        return [[{ respondent_count: 8 }]]; // 8 >= 5
      }
      if (sql.includes('SELECT q.id, q.category')) {
        return [[]];
      }
      if (sql.includes('e.strengths')) {
        return [[
          { strengths: 'Super energetic and helpful', weaknesses: 'Gives pop quizzes' },
          { strengths: 'Always available', weaknesses: 'None' },
        ]];
      }
      return [[]];
    };

    const res = await request(app)
      .get('/api/evaluation/faculty/FAC-SAFE-01/subject-section-report?subject_id=101&section=BSIT-3A')
      .set('Authorization', `Bearer ${facultyToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.respondentCount, 8);
    assert.equal(res.body.thresholdReached, true);
    assert.equal(res.body.thresholdMessage, null);
    assert.equal(res.body.comments.length, 2);
    assert.equal(res.body.comments[0].strengths, 'Super energetic and helpful');
  });

  // ── 7. Custom threshold via environment variable ──────────────────────────
  it('7. Dynamically respects custom MIN_EVALUATION_THRESHOLD from process.env', async () => {
    process.env.MIN_EVALUATION_THRESHOLD = '3';
    Evaluation.findByFacultyId = async () => sampleEvaluations(3);

    const res = await request(app)
      .get('/api/evaluation/faculty/FAC-SAFE-01')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.minThreshold, 3);
    assert.equal(res.body.thresholdReached, true);
    assert.equal(res.body.recentFeedback.length, 3);
  });

  // ── 8. GET /api/dashboard/faculty protects sentiment under threshold ──────
  it('8. GET /api/dashboard/faculty protects sentimentOverview when evaluations < threshold', async () => {
    Evaluation.findByFacultyId = async () => sampleEvaluations(2);

    pool.execute = async (sql) => {
      if (sql.includes('COUNT(DISTINCT st.id)')) {
        return [[{ total_students: 30, evaluated_students: 2 }]];
      }
      return [[]];
    };

    const res = await request(app)
      .get('/api/dashboard/faculty')
      .set('Authorization', `Bearer ${facultyToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.thresholdReached, false);
    assert.deepEqual(res.body.sentimentOverview, { positive: 0, neutral: 0, negative: 0 });
  });

});
