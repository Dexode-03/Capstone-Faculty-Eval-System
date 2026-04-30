const natural = require('natural');
const trainingData = require('./trainingData');

// ── Train Naive Bayes classifier on module load ───────────────────
// Use a custom tokenizer that produces both unigrams (single words)
// and bigrams (word pairs) so negation phrases like "not clear",
// "not helpful", "not good" are treated as single units.
const classifier = new natural.BayesClassifier();

// Override the default stemmer with one that appends bigrams
const tokenizer = new natural.WordTokenizer();
classifier.stemmer = {
  tokenizeAndStem: (text) => {
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
    // Stem each token
    const stemmed = tokens.map(t => natural.PorterStemmer.stem(t));
    // Build bigrams (consecutive word pairs)
    const bigrams = [];
    for (let i = 0; i < stemmed.length - 1; i++) {
      bigrams.push(`${stemmed[i]}_${stemmed[i + 1]}`);
    }
    // Return both unigrams + bigrams
    return [...stemmed, ...bigrams];
  },
};

trainingData.forEach(([text, label]) => classifier.addDocument(text, label));
classifier.train();
console.log(`[NLP] Naive Bayes classifier trained with ${trainingData.length} examples (unigrams + bigrams).`);

// ── Short display labels for PSU categories ───────────────────────
const SHORT_CATEGORY = {
  'A. Management of Teaching and Learning':        'Teaching & Learning',
  'B. Content Knowledge, Pedagogy and Technology': 'Content & Pedagogy',
  'C. Commitment and Transparency':                'Commitment',
};

/**
 * Analyze the sentiment of a text comment using a trained
 * Naive Bayes classifier (supervised machine learning).
 *
 * Returns the same shape used throughout the app so all
 * downstream code (recommendations, reports, dashboard)
 * continues to work unchanged.
 */
const analyzeSentiment = (text) => {
  const label = classifier.classify(text);

  // Get per-class log-probabilities for confidence scoring
  const classifications = classifier.getClassifications(text);
  const classMap = {};
  classifications.forEach(c => { classMap[c.label] = c.value; });

  // Convert log-probabilities to a normalized 0–1 confidence
  const values = classifications.map(c => Math.exp(c.value));
  const sum    = values.reduce((a, b) => a + b, 0);
  const probs  = {};
  classifications.forEach((c, i) => { probs[c.label] = values[i] / sum; });

  // Map to a numeric score: positive → +1, negative → -1, neutral → 0
  // scaled by the confidence of the winning class
  const confidence = probs[label] || 0.5;
  const baseScore  = label === 'positive' ? 1 : label === 'negative' ? -1 : 0;
  const score      = parseFloat((baseScore * confidence).toFixed(4));

  // Tokenize to identify which words contributed (for transparency)
  const tokenizer  = new natural.WordTokenizer();
  const tokens     = tokenizer.tokenize(text.toLowerCase()) || [];

  return {
    score,
    comparative: tokens.length > 0 ? parseFloat((score / tokens.length).toFixed(4)) : 0,
    label,
    confidence:  parseFloat(confidence.toFixed(4)),
    positive:    label === 'positive' ? tokens : [],
    negative:    label === 'negative' ? tokens : [],
  };
};

// ── Stop-words to exclude from keyword extraction (EN + Filipino) ──
const STOP_WORDS = new Set([
  // English
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'to','of','in','for','on','with','at','by','from','as','into','through','and',
  'but','or','nor','not','no','so','if','then','than','too','very','just','about',
  'up','out','all','also','its','it','this','that','these','those','he','she',
  'they','we','you','i','me','my','his','her','our','their','your','who','whom',
  'which','what','when','where','how','each','every','both','few','more','most',
  'some','any','such','only','own','same','other','s','t','m','re','ve','ll','d',
  // Filipino
  'ang','ng','sa','na','si','ni','mga','ay','ko','mo','niya','namin','natin',
  'nila','ito','iyan','iyon','dito','diyan','doon','kung','at','o','pero',
  'dahil','kasi','para','naman','lang','din','rin','pa','po','ba','yung',
  'siya','sila','kami','tayo','kayo','ako','ka',
]);

/**
 * Extract top keywords from text, filtering out stop-words.
 * Returns [{ word, count }] sorted by frequency descending.
 */
const extractKeywords = (text, topN = 10) => {
  if (!text || text.trim().length === 0) return [];
  const tkn = new natural.WordTokenizer();
  const words = tkn.tokenize(text.toLowerCase()) || [];
  const freq = {};
  words.forEach(w => {
    if (w.length > 2 && !STOP_WORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
};

// ── Keyword-to-recommendation mapping (EN + Filipino + Taglish) ──
const WEAKNESS_KEYWORD_MAP = {
  // Clarity
  unclear:   { theme: 'Clarity', rec: 'Clarity concerns detected. Suggest using more concrete examples, visual aids, and step-by-step explanations during lectures.' },
  confusing: { theme: 'Clarity', rec: null },
  labo:      { theme: 'Clarity', rec: null },
  malabo:    { theme: 'Clarity', rec: null },
  // Pacing
  fast:      { theme: 'Pacing', rec: 'Pacing issues identified. Recommend incorporating structured pauses, comprehension checks, and allowing more time for student questions.' },
  rushed:    { theme: 'Pacing', rec: null },
  bilis:     { theme: 'Pacing', rec: null },
  pacing:    { theme: 'Pacing', rec: null },
  // Engagement
  boring:    { theme: 'Engagement', rec: 'Student engagement is low. Recommend incorporating interactive activities, group discussions, and varied instructional methods.' },
  monotone:  { theme: 'Engagement', rec: null },
  unengaging:{ theme: 'Engagement', rec: null },
  nakakaantok:{ theme: 'Engagement', rec: null },
  // Punctuality
  late:      { theme: 'Punctuality', rec: 'Attendance and punctuality concerns noted. Faculty should ensure consistent class schedules and timely communication of any cancellations.' },
  absent:    { theme: 'Punctuality', rec: null },
  laging:    { theme: 'Punctuality', rec: null },
  // Grading
  grading:   { theme: 'Grading', rec: 'Grading and feedback timeliness was mentioned. Ensure evaluations are returned promptly with constructive comments to support student improvement.' },
  grades:    { theme: 'Grading', rec: null },
  feedback:  { theme: 'Grading', rec: null },
  tagal:     { theme: 'Grading', rec: null },
  // Fairness
  unfair:    { theme: 'Fairness', rec: 'Fairness concerns raised by students. Review grading criteria transparency and ensure equal treatment of all students.' },
  bias:      { theme: 'Fairness', rec: null },
  favoritism:{ theme: 'Fairness', rec: null },
  // Respect
  rude:      { theme: 'Respect', rec: 'Professionalism concerns raised. Faculty should foster a respectful and inclusive learning environment at all times.' },
  bastos:    { theme: 'Respect', rec: null },
  masungit:  { theme: 'Respect', rec: null },
  disrespectful: { theme: 'Respect', rec: null },
};

const STRENGTH_KEYWORD_MAP = {
  helpful:      { theme: 'Supportiveness', rec: 'Students consistently appreciate the supportive and approachable teaching style. Maintain this student-centered approach.' },
  approachable: { theme: 'Supportiveness', rec: null },
  supportive:   { theme: 'Supportiveness', rec: null },
  mabait:       { theme: 'Supportiveness', rec: null },
  maalaga:      { theme: 'Supportiveness', rec: null },
  knowledgeable:{ theme: 'Expertise', rec: 'Strong subject matter expertise recognized. Consider sharing best practices through department-level knowledge sharing sessions.' },
  expert:       { theme: 'Expertise', rec: null },
  magaling:     { theme: 'Expertise', rec: null },
  galing:       { theme: 'Expertise', rec: null },
  husay:        { theme: 'Expertise', rec: null },
  organized:    { theme: 'Organization', rec: 'Students noted strong organization and preparedness. This is a key strength that positively impacts learning outcomes.' },
  prepared:     { theme: 'Organization', rec: null },
  structured:   { theme: 'Organization', rec: null },
  engaging:     { theme: 'Engagement', rec: 'High student engagement observed. The use of interactive and varied teaching methods is contributing to positive learning experiences.' },
  interactive:  { theme: 'Engagement', rec: null },
  fun:          { theme: 'Engagement', rec: null },
  masaya:       { theme: 'Engagement', rec: null },
  saya:         { theme: 'Engagement', rec: null },
  enjoy:        { theme: 'Engagement', rec: null },
  clear:        { theme: 'Clarity', rec: 'Clear and effective communication is a notable strength. Continue using examples and structured explanations.' },
  linaw:        { theme: 'Clarity', rec: null },
};

/**
 * Generate prescriptive recommendations for a single faculty member.
 * Uses dynamic keyword extraction instead of hardcoded includes().
 */
const generateRecommendations = (evaluations) => {
  const recommendations = [];

  if (!evaluations || evaluations.length === 0) {
    return ['No evaluations available for analysis.'];
  }

  const avgRating = evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length;
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  evaluations.forEach(e => { sentimentCounts[e.sentiment]++; });

  const total           = evaluations.length;
  const negativePercent = (sentimentCounts.negative / total) * 100;
  const positivePercent = (sentimentCounts.positive / total) * 100;

  // ── Rating-based recommendations ──────────────────────────────
  if (avgRating < 2.5) {
    recommendations.push(
      `Overall rating is critically low (${avgRating.toFixed(1)}/5). Immediate faculty development intervention is recommended, including a review of teaching methodology and classroom engagement.`
    );
  } else if (avgRating < 3.5) {
    recommendations.push(
      `Rating of ${avgRating.toFixed(1)}/5 is below satisfactory. Focus on specific areas flagged in student feedback and consider peer mentoring from higher-rated colleagues.`
    );
  } else if (avgRating < 4.5) {
    recommendations.push(
      `Rating of ${avgRating.toFixed(1)}/5 is good. Minor refinements based on student feedback can push performance to excellent.`
    );
  } else {
    recommendations.push(
      `Excellent overall rating (${avgRating.toFixed(1)}/5). This faculty member is a strong candidate for mentoring roles and teaching excellence recognition.`
    );
  }

  // ── Sentiment-based recommendations ───────────────────────────
  if (negativePercent > 40) {
    recommendations.push(
      `High negative sentiment detected (${Math.round(negativePercent)}%). A structured faculty development plan and follow-up evaluation within the semester is strongly recommended.`
    );
  } else if (negativePercent > 20) {
    recommendations.push(
      `Moderate negative sentiment present (${Math.round(negativePercent)}%). Review recurring complaints in student feedback and address specific concerns raised.`
    );
  }

  if (positivePercent > 70) {
    recommendations.push(
      `Strong positive sentiment trend (${Math.round(positivePercent)}%). Consider nominating this faculty for teaching awards or a leadership role in curriculum development.`
    );
  }

  // ── Dynamic keyword-based recommendations ─────────────────────
  const weaknessesText  = evaluations.map(e => e.weaknesses || '').join(' ');
  const strengthsText   = evaluations.map(e => e.strengths  || '').join(' ');
  const fallbackText    = evaluations.map(e => e.comment    || '').join(' ');
  const weakSource      = weaknessesText || fallbackText;
  const strongSource    = strengthsText  || fallbackText;

  // Extract top keywords from weaknesses & strengths
  const weakKeywords   = extractKeywords(weakSource, 15);
  const strongKeywords = extractKeywords(strongSource, 15);

  // Match weakness keywords to themed recommendations
  const triggeredWeakThemes = new Set();
  weakKeywords.forEach(({ word, count }) => {
    const mapping = WEAKNESS_KEYWORD_MAP[word];
    if (mapping && !triggeredWeakThemes.has(mapping.theme)) {
      triggeredWeakThemes.add(mapping.theme);
      // Use the first keyword in the theme that has a rec
      const rec = mapping.rec || Object.values(WEAKNESS_KEYWORD_MAP)
        .find(m => m.theme === mapping.theme && m.rec)?.rec;
      if (rec) {
        recommendations.push(`[Weakness: ${mapping.theme} — mentioned ${count}x] ${rec}`);
      }
    }
  });

  // Match strength keywords to themed recommendations
  const triggeredStrongThemes = new Set();
  strongKeywords.forEach(({ word, count }) => {
    const mapping = STRENGTH_KEYWORD_MAP[word];
    if (mapping && !triggeredStrongThemes.has(mapping.theme)) {
      triggeredStrongThemes.add(mapping.theme);
      const rec = mapping.rec || Object.values(STRENGTH_KEYWORD_MAP)
        .find(m => m.theme === mapping.theme && m.rec)?.rec;
      if (rec) {
        recommendations.push(`[Strength: ${mapping.theme} — mentioned ${count}x] ${rec}`);
      }
    }
  });

  // ── Surface top unmapped keywords for transparency ────────────
  const allMappedWords = new Set([
    ...Object.keys(WEAKNESS_KEYWORD_MAP),
    ...Object.keys(STRENGTH_KEYWORD_MAP),
  ]);
  const unmappedWeak = weakKeywords
    .filter(k => !allMappedWords.has(k.word) && k.count >= 2)
    .slice(0, 3);
  if (unmappedWeak.length > 0) {
    const wordList = unmappedWeak.map(k => `"${k.word}" (${k.count}x)`).join(', ');
    recommendations.push(
      `Additional recurring concern keywords detected: ${wordList}. Review these topics in student feedback for further action.`
    );
  }

  return recommendations;
};

/**
 * Generate system-wide prescriptive analysis.
 * Used in the Reports page for admin and faculty.
 *
 * @param {Array} allEvaluations - All evaluations with faculty_name, department,
 *                                 strengths, and weaknesses fields
 * @param {Array} facultyList    - All faculty members
 */
const generateSystemRecommendations = (allEvaluations, facultyList) => {
  if (!allEvaluations || allEvaluations.length === 0) {
    return {
      overallHealth:         'insufficient_data',
      systemRecommendations: ['No evaluation data available for system-wide analysis.'],
      departmentInsights:    [],
      facultyFlags:          { needsAttention: [], highPerformers: [] },
      trends:                [],
    };
  }

  const total = allEvaluations.length;

  // ── Overall sentiment health ──────────────────────────────────
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  allEvaluations.forEach(e => { sentimentCounts[e.sentiment]++; });

  const positiveRate = (sentimentCounts.positive / total) * 100;
  const negativeRate = (sentimentCounts.negative / total) * 100;

  let overallHealth;
  if (positiveRate >= 70)      overallHealth = 'excellent';
  else if (positiveRate >= 50) overallHealth = 'good';
  else if (positiveRate >= 35) overallHealth = 'fair';
  else                         overallHealth = 'needs_improvement';

  // ── Per-faculty map ───────────────────────────────────────────
  const facultyMap = {};
  allEvaluations.forEach(e => {
    const fid = e.faculty_id;
    if (!facultyMap[fid]) {
      facultyMap[fid] = {
        id:         fid,
        name:       e.faculty_name || `Faculty #${fid}`,
        department: e.department   || 'Unknown',
        ratings:    [],
        sentiments: { positive: 0, neutral: 0, negative: 0 },
        strengths:  [],
        weaknesses: [],
      };
    }
    facultyMap[fid].ratings.push(e.rating);
    facultyMap[fid].sentiments[e.sentiment]++;
    if (e.strengths)  facultyMap[fid].strengths.push(e.strengths);
    if (e.weaknesses) facultyMap[fid].weaknesses.push(e.weaknesses);
  });

  // Mean of per-faculty averages
  const facultyAverages = Object.values(facultyMap).map(
    f => f.ratings.reduce((s, r) => s + r, 0) / f.ratings.length
  );
  const avgRating = facultyAverages.reduce((s, a) => s + a, 0) / facultyAverages.length;

  // ── Department analysis ───────────────────────────────────────
  const deptMap = {};
  allEvaluations.forEach(e => {
    const dept = e.department || 'Unknown';
    const fid  = e.faculty_id;
    if (!deptMap[dept]) {
      deptMap[dept] = {
        facultyRatings: {},
        sentiments:     { positive: 0, neutral: 0, negative: 0 },
        weaknesses:     [],
        strengths:      [],
      };
    }
    if (!deptMap[dept].facultyRatings[fid]) deptMap[dept].facultyRatings[fid] = [];
    deptMap[dept].facultyRatings[fid].push(e.rating);
    deptMap[dept].sentiments[e.sentiment]++;
    if (e.strengths)  deptMap[dept].strengths.push(e.strengths);
    if (e.weaknesses) deptMap[dept].weaknesses.push(e.weaknesses);
  });

  const departmentInsights = Object.entries(deptMap).map(([dept, data]) => {
    const perFacultyAvgs = Object.values(data.facultyRatings).map(
      ratings => ratings.reduce((s, r) => s + r, 0) / ratings.length
    );
    const deptAvg    = perFacultyAvgs.reduce((s, a) => s + a, 0) / perFacultyAvgs.length;
    const deptTotal  = Object.values(data.facultyRatings).flat().length;
    const deptNegPct = (data.sentiments.negative / deptTotal) * 100;
    const deptPosPct = (data.sentiments.positive / deptTotal) * 100;

    const weakText = data.weaknesses.join(' ').toLowerCase();
    const strongText = data.strengths.join(' ').toLowerCase();

    let status;
    if (deptAvg >= 4.5 && deptPosPct >= 70)     status = 'excellent';
    else if (deptAvg >= 3.5 && deptNegPct < 30) status = 'good';
    else if (deptAvg >= 2.5)                     status = 'fair';
    else                                          status = 'needs_improvement';

    const insight = [];
    if (deptNegPct > 40) {
      insight.push(`High negative feedback rate (${Math.round(deptNegPct)}%). Department-level review recommended.`);
    }
    if (deptAvg < 3.0) {
      insight.push(`Average rating of ${deptAvg.toFixed(1)} is below acceptable threshold. A structured improvement plan is needed.`);
    }
    if (deptPosPct > 70) {
      insight.push(`Strong positive sentiment (${Math.round(deptPosPct)}%). Department is performing well.`);
    }

    // ── Dynamic department keyword insights ─────────────────────
    const deptWeakKW   = extractKeywords(weakText, 5);
    const deptStrongKW = extractKeywords(strongText, 5);

    deptWeakKW.forEach(({ word, count }) => {
      const m = WEAKNESS_KEYWORD_MAP[word];
      if (m && count >= 2) {
        insight.push(`"${word}" mentioned ${count}x — ${m.theme} is a concern in this department.`);
      }
    });
    deptStrongKW.forEach(({ word, count }) => {
      const m = STRENGTH_KEYWORD_MAP[word];
      if (m && count >= 2) {
        insight.push(`"${word}" mentioned ${count}x — ${m.theme} is a strength in this department.`);
      }
    });

    return {
      department:       dept,
      averageRating:    parseFloat(deptAvg.toFixed(2)),
      totalEvaluations: deptTotal,
      sentiments:       data.sentiments,
      positiveRate:     Math.round(deptPosPct),
      negativeRate:     Math.round(deptNegPct),
      status,
      insights:         insight.length > 0 ? insight : [`Performance is ${status}.`],
    };
  }).sort((a, b) => b.averageRating - a.averageRating);

  // ── Per-faculty flags ─────────────────────────────────────────
  const needsAttention = [];
  const highPerformers = [];

  Object.values(facultyMap).forEach(f => {
    const fAvg    = f.ratings.reduce((s, r) => s + r, 0) / f.ratings.length;
    const fTotal  = f.ratings.length;
    const fNegPct = (f.sentiments.negative / fTotal) * 100;
    const fPosPct = (f.sentiments.positive / fTotal) * 100;

    if (fAvg < 3.0 || fNegPct > 40) {
      needsAttention.push({
        id:            f.id,
        name:          f.name,
        department:    f.department,
        averageRating: parseFloat(fAvg.toFixed(2)),
        negativeRate:  Math.round(fNegPct),
        reason:        fAvg < 3.0
          ? `Low average rating of ${fAvg.toFixed(1)}`
          : `High negative feedback rate of ${Math.round(fNegPct)}%`,
      });
    }

    if (fAvg >= 4.5 && fPosPct >= 70) {
      highPerformers.push({
        id:            f.id,
        name:          f.name,
        department:    f.department,
        averageRating: parseFloat(fAvg.toFixed(2)),
        positiveRate:  Math.round(fPosPct),
      });
    }
  });

  // ── Dynamic system-wide keyword trends ────────────────────────
  const allWeaknesses = allEvaluations.map(e => (e.weaknesses || e.comment || '')).join(' ');
  const allStrengths  = allEvaluations.map(e => (e.strengths  || e.comment || '')).join(' ');
  const trends = [];

  // Extract top keywords system-wide
  const sysWeakKW   = extractKeywords(allWeaknesses, 10);
  const sysStrongKW = extractKeywords(allStrengths, 10);

  // Map weakness keywords to warning trends
  const sysWeakThemes = new Set();
  sysWeakKW.forEach(({ word, count }) => {
    const m = WEAKNESS_KEYWORD_MAP[word];
    if (m && !sysWeakThemes.has(m.theme)) {
      sysWeakThemes.add(m.theme);
      const rec = m.rec || Object.values(WEAKNESS_KEYWORD_MAP).find(x => x.theme === m.theme && x.rec)?.rec;
      if (rec) {
        trends.push({ type: 'warning', keyword: word, count, theme: m.theme, text: `[${m.theme} — "${word}" ×${count}] ${rec}` });
      }
    }
  });

  // Map strength keywords to positive trends
  const sysStrongThemes = new Set();
  sysStrongKW.forEach(({ word, count }) => {
    const m = STRENGTH_KEYWORD_MAP[word];
    if (m && !sysStrongThemes.has(m.theme)) {
      sysStrongThemes.add(m.theme);
      const rec = m.rec || Object.values(STRENGTH_KEYWORD_MAP).find(x => x.theme === m.theme && x.rec)?.rec;
      if (rec) {
        trends.push({ type: 'positive', keyword: word, count, theme: m.theme, text: `[${m.theme} — "${word}" ×${count}] ${rec}` });
      }
    }
  });

  // Surface unmapped but frequent keywords as emerging trends
  const allMapped = new Set([...Object.keys(WEAKNESS_KEYWORD_MAP), ...Object.keys(STRENGTH_KEYWORD_MAP)]);
  const emergingWeak = sysWeakKW.filter(k => !allMapped.has(k.word) && k.count >= 3).slice(0, 3);
  emergingWeak.forEach(({ word, count }) => {
    trends.push({ type: 'info', keyword: word, count, theme: 'Emerging', text: `Emerging concern: "${word}" appeared ${count} times in weakness feedback. Investigate further.` });
  });

  // ── System-level recommendations ─────────────────────────────
  const systemRecommendations = [];

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

  if (negativeRate > 30) {
    systemRecommendations.push(
      `${Math.round(negativeRate)}% of all evaluations carry negative sentiment. A structured intervention program targeting recurring issues is needed immediately.`
    );
  }

  if (needsAttention.length > 0) {
    systemRecommendations.push(
      `${needsAttention.length} faculty member(s) have been flagged for performance review. Individual improvement plans should be initiated promptly.`
    );
  }

  if (highPerformers.length > 0) {
    systemRecommendations.push(
      `${highPerformers.length} faculty member(s) are performing at an excellent level. Consider recognizing them and leveraging their practices across departments.`
    );
  }

  const worstDept = [...departmentInsights].sort((a, b) => a.averageRating - b.averageRating)[0];
  if (worstDept && worstDept.averageRating < 3.5) {
    systemRecommendations.push(
      `The ${worstDept.department} department has the lowest average rating (${worstDept.averageRating}). Prioritize support and development resources for this department.`
    );
  }

  // Add top system-wide concern themes as recommendations
  if (sysWeakThemes.size > 0) {
    const themeList = [...sysWeakThemes].slice(0, 3).join(', ');
    systemRecommendations.push(
      `Top concern areas across all evaluations: ${themeList}. Prioritize institutional support and training for these themes.`
    );
  }

  return {
    overallHealth,
    avgRating:             parseFloat(avgRating.toFixed(2)),
    totalEvaluations:      total,
    sentimentCounts,
    positiveRate:          Math.round(positiveRate),
    negativeRate:          Math.round(negativeRate),
    systemRecommendations,
    departmentInsights,
    facultyFlags: { needsAttention, highPerformers },
    trends,
  };
};

module.exports = { analyzeSentiment, generateRecommendations, generateSystemRecommendations, SHORT_CATEGORY };