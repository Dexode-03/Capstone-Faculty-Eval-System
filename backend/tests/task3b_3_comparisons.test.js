'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { calculateFacultyComparisons } = require('../utils/comparisons');
const AcademicPeriod = require('../models/AcademicPeriod');
const Evaluation = require('../models/Evaluation');

describe('Task 3B.3: Comparisons (FR-15, FR-19)', () => {

  describe('1. Previous period comparison - acceptance & edge cases', () => {
    let origGetPreviousPeriod;
    let origFindByFacultyAndPeriod;
    let origGetDepartmentBenchmark;
    let origGetPeriodAggregates;

    before(() => {
      origGetPreviousPeriod = AcademicPeriod.getPreviousPeriod;
      origFindByFacultyAndPeriod = Evaluation.findByFacultyAndPeriod;
      origGetDepartmentBenchmark = Evaluation.getDepartmentBenchmark;
      origGetPeriodAggregates = Evaluation.getPeriodAggregatesByFaculty;
    });

    after(() => {
      AcademicPeriod.getPreviousPeriod = origGetPreviousPeriod;
      Evaluation.findByFacultyAndPeriod = origFindByFacultyAndPeriod;
      Evaluation.getDepartmentBenchmark = origGetDepartmentBenchmark;
      Evaluation.getPeriodAggregatesByFaculty = origGetPeriodAggregates;
    });

    it('returns "no earlier data" when no previous academic period exists', async () => {
      AcademicPeriod.getPreviousPeriod = async () => null;
      Evaluation.getDepartmentBenchmark = async () => ({ averageRating: 4.0, totalEvaluations: 10, qualifyingFacultyCount: 2 });
      Evaluation.getPeriodAggregatesByFaculty = async () => [];

      const result = await calculateFacultyComparisons({
        facultyId: 'fac-1',
        department: 'Computer Science',
        currentAvgRating: 4.2,
        activePeriod: { id: 1, academic_year: '2025-2026', semester: '1st' },
        minThreshold: 5,
      });

      assert.equal(result.previousPeriodComparison.hasEarlierData, false);
      assert.equal(result.previousPeriodComparison.status, 'no earlier data');
      assert.equal(result.previousPeriodComparison.message, 'no earlier data');
      assert.equal(result.previousPeriodComparison.previousPeriod, null);
      assert.equal(result.previousPeriodComparison.ratingChange, null);
    });

    it('returns "no earlier data" when previous period exists but faculty has zero evaluations in it', async () => {
      AcademicPeriod.getPreviousPeriod = async () => ({
        id: 99,
        academic_year: '2024-2025',
        semester: '2nd',
      });
      Evaluation.findByFacultyAndPeriod = async () => []; // 0 evaluations
      Evaluation.getDepartmentBenchmark = async () => ({ averageRating: 4.0, totalEvaluations: 10, qualifyingFacultyCount: 2 });
      Evaluation.getPeriodAggregatesByFaculty = async () => [];

      const result = await calculateFacultyComparisons({
        facultyId: 'fac-new',
        department: 'Computer Science',
        currentAvgRating: 4.5,
        activePeriod: { id: 100, academic_year: '2025-2026', semester: '1st' },
        minThreshold: 5,
      });

      assert.equal(result.previousPeriodComparison.hasEarlierData, false);
      assert.equal(result.previousPeriodComparison.status, 'no earlier data');
      assert.equal(result.previousPeriodComparison.message, 'no earlier data');
      assert.equal(result.previousPeriodComparison.previousPeriod, null);
    });

    it('calculates positive delta and "improved" direction when current rating > previous period rating', async () => {
      AcademicPeriod.getPreviousPeriod = async () => ({
        id: 1,
        academic_year: '2024-2025',
        semester: '2nd',
      });
      // Previous evaluations: 6 ratings of 4.0
      Evaluation.findByFacultyAndPeriod = async () => [
        { rating: 4, sentiment: 'positive' },
        { rating: 4, sentiment: 'positive' },
        { rating: 4, sentiment: 'positive' },
        { rating: 4, sentiment: 'neutral' },
        { rating: 4, sentiment: 'neutral' },
        { rating: 4, sentiment: 'neutral' },
      ];
      Evaluation.getDepartmentBenchmark = async () => ({ averageRating: 4.1, totalEvaluations: 15, qualifyingFacultyCount: 3 });
      Evaluation.getPeriodAggregatesByFaculty = async () => [];

      const result = await calculateFacultyComparisons({
        facultyId: 'fac-1',
        department: 'Computer Science',
        currentAvgRating: 4.35,
        activePeriod: { id: 2, academic_year: '2025-2026', semester: '1st' },
        minThreshold: 5,
      });

      assert.equal(result.previousPeriodComparison.hasEarlierData, true);
      assert.equal(result.previousPeriodComparison.status, 'available');
      assert.equal(result.previousPeriodComparison.ratingChange, 0.35); // 4.35 - 4.00
      assert.equal(result.previousPeriodComparison.ratingChangeFormatted, '+0.35');
      assert.equal(result.previousPeriodComparison.ratingChangeDirection, 'improved');
      assert.match(result.previousPeriodComparison.message, /\+0\.35 improvement/);
      assert.equal(result.previousPeriodComparison.previousPeriod.verbalRating, 'Very Satisfactory');
      assert.equal(result.previousPeriodComparison.previousPeriod.thresholdReached, true);
      assert.notEqual(result.previousPeriodComparison.previousPeriod.sentimentOverview, null);
    });

    it('calculates negative delta and "declined" direction when current rating < previous period rating', async () => {
      AcademicPeriod.getPreviousPeriod = async () => ({
        id: 1,
        academic_year: '2024-2025',
        semester: '2nd',
      });
      Evaluation.findByFacultyAndPeriod = async () => [
        { rating: 4.8, sentiment: 'positive' },
        { rating: 4.6, sentiment: 'positive' },
        { rating: 4.7, sentiment: 'positive' },
        { rating: 4.7, sentiment: 'positive' },
        { rating: 4.7, sentiment: 'positive' },
      ]; // average = 4.70
      Evaluation.getDepartmentBenchmark = async () => ({ averageRating: 4.0, totalEvaluations: 10, qualifyingFacultyCount: 2 });
      Evaluation.getPeriodAggregatesByFaculty = async () => [];

      const result = await calculateFacultyComparisons({
        facultyId: 'fac-1',
        department: 'Computer Science',
        currentAvgRating: 4.40,
        activePeriod: { id: 2, academic_year: '2025-2026', semester: '1st' },
        minThreshold: 5,
      });

      assert.equal(result.previousPeriodComparison.hasEarlierData, true);
      assert.equal(result.previousPeriodComparison.ratingChange, -0.30); // 4.40 - 4.70
      assert.equal(result.previousPeriodComparison.ratingChangeFormatted, '-0.30');
      assert.equal(result.previousPeriodComparison.ratingChangeDirection, 'declined');
      assert.match(result.previousPeriodComparison.message, /-0\.30 decline/);
    });

    it('masks previous period sentiment when response count is below minThreshold', async () => {
      AcademicPeriod.getPreviousPeriod = async () => ({
        id: 1,
        academic_year: '2024-2025',
        semester: '2nd',
      });
      // Only 2 evaluations (< minThreshold of 5)
      Evaluation.findByFacultyAndPeriod = async () => [
        { rating: 3.5, sentiment: 'neutral' },
        { rating: 4.5, sentiment: 'positive' },
      ];
      Evaluation.getDepartmentBenchmark = async () => ({ averageRating: null, totalEvaluations: 0, qualifyingFacultyCount: 0 });
      Evaluation.getPeriodAggregatesByFaculty = async () => [];

      const result = await calculateFacultyComparisons({
        facultyId: 'fac-1',
        department: 'Computer Science',
        currentAvgRating: 4.0,
        activePeriod: { id: 2, academic_year: '2025-2026', semester: '1st' },
        minThreshold: 5,
      });

      assert.equal(result.previousPeriodComparison.hasEarlierData, true);
      assert.equal(result.previousPeriodComparison.previousPeriod.thresholdReached, false);
      assert.equal(result.previousPeriodComparison.previousPeriod.sentimentOverview, null);
    });
  });

  describe('2. Department benchmark comparison (FR-15)', () => {
    let origGetPreviousPeriod;
    let origGetDepartmentBenchmark;
    let origGetPeriodAggregates;

    before(() => {
      origGetPreviousPeriod = AcademicPeriod.getPreviousPeriod;
      origGetDepartmentBenchmark = Evaluation.getDepartmentBenchmark;
      origGetPeriodAggregates = Evaluation.getPeriodAggregatesByFaculty;
      AcademicPeriod.getPreviousPeriod = async () => null;
      Evaluation.getPeriodAggregatesByFaculty = async () => [];
    });

    after(() => {
      AcademicPeriod.getPreviousPeriod = origGetPreviousPeriod;
      Evaluation.getDepartmentBenchmark = origGetDepartmentBenchmark;
      Evaluation.getPeriodAggregatesByFaculty = origGetPeriodAggregates;
    });

    it('correctly compares faculty score with department average (above department average)', async () => {
      Evaluation.getDepartmentBenchmark = async (dept) => ({
        department: dept,
        averageRating: 4.10,
        totalEvaluations: 25,
        qualifyingFacultyCount: 4,
      });

      const result = await calculateFacultyComparisons({
        facultyId: 'fac-1',
        department: 'Information Technology',
        currentAvgRating: 4.45,
        activePeriod: { id: 1 },
        minThreshold: 5,
      });

      assert.equal(result.departmentComparison.department, 'Information Technology');
      assert.equal(result.departmentComparison.departmentAverage, 4.10);
      assert.equal(result.departmentComparison.departmentAverageFormatted, '4.10');
      assert.equal(result.departmentComparison.departmentVerbalRating, 'Very Satisfactory');
      assert.equal(result.departmentComparison.difference, 0.35); // 4.45 - 4.10
      assert.equal(result.departmentComparison.differenceFormatted, '+0.35');
      assert.equal(result.departmentComparison.differenceDirection, 'above');
      assert.equal(result.departmentComparison.status, 'available');
      assert.match(result.departmentComparison.message, /\+0\.35 above department average/);
    });

    it('correctly compares faculty score with department average (below department average)', async () => {
      Evaluation.getDepartmentBenchmark = async (dept) => ({
        department: dept,
        averageRating: 4.50,
        totalEvaluations: 30,
        qualifyingFacultyCount: 5,
      });

      const result = await calculateFacultyComparisons({
        facultyId: 'fac-1',
        department: 'Education',
        currentAvgRating: 4.20,
        activePeriod: { id: 1 },
        minThreshold: 5,
      });

      assert.equal(result.departmentComparison.difference, -0.30); // 4.20 - 4.50
      assert.equal(result.departmentComparison.differenceFormatted, '-0.30');
      assert.equal(result.departmentComparison.differenceDirection, 'below');
      assert.match(result.departmentComparison.message, /-0\.30 below department average/);
    });

    it('excludes periods/departments below the minimum-response threshold (returns null benchmark)', async () => {
      // Benchmark returns null when 0 faculty meet the threshold
      Evaluation.getDepartmentBenchmark = async (dept) => ({
        department: dept,
        averageRating: null,
        totalEvaluations: 3,
        qualifyingFacultyCount: 0,
      });

      const result = await calculateFacultyComparisons({
        facultyId: 'fac-1',
        department: 'Engineering',
        currentAvgRating: 3.80,
        activePeriod: { id: 1 },
        minThreshold: 5,
      });

      assert.equal(result.departmentComparison.departmentAverage, null);
      assert.equal(result.departmentComparison.difference, null);
      assert.equal(result.departmentComparison.status, 'insufficient_data');
      assert.match(result.departmentComparison.message, /Department benchmark unavailable/);
    });
  });

  describe('3. AcademicPeriod.getPreviousPeriod logic', () => {
    let origFindAll;
    let origGetActive;

    before(() => {
      origFindAll = AcademicPeriod.findAll;
      origGetActive = AcademicPeriod.getActive;
    });

    after(() => {
      AcademicPeriod.findAll = origFindAll;
      AcademicPeriod.getActive = origGetActive;
    });

    it('returns immediate earlier period when multiple periods are registered', async () => {
      AcademicPeriod.findAll = async () => [
        { id: 1, academic_year: '2024-2025', semester: '1st', is_active: 0 },
        { id: 2, academic_year: '2024-2025', semester: '2nd', is_active: 0 },
        { id: 3, academic_year: '2025-2026', semester: '1st', is_active: 1 },
      ];
      AcademicPeriod.getActive = async () => ({ id: 3, academic_year: '2025-2026', semester: '1st', is_active: 1 });

      const prev = await AcademicPeriod.getPreviousPeriod();
      assert.notEqual(prev, null);
      assert.equal(prev.id, 2);
      assert.equal(prev.academic_year, '2024-2025');
      assert.equal(prev.semester, '2nd');
    });

    it('returns null when the active period is the earliest recorded period', async () => {
      AcademicPeriod.findAll = async () => [
        { id: 1, academic_year: '2024-2025', semester: '1st', is_active: 1 },
      ];
      AcademicPeriod.getActive = async () => ({ id: 1, academic_year: '2024-2025', semester: '1st', is_active: 1 });

      const prev = await AcademicPeriod.getPreviousPeriod();
      assert.equal(prev, null);
    });
  });

  describe('4. Period History Aggregation (FR-19)', () => {
    let origGetPreviousPeriod;
    let origGetDepartmentBenchmark;
    let origGetPeriodAggregates;

    before(() => {
      origGetPreviousPeriod = AcademicPeriod.getPreviousPeriod;
      origGetDepartmentBenchmark = Evaluation.getDepartmentBenchmark;
      origGetPeriodAggregates = Evaluation.getPeriodAggregatesByFaculty;
      AcademicPeriod.getPreviousPeriod = async () => null;
      Evaluation.getDepartmentBenchmark = async () => ({ averageRating: 4.0, totalEvaluations: 10, qualifyingFacultyCount: 2 });
    });

    after(() => {
      AcademicPeriod.getPreviousPeriod = origGetPreviousPeriod;
      Evaluation.getDepartmentBenchmark = origGetDepartmentBenchmark;
      Evaluation.getPeriodAggregatesByFaculty = origGetPeriodAggregates;
    });

    it('returns historical breakdown across academic periods', async () => {
      Evaluation.getPeriodAggregatesByFaculty = async () => [
        {
          academic_period_id: 3,
          academic_year: '2025-2026',
          semester: '1st',
          is_active: 1,
          total_evaluations: 8,
          avg_rating: '4.65',
          positive: 6,
          neutral: 2,
          negative: 0,
        },
        {
          academic_period_id: 2,
          academic_year: '2024-2025',
          semester: '2nd',
          is_active: 0,
          total_evaluations: 12,
          avg_rating: '4.20',
          positive: 8,
          neutral: 3,
          negative: 1,
        },
      ];

      const result = await calculateFacultyComparisons({
        facultyId: 'fac-1',
        department: 'Computer Science',
        currentAvgRating: 4.65,
        minThreshold: 5,
      });

      assert.equal(result.periodHistory.length, 2);
      assert.equal(result.periodHistory[0].academic_year, '2025-2026');
      assert.equal(result.periodHistory[0].verbalRating, 'Outstanding');
      assert.equal(result.periodHistory[0].isActive, true);
      assert.equal(result.periodHistory[1].verbalRating, 'Very Satisfactory');
      assert.equal(result.periodHistory[1].isActive, false);
    });
  });
});
