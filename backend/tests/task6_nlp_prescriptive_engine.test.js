'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const prescriptiveEngine = require('../utils/prescriptiveEngine');
const sentimentAnalyzer = require('../utils/sentimentAnalyzer');

describe('NLP Prescriptive Recommendation Engine & Module Separation', () => {

  it('1. Verifies complete architectural separation of sentiment analysis and prescriptive recommendations', () => {
    // Both modules exist independently
    assert.equal(typeof sentimentAnalyzer.analyzeSentiment, 'function', 'sentimentAnalyzer has analyzeSentiment');
    assert.equal(typeof prescriptiveEngine.generateRecommendations, 'function', 'prescriptiveEngine has generateRecommendations');
    assert.equal(typeof prescriptiveEngine.generateMacroPrescriptions, 'function', 'prescriptiveEngine has generateMacroPrescriptions');

    // sentimentAnalyzer re-exports prescriptive methods for complete backward compatibility
    assert.equal(typeof sentimentAnalyzer.generateRecommendations, 'function');
    assert.equal(typeof sentimentAnalyzer.generateSystemRecommendations, 'function');
  });

  it('2. Normalizes Taglish affixes and stems accurately', () => {
    const sungitNorm = prescriptiveEngine.normalizeTaglishWord('napakasungit');
    assert.equal(sungitNorm.tagalogStem, 'sungit');

    const bilisNorm = prescriptiveEngine.normalizeTaglishWord('nagmamadali');
    assert.equal(bilisNorm.tagalogStem, 'madali');

    const baitNorm = prescriptiveEngine.normalizeTaglishWord('mabait');
    assert.equal(baitNorm.tagalogStem, 'bait');

    const englishNorm = prescriptiveEngine.normalizeTaglishWord('confusing');
    assert.equal(englishNorm.stem, 'confus');
  });

  it('3. Extracts bigrams and matches multi-word collocations in student feedback', () => {
    const text = 'sobrang bilis magturo at di maintindihan';
    const ngrams = prescriptiveEngine.extractNgrams(text);

    assert.ok(ngrams.includes('sobrang bilis'), 'Expected "sobrang bilis" bigram');
    assert.ok(ngrams.includes('di maintindihan'), 'Expected "di maintindihan" bigram');

    // Matching keyword against collocation
    assert.ok(prescriptiveEngine.matchesKeyword('sobrang bilis', 'sobrang bilis'));
    assert.ok(prescriptiveEngine.matchesKeyword('di maintindihan', 'di maintindihan'));
  });

  it('4. Tolerates spelling variations and typos using Levenshtein distance matching', () => {
    // Damerau-Levenshtein distance <= 1 for length >= 4
    assert.ok(prescriptiveEngine.matchesKeyword('unlcear', 'unclear')); // transposition/typo
    assert.ok(prescriptiveEngine.matchesKeyword('terible', 'terrible'));
    assert.ok(prescriptiveEngine.matchesKeyword('malabp', 'malabo'));
  });

  it('5. Enforces severity-weighted thresholds: High severity triggers on 1x, Medium severity requires 2x', () => {
    // Case A: High severity (Respect / "masungit") mentioned only 1 time -> SHOULD trigger
    const evalsWithSingleRespect = [
      {
        id: 1,
        rating: 3.5,
        comment: 'Napakasungit ni maam kahapon sa lecture.',
        weaknesses: 'napakasungit',
        strengths: '',
        sentiment: 'negative',
      },
      {
        id: 2,
        rating: 3.8,
        comment: 'Good presentation of materials.',
        weaknesses: '',
        strengths: 'organized',
        sentiment: 'positive',
      },
    ];

    const recsRespect = prescriptiveEngine.generateRecommendations(evalsWithSingleRespect);
    const respectItem = recsRespect.find(r => r.theme === 'Respect' && r.rule_type === 'weakness');
    assert.ok(respectItem, 'High severity Respect should trigger on 1 mention');
    assert.equal(respectItem.severity, 'high');

    // Case B: Medium severity (Clarity / "malabo") mentioned only 1 time -> SHOULD NOT trigger (requires 2x)
    const evalsWithSingleClarity = [
      {
        id: 1,
        rating: 3.8,
        comment: 'Medyo malabo yung slide 5.',
        weaknesses: 'malabo',
        strengths: '',
        sentiment: 'neutral',
      },
      {
        id: 2,
        rating: 4.0,
        comment: 'Very helpful and approachable.',
        weaknesses: '',
        strengths: 'helpful',
        sentiment: 'positive',
      },
    ];

    const recsClaritySingle = prescriptiveEngine.generateRecommendations(evalsWithSingleClarity);
    const clarityItemSingle = recsClaritySingle.find(r => r.theme === 'Clarity' && r.rule_type === 'weakness');
    assert.equal(clarityItemSingle, undefined, 'Medium severity Clarity should NOT trigger on single isolated mention');

    // Case C: Medium severity (Clarity / "malabo") mentioned 2 times -> SHOULD trigger
    const evalsWithDoubleClarity = [
      ...evalsWithSingleClarity,
      {
        id: 3,
        rating: 3.6,
        comment: 'Hindi malinaw ang instructions sa activity.',
        weaknesses: 'hindi malinaw',
        strengths: '',
        sentiment: 'negative',
      },
    ];

    const recsClarityDouble = prescriptiveEngine.generateRecommendations(evalsWithDoubleClarity);
    const clarityItemDouble = recsClarityDouble.find(r => r.theme === 'Clarity' && r.rule_type === 'weakness');
    assert.ok(clarityItemDouble, 'Medium severity Clarity SHOULD trigger on 2 mentions');
    assert.equal(clarityItemDouble.severity, 'medium');
  });

  it('6. Balanced Top-5 Ranking guarantees at least one recognized strength is included', () => {
    // Faculty with multiple weaknesses and one strong strength
    const evals = [
      {
        id: 1,
        rating: 2.8,
        comment: 'Laging late, napakasungit, sobrang bilis magturo, at unfair magpa-quiz pero napakabait mag-explain.',
        weaknesses: 'late, masungit, mabilis, unfair',
        strengths: 'mabait',
        sentiment: 'negative',
      },
      {
        id: 2,
        rating: 2.7,
        comment: 'Late na naman, bastos pa sumagot sa tanong, nagmamadali lagi sa lesson, at may favoritism, though supportive.',
        weaknesses: 'late, bastos, nagmamadali, favoritism',
        strengths: 'supportive',
        sentiment: 'negative',
      },
    ];

    const recs = prescriptiveEngine.generateRecommendations(evals);

    assert.ok(Array.isArray(recs));
    assert.ok(recs.length <= 5, 'Must be capped at top 5 recommendations');

    // Must have at least 1 strength/positive recommendation in the top 5
    const strengthItem = recs.find(r => r.severity === 'positive');
    assert.ok(strengthItem, 'Balanced top-5 must preserve at least one recognized strength/positive affirmation');
    assert.ok(strengthItem.includes('Supportiveness'));
  });

  it('7. Generates Macro-Aggregated Institutional FDP recommendations when >= 25% of faculty share a theme', () => {
    const facultyList = [
      { id: 1, name: 'Faculty A', department: 'BSIT' },
      { id: 2, name: 'Faculty B', department: 'BSIT' },
      { id: 3, name: 'Faculty C', department: 'BSBA' },
      { id: 4, name: 'Faculty D', department: 'BSBA' },
    ];

    // 2 out of 4 faculty (50%) have pacing complaints (sobrang bilis / rushed)
    const allEvaluations = [
      { faculty_id: 1, rating: 3.2, weaknesses: 'sobrang bilis magturo, rushed', comment: '', sentiment: 'negative' },
      { faculty_id: 2, rating: 3.4, weaknesses: 'mabilis mag-lecture, nagmamadali', comment: '', sentiment: 'negative' },
      { faculty_id: 3, rating: 4.5, weaknesses: '', strengths: 'helpful', comment: 'great', sentiment: 'positive' },
      { faculty_id: 4, rating: 4.6, weaknesses: '', strengths: 'organized', comment: 'well done', sentiment: 'positive' },
    ];

    const macroResult = prescriptiveEngine.generateMacroPrescriptions({
      avgRating: 3.9,
      negativeRate: 20,
      allEvaluations,
      facultyList,
    });

    assert.ok(Array.isArray(macroResult.systemRecommendations));

    // Look for the Institutional FDP Recommendation for Pacing
    const fdpPacing = macroResult.systemRecommendations.find(r =>
      r.includes('Institutional FDP Recommendation') && r.includes('Pacing')
    );

    assert.ok(fdpPacing, 'Expected Institutional FDP recommendation for Pacing when >= 25% of faculty are affected');
    assert.match(fdpPacing, /2 faculty member\(s\) \(50%\)/);
  });
});
