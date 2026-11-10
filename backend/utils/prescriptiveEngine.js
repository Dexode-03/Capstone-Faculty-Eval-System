/**
 * Prescriptive Analysis & NLP Recommendation Engine
 *
 * Dedicated module for:
 *   1. Taglish NLP Text Preprocessing (tokenization, Porter stemming, Tagalog prefix stripping & reduplication)
 *   2. Collocation and Bigram phrase extraction (e.g., "sobrang bilis", "hindi malinaw", "not clear")
 *   3. Damerau-Levenshtein distance fuzzy matching for student comment variations and typos
 *   4. Semantic theme extraction & severity-weighted thresholding with negation handling
 *   5. Prescriptive recommendation generation with DB-backed rules integration
 *   6. Balanced Top-5 ranking (High -> Medium -> Low severity with guaranteed positive affirmation)
 *   7. Macro-aggregated institutional recommendations for administration
 */

const natural = require('natural');

// ── NLP Tokenizer & Stemmer ─────────────────────────────────────────
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Tagalog common prefixes to strip for Taglish pseudo-stemming (ordered by length)
const TAGALOG_PREFIXES = [
  'nagmamaka', 'nagmamadali', 'nagkaka', 'napaka', 'pinaka',
  'nagka', 'nagma', 'magma', 'pagka', 'maka', 'naka',
  'nag', 'mag', 'pag', 'ma', 'na', 'i',
];

const NEGATION_WORDS = new Set([
  'not', 'never', 'no', 'di', 'hindi', 'wala', 'walang', 'hardly', 'barely',
]);

/**
 * Normalizes a Taglish or English word:
 * 1. Lowercase + strip punctuation
 * 2. Strip common Tagalog affixes and reduplications (e.g., nagmamadali -> madali)
 * 3. Porter stem for English roots
 */
function normalizeTaglishWord(word) {
  let clean = String(word || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  if (!clean || clean.length < 2) {
    return { raw: clean, stem: clean, tagalogStem: clean, combinedStem: clean };
  }

  // Strip Tagalog prefix if found (longest prefix first)
  let tagalogStem = clean;
  for (const prefix of TAGALOG_PREFIXES) {
    if (clean.startsWith(prefix) && clean.length > prefix.length + 2) {
      tagalogStem = clean.substring(prefix.length);
      break;
    }
  }

  // Handle Tagalog syllable reduplication (e.g., ma-madali -> madali)
  if (tagalogStem.length >= 6 && tagalogStem.slice(0, 2) === tagalogStem.slice(2, 4)) {
    tagalogStem = tagalogStem.substring(2);
  }

  // English Porter stemming
  const englishStem = stemmer.stem(clean);
  const tagalogPorterStem = stemmer.stem(tagalogStem);

  return {
    raw: clean,
    stem: englishStem,
    tagalogStem: tagalogStem,
    combinedStem: tagalogPorterStem,
  };
}

/**
 * Fuzzy match check using Damerau-Levenshtein distance (tolerance <= 1 for words length >= 4)
 */
function fuzzyMatchWord(target, candidate) {
  if (target === candidate) return true;
  if (!target || !candidate) return false;
  if (target.length < 4 || candidate.length < 4) return false;

  if (natural.DamerauLevenshteinDistance) {
    return natural.DamerauLevenshteinDistance(target, candidate) <= 1;
  }
  return natural.LevenshteinDistance(target, candidate) <= 1;
}

// ── Recommendation severity priorities (Task 3B.4 / FR-23) ────────
const SEVERITY_ORDER = {
  high: 1,
  medium: 2,
  low: 3,
  positive: 4,
};

const WEAKNESS_THEME_SEVERITY = {
  Punctuality: 'high',
  Fairness: 'high',
  Respect: 'high',
  Clarity: 'medium',
  Pacing: 'medium',
  Engagement: 'medium',
  Grading: 'medium',
};

// Default threshold counts before a theme generates a recommendation
const DEFAULT_THEME_THRESHOLDS = {
  high: 1,     // High-severity issues (Respect, Fairness, Punctuality) trigger on single mention
  medium: 2,   // Pedagogical issues require at least 2 mentions to avoid one-off noise
  low: 2,
  positive: 1, // Strengths trigger on 1 mention to encourage positive feedback
};

// ── Built-in Pedagogical Themes & Lexicon Clusters ────────────────
const WEAKNESS_THEMES = {
  Clarity: {
    severity: 'medium',
    keywords: [
      'unclear', 'confusing', 'labo', 'malabo', 'vague', 'magulo', 'gulo',
      'di maintindihan', 'hindi maintindihan', 'di malinaw', 'hindi malinaw',
      'not clear', 'disorganized', 'lito', 'nakakalito',
    ],
    recommendation: 'Clarity concerns detected. Suggest using more concrete examples, visual aids, and step-by-step explanations during lectures.',
  },
  Pacing: {
    severity: 'medium',
    keywords: [
      'fast', 'rushed', 'bilis', 'mabilis', 'sobrang bilis', 'pacing',
      'nagmamadali', 'madali', 'overwhelming', 'humahagibis', 'too fast',
    ],
    recommendation: 'Pacing issues identified. Recommend incorporating structured pauses, comprehension checks, and allowing more time for student questions.',
  },
  Engagement: {
    severity: 'medium',
    keywords: [
      'boring', 'monotone', 'unengaging', 'nakakaantok', 'antok', 'katamad',
      'tamad', 'passive', 'walang gana', 'boring magturo', 'not engaging',
    ],
    recommendation: 'Student engagement is low. Recommend incorporating interactive activities, group discussions, and varied instructional methods.',
  },
  Punctuality: {
    severity: 'high',
    keywords: [
      'late', 'absent', 'laging', 'tardy', 'huli', 'di pumapasok',
      'di sumisipot', 'hindi pumapasok', 'walang paramdam', 'ghosting',
    ],
    recommendation: 'Attendance and punctuality concerns noted. Faculty should ensure consistent class schedules and timely communication of any cancellations.',
  },
  Grading: {
    severity: 'medium',
    keywords: [
      'grading', 'grades', 'feedback', 'tagal', 'matagal', 'delayed',
      'walang grade', 'ambaba', 'mabagal magbigay ng grade', 'no feedback',
    ],
    recommendation: 'Grading and feedback timeliness was mentioned. Ensure evaluations are returned promptly with constructive comments to support student improvement.',
  },
  Fairness: {
    severity: 'high',
    keywords: [
      'unfair', 'bias', 'biased', 'favoritism', 'paborito', 'di patas',
      'hindi patas', 'unjust', 'namimili',
    ],
    recommendation: 'Fairness concerns raised by students. Review grading criteria transparency and ensure equal treatment of all students.',
  },
  Respect: {
    severity: 'high',
    keywords: [
      'rude', 'bastos', 'masungit', 'disrespectful', 'namamahiya', 'pahiya',
      'insulting', 'harsh', 'suplada', 'suplado', 'terror', 'masakit magsalita',
    ],
    recommendation: 'Professionalism concerns raised. Faculty should foster a respectful and inclusive learning environment at all times.',
  },
};

const STRENGTH_THEMES = {
  Supportiveness: {
    severity: 'positive',
    keywords: [
      'helpful', 'approachable', 'supportive', 'mabait', 'maalaga', 'caring',
      'understanding', 'marunong umintindi', 'patient', 'matiyaga', 'accommodating',
    ],
    recommendation: 'Students consistently appreciate the supportive and approachable teaching style. Maintain this student-centered approach.',
  },
  Expertise: {
    severity: 'positive',
    keywords: [
      'knowledgeable', 'expert', 'magaling', 'galing', 'husay', 'mahusay',
      'mastery', 'competent', 'talino', 'matalino', 'broad knowledge',
    ],
    recommendation: 'Strong subject matter expertise recognized. Consider sharing best practices through department-level knowledge sharing sessions.',
  },
  Organization: {
    severity: 'positive',
    keywords: [
      'organized', 'prepared', 'structured', 'maayos', 'handa', 'systematic',
      'well-organized', 'clear syllabus', 'on time',
    ],
    recommendation: 'Students noted strong organization and preparedness. This is a key strength that positively impacts learning outcomes.',
  },
  Engagement: {
    severity: 'positive',
    keywords: [
      'engaging', 'interactive', 'fun', 'masaya', 'saya', 'enjoy',
      'lively', 'buhay ang klase', 'active', 'enthusiastic',
    ],
    recommendation: 'High student engagement observed. The use of interactive and varied teaching methods is contributing to positive learning experiences.',
  },
  Clarity: {
    severity: 'positive',
    keywords: [
      'clear', 'linaw', 'malinaw', 'madaling maintindihan', 'easy to understand',
      'well-explained', 'simple', 'detailed',
    ],
    recommendation: 'Clear and effective communication is a notable strength. Continue using examples and structured explanations.',
  },
};

// Flat mappings for fast direct lookup
const WEAKNESS_KEYWORD_MAP = {};
Object.entries(WEAKNESS_THEMES).forEach(([theme, info]) => {
  info.keywords.forEach((kw, idx) => {
    WEAKNESS_KEYWORD_MAP[kw] = {
      theme,
      rec: idx === 0 ? info.recommendation : null,
    };
  });
});

const STRENGTH_KEYWORD_MAP = {};
Object.entries(STRENGTH_THEMES).forEach(([theme, info]) => {
  info.keywords.forEach((kw, idx) => {
    STRENGTH_KEYWORD_MAP[kw] = {
      theme,
      rec: idx === 0 ? info.recommendation : null,
    };
  });
});

/**
 * RecommendationItem extends String for backward compatibility with string operations
 * while providing structured metadata (severity, theme, rule_type, evidence) in JSON.
 */
class RecommendationItem extends String {
  constructor(text, meta = {}) {
    super(text);
    this.text = String(text);
    this.severity = meta.severity || 'medium';
    this.theme = meta.theme || null;
    this.rule_type = meta.rule_type || null;
    this.evidence = meta.evidence || null;
  }

  toJSON() {
    return {
      text: this.toString(),
      severity: this.severity,
      theme: this.theme,
      rule_type: this.rule_type,
      evidence: this.evidence,
    };
  }
}

// ── NLP Phrase & N-gram Tokenizer ─────────────────────────────────
/**
 * Extracts unigrams and bigram collocations from text
 */
function extractNgrams(text) {
  if (!text) return [];
  const rawTokens = tokenizer.tokenize(String(text).toLowerCase()) || [];
  const ngrams = [];

  for (let i = 0; i < rawTokens.length; i++) {
    ngrams.push(rawTokens[i]); // Unigram
    if (i < rawTokens.length - 1) {
      ngrams.push(`${rawTokens[i]} ${rawTokens[i + 1]}`); // Bigram
    }
  }
  return ngrams;
}

/**
 * Matches an n-gram against a seed keyword using exact, stemmed, or fuzzy match
 */
function matchesKeyword(ngram, seedKeyword) {
  const normSeed = seedKeyword.toLowerCase().trim();
  const normNgram = ngram.toLowerCase().trim();

  // 1. Exact match
  if (normNgram === normSeed) return true;

  // 2. Substring match for phrases
  if (normSeed.includes(' ') && normNgram.includes(normSeed)) return true;

  // 3. Normalized / Taglish affix stem match
  const n1 = normalizeTaglishWord(normNgram);
  const n2 = normalizeTaglishWord(normSeed);

  if (n1.stem === n2.stem || n1.combinedStem === n2.combinedStem) {
    return true;
  }

  // 4. Fuzzy Damerau-Levenshtein match for single-word stems and raw words
  if (!normSeed.includes(' ') && !normNgram.includes(' ')) {
    if (fuzzyMatchWord(n1.raw, n2.raw)) return true;
    if (fuzzyMatchWord(n1.combinedStem, n2.combinedStem)) return true;
  }

  return false;
}

/**
 * Checks if a matched phrase in text was negated (e.g. "hindi malinaw", "not helpful")
 */
function isPhraseNegated(fullText, phrase) {
  const words = fullText.toLowerCase().split(/\s+/);
  const phraseFirstWord = phrase.split(/\s+/)[0];
  const idx = words.indexOf(phraseFirstWord);
  if (idx > 0 && NEGATION_WORDS.has(words[idx - 1])) {
    return true;
  }
  return false;
}

/**
 * Scans evaluation text comments and detects NLP themes with frequencies
 */
function scanTextForThemes(evaluations, themeDefinitions, isStrength = false) {
  const themeCounts = {};

  evaluations.forEach(e => {
    // For strengths, prioritize e.strengths.
    // For weaknesses, prioritize e.weaknesses.
    // Only fall back to e.comment if the specific field is empty.
    let textToScan = '';
    if (isStrength) {
      textToScan = e.strengths || (e.weaknesses ? '' : (e.comment || ''));
    } else {
      textToScan = e.weaknesses || (e.strengths ? '' : (e.comment || ''));
    }

    if (!textToScan) return;

    const ngrams = extractNgrams(textToScan);
    const matchedInThisEvaluation = new Set();

    Object.entries(themeDefinitions).forEach(([theme, def]) => {
      const keywords = def.keywords || [];
      for (const kw of keywords) {
        for (const ng of ngrams) {
          if (matchesKeyword(ng, kw)) {
            // If checking strengths but the word is negated (e.g. "hindi malinaw"), don't count as strength!
            if (isStrength && isPhraseNegated(textToScan, ng)) {
              continue;
            }
            matchedInThisEvaluation.add(theme);
            break;
          }
        }
        if (matchedInThisEvaluation.has(theme)) break;
      }
    });

    // Increment count once per evaluation per theme
    matchedInThisEvaluation.forEach(theme => {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    });
  });

  return themeCounts;
}

/**
 * Fallback keyword frequency extractor (token-based)
 */
const STOPWORDS = new Set([
  'the', 'and', 'is', 'in', 'it', 'to', 'of', 'for', 'with', 'on', 'at', 'by',
  'this', 'that', 'an', 'are', 'was', 'be', 'as', 'from', 'or', 'have', 'has',
  'ang', 'ng', 'mga', 'sa', 'at', 'na', 'ay', 'si', 'ni', 'kay', 'para',
  'nang', 'dahil', 'kung', 'pero', 'kasi', 'naman', 'din', 'rin', 'lang',
  'po', 'opo', 'siya', 'sila', 'kami', 'tayo', 'ko', 'mo', 'niya', 'nila',
  'very', 'much', 'so', 'too', 'also', 'just', 'more', 'most', 'some',
  'teacher', 'prof', 'professor', 'instructor', 'class', 'subject', 'student',
]);

function extractKeywords(text, maxKeywords = 15) {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));

  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Generate prescriptive recommendations for a single faculty member.
 * Features:
 *   - Taglish NLP theme extraction (affixes, collocations, fuzzy matching)
 *   - Hybrid integration: DB recommendation_rules + built-in pedagogical themes
 *   - Severity-weighted thresholds (High >= 1, Medium >= 2)
 *   - Balanced Top-5 ranking (preserves recognized strengths)
 */
const generateRecommendations = (evaluations, dbRules = null) => {
  const recommendations = [];

  if (!evaluations || evaluations.length === 0) {
    return ['No evaluations available for analysis.'];
  }

  const avgRating = evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length;

  // Weighted sentiment ratio calculations
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  const weightedSentiment = { positive: 0, neutral: 0, negative: 0 };
  let totalWeight = 0;

  evaluations.forEach(e => {
    if (e.sentiment) sentimentCounts[e.sentiment] = (sentimentCounts[e.sentiment] || 0) + 1;
    const raw = parseFloat(e?.sentiment_score);
    let probs;
    if (Number.isFinite(raw)) {
      const s = Math.max(-1, Math.min(1, raw));
      probs = {
        positive: Math.max(0, s),
        neutral:  Math.max(0, 1 - Math.abs(s)),
        negative: Math.max(0, -s),
      };
    } else {
      probs = {
        positive: e?.sentiment === 'positive' ? 1 : 0,
        neutral:  e?.sentiment === 'neutral' ? 1 : 0,
        negative: e?.sentiment === 'negative' ? 1 : 0,
      };
    }
    const entries = Object.entries(probs || {});
    const [label, probability] = entries.sort((a, b) => b[1] - a[1])[0];
    weightedSentiment[label] = (weightedSentiment[label] || 0) + probability;
    totalWeight += probability;
  });

  const safeTotalWeight = totalWeight > 0 ? totalWeight : 1;
  const negativePercent = (weightedSentiment.negative / safeTotalWeight) * 100;
  const positivePercent = (weightedSentiment.positive / safeTotalWeight) * 100;

  // ── 1. Evaluate Quantitative Rules (Rating & Sentiment) ─────────
  const activeRules = Array.isArray(dbRules) && dbRules.length > 0
    ? dbRules.filter(r => r.is_active !== 0)
    : null;

  if (activeRules && activeRules.length > 0) {
    // 1a. Rating rules from DB
    const ratingRules = activeRules.filter(r => r.rule_type === 'rating');
    for (const rule of ratingRules) {
      const thresh = parseFloat(rule.threshold);
      let match = false;
      if (rule.operator === '<') match = avgRating < thresh;
      else if (rule.operator === '<=') match = avgRating <= thresh;
      else if (rule.operator === '>') match = avgRating > thresh;
      else if (rule.operator === '>=') match = avgRating >= thresh;
      else if (rule.operator === '=') match = Math.abs(avgRating - thresh) < 0.01;

      if (match) {
        const text = rule.recommendation_text.replace('{rating}', avgRating.toFixed(1));
        const sev = rule.severity || (avgRating < 2.5 ? 'high' : avgRating < 3.5 ? 'medium' : avgRating < 4.5 ? 'low' : 'positive');
        recommendations.push(new RecommendationItem(text, {
          severity: sev,
          theme: rule.theme || 'Rating',
          rule_type: 'rating',
        }));
        break;
      }
    }

    // 1b. Sentiment rules from DB
    const sentimentRules = activeRules.filter(r => r.rule_type === 'sentiment');
    for (const rule of sentimentRules) {
      const thresh = parseFloat(rule.threshold);
      const isNeg = rule.metric === 'sentiment_negative_pct';
      const pct = isNeg ? negativePercent : positivePercent;
      let match = false;
      if (rule.operator === '>') match = pct > thresh;
      else if (rule.operator === '>=') match = pct >= thresh;
      else if (rule.operator === '<') match = pct < thresh;
      else if (rule.operator === '<=') match = pct <= thresh;

      if (match) {
        const text = rule.recommendation_text
          .replace('{negative_pct}', Math.round(pct))
          .replace('{positive_pct}', Math.round(pct));
        const sev = rule.severity || (isNeg ? (pct > 40 ? 'high' : 'medium') : 'positive');
        recommendations.push(new RecommendationItem(text, {
          severity: sev,
          theme: rule.theme || 'Sentiment',
          rule_type: 'sentiment',
        }));
      }
    }
  } else {
    // Hardcoded fallback rating rule
    if (avgRating < 2.5) {
      recommendations.push(new RecommendationItem(
        `Overall rating is critically low (${avgRating.toFixed(1)}/5). Immediate faculty development intervention is recommended, including a review of teaching methodology and classroom engagement.`,
        { severity: 'high', theme: 'Rating', rule_type: 'rating' }
      ));
    } else if (avgRating < 3.5) {
      recommendations.push(new RecommendationItem(
        `Rating of ${avgRating.toFixed(1)}/5 is below satisfactory. Focus on specific areas flagged in student feedback and consider peer mentoring from higher-rated colleagues.`,
        { severity: 'medium', theme: 'Rating', rule_type: 'rating' }
      ));
    } else if (avgRating < 4.5) {
      recommendations.push(new RecommendationItem(
        `Rating of ${avgRating.toFixed(1)}/5 is good. Minor refinements based on student feedback can push performance to excellent.`,
        { severity: 'low', theme: 'Rating', rule_type: 'rating' }
      ));
    } else {
      recommendations.push(new RecommendationItem(
        `Excellent overall rating (${avgRating.toFixed(1)}/5). This faculty member is a strong candidate for mentoring roles and teaching excellence recognition.`,
        { severity: 'positive', theme: 'Rating', rule_type: 'rating' }
      ));
    }

    // Hardcoded fallback sentiment rule
    if (negativePercent > 40) {
      recommendations.push(new RecommendationItem(
        `High high-probability negative sentiment detected (${Math.round(negativePercent)}%). A structured faculty development plan and follow-up evaluation within the semester is strongly recommended.`,
        { severity: 'high', theme: 'Sentiment Negative', rule_type: 'sentiment' }
      ));
    } else if (negativePercent > 20) {
      recommendations.push(new RecommendationItem(
        `Moderate high-probability negative sentiment present (${Math.round(negativePercent)}%). Review recurring complaints in student feedback and address specific concerns raised.`,
        { severity: 'medium', theme: 'Sentiment Negative', rule_type: 'sentiment' }
      ));
    }

    if (positivePercent > 70) {
      recommendations.push(new RecommendationItem(
        `Strong high-probability positive sentiment trend (${Math.round(positivePercent)}%). Consider nominating this faculty for teaching awards or a leadership role in curriculum development.`,
        { severity: 'positive', theme: 'Sentiment Positive', rule_type: 'sentiment' }
      ));
    }
  }

  // ── 2. NLP Theme Extraction for Weaknesses and Strengths ─────────
  const effectiveWeakThemes = {};
  const effectiveStrongThemes = {};

  if (activeRules && activeRules.length > 0) {
    activeRules.forEach(rule => {
      if (!rule.keywords) return;
      const kws = rule.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      const target = rule.rule_type === 'strength' ? effectiveStrongThemes : effectiveWeakThemes;

      target[rule.theme] = {
        severity: rule.severity || (rule.rule_type === 'strength' ? 'positive' : (WEAKNESS_THEME_SEVERITY[rule.theme] || 'medium')),
        keywords: kws,
        recommendation: rule.recommendation_text,
        customThreshold: rule.threshold ? parseInt(rule.threshold, 10) : null,
      };
    });
  } else {
    Object.assign(effectiveWeakThemes, WEAKNESS_THEMES);
    Object.assign(effectiveStrongThemes, STRENGTH_THEMES);
  }

  // NLP scan across comments
  const detectedWeakCounts = scanTextForThemes(evaluations, effectiveWeakThemes, false);
  const detectedStrongCounts = scanTextForThemes(evaluations, effectiveStrongThemes, true);

  // Fallback: also scan raw token extraction to guarantee legacy test phrase compatibility
  const weaknessesText = evaluations.map(e => e.weaknesses || '').join(' ');
  const strengthsText = evaluations.map(e => e.strengths || '').join(' ');
  const fallbackText = evaluations.map(e => e.comment || '').join(' ');
  const weakRawKW = extractKeywords(weaknessesText || fallbackText, 15);
  const strongRawKW = extractKeywords(strengthsText || fallbackText, 15);

  // Fallback word count incorporation
  weakRawKW.forEach(({ word, count }) => {
    Object.entries(effectiveWeakThemes).forEach(([theme, def]) => {
      if (def.keywords.includes(word) && (!detectedWeakCounts[theme] || detectedWeakCounts[theme] < count)) {
        detectedWeakCounts[theme] = count;
      }
    });
  });

  strongRawKW.forEach(({ word, count }) => {
    Object.entries(effectiveStrongThemes).forEach(([theme, def]) => {
      if (def.keywords.includes(word) && (!detectedStrongCounts[theme] || detectedStrongCounts[theme] < count)) {
        detectedStrongCounts[theme] = count;
      }
    });
  });

  // ── 3. Apply Severity-Weighted Thresholding ─────────────────────
  // Weaknesses: High severity >= 1, Medium/Low >= 2 (or customThreshold)
  Object.entries(detectedWeakCounts).forEach(([theme, count]) => {
    const def = effectiveWeakThemes[theme];
    if (!def) return;
    const sev = def.severity || WEAKNESS_THEME_SEVERITY[theme] || 'medium';
    const minThreshold = def.customThreshold !== null && def.customThreshold !== undefined
      ? def.customThreshold
      : (DEFAULT_THEME_THRESHOLDS[sev] || 2);

    if (count >= minThreshold) {
      const text = `[Weakness: ${theme} — mentioned ${count}x] ${def.recommendation}`;
      recommendations.push(new RecommendationItem(text, {
        severity: sev,
        theme: theme,
        rule_type: 'weakness',
        evidence: `mentioned ${count}x`,
      }));
    }
  });

  // Strengths: Positive severity >= 1 (or customThreshold)
  Object.entries(detectedStrongCounts).forEach(([theme, count]) => {
    const def = effectiveStrongThemes[theme];
    if (!def) return;
    const minThreshold = def.customThreshold !== null && def.customThreshold !== undefined
      ? def.customThreshold
      : 1;

    if (count >= minThreshold) {
      const text = `[Strength: ${theme} — mentioned ${count}x] ${def.recommendation}`;
      recommendations.push(new RecommendationItem(text, {
        severity: def.severity || 'positive',
        theme: theme,
        rule_type: 'strength',
        evidence: `mentioned ${count}x`,
      }));
    }
  });

  // ── 4. Balanced Top-5 Ranking ──────────────────────────────────
  // Sort with most serious first: high (1) -> medium (2) -> low (3) -> positive (4)
  recommendations.sort((a, b) => {
    const rankA = SEVERITY_ORDER[a.severity] || 99;
    const rankB = SEVERITY_ORDER[b.severity] || 99;
    if (rankA !== rankB) return rankA - rankB;
    const typePriority = { weakness: 1, strength: 2, sentiment: 3, rating: 4 };
    const pA = typePriority[a.rule_type] || 99;
    const pB = typePriority[b.rule_type] || 99;
    return pA - pB;
  });

  // Balanced top-5: if there are weaknesses and at least 1 strength,
  // guarantee that at least 1 positive recommendation is kept in the top-5 list
  if (recommendations.length > 5) {
    const weaknesses = recommendations.filter(r => r.severity !== 'positive');
    const strengths = recommendations.filter(r => r.severity === 'positive');

    if (strengths.length > 0 && weaknesses.length >= 4) {
      const balanced = [...weaknesses.slice(0, 4), strengths[0]];
      return balanced;
    }
    return recommendations.slice(0, 5);
  }

  return recommendations;
};

/**
 * Generate macro-aggregated system-wide prescriptive recommendations for administrators
 */
function generateMacroPrescriptions({
  avgRating = 0,
  negativeRate = 0,
  allEvaluations = [],
  facultyList = [],
  needsAttentionCount = 0,
  highPerformersCount = 0,
  worstDept = null,
}) {
  const systemRecommendations = [];

  // 1. Overall institutional rating guidance
  if (avgRating >= 4.0) {
    systemRecommendations.push(
      `System average rating of ${avgRating.toFixed(1)}/5 indicates strong overall teaching performance. Maintain current standards and recognize top performers.`
    );
  } else if (avgRating >= 3.0) {
    systemRecommendations.push(
      `System average rating of ${avgRating.toFixed(1)}/5 is acceptable but has room for improvement. Focus resources on mid-performing faculty.`
    );
  } else {
    systemRecommendations.push(
      `System average rating of ${avgRating.toFixed(1)}/5 is below the acceptable threshold. An urgent, system-wide faculty development program is recommended.`
    );
  }

  // 2. Sentiment threshold guidance
  if (negativeRate > 30) {
    systemRecommendations.push(
      `${Math.round(negativeRate)}% of all evaluations carry negative sentiment. A structured intervention program targeting recurring issues is needed immediately.`
    );
  }

  if (needsAttentionCount > 0) {
    systemRecommendations.push(
      `${needsAttentionCount} faculty member(s) have been flagged for performance review. Individual improvement plans should be initiated promptly.`
    );
  }

  if (highPerformersCount > 0) {
    systemRecommendations.push(
      `${highPerformersCount} faculty member(s) are performing at an excellent level. Consider recognizing them and leveraging their practices across departments.`
    );
  }

  if (worstDept && worstDept.averageRating < 3.5) {
    systemRecommendations.push(
      `The ${worstDept.department} department has the lowest average rating (${worstDept.averageRating}). Prioritize support and development resources for this department.`
    );
  }

  // 3. Macro-aggregated NLP Institutional Interventions
  const facultyEvalMap = {};
  allEvaluations.forEach(e => {
    if (!facultyEvalMap[e.faculty_id]) facultyEvalMap[e.faculty_id] = [];
    facultyEvalMap[e.faculty_id].push(e);
  });

  const macroThemeCounts = {};
  let totalEvaluatedFaculty = 0;

  (facultyList || []).forEach(f => {
    const fEvals = facultyEvalMap[f.id];
    if (!fEvals || fEvals.length === 0) return;
    totalEvaluatedFaculty++;

    const facultyWeaknesses = scanTextForThemes(fEvals, WEAKNESS_THEMES, false);
    Object.keys(facultyWeaknesses).forEach(theme => {
      macroThemeCounts[theme] = (macroThemeCounts[theme] || 0) + 1;
    });
  });

  if (totalEvaluatedFaculty > 0) {
    Object.entries(macroThemeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([theme, affectedCount]) => {
        const pct = Math.round((affectedCount / totalEvaluatedFaculty) * 100);
        if (pct >= 25) {
          systemRecommendations.push(
            `Institutional FDP Recommendation: ${affectedCount} faculty member(s) (${pct}%) received student feedback regarding ${theme}. Recommend organizing a campus-wide Faculty Development Seminar focused on ${theme.toLowerCase()} enhancement.`
          );
        }
      });
  }

  // Top themes summary
  const topThemes = Object.entries(macroThemeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  if (topThemes.length > 0) {
    systemRecommendations.push(
      `Top concern areas across all evaluations: ${topThemes.join(', ')}. Prioritize institutional support and training for these themes.`
    );
  }

  return {
    systemRecommendations,
    macroThemeCounts,
  };
}

module.exports = {
  // Core Prescriptive Engine
  generateRecommendations,
  generateMacroPrescriptions,
  RecommendationItem,
  SEVERITY_ORDER,
  WEAKNESS_THEME_SEVERITY,
  DEFAULT_THEME_THRESHOLDS,

  // NLP utilities
  normalizeTaglishWord,
  extractNgrams,
  matchesKeyword,
  scanTextForThemes,
  extractKeywords,

  // Ontologies
  WEAKNESS_THEMES,
  STRENGTH_THEMES,
  WEAKNESS_KEYWORD_MAP,
  STRENGTH_KEYWORD_MAP,
};
