'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { calculateResponseRate } = require('../utils/responseRate');
const { generateSystemRecommendations } = require('../utils/sentimentAnalyzer');

describe('Task 3B.2: Response Count and Response Rate (FR-14)', () => {

  describe('1. calculateResponseRate core utility', () => {
    it('calculates 100% response rate correctly', () => {
      const result = calculateResponseRate(7, 7);
      assert.equal(result.rate, 100);
      assert.equal(result.formatted, '100%');
      assert.equal(result.evaluations, 7);
      assert.equal(result.enrolled, 7);
    });

    it('calculates partial response rate with 1 decimal place (3/7 = 42.9%)', () => {
      const result = calculateResponseRate(3, 7);
      assert.equal(result.rate, 42.9);
      assert.equal(result.formatted, '42.9%');
      assert.equal(result.evaluations, 3);
      assert.equal(result.enrolled, 7);
    });

    it('calculates 0% response rate when 0 evaluations received for enrolled students', () => {
      const result = calculateResponseRate(0, 4);
      assert.equal(result.rate, 0);
      assert.equal(result.formatted, '0%');
      assert.equal(result.evaluations, 0);
      assert.equal(result.enrolled, 4);
    });

    it('returns n/a when enrolled students is 0 (avoids divide-by-zero & NaN)', () => {
      const result = calculateResponseRate(0, 0);
      assert.equal(result.rate, null);
      assert.equal(result.formatted, 'n/a');
      assert.equal(result.evaluations, 0);
      assert.equal(result.enrolled, 0);
    });

    it('returns n/a when enrolled is 0 even if evaluations exist', () => {
      const result = calculateResponseRate(5, 0);
      assert.equal(result.rate, null);
      assert.equal(result.formatted, 'n/a');
    });

    it('handles null, undefined, and non-numeric inputs gracefully', () => {
      assert.equal(calculateResponseRate(null, null).formatted, 'n/a');
      assert.equal(calculateResponseRate(undefined, undefined).formatted, 'n/a');
      assert.equal(calculateResponseRate('abc', 'xyz').formatted, 'n/a');
      assert.equal(calculateResponseRate(-5, 0).formatted, 'n/a');
    });

    it('handles numeric string inputs correctly', () => {
      const result = calculateResponseRate('10', '20');
      assert.equal(result.rate, 50);
      assert.equal(result.formatted, '50%');
      assert.equal(result.evaluations, 10);
      assert.equal(result.enrolled, 20);
    });
  });

  describe('2. Manual count simulation matching seed data specification', () => {
    // Exact seed definitions from backend/seed.js:
    const mockStudents = [
      // CS (7 students)
      { id: 'S1', dept: 'CS', subs: ['CS101', 'CS201'], sec: 'A' },
      { id: 'S2', dept: 'CS', subs: ['CS101', 'CS102'], sec: 'A' },
      { id: 'S3', dept: 'CS', subs: ['CS101', 'CS102'], sec: 'A' },
      { id: 'S4', dept: 'CS', subs: ['CS102', 'CS201'], sec: 'B' },
      { id: 'S5', dept: 'CS', subs: ['CS101'], sec: 'A' },
      { id: 'S6', dept: 'CS', subs: ['CS101'], sec: 'B' },
      { id: 'S7', dept: 'CS', subs: ['CS101'], sec: 'A' },

      // IT (9 students)
      { id: 'S8', dept: 'IT', subs: ['IT101', 'IT201'], sec: 'B' },
      { id: 'S9', dept: 'IT', subs: ['IT101', 'IT102'], sec: 'B' },
      { id: 'S10', dept: 'IT', subs: ['IT101', 'IT201'], sec: 'B' },
      { id: 'S11', dept: 'IT', subs: ['IT101', 'IT102'], sec: 'A' },
      { id: 'S12', dept: 'IT', subs: ['IT102', 'IT201'], sec: 'A' },
      { id: 'S13', dept: 'IT', subs: ['IT101'], sec: 'B' },
      { id: 'S14', dept: 'IT', subs: ['IT101'], sec: 'A' },
      { id: 'S15', dept: 'IT', subs: ['IT102'], sec: 'B' },
      { id: 'S16', dept: 'IT', subs: ['IT101'], sec: 'A' },

      // Engineering (6 students)
      { id: 'S17', dept: 'ENG', subs: ['ENG101', 'ENG201'], sec: 'A' },
      { id: 'S18', dept: 'ENG', subs: ['ENG201'], sec: 'B' },
      { id: 'S19', dept: 'ENG', subs: ['ENG101'], sec: 'A' },
      { id: 'S20', dept: 'ENG', subs: ['ENG101', 'ENG201'], sec: 'B' },
      { id: 'S21', dept: 'ENG', subs: ['ENG101'], sec: 'A' },
      { id: 'S22', dept: 'ENG', subs: ['ENG101'], sec: 'A' },

      // Education (4 students)
      { id: 'S23', dept: 'EDU', subs: ['EDU101'], sec: 'A' },
      { id: 'S24', dept: 'EDU', subs: ['EDU101'], sec: 'B' },
      { id: 'S25', dept: 'EDU', subs: ['EDU101'], sec: 'A' },
      { id: 'S26', dept: 'EDU', subs: ['EDU101'], sec: 'A' },

      // Business Administration (4 students)
      { id: 'S27', dept: 'BA', subs: ['BA101'], sec: 'A' },
      { id: 'S28', dept: 'BA', subs: ['BA101'], sec: 'B' },
      { id: 'S29', dept: 'BA', subs: ['BA101'], sec: 'A' },
      { id: 'S30', dept: 'BA', subs: ['BA101'], sec: 'A' },
    ];

    function countEnrolled(facultySubjects) {
      const uniqueStudents = new Set();
      for (const st of mockStudents) {
        const matches = facultySubjects.some(fs => {
          const hasSubject = st.subs.includes(fs.subject);
          const matchesSec = !fs.section || fs.section === st.sec;
          return hasSubject && matchesSec;
        });
        if (matches) {
          uniqueStudents.add(st.id);
        }
      }
      return uniqueStudents.size;
    }

    it('matches manual count for faculty@psu.edu.ph (CS101, CS102) → 7 students', () => {
      const count = countEnrolled([{ subject: 'CS101' }, { subject: 'CS102' }]);
      assert.equal(count, 7);
      const { rate, formatted } = calculateResponseRate(5, count);
      assert.equal(rate, 71.4);
      assert.equal(formatted, '71.4%');
    });

    it('matches manual count for faculty10@psu.edu.ph (CS102 only) → 3 students', () => {
      const count = countEnrolled([{ subject: 'CS102' }]);
      assert.equal(count, 3);
      const { rate, formatted } = calculateResponseRate(3, count);
      assert.equal(rate, 100);
      assert.equal(formatted, '100%');
    });

    it('matches manual count for faculty3@psu.edu.ph (CS201, CS102) → 4 students', () => {
      const count = countEnrolled([{ subject: 'CS201' }, { subject: 'CS102' }]);
      assert.equal(count, 4);
    });

    it('matches manual count for faculty14@psu.edu.ph (ENG201 only) → 3 students', () => {
      const count = countEnrolled([{ subject: 'ENG201' }]);
      assert.equal(count, 3);
    });

    it('matches manual count for faculty6@psu.edu.ph (EDU101) → 4 students', () => {
      const count = countEnrolled([{ subject: 'EDU101' }]);
      assert.equal(count, 4);
    });

    it('matches manual count for faculty7@psu.edu.ph (BA101) → 4 students', () => {
      const count = countEnrolled([{ subject: 'BA101' }]);
      assert.equal(count, 4);
    });

    it('faculty with no assigned subjects has 0 enrolled and n/a response rate', () => {
      const count = countEnrolled([]);
      assert.equal(count, 0);
      const { rate, formatted } = calculateResponseRate(0, count);
      assert.equal(rate, null);
      assert.equal(formatted, 'n/a');
    });

    it('section-specific matching works correctly (CS101 section A only → 5 students)', () => {
      const count = countEnrolled([{ subject: 'CS101', section: 'A' }]);
      assert.equal(count, 5); // S1, S2, S3, S5, S7
    });
  });

  describe('3. Integration with generateSystemRecommendations (Reports page)', () => {
    it('attaches enrolledStudents, responseRate, and responseRateFormatted to each faculty in facultySummary', () => {
      const mockFaculty = [
        { id: 'FAC-1', name: 'Dr. Maria Santos', department: 'Computer Science' },
        { id: 'FAC-2', name: 'Prof. Unassigned', department: 'Computer Science' },
      ];

      const mockEvaluations = [
        {
          id: 1,
          faculty_id: 'FAC-1',
          faculty_name: 'Dr. Maria Santos',
          department: 'Computer Science',
          rating: 4.8,
          sentiment: 'positive',
          sentiment_score: 0.9,
          comment: 'Great teaching',
          strengths: 'Clear explanation',
          weaknesses: null,
        },
      ];

      const enrolledMap = {
        'FAC-1': 7,
        'FAC-2': 0,
      };

      const analysis = generateSystemRecommendations(mockEvaluations, mockFaculty, enrolledMap);

      assert.ok(Array.isArray(analysis.facultySummary));
      assert.equal(analysis.facultySummary.length, 2);

      const f1 = analysis.facultySummary.find(f => f.id === 'FAC-1');
      assert.ok(f1);
      assert.equal(f1.enrolledStudents, 7);
      assert.equal(f1.totalEvaluations, 1);
      assert.equal(f1.responseRate, 14.3);
      assert.equal(f1.responseRateFormatted, '14.3%');

      const f2 = analysis.facultySummary.find(f => f.id === 'FAC-2');
      assert.ok(f2);
      assert.equal(f2.enrolledStudents, 0);
      assert.equal(f2.totalEvaluations, 0);
      assert.equal(f2.responseRate, null);
      assert.equal(f2.responseRateFormatted, 'n/a');
    });
  });
});
