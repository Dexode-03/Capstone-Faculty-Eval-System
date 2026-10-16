'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { pool } = require('../config/db');
const User = require('../models/User');
const Evaluation = require('../models/Evaluation');
const { getSystemAnalysis } = require('../controllers/evaluationController');

describe('Task 3B.5: Filters (FR-02, FR-28)', () => {
  let origExecute;
  let lastExecutedQuery = null;
  let lastExecutedParams = null;

  before(() => {
    origExecute = pool.execute;
  });

  after(() => {
    pool.execute = origExecute;
  });

  // Helper to intercept queries
  const mockPoolExecute = (mockRows = []) => {
    pool.execute = async (query, params = []) => {
      lastExecutedQuery = query;
      lastExecutedParams = params;
      return [mockRows, []];
    };
  };

  describe('1. Accounts Page Filters (FR-02) — Parameterized queries & SQL injection safety', () => {
    it('filters faculty by department using parameterized query', async () => {
      mockPoolExecute([{ id: 'fac-1', name: 'Dr. Santos', department: 'CS' }]);

      const result = await User.findAllByRoleFiltered('faculty', { department: 'CS' });
      assert.ok(Array.isArray(result));
      assert.ok(lastExecutedQuery.includes('f.department = ?'));
      assert.deepEqual(lastExecutedParams, ['CS']);
    });

    it('filters faculty by subject using parameterized subquery', async () => {
      mockPoolExecute([{ id: 'fac-1', name: 'Dr. Santos', department: 'CS' }]);

      await User.findAllByRoleFiltered('faculty', { subject: 'CS101' });
      assert.ok(lastExecutedQuery.includes('fs_sub.subject_id = ? OR s_sub.code = ?'));
      assert.deepEqual(lastExecutedParams, ['CS101', 'CS101']);
    });

    it('filters faculty by year_level and section using parameterized queries', async () => {
      mockPoolExecute([{ id: 'fac-1', name: 'Dr. Santos' }]);

      await User.findAllByRoleFiltered('faculty', { year_level: '3rd Year', section: 'A' });
      assert.ok(lastExecutedQuery.includes('s_sub.year_level = ?'));
      assert.ok(lastExecutedQuery.includes('fs_sub.section = ?'));
      assert.deepEqual(lastExecutedParams, ['3rd Year', 'A']);
    });

    it('filters students by department, subject, year_level, and section combined', async () => {
      mockPoolExecute([{ id: 'stu-1', name: 'Juan Cruz', department: 'CS', year_level: '4th Year', section: 'A' }]);

      const filters = {
        department: 'CS',
        subject: 'sub_123',
        year_level: '4th Year',
        section: 'A',
      };
      await User.findAllByRoleFiltered('student', filters);

      assert.ok(lastExecutedQuery.includes('st.department = ?'));
      assert.ok(lastExecutedQuery.includes('ss_sub.subject_id = ? OR s_sub.code = ?'));
      assert.ok(lastExecutedQuery.includes('st.year_level = ?'));
      assert.ok(lastExecutedQuery.includes('st.section = ?'));
      assert.deepEqual(lastExecutedParams, ['CS', 'sub_123', 'sub_123', '4th Year', 'A']);
    });

    it('safely ignores empty, whitespace, null, undefined, and "all" filter values', async () => {
      mockPoolExecute([]);

      await User.findAllByRoleFiltered('student', {
        department: '',
        subject: 'all',
        year_level: '   ',
        section: null,
        search: undefined,
      });

      // No WHERE filter clauses added except WHERE 1=1
      assert.ok(!lastExecutedQuery.includes('st.department = ?'));
      assert.ok(!lastExecutedQuery.includes('st.year_level = ?'));
      assert.ok(!lastExecutedQuery.includes('st.section = ?'));
      assert.deepEqual(lastExecutedParams, []);
    });

    it('prevents SQL injection with malicious quote inputs in user filters', async () => {
      mockPoolExecute([]);

      const maliciousInputs = {
        department: "CS' OR '1'='1",
        subject: "'; DROP TABLE students; --",
        year_level: '4th Year" OR "1"="1',
        section: "A' UNION SELECT * FROM admins --",
        search: "' OR name LIKE '%",
      };

      await User.findAllByRoleFiltered('student', maliciousInputs);

      // Verify input values are bound strictly as parameters, never concatenated into SQL
      assert.ok(!lastExecutedQuery.includes("DROP TABLE"));
      assert.ok(!lastExecutedQuery.includes("UNION SELECT"));
      assert.ok(!lastExecutedQuery.includes("'1'='1'"));
      assert.deepEqual(lastExecutedParams, [
        "CS' OR '1'='1",
        "'; DROP TABLE students; --",
        "'; DROP TABLE students; --",
        '4th Year" OR "1"="1',
        "A' UNION SELECT * FROM admins --",
        "%' OR name LIKE '%%",
        "%' OR name LIKE '%%",
      ]);
    });
  });

  describe('2. Reports Page Filters (FR-28) — Parameterized queries & SQL injection safety', () => {
    it('filters evaluations by academic period', async () => {
      mockPoolExecute([{ id: 1, rating: 4.5, comment: 'Great' }]);

      await Evaluation.findAll({ period: 2 });
      assert.ok(lastExecutedQuery.includes('e.academic_period_id = ?'));
      assert.deepEqual(lastExecutedParams, [2]);
    });

    it('filters evaluations by department', async () => {
      mockPoolExecute([]);

      await Evaluation.findAll({ department: 'Engineering' });
      assert.ok(lastExecutedQuery.includes('f.department = ?'));
      assert.deepEqual(lastExecutedParams, ['Engineering']);
    });

    it('filters evaluations by faculty ID', async () => {
      mockPoolExecute([]);

      await Evaluation.findAll({ faculty: 'fac-99' });
      assert.ok(lastExecutedQuery.includes('e.faculty_id = ?'));
      assert.deepEqual(lastExecutedParams, ['fac-99']);
    });

    it('filters evaluations by subject via evaluation submissions subquery', async () => {
      mockPoolExecute([]);

      await Evaluation.findAll({ subject: 'CS102' });
      assert.ok(lastExecutedQuery.includes('ss_sub.subject_id = ? OR s_sub.code = ?'));
      assert.deepEqual(lastExecutedParams, ['CS102', 'CS102']);
    });

    it('filters evaluations by year_level and section', async () => {
      mockPoolExecute([]);

      await Evaluation.findAll({ year_level: '2nd Year', section: 'B' });
      assert.ok(lastExecutedQuery.includes('st_sub.year_level = ?'));
      assert.ok(lastExecutedQuery.includes('st_sub.section = ?'));
      assert.deepEqual(lastExecutedParams, ['2nd Year', 'B']);
    });

    it('combines period, department, faculty, subject, year_level, and section correctly', async () => {
      mockPoolExecute([]);

      const combined = {
        period: '1',
        department: 'CS',
        faculty: 'fac-5',
        subject: 'sub-101',
        year_level: '3rd Year',
        section: 'A',
      };

      await Evaluation.findAll(combined);

      assert.ok(lastExecutedQuery.includes('e.academic_period_id = ?'));
      assert.ok(lastExecutedQuery.includes('f.department = ?'));
      assert.ok(lastExecutedQuery.includes('e.faculty_id = ?'));
      assert.ok(lastExecutedQuery.includes('ss_sub.subject_id = ? OR s_sub.code = ?'));
      assert.ok(lastExecutedQuery.includes('st_sub.year_level = ?'));
      assert.ok(lastExecutedQuery.includes('st_sub.section = ?'));

      assert.deepEqual(lastExecutedParams, [
        '1',
        'CS',
        'fac-5',
        'sub-101',
        'sub-101',
        '3rd Year',
        'A',
      ]);
    });

    it('safely ignores invalid, empty, or "all" filters in Evaluation.findAll', async () => {
      mockPoolExecute([]);

      await Evaluation.findAll({
        period: 'all',
        department: '',
        faculty: null,
        subject: undefined,
        year_level: '   ',
        section: 'ALL',
      });

      assert.ok(!lastExecutedQuery.includes('WHERE'));
      assert.deepEqual(lastExecutedParams, []);
    });

    it('prevents SQL injection in Evaluation.findAll with quote characters', async () => {
      mockPoolExecute([]);

      const malicious = {
        period: "1' OR '1'='1",
        department: "CS'--",
        faculty: 'admin"; DROP TABLE evaluations; --',
        subject: "' OR ''='",
        year_level: "1st' OR '1'='1",
        section: "A' UNION SELECT 1,2,3 --",
      };

      await Evaluation.findAll(malicious);

      assert.ok(!lastExecutedQuery.includes("DROP TABLE"));
      assert.ok(!lastExecutedQuery.includes("UNION SELECT"));
      assert.ok(!lastExecutedQuery.includes("'1'='1'"));
      assert.deepEqual(lastExecutedParams, [
        "1' OR '1'='1",
        "CS'--",
        'admin"; DROP TABLE evaluations; --',
        "' OR ''='",
        "' OR ''='",
        "1st' OR '1'='1",
        "A' UNION SELECT 1,2,3 --",
      ]);
    });
  });

  describe('3. getSystemAnalysis controller integration', () => {
    it('passes filter query parameters to Evaluation.findAll and returns filterOptions', async () => {
      let capturedFilters = null;
      const origFindAll = Evaluation.findAll;

      Evaluation.findAll = async (filters) => {
        capturedFilters = filters;
        return [
          {
            id: 1,
            faculty_id: 'fac-1',
            rating: 4.5,
            comment: 'Very helpful and organized',
            sentiment: 'positive',
            sentiment_score: 0.8,
            strengths: 'helpful, organized',
            weaknesses: '',
            faculty_name: 'Dr. Santos',
            department: 'CS',
          },
        ];
      };

      mockPoolExecute([]);

      const req = {
        query: {
          period: '1',
          department: 'CS',
          faculty: 'fac-1',
          subject: 'CS101',
          year_level: '4th Year',
          section: 'A',
        },
        user: { role: 'admin', id: 'admin-1' },
        ip: '127.0.0.1',
      };

      let responseData = null;
      const res = {
        json: (data) => {
          responseData = data;
          return res;
        },
        status: () => res,
      };

      try {
        await getSystemAnalysis(req, res);

        assert.deepEqual(capturedFilters, {
          period: '1',
          department: 'CS',
          faculty: 'fac-1',
          subject: 'CS101',
          year_level: '4th Year',
          section: 'A',
        });

        assert.ok(responseData, 'Expected responseData from getSystemAnalysis');
        assert.ok(responseData.filterOptions, 'Expected filterOptions in response');
        assert.ok(Array.isArray(responseData.filterOptions.yearLevels));
        assert.ok(Array.isArray(responseData.filterOptions.sections));
        assert.deepEqual(responseData.activeFilters, req.query);
      } finally {
        Evaluation.findAll = origFindAll;
      }
    });
  });
});
