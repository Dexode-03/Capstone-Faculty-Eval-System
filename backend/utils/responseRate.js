/**
 * Response Rate Calculation Utility (Task 3B.2 / FR-14)
 *
 * Calculates the evaluation response count and response rate percentage
 * for a faculty member in an academic period.
 *
 * Acceptance criteria:
 *   - Correct percentage calculation (e.g. 3 of 7 = 42.9%)
 *   - Zero enrolled students returns 'n/a' without divide-by-zero or NaN
 *   - Capped at 100% to ensure response rate cannot exceed total class size
 */

function calculateResponseRate(evaluationsCount, enrolledCount) {
  const evaluations = Math.max(0, parseInt(evaluationsCount, 10) || 0);
  const enrolled = Math.max(0, parseInt(enrolledCount, 10) || 0);

  if (enrolled <= 0) {
    return {
      rate: null,
      formatted: 'n/a',
      evaluations,
      enrolled: 0,
    };
  }

  // Response rate cannot exceed 100% of enrolled students
  const rawRate = Math.min(100, (evaluations / enrolled) * 100);
  const rate = parseFloat(rawRate.toFixed(1));

  return {
    rate,
    formatted: `${rate}%`,
    evaluations,
    enrolled: Math.max(enrolled, evaluations),
  };
}

module.exports = {
  calculateResponseRate,
};
