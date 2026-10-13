/**
 * Official PSU Faculty Evaluation Verbal Rating Scale (FR-13)
 * Configurable brackets and descriptive ratings.
 * Range: Option A (4.51-5.00, 3.51-4.50, 2.51-3.50, 1.51-2.50, 1.00-1.50)
 * Verbal Descriptions: Option B (Outstanding, Very Satisfactory, Satisfactory, Fair, Poor)
 */

export const RATING_SCALE = [
  {
    min: 4.51,
    max: 5.00,
    label: 'Outstanding',
    description: 'Always manifested',
  },
  {
    min: 3.51,
    max: 4.50,
    label: 'Very Satisfactory',
    description: 'Often manifested',
  },
  {
    min: 2.51,
    max: 3.50,
    label: 'Satisfactory',
    description: 'Sometimes manifested',
  },
  {
    min: 1.51,
    max: 2.50,
    label: 'Fair',
    description: 'Seldom manifested',
  },
  {
    min: 1.00,
    max: 1.50,
    label: 'Poor',
    description: 'Never / Rarely manifested',
  },
];

/**
 * Maps an overall numerical mean score to an official PSU verbal rating.
 * @param {number|string|null|undefined} score
 * @returns {string} Verbal rating label, or 'N/A' if null/invalid/below 1.00
 */
export const getVerbalRating = (score) => {
  if (score === null || score === undefined || score === '') return 'N/A';
  const num = typeof score === 'number' ? score : parseFloat(score);
  if (isNaN(num) || num < 1.00) return 'N/A';

  const rounded = Math.round(num * 100) / 100;

  for (const bracket of RATING_SCALE) {
    if (rounded >= bracket.min && rounded <= bracket.max) {
      return bracket.label;
    }
  }

  if (rounded > 5.00) return 'Outstanding';
  if (rounded >= 1.00 && rounded < 1.51) return 'Poor';

  return 'N/A';
};
