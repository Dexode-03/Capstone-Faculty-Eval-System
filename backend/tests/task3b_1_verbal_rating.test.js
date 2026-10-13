const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { getVerbalRating, RATING_SCALE } = require('../config/ratingScale');

describe('Task 3B.1: Verbal Rating Scale (FR-13)', () => {

  // ── Scale configuration sanity ───────────────────────────────────
  it('RATING_SCALE has exactly 5 brackets covering 1.00 to 5.00', () => {
    assert.equal(RATING_SCALE.length, 5);
    assert.equal(RATING_SCALE[RATING_SCALE.length - 1].min, 1.00);
    assert.equal(RATING_SCALE[0].max, 5.00);
  });

  it('all brackets have label and description strings', () => {
    for (const bracket of RATING_SCALE) {
      assert.ok(typeof bracket.label === 'string' && bracket.label.length > 0);
      assert.ok(typeof bracket.description === 'string' && bracket.description.length > 0);
      assert.ok(bracket.min <= bracket.max);
    }
  });

  // ── Happy-path mappings ──────────────────────────────────────────
  it('maps 5.00 → Outstanding', () => {
    assert.equal(getVerbalRating(5.00), 'Outstanding');
  });

  it('maps 4.51 → Outstanding (lower boundary)', () => {
    assert.equal(getVerbalRating(4.51), 'Outstanding');
  });

  it('maps 4.50 → Very Satisfactory (upper boundary)', () => {
    assert.equal(getVerbalRating(4.50), 'Very Satisfactory');
  });

  it('maps 3.51 → Very Satisfactory (lower boundary)', () => {
    assert.equal(getVerbalRating(3.51), 'Very Satisfactory');
  });

  it('maps 3.50 → Satisfactory (upper boundary)', () => {
    assert.equal(getVerbalRating(3.50), 'Satisfactory');
  });

  it('maps 2.51 → Satisfactory (lower boundary)', () => {
    assert.equal(getVerbalRating(2.51), 'Satisfactory');
  });

  it('maps 2.50 → Fair (upper boundary)', () => {
    assert.equal(getVerbalRating(2.50), 'Fair');
  });

  it('maps 1.51 → Fair (lower boundary)', () => {
    assert.equal(getVerbalRating(1.51), 'Fair');
  });

  it('maps 1.50 → Poor (upper boundary)', () => {
    assert.equal(getVerbalRating(1.50), 'Poor');
  });

  it('maps 1.00 → Poor (minimum valid score)', () => {
    assert.equal(getVerbalRating(1.00), 'Poor');
  });

  // ── Mid-range values ─────────────────────────────────────────────
  it('maps 4.75 → Outstanding', () => {
    assert.equal(getVerbalRating(4.75), 'Outstanding');
  });

  it('maps 4.00 → Very Satisfactory', () => {
    assert.equal(getVerbalRating(4.00), 'Very Satisfactory');
  });

  it('maps 3.00 → Satisfactory', () => {
    assert.equal(getVerbalRating(3.00), 'Satisfactory');
  });

  it('maps 2.00 → Fair', () => {
    assert.equal(getVerbalRating(2.00), 'Fair');
  });

  it('maps 1.25 → Poor', () => {
    assert.equal(getVerbalRating(1.25), 'Poor');
  });

  // ── String inputs ────────────────────────────────────────────────
  it('accepts string score "4.51" → Outstanding', () => {
    assert.equal(getVerbalRating('4.51'), 'Outstanding');
  });

  it('accepts string score "3.50" → Satisfactory', () => {
    assert.equal(getVerbalRating('3.50'), 'Satisfactory');
  });

  it('accepts string score "0.0" → N/A', () => {
    assert.equal(getVerbalRating('0.0'), 'N/A');
  });

  // ── Edge/invalid inputs ──────────────────────────────────────────
  it('returns N/A for null', () => {
    assert.equal(getVerbalRating(null), 'N/A');
  });

  it('returns N/A for undefined', () => {
    assert.equal(getVerbalRating(undefined), 'N/A');
  });

  it('returns N/A for empty string', () => {
    assert.equal(getVerbalRating(''), 'N/A');
  });

  it('returns N/A for NaN input', () => {
    assert.equal(getVerbalRating('abc'), 'N/A');
  });

  it('returns N/A for 0', () => {
    assert.equal(getVerbalRating(0), 'N/A');
  });

  it('returns N/A for 0.99 (below minimum valid score)', () => {
    assert.equal(getVerbalRating(0.99), 'N/A');
  });

  it('returns N/A for negative number', () => {
    assert.equal(getVerbalRating(-2.5), 'N/A');
  });

  it('returns Outstanding for score > 5.00 (overflow)', () => {
    assert.equal(getVerbalRating(5.01), 'Outstanding');
  });

  // ── IEEE floating point boundary precision ───────────────────────
  it('handles IEEE float: 4.5099999... rounds to 4.51 → Outstanding', () => {
    // In IEEE754, 4.509999999999999 rounds to 4.51 at 2dp → Outstanding
    assert.equal(getVerbalRating(4.509999999999999), 'Outstanding');
  });

  it('handles 4.504 → rounds to 4.50 → Very Satisfactory', () => {
    assert.equal(getVerbalRating(4.504), 'Very Satisfactory');
  });

  it('handles 3.505 → rounds to 3.51 → Very Satisfactory', () => {
    assert.equal(getVerbalRating(3.505), 'Very Satisfactory');
  });
});
