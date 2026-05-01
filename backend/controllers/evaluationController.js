const Evaluation = require('../models/Evaluation');
const EvaluationQuestion = require('../models/EvaluationQuestion');
const EvaluationResponse = require('../models/EvaluationResponse');
const Faculty = require('../models/Faculty');
const {
  analyzeSentiment,
  generateRecommendations,
  generateSystemRecommendations,
  SHORT_CATEGORY,
} = require('../utils/sentimentAnalyzer');

/**
 * GET /api/evaluation/questions
 * Returns flat list + grouped object with category_description per group
 */
const getQuestions = async (req, res) => {
  try {
    const questions = await EvaluationQuestion.findAllActive();

    const grouped = {};
    questions.forEach(q => {
      if (!grouped[q.category]) {
        grouped[q.category] = {
          description: q.category_description || null,
          questions:   [],
        };
      }
      grouped[q.category].questions.push(q);
    });

    res.json({ questions, grouped });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Server error fetching questions.' });
  }
};

// ── Input sanitization helpers ──────────────────────────────────
const MAX_TEXT_LENGTH = 1000;

/** Strip HTML/script tags and normalize whitespace */
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
};

/** Detect spam: repeated chars (aaaa), repeated words (good good good) */
const isSpam = (text) => {
  if (!text || text.length < 3) return false;
  if (/(.)(\1){4,}/i.test(text)) return true;
  const words = text.toLowerCase().split(/\s+/);
  const freq = {};
  words.forEach(w => { if (w.length > 1) freq[w] = (freq[w] || 0) + 1; });
  const maxRepeat = Math.max(0, ...Object.values(freq));
  if (words.length > 2 && maxRepeat / words.length > 0.6) return true;
  return false;
};

/**
 * POST /api/evaluation/submit
 */
const submitEvaluation = async (req, res) => {
  try {
    const { faculty_id, responses } = req.body;
    const student_id = req.user.id;

    const strengths  = sanitizeText(req.body.strengths);
    const weaknesses = sanitizeText(req.body.weaknesses);

    if (strengths && isSpam(strengths)) {
      return res.status(400).json({ message: 'Strengths field appears to contain spam or repeated text. Please provide meaningful feedback.' });
    }
    if (weaknesses && isSpam(weaknesses)) {
      return res.status(400).json({ message: 'Weaknesses field appears to contain spam or repeated text. Please provide meaningful feedback.' });
    }

    if (!faculty_id) {
      return res.status(400).json({ message: 'Faculty is required.' });
    }
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: 'Evaluation responses are required.' });
    }

    const faculty = await Faculty.findById(faculty_id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found.' });
    }

    const ratedResponses = responses.filter(r => r.rating !== undefined);
    for (const r of ratedResponses) {
      if (!r.question_id || r.rating < 1 || r.rating > 5) {
        return res.status(400).json({
          message: 'All rated questions must have a rating between 1 and 5.',
        });
      }
    }
    if (ratedResponses.length === 0) {
      return res.status(400).json({ message: 'At least one rated response is required.' });
    }

    const avgRating     = ratedResponses.reduce((sum, r) => sum + r.rating, 0) / ratedResponses.length;
    const overallRating = Math.round(avgRating * 10) / 10;

    const strengthsSentiment  = strengths  ? analyzeSentiment(strengths)  : null;
    const weaknessesSentiment = weaknesses ? analyzeSentiment(weaknesses) : null;

    let sentimentResult;
    if (strengthsSentiment && weaknessesSentiment) {
      const posScore = (strengthsSentiment.label === 'positive' ? strengthsSentiment.confidence : 0)
                     + (weaknessesSentiment.label === 'positive' ? weaknessesSentiment.confidence : 0);
      const negScore = (strengthsSentiment.label === 'negative' ? strengthsSentiment.confidence : 0)
                     + (weaknessesSentiment.label === 'negative' ? weaknessesSentiment.confidence : 0);

      if (posScore > negScore)      sentimentResult = strengthsSentiment;
      else if (negScore > posScore) sentimentResult = weaknessesSentiment;
      else                          sentimentResult = { label: 'neutral', score: 0, confidence: 0.5 };
    } else {
      sentimentResult = strengthsSentiment || weaknessesSentiment
                     || analyzeSentiment('No comments provided.');
    }

    const commentForSentiment = [strengths || '', weaknesses || ''].filter(Boolean).join(' ')
                             || 'No comments provided.';

    const result = await Evaluation.create({
      student_id,
      faculty_id,
      rating:          Math.round(overallRating),
      comment:         commentForSentiment,
      sentiment:       sentimentResult.label,
      sentiment_score: sentimentResult.score,
    });

    const evaluationId = result.insertId;

    const allResponses = [...responses];
    const hasTextInResponses = responses.some(r => r.text_response !== undefined);
    if (!hasTextInResponses) {
      const allQuestions = await EvaluationQuestion.findAllActive();
      const openEndedQs  = allQuestions.filter(q => q.question_type === 'text');
      if (openEndedQs.length >= 1 && strengths !== undefined) {
        allResponses.push({ question_id: openEndedQs[0].id, text_response: strengths || '' });
      }
      if (openEndedQs.length >= 2 && weaknesses !== undefined) {
        allResponses.push({ question_id: openEndedQs[1].id, text_response: weaknesses || '' });
      }
    }

    await EvaluationResponse.createBulk(evaluationId, allResponses);

    res.status(201).json({
      message:          'Evaluation submitted successfully.',
      overallRating,
      sentimentAnalysis: sentimentResult,
    });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    res.status(500).json({ message: 'Server error submitting evaluation.' });
  }
};

/**
 * GET /api/evaluation/faculty/:id
 */
const getFacultyEvaluations = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found.' });
    }

    const evaluations     = await Evaluation.findByFacultyId(id);
    const avgRating       = await Evaluation.getAverageRating(id);
    const questionAvgs    = await EvaluationResponse.getAveragesByFaculty(id);
    const recommendations = generateRecommendations(evaluations);

    const sentimentOverview = { positive: 0, neutral: 0, negative: 0 };
    evaluations.forEach(e => { sentimentOverview[e.sentiment]++; });

    const categoryAverages = {};
    questionAvgs.forEach(q => {
      const displayName = SHORT_CATEGORY[q.category] || q.category;
      if (!categoryAverages[displayName]) {
        categoryAverages[displayName] = { total: 0, count: 0 };
      }
      categoryAverages[displayName].total += parseFloat(q.avg_rating);
      categoryAverages[displayName].count += 1;
    });

    const categoryAveragesFormatted = {};
    Object.entries(categoryAverages).forEach(([cat, data]) => {
      categoryAveragesFormatted[cat] = parseFloat((data.total / data.count).toFixed(2));
    });

    const recentFeedback = evaluations.slice(0, 10).map(e => ({
      id:         e.id,
      comment:    e.comment,
      strengths:  e.strengths  || null,
      weaknesses: e.weaknesses || null,
      rating:     e.rating,
      sentiment:  e.sentiment,
      date:       e.created_at,
    }));

    res.json({
      faculty,
      averageRating:    avgRating ? parseFloat(avgRating).toFixed(1) : '0.0',
      totalEvaluations: evaluations.length,
      sentimentOverview,
      categoryAverages: categoryAveragesFormatted,
      recentFeedback,
      recommendations,
    });
  } catch (error) {
    console.error('Get faculty evaluations error:', error);
    res.status(500).json({ message: 'Server error fetching evaluations.' });
  }
};

/**
 * GET /api/evaluation/my-evaluations
 */
const getMyEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findByStudentId(req.user.id);
    res.json({ evaluations });
  } catch (error) {
    console.error('Get my evaluations error:', error);
    res.status(500).json({ message: 'Server error fetching evaluations.' });
  }
};

/**
 * GET /api/evaluation/enrolled-instructors
 */
const getEnrolledInstructors = async (req, res) => {
  try {
    const student_id = req.user.id;

    const allFaculty    = await Faculty.findAll();
    const myEvaluations = await Evaluation.findByStudentId(student_id);

    const evaluatedIds = new Set(myEvaluations.map(e => Number(e.faculty_id)));

    const instructors = allFaculty.map(f => ({
      id:         f.id,
      name:       f.name,
      subject:    f.subject || f.department,
      department: f.department,
      evaluated:  evaluatedIds.has(Number(f.id)),
    }));

    res.json({ instructors });
  } catch (error) {
    console.error('Get enrolled instructors error:', error);
    res.status(500).json({ message: 'Server error fetching instructors.' });
  }
};

/**
 * GET /api/evaluation/analysis
 * System-wide prescriptive analysis for admin Reports page.
 */
const getSystemAnalysis = async (req, res) => {
  try {
    const allEvaluations = await Evaluation.findAll();
    const allFaculty     = await Faculty.findAll();
    const analysis       = generateSystemRecommendations(allEvaluations, allFaculty);
    res.json(analysis);
  } catch (error) {
    console.error('System analysis error:', error);
    res.status(500).json({ message: 'Server error generating system analysis.' });
  }
};

/**
 * GET /api/evaluation/analysis/by-year-department
 * Sentiment analysis + prescriptive recommendations
 * grouped by student year_level × faculty department.
 */
const getAnalysisByYearDepartment = async (req, res) => {
  try {
    const db = require('../config/db');

    // Adjust column/table names below if your schema differs
    const [rows] = await db.query(`
      SELECT
        e.id,
        e.faculty_id,
        e.rating,
        e.comment,
        e.strengths,
        e.weaknesses,
        e.sentiment,
        e.created_at,
        f.name        AS faculty_name,
        f.department,
        u.year_level,
        u.id          AS student_id
      FROM evaluations e
      JOIN faculty     f ON f.id = e.faculty_id
      JOIN users       u ON u.id = e.student_id
      WHERE e.rating IS NOT NULL
      ORDER BY u.year_level, f.department
    `);

    if (!rows || rows.length === 0) {
      return res.json({ groups: [], yearLevels: [] });
    }

    // ── Group by year_level + department ──────────────────────
    const groupMap = {};
    rows.forEach(row => {
      const yearLevel  = row.year_level  || 'Unknown Year';
      const department = row.department  || 'Unknown Department';
      const key        = `${yearLevel}|||${department}`;

      if (!groupMap[key]) {
        groupMap[key] = { year_level: yearLevel, department, evaluations: [], studentIds: new Set() };
      }
      groupMap[key].evaluations.push(row);
      if (row.student_id) groupMap[key].studentIds.add(row.student_id);
    });

    // ── Compute metrics per group ─────────────────────────────
    const STOP = new Set([
      'the','a','an','is','are','was','were','be','been','have','has','had',
      'do','does','did','will','would','could','should','to','of','in','for',
      'on','with','at','by','from','and','but','or','not','no','very','just',
      'ang','ng','sa','na','si','ni','mga','ay','ko','mo','niya','namin',
      'natin','nila','ito','iyan','pero','dahil','lang','din','rin','pa',
      'po','ba','yung','siya','sila','kami','tayo','kayo','ako','ka',
    ]);

    const kwCount = (text) => {
      const words = (text.toLowerCase().match(/[a-z]{3,}/g) || []);
      const freq  = {};
      words.forEach(w => { if (!STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));
    };

    const groups = Object.values(groupMap).map(group => {
      const evals = group.evaluations;
      const total = evals.length;

      // Re-classify sentiment if not already stored
      const withSentiment = evals.map(e => {
        const text = [e.comment, e.strengths, e.weaknesses].filter(Boolean).join(' ');
        const sentiment = e.sentiment || (text ? analyzeSentiment(text).label : 'neutral');
        return { ...e, sentiment };
      });

      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      withSentiment.forEach(e => { sentimentCounts[e.sentiment]++; });

      const positiveRate = Math.round((sentimentCounts.positive / total) * 100);
      const negativeRate = Math.round((sentimentCounts.negative / total) * 100);
      const neutralRate  = Math.round((sentimentCounts.neutral  / total) * 100);

      const avgRating = parseFloat(
        (evals.reduce((s, e) => s + (parseFloat(e.rating) || 0), 0) / total).toFixed(2)
      );

      let status;
      if      (positiveRate >= 70 && avgRating >= 4.5) status = 'excellent';
      else if (positiveRate >= 50 && avgRating >= 3.5) status = 'good';
      else if (positiveRate >= 35 || avgRating >= 2.5) status = 'fair';
      else                                              status = 'needs_improvement';

      const recommendations    = generateRecommendations(withSentiment);
      const weakText           = withSentiment.map(e => e.weaknesses || '').join(' ');
      const strongText         = withSentiment.map(e => e.strengths  || '').join(' ');
      const fallback           = withSentiment.map(e => e.comment    || '').join(' ');
      const topWeaknessKeywords = kwCount(weakText  || fallback);
      const topStrengthKeywords = kwCount(strongText || fallback);

      return {
        year_level:           group.year_level,
        department:           group.department,
        totalEvaluations:     total,
        evaluatedStudents:    group.studentIds.size,
        avgRating,
        sentimentCounts,
        positiveRate,
        negativeRate,
        neutralRate,
        status,
        recommendations,
        topWeaknessKeywords,
        topStrengthKeywords,
      };
    });

    // Sort by year_level asc, then avgRating desc within year
    groups.sort((a, b) => {
      const yc = String(a.year_level).localeCompare(String(b.year_level), undefined, { numeric: true });
      return yc !== 0 ? yc : b.avgRating - a.avgRating;
    });

    const yearLevels = [...new Set(groups.map(g => g.year_level))];

    return res.json({ groups, yearLevels });

  } catch (err) {
    console.error('[getAnalysisByYearDepartment]', err);
    return res.status(500).json({ message: 'Failed to generate year-level/department analysis.' });
  }
};

/**
 * DELETE /api/evaluation/clear-all
 */
const clearAllEvaluations = async (req, res) => {
  try {
    const evalCount = await Evaluation.count();
    await EvaluationResponse.deleteAll();
    await Evaluation.deleteAll();
    res.json({
      message: `Successfully cleared ${evalCount} evaluation(s) and all associated responses.`,
      deletedCount: evalCount,
    });
  } catch (error) {
    console.error('Clear evaluations error:', error);
    res.status(500).json({ message: 'Server error clearing evaluation data.' });
  }
};

/**
 * GET /api/evaluation/my-report
 */
const getMyFacultyReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const facultyRecord = await Faculty.findByUserId(userId);
    if (!facultyRecord) {
      return res.status(404).json({ message: 'No faculty record linked to your account.' });
    }

    const facultyId       = facultyRecord.id;
    const evaluations     = await Evaluation.findByFacultyId(facultyId);
    const avgRating       = await Evaluation.getAverageRating(facultyId);
    const questionAvgs    = await EvaluationResponse.getAveragesByFaculty(facultyId);
    const recommendations = generateRecommendations(evaluations);

    const sentimentOverview = { positive: 0, neutral: 0, negative: 0 };
    evaluations.forEach(e => { sentimentOverview[e.sentiment]++; });

    const categoryAverages = {};
    questionAvgs.forEach(q => {
      const displayName = SHORT_CATEGORY[q.category] || q.category;
      if (!categoryAverages[displayName]) {
        categoryAverages[displayName] = { total: 0, count: 0 };
      }
      categoryAverages[displayName].total += parseFloat(q.avg_rating);
      categoryAverages[displayName].count += 1;
    });

    const categoryAveragesFormatted = {};
    Object.entries(categoryAverages).forEach(([cat, data]) => {
      categoryAveragesFormatted[cat] = parseFloat((data.total / data.count).toFixed(2));
    });

    const recentFeedback = evaluations.slice(0, 10).map(e => ({
      id:         e.id,
      comment:    e.comment,
      strengths:  e.strengths  || null,
      weaknesses: e.weaknesses || null,
      rating:     e.rating,
      sentiment:  e.sentiment,
      date:       e.created_at,
    }));

    res.json({
      faculty:          facultyRecord,
      averageRating:    avgRating ? parseFloat(avgRating).toFixed(1) : '0.0',
      totalEvaluations: evaluations.length,
      sentimentOverview,
      categoryAverages: categoryAveragesFormatted,
      recentFeedback,
      recommendations,
    });
  } catch (error) {
    console.error('Get my faculty report error:', error);
    res.status(500).json({ message: 'Server error fetching your report.' });
  }
};

module.exports = {
  getQuestions,
  submitEvaluation,
  getFacultyEvaluations,
  getMyEvaluations,
  getEnrolledInstructors,
  getSystemAnalysis,
  getAnalysisByYearDepartment,
  getMyFacultyReport,
  clearAllEvaluations,
};