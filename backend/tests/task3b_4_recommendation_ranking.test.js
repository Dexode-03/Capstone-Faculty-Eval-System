'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  generateRecommendations,
  SEVERITY_ORDER,
  RecommendationItem,
} = require('../utils/sentimentAnalyzer');

describe('Task 3B.4: Rank Recommendations by Severity (FR-23)', () => {

  const fixedEvaluations = [
    {
      id: 1,
      rating: 3.2,
      comment: 'Professor is often late and lectures are unclear, but approachable and helpful.',
      strengths: 'approachable, helpful',
      weaknesses: 'late, unclear',
      sentiment: 'neutral',
      sentiment_score: 0.1,
    },
    {
      id: 2,
      rating: 3.4,
      comment: 'Very late for exams and unclear slides, though knowledgeable and helpful.',
      strengths: 'knowledgeable, helpful',
      weaknesses: 'late, unclear',
      sentiment: 'negative',
      sentiment_score: -0.4,
    },
  ];

  it('1. Assigns severity to every recommendation and sorts most serious first (high -> medium -> low -> positive)', () => {
    const recs = generateRecommendations(fixedEvaluations, null);

    assert.ok(Array.isArray(recs));
    assert.ok(recs.length >= 3, 'Expected at least 3 recommendations');

    // Extract severities
    const severities = recs.map(r => r.severity);

    // Verify all severities are valid
    severities.forEach(sev => {
      assert.ok(['high', 'medium', 'low', 'positive'].includes(sev), `Invalid severity: ${sev}`);
    });

    // Verify strictly monotonic non-decreasing order of severity rank
    for (let i = 0; i < severities.length - 1; i++) {
      const rankCurrent = SEVERITY_ORDER[severities[i]];
      const rankNext = SEVERITY_ORDER[severities[i + 1]];
      assert.ok(
        rankCurrent <= rankNext,
        `Expected ${severities[i]} (rank ${rankCurrent}) to precede or equal ${severities[i + 1]} (rank ${rankNext})`
      );
    }

    // High severity item (Punctuality) must be ranked first
    assert.equal(severities[0], 'high');
    assert.ok(recs[0].includes('Punctuality') || recs[0].includes('Attendance'));

    // Positive commendations (Supportiveness / Expertise) must be ranked after weaknesses
    const lastSeverity = severities[severities.length - 1];
    assert.equal(lastSeverity, 'positive');
  });

  it('2. Keeps evidence text and recommendation wording completely unchanged', () => {
    const recs = generateRecommendations(fixedEvaluations, null);

    // High-severity punctuality recommendation with exact evidence count
    const punctualityRec = recs.find(r => r.includes('Punctuality'));
    assert.ok(punctualityRec, 'Expected Punctuality recommendation');
    assert.match(punctualityRec.toString(), /\[Weakness: Punctuality — mentioned 2x\]/);
    assert.match(punctualityRec.toString(), /Attendance and punctuality concerns noted/);

    // Medium-severity clarity recommendation with exact evidence count
    const clarityRec = recs.find(r => r.includes('Clarity'));
    assert.ok(clarityRec, 'Expected Clarity recommendation');
    assert.match(clarityRec.toString(), /\[Weakness: Clarity — mentioned 2x\]/);
    assert.match(clarityRec.toString(), /Clarity concerns detected/);

    // Positive strength recommendation with exact evidence count
    const supportRec = recs.find(r => r.includes('Supportiveness'));
    assert.ok(supportRec, 'Expected Supportiveness recommendation');
    assert.match(supportRec.toString(), /\[Strength: Supportiveness — mentioned 2x\]/);
  });

  it('3. Takes severity dynamically from database rules table (Task 3.2 integration)', () => {
    const dbRules = [
      {
        id: 1,
        theme: 'Supportiveness',
        rule_type: 'strength',
        keywords: 'helpful, approachable',
        recommendation_text: 'Students value the supportive atmosphere.',
        severity: 'positive',
        is_active: 1,
      },
      {
        id: 2,
        theme: 'Punctuality',
        rule_type: 'weakness',
        keywords: 'late',
        recommendation_text: 'Timely arrival to lectures is mandatory.',
        severity: 'high',
        is_active: 1,
      },
      {
        id: 3,
        theme: 'Clarity',
        rule_type: 'weakness',
        keywords: 'unclear',
        recommendation_text: 'Use clear visual diagrams.',
        severity: 'medium',
        is_active: 1,
      },
    ];

    const recs = generateRecommendations(fixedEvaluations, dbRules);

    assert.equal(recs[0].severity, 'high');
    assert.ok(recs[0].includes('Punctuality'));

    assert.equal(recs[1].severity, 'medium');
    assert.ok(recs[1].includes('Clarity'));

    assert.equal(recs[2].severity, 'positive');
    assert.ok(recs[2].includes('Supportiveness'));
  });

  it('4. Customizing a rule severity in the database re-orders recommendations immediately without redeploy', () => {
    // If an administrator elevates "Clarity" to "high" severity and lowers "Punctuality" to "low"
    const customizedRules = [
      {
        id: 1,
        theme: 'Supportiveness',
        rule_type: 'strength',
        keywords: 'helpful, approachable',
        recommendation_text: 'Students value the supportive atmosphere.',
        severity: 'positive',
        is_active: 1,
      },
      {
        id: 2,
        theme: 'Punctuality',
        rule_type: 'weakness',
        keywords: 'late',
        recommendation_text: 'Timely arrival to lectures is mandatory.',
        severity: 'low', // changed to low
        is_active: 1,
      },
      {
        id: 3,
        theme: 'Clarity',
        rule_type: 'weakness',
        keywords: 'unclear',
        recommendation_text: 'Use clear visual diagrams.',
        severity: 'high', // elevated to high
        is_active: 1,
      },
    ];

    const recs = generateRecommendations(fixedEvaluations, customizedRules);

    // Now Clarity (high) must appear BEFORE Punctuality (low)
    assert.equal(recs[0].severity, 'high');
    assert.ok(recs[0].includes('Clarity'));

    assert.equal(recs[1].severity, 'low');
    assert.ok(recs[1].includes('Punctuality'));

    assert.equal(recs[2].severity, 'positive');
    assert.ok(recs[2].includes('Supportiveness'));
  });

  it('5. Maintains snapshot parity between hardcoded fallback and seeded DB rules', () => {
    const seededRules = [
      {
        theme: 'Rating',
        rule_type: 'rating',
        keywords: null,
        metric: 'rating',
        operator: '<',
        threshold: 3.50,
        recommendation_text: 'Rating of {rating}/5 is below satisfactory. Focus on specific areas flagged in student feedback and consider peer mentoring from higher-rated colleagues.',
        severity: 'medium',
        is_active: 1,
      },
      {
        theme: 'Punctuality',
        rule_type: 'weakness',
        keywords: 'late, absent, laging',
        metric: 'keyword',
        operator: 'contains',
        threshold: null,
        recommendation_text: 'Attendance and punctuality concerns noted. Faculty should ensure consistent class schedules and timely communication of any cancellations.',
        severity: 'high',
        is_active: 1,
      },
      {
        theme: 'Clarity',
        rule_type: 'weakness',
        keywords: 'unclear, confusing, labo, malabo',
        metric: 'keyword',
        operator: 'contains',
        threshold: null,
        recommendation_text: 'Clarity concerns detected. Suggest using more concrete examples, visual aids, and step-by-step explanations during lectures.',
        severity: 'medium',
        is_active: 1,
      },
      {
        theme: 'Supportiveness',
        rule_type: 'strength',
        keywords: 'helpful, approachable, supportive, mabait, maalaga',
        metric: 'keyword',
        operator: 'contains',
        threshold: null,
        recommendation_text: 'Students consistently appreciate the supportive and approachable teaching style. Maintain this student-centered approach.',
        severity: 'positive',
        is_active: 1,
      },
      {
        theme: 'Expertise',
        rule_type: 'strength',
        keywords: 'knowledgeable, expert, magaling, galing, husay',
        metric: 'keyword',
        operator: 'contains',
        threshold: null,
        recommendation_text: 'Strong subject matter expertise recognized. Consider sharing best practices through department-level knowledge sharing sessions.',
        severity: 'positive',
        is_active: 1,
      },
    ];

    const fallbackRecs = generateRecommendations(fixedEvaluations, null);
    const dbRecs = generateRecommendations(fixedEvaluations, seededRules);

    // Both must rank Punctuality (high) first
    assert.equal(fallbackRecs[0].severity, 'high');
    assert.equal(dbRecs[0].severity, 'high');
    assert.ok(fallbackRecs[0].includes('Punctuality'));
    assert.ok(dbRecs[0].includes('Punctuality'));

    // Both must preserve recommendation texts
    assert.equal(fallbackRecs[0].toString(), dbRecs[0].toString());
  });

  it('6. RecommendationItem instances support string operations and serialize to JSON with metadata', () => {
    const item = new RecommendationItem('Faculty development needed.', {
      severity: 'high',
      theme: 'Punctuality',
      rule_type: 'weakness',
      evidence: 'mentioned 3x',
    });

    // String compatibility
    assert.equal(item.includes('development'), true);
    assert.equal(item.toLowerCase(), 'faculty development needed.');
    assert.equal(item.toString(), 'Faculty development needed.');

    // JSON serialization
    const json = JSON.stringify(item);
    const parsed = JSON.parse(json);
    assert.equal(parsed.text, 'Faculty development needed.');
    assert.equal(parsed.severity, 'high');
    assert.equal(parsed.theme, 'Punctuality');
    assert.equal(parsed.evidence, 'mentioned 3x');
  });

  it('7. Handles empty evaluations array safely', () => {
    const recs = generateRecommendations([]);
    assert.deepEqual(recs, ['No evaluations available for analysis.']);
  });
});
