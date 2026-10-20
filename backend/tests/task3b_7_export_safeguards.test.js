'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { pool } = require('../config/db');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const AcademicPeriod = require('../models/AcademicPeriod');
const Evaluation = require('../models/Evaluation');
const EvaluationResponse = require('../models/EvaluationResponse');
const RecommendationRule = require('../models/RecommendationRule');
const AuditLog = require('../models/AuditLog');
const {
  getFacultyEvaluations,
  getFacultySubjectSectionReport,
  getSystemAnalysis,
} = require('../controllers/evaluationController');
const { getVerbalRating } = require('../config/ratingScale');

describe('Task 3B.7: PDF and Excel Export Safeguards (FR-30)', () => {
  let origFacultyFindById;
  let origEvalFindByFacultyId;
  let origEvalGetAverageRating;
  let origEvalResponseGetAverages;
  let origFacultyGetSubjectAssignments;
  let origFacultyGetEnrolledCount;
  let origAcademicPeriodGetActive;
  let origRecRuleFindAll;
  let origAuditLog;
  let origSubjectFindById;
  let origPoolExecute;

  let origDeptBenchmark;
  let origPeriodAggregates;
  let origPeriodFindAll;

  before(() => {
    origFacultyFindById = Faculty.findById;
    origEvalFindByFacultyId = Evaluation.findByFacultyId;
    origEvalGetAverageRating = Evaluation.getAverageRating;
    origEvalResponseGetAverages = EvaluationResponse.getAveragesByFaculty;
    origFacultyGetSubjectAssignments = Faculty.getSubjectAssignments;
    origFacultyGetEnrolledCount = Faculty.getEnrolledStudentCount;
    origAcademicPeriodGetActive = AcademicPeriod.getActive;
    origRecRuleFindAll = RecommendationRule.findAllActive;
    origAuditLog = AuditLog.log;
    origSubjectFindById = Subject.findById;
    origPoolExecute = pool.execute;
    origDeptBenchmark = Evaluation.getDepartmentBenchmark;
    origPeriodAggregates = Evaluation.getPeriodAggregatesByFaculty;
    origPeriodFindAll = AcademicPeriod.findAll;

    // Stubs
    Faculty.findById = async (id) => ({
      id,
      name: id === 'fac-1' ? 'Dr. Santos' : 'Prof. Reyes',
      department: 'Computer Studies',
    });
    Evaluation.getAverageRating = async () => '4.50';
    EvaluationResponse.getAveragesByFaculty = async () => [];
    Faculty.getSubjectAssignments = async () => [];
    Faculty.getEnrolledStudentCount = async () => 30;
    AcademicPeriod.getActive = async () => ({ id: 1, semester: '1st Semester', academic_year: '2024-2025' });
    AcademicPeriod.findAll = async () => [{ id: 1, semester: '1st Semester', academic_year: '2024-2025', is_active: 1 }];
    Evaluation.getDepartmentBenchmark = async () => ({ average_rating: '4.20', qualifying_faculty_count: 5 });
    Evaluation.getPeriodAggregatesByFaculty = async () => [];
    RecommendationRule.findAllActive = async () => [];
    AuditLog.log = async () => {};
    Subject.findById = async (id) => ({ id, code: 'CS101', name: 'Intro to CS' });
  });

  after(() => {
    Faculty.findById = origFacultyFindById;
    Evaluation.findByFacultyId = origEvalFindByFacultyId;
    Evaluation.getAverageRating = origEvalGetAverageRating;
    EvaluationResponse.getAveragesByFaculty = origEvalResponseGetAverages;
    Faculty.getSubjectAssignments = origFacultyGetSubjectAssignments;
    Faculty.getEnrolledStudentCount = origFacultyGetEnrolledCount;
    AcademicPeriod.getActive = origAcademicPeriodGetActive;
    RecommendationRule.findAllActive = origRecRuleFindAll;
    AuditLog.log = origAuditLog;
    Subject.findById = origSubjectFindById;
    pool.execute = origPoolExecute;
    Evaluation.getDepartmentBenchmark = origDeptBenchmark;
    Evaluation.getPeriodAggregatesByFaculty = origPeriodAggregates;
    AcademicPeriod.findAll = origPeriodFindAll;
  });

  // Helper to create mock req and res
  const createMockReqRes = (user, params = {}, query = {}) => {
    const req = {
      user,
      params,
      query,
      ip: '127.0.0.1',
    };
    let responseStatus = 200;
    let responseData = null;

    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      },
      getStatus: () => responseStatus,
      getData: () => responseData,
    };
    return { req, res };
  };

  describe('1. Role Access Checks (Admins export all, Faculty export only their own)', () => {
    it('allows admin to access any faculty member evaluation report', async () => {
      Evaluation.findByFacultyId = async () => [];
      const { req, res } = createMockReqRes({ id: 'admin-1', role: 'admin' }, { id: 'fac-1' });

      await getFacultyEvaluations(req, res);
      assert.equal(res.getStatus(), 200);
      assert.equal(res.getData().faculty.name, 'Dr. Santos');
    });

    it('allows a faculty member to access their own evaluation report', async () => {
      Evaluation.findByFacultyId = async () => [];
      const { req, res } = createMockReqRes({ id: 'fac-1', role: 'faculty' }, { id: 'fac-1' });

      await getFacultyEvaluations(req, res);
      assert.equal(res.getStatus(), 200);
      assert.equal(res.getData().faculty.name, 'Dr. Santos');
    });

    it('DENIES a faculty member from accessing another faculty member report (403)', async () => {
      const { req, res } = createMockReqRes({ id: 'fac-1', role: 'faculty' }, { id: 'fac-2' });

      await getFacultyEvaluations(req, res);
      assert.equal(res.getStatus(), 403);
      assert.match(res.getData().message, /access denied/i);
    });

    it('DENIES student or non-privileged roles from accessing faculty report (403)', async () => {
      const { req, res } = createMockReqRes({ id: 'stu-1', role: 'student' }, { id: 'fac-1' });

      await getFacultyEvaluations(req, res);
      assert.equal(res.getStatus(), 403);
    });

    it('enforces role check on subject-section report: faculty can only view own subject section', async () => {
      const { req: deniedReq, res: deniedRes } = createMockReqRes(
        { id: 'fac-1', role: 'faculty' },
        { id: 'fac-2' },
        { subject_id: 'sub-1', section: 'A' }
      );
      await getFacultySubjectSectionReport(deniedReq, deniedRes);
      assert.equal(deniedRes.getStatus(), 403);

      // Same faculty accessing their own
      pool.execute = async (sql) => {
        if (sql.includes('COUNT(DISTINCT st.id)')) return [[{ enrolled_count: 25 }], []];
        if (sql.includes('COUNT(DISTINCT es.student_id)')) return [[{ respondent_count: 10 }], []];
        if (sql.includes('FROM evaluation_questions')) return [[], []];
        if (sql.includes('FROM evaluations e')) return [[], []];
        return [[], []];
      };

      const { req: allowedReq, res: allowedRes } = createMockReqRes(
        { id: 'fac-1', role: 'faculty' },
        { id: 'fac-1' },
        { subject_id: 'sub-1', section: 'A' }
      );
      await getFacultySubjectSectionReport(allowedReq, allowedRes);
      assert.equal(allowedRes.getStatus(), 200);
    });
  });

  describe('2. Student Anonymity Safeguard (Never include student identity)', () => {
    it('ensures evaluation report feedback contains NO student identities', async () => {
      // Return evaluations with comments
      Evaluation.findByFacultyId = async () => [
        {
          id: 1,
          rating: 5,
          sentiment: 'positive',
          strengths: 'Very clear lectures',
          weaknesses: 'None',
          created_at: new Date(),
        },
        {
          id: 2,
          rating: 4,
          sentiment: 'positive',
          strengths: 'Kind teacher',
          weaknesses: 'Fast pace',
          created_at: new Date(),
        },
        { id: 3, rating: 5, sentiment: 'positive', strengths: 'Great', weaknesses: '', created_at: new Date() },
        { id: 4, rating: 5, sentiment: 'positive', strengths: 'Helpful', weaknesses: '', created_at: new Date() },
        { id: 5, rating: 4, sentiment: 'positive', strengths: 'Approachable', weaknesses: '', created_at: new Date() },
      ];

      const { req, res } = createMockReqRes({ id: 'admin-1', role: 'admin' }, { id: 'fac-1' });
      await getFacultyEvaluations(req, res);

      const data = res.getData();
      assert.equal(data.thresholdReached, true);
      assert.ok(data.recentFeedback.length > 0);

      // Verify each feedback item strictly lacks student identity fields
      data.recentFeedback.forEach((f) => {
        assert.equal(f.student_id, undefined, 'student_id must never be present');
        assert.equal(f.student_name, undefined, 'student_name must never be present');
        assert.equal(f.name, undefined, 'student name must never be present');
        assert.equal(f.email, undefined, 'email must never be present');
        assert.equal(f.student_number, undefined, 'student_number must never be present');
        assert.equal(f.anonymous_student_ref, undefined, 'anonymous respondent ref must never be present');
      });
    });
  });

  describe('3. Minimum-Response Threshold Safeguard (Hide comments & recommendations)', () => {
    it('withholds comments and recommendations when total evaluations < 5', async () => {
      // 3 evaluations (< threshold of 5)
      Evaluation.findByFacultyId = async () => [
        { id: 1, rating: 4, sentiment: 'positive', strengths: 'Good', weaknesses: '', created_at: new Date() },
        { id: 2, rating: 4, sentiment: 'positive', strengths: 'Good', weaknesses: '', created_at: new Date() },
        { id: 3, rating: 5, sentiment: 'positive', strengths: 'Good', weaknesses: '', created_at: new Date() },
      ];

      const { req, res } = createMockReqRes({ id: 'fac-1', role: 'faculty' }, { id: 'fac-1' });
      await getFacultyEvaluations(req, res);

      const data = res.getData();
      assert.equal(data.thresholdReached, false, 'thresholdReached must be false when < 5');
      assert.deepEqual(data.recentFeedback, [], 'recentFeedback must be empty array when threshold not met');
      assert.deepEqual(data.recommendations, [], 'recommendations must be empty array when threshold not met');
      assert.ok(data.thresholdMessage.includes('Threshold not met'));
    });

    it('discloses comments and recommendations when total evaluations >= 5', async () => {
      Evaluation.findByFacultyId = async () => [
        { id: 1, rating: 4, sentiment: 'positive', strengths: 'A', weaknesses: '', created_at: new Date() },
        { id: 2, rating: 4, sentiment: 'positive', strengths: 'B', weaknesses: '', created_at: new Date() },
        { id: 3, rating: 5, sentiment: 'positive', strengths: 'C', weaknesses: '', created_at: new Date() },
        { id: 4, rating: 5, sentiment: 'positive', strengths: 'D', weaknesses: '', created_at: new Date() },
        { id: 5, rating: 4, sentiment: 'positive', strengths: 'E', weaknesses: '', created_at: new Date() },
      ];

      const { req, res } = createMockReqRes({ id: 'fac-1', role: 'faculty' }, { id: 'fac-1' });
      await getFacultyEvaluations(req, res);

      const data = res.getData();
      assert.equal(data.thresholdReached, true);
      assert.equal(data.recentFeedback.length, 5);
      assert.equal(data.thresholdMessage, null);
    });
  });

  describe('4. Export Data Parity (Numbers match on-screen configuration)', () => {
    it('correctly maps scores to PSU official verbal rating scale for export', () => {
      assert.equal(getVerbalRating(4.8), 'Outstanding');
      assert.equal(getVerbalRating(4.55), 'Outstanding');
      assert.equal(getVerbalRating(4.5), 'Very Satisfactory');
      assert.equal(getVerbalRating(4.0), 'Very Satisfactory');
      assert.equal(getVerbalRating(3.51), 'Very Satisfactory');
      assert.equal(getVerbalRating(3.5), 'Satisfactory');
      assert.equal(getVerbalRating(3.0), 'Satisfactory');
      assert.equal(getVerbalRating(2.51), 'Satisfactory');
      assert.equal(getVerbalRating(2.5), 'Fair');
      assert.equal(getVerbalRating(2.0), 'Fair');
      assert.equal(getVerbalRating(1.51), 'Fair');
      assert.equal(getVerbalRating(1.5), 'Poor');
      assert.equal(getVerbalRating(1.2), 'Poor');
      assert.equal(getVerbalRating(0), 'N/A');
    });
  });
});
