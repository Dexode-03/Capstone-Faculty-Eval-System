const { getVerbalRating } = require('../config/ratingScale');
const AcademicPeriod = require('../models/AcademicPeriod');
const Evaluation = require('../models/Evaluation');

/**
 * Calculates comparative benchmarks for faculty reports (Task 3B.3 / FR-15, FR-19):
 * 1. Department Benchmark:
 *    - Compares faculty against department mean rating for the period
 *    - EXCLUDES faculty with evaluations < minThreshold (default: 5)
 * 2. Previous Period Comparison:
 *    - Identifies immediately preceding academic period
 *    - If no earlier period exists or faculty has no evaluations in it: returns 'no earlier data'
 *    - If earlier evaluations exist: calculates ratingChange (delta) and direction (improved/declined/unchanged)
 * 3. Period-by-period aggregates (FR-19)
 *
 * @param {Object} params
 * @param {string} params.facultyId
 * @param {string} params.department
 * @param {number|string|null} params.currentAvgRating
 * @param {Object|null} [params.activePeriod]
 * @param {number} [params.minThreshold=5]
 * @returns {Promise<Object>}
 */
async function calculateFacultyComparisons({
  facultyId,
  department,
  currentAvgRating,
  activePeriod = null,
  minThreshold = 5,
}) {
  const currentAvg = (currentAvgRating !== null && currentAvgRating !== undefined && !isNaN(parseFloat(currentAvgRating)))
    ? parseFloat(parseFloat(currentAvgRating).toFixed(2))
    : null;

  // 1. Department Benchmark (FR-15)
  let deptBenchmark = { averageRating: null, totalEvaluations: 0, qualifyingFacultyCount: 0 };
  if (department) {
    try {
      deptBenchmark = await Evaluation.getDepartmentBenchmark(
        department,
        activePeriod ? activePeriod.id : null,
        minThreshold
      );
    } catch (err) {
      console.error('Error fetching department benchmark:', err);
    }
  }

  const deptAvg = deptBenchmark.averageRating !== null && deptBenchmark.averageRating !== undefined
    ? parseFloat(parseFloat(deptBenchmark.averageRating).toFixed(2))
    : null;

  let deptDiff = null;
  let deptDiffDirection = null;
  let deptDiffFormatted = 'n/a';
  let deptMessage = 'Department benchmark unavailable (minimum response threshold not reached)';

  if (deptAvg !== null && currentAvg !== null) {
    deptDiff = parseFloat((currentAvg - deptAvg).toFixed(2));
    if (deptDiff > 0) {
      deptDiffDirection = 'above';
      deptDiffFormatted = `+${deptDiff.toFixed(2)}`;
      deptMessage = `+${deptDiff.toFixed(2)} above department average`;
    } else if (deptDiff < 0) {
      deptDiffDirection = 'below';
      deptDiffFormatted = `${deptDiff.toFixed(2)}`;
      deptMessage = `${deptDiff.toFixed(2)} below department average`;
    } else {
      deptDiffDirection = 'equal';
      deptDiffFormatted = '0.00';
      deptMessage = 'Matches department average';
    }
  }

  const departmentComparison = {
    department: department || 'Unknown',
    departmentAverage: deptAvg,
    departmentAverageFormatted: deptAvg !== null ? deptAvg.toFixed(2) : 'n/a',
    departmentVerbalRating: deptAvg !== null ? getVerbalRating(deptAvg) : 'N/A',
    qualifyingFacultyCount: deptBenchmark.qualifyingFacultyCount || 0,
    totalEvaluations: deptBenchmark.totalEvaluations || 0,
    difference: deptDiff,
    differenceFormatted: deptDiffFormatted,
    differenceDirection: deptDiffDirection,
    status: deptAvg !== null ? 'available' : 'insufficient_data',
    message: deptMessage,
  };

  // 2. Previous Period Comparison (FR-15)
  let previousPeriod = null;
  try {
    previousPeriod = await AcademicPeriod.getPreviousPeriod(activePeriod);
  } catch (err) {
    console.error('Error fetching previous period:', err);
  }

  let prevEvals = [];
  if (previousPeriod && facultyId) {
    try {
      prevEvals = await Evaluation.findByFacultyAndPeriod(facultyId, previousPeriod.id);
    } catch (err) {
      console.error('Error fetching previous period evaluations:', err);
    }
  }

  const hasEarlierData = prevEvals.length > 0;
  let previousPeriodComparison = {
    hasEarlierData: false,
    status: 'no earlier data',
    message: 'no earlier data',
    previousPeriod: null,
    ratingChange: null,
    ratingChangeFormatted: 'n/a',
    ratingChangeDirection: null,
  };

  if (hasEarlierData) {
    const prevRatings = prevEvals.map(e => e.rating);
    const prevAvg = parseFloat((prevRatings.reduce((sum, r) => sum + r, 0) / prevRatings.length).toFixed(2));
    const prevThresholdReached = prevEvals.length >= minThreshold;

    let prevChange = null;
    let prevChangeFormatted = 'n/a';
    let prevChangeDirection = null;
    let prevMessage = '';

    if (currentAvg !== null) {
      prevChange = parseFloat((currentAvg - prevAvg).toFixed(2));
      if (prevChange > 0) {
        prevChangeDirection = 'improved';
        prevChangeFormatted = `+${prevChange.toFixed(2)}`;
        prevMessage = `+${prevChange.toFixed(2)} improvement from previous period`;
      } else if (prevChange < 0) {
        prevChangeDirection = 'declined';
        prevChangeFormatted = `${prevChange.toFixed(2)}`;
        prevMessage = `${prevChange.toFixed(2)} decline from previous period`;
      } else {
        prevChangeDirection = 'unchanged';
        prevChangeFormatted = '0.00';
        prevMessage = 'Unchanged from previous period';
      }
    }

    const prevSentiments = { positive: 0, neutral: 0, negative: 0 };
    prevEvals.forEach(e => {
      if (prevSentiments[e.sentiment] !== undefined) prevSentiments[e.sentiment]++;
    });

    previousPeriodComparison = {
      hasEarlierData: true,
      status: 'available',
      message: prevMessage,
      previousPeriod: {
        id: previousPeriod.id,
        name: `${previousPeriod.semester} of SY ${previousPeriod.academic_year}`,
        academic_year: previousPeriod.academic_year,
        semester: previousPeriod.semester,
        averageRating: prevAvg.toFixed(2),
        verbalRating: getVerbalRating(prevAvg),
        totalEvaluations: prevEvals.length,
        thresholdReached: prevThresholdReached,
        sentimentOverview: prevThresholdReached ? prevSentiments : null,
      },
      ratingChange: prevChange,
      ratingChangeFormatted: prevChangeFormatted,
      ratingChangeDirection: prevChangeDirection,
    };
  }

  // 3. Period-by-period aggregates (FR-19)
  let periodHistory = [];
  try {
    if (facultyId) {
      const historyRows = await Evaluation.getPeriodAggregatesByFaculty(facultyId);
      periodHistory = historyRows.map(row => {
        const rowAvg = row.avg_rating !== null ? parseFloat(parseFloat(row.avg_rating).toFixed(2)) : 0;
        const count = parseInt(row.total_evaluations, 10) || 0;
        const reached = count >= minThreshold;
        return {
          academic_period_id: row.academic_period_id,
          academic_year: row.academic_year,
          semester: row.semester,
          name: row.academic_year !== 'Unassigned' ? `${row.semester} of SY ${row.academic_year}` : 'Unassigned Period',
          isActive: row.is_active === 1,
          totalEvaluations: count,
          averageRating: rowAvg.toFixed(2),
          verbalRating: getVerbalRating(rowAvg),
          thresholdReached: reached,
          sentimentOverview: reached ? {
            positive: parseInt(row.positive, 10) || 0,
            neutral: parseInt(row.neutral, 10) || 0,
            negative: parseInt(row.negative, 10) || 0,
          } : null,
        };
      });
    }
  } catch (err) {
    console.error('Error fetching period aggregates:', err);
  }

  return {
    departmentComparison,
    previousPeriodComparison,
    periodHistory,
  };
}

module.exports = {
  calculateFacultyComparisons,
};
