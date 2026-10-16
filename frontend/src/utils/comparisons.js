/**
 * Frontend comparison utilities (Task 3B.3 / FR-15, FR-19)
 */

/**
 * Format rating difference with explicit + or - sign
 * @param {number|null} diff
 * @returns {string}
 */
export function formatDifference(diff) {
  if (diff === null || diff === undefined || isNaN(diff)) return 'n/a';
  return diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
}

/**
 * Returns Tailwind badge styling based on direction ('improved' | 'declined' | 'unchanged' | 'above' | 'below' | 'equal')
 * @param {string} direction
 * @returns {string} Tailwind CSS class string
 */
export function getComparisonBadgeClass(direction) {
  switch (direction) {
    case 'improved':
    case 'above':
      return 'bg-green-50 text-green-700 border border-green-200';
    case 'declined':
    case 'below':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'unchanged':
    case 'equal':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    default:
      return 'bg-gray-100 text-psu-muted border border-psu-border';
  }
}
