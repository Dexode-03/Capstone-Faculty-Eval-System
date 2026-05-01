const Evaluation = require('../models/Evaluation');
const EvaluationQuestion = require('../models/EvaluationQuestion');
const EvaluationResponse = require('../models/EvaluationResponse');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const {
  buildAnonymousRespondentRef,
  buildDecoupledSentimentText,
} = require('../utils/privacy');
const {
  analyzeSentiment,
  generateRecommendations,
  generateSystemRecommendations,
  SHORT_CATEGORY,
} = require('../utils/sentimentAnalyzer');

/**
 * GET /api/evaluation/questions
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

// ── Input sanitization helpers ────────────────────────────────────
const MAX_TEXT_LENGTH = 1000;

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

    // Programmatic decoupling per field:
    // strengths and weaknesses are analyzed separately, then aggregated
    // using confidence-weighted polarity.
    const toSignedProbability = (result) => {
      if (!result) return 0;
      if (result.label === 'positive') return result.confidence;
      if (result.label === 'negative') return -result.confidence;
      return 0;
    };

    const strengthsProb = toSignedProbability(strengthsSentiment);
    const weaknessesProb = toSignedProbability(weaknessesSentiment);
    const combinedScore = strengthsProb + weaknessesProb;

    let finalLabel = 'neutral';
    if (combinedScore >= 0.15) finalLabel = 'positive';
    else if (combinedScore <= -0.15) finalLabel = 'negative';

    const sourceCount = [strengthsSentiment, weaknessesSentiment].filter(Boolean).length;
    const finalConfidence = sourceCount > 0
      ? Math.min(1, Math.abs(combinedScore) / sourceCount)
      : 0;

    const sentimentResult = {
      label: finalLabel,
      score: parseFloat(combinedScore.toFixed(4)),
      confidence: parseFloat(finalConfidence.toFixed(4)),
    };

    // Programmatic decoupling: sentiment engine receives text-only content.
    // Student metadata is encrypted separately and never forwarded to analysis.
    const commentForSentiment = buildDecoupledSentimentText({ strengths, weaknesses });
    const anonymous_student_ref = buildAnonymousRespondentRef({ studentId: student_id });

    const result = await Evaluation.create({
      student_id,
      anonymous_student_ref,
      faculty_id,
      rating:          Math.round(overallRating),
      comment:         commentForSentiment,
      strengths,
      weaknesses,
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
      message:           'Evaluation submitted successfully.',
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
 * FIXED: Now scoped to the student's subject_id instead of returning all faculty.
 * Only returns faculty whose subject matches the logged-in student's subject.
 */
const getEnrolledInstructors = async (req, res) => {
  try {
    const student_id = req.user.id;

    // Get student's subject_id from students table
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found.' });
    }

    // Get faculty matching the student's subject
    let facultyList = [];
    if (student.subject_id) {
      facultyList = await Faculty.findBySubject(student.subject_id);
    } else {
      // Fallback if student has no subject assigned yet
      facultyList = await Faculty.findAll();
    }

    // Mark which faculty have already been evaluated by this student
    const myEvaluations = await Evaluation.findByStudentId(student_id);
    const evaluatedIds  = new Set(myEvaluations.map(e => Number(e.faculty_id)));

    const instructors = facultyList.map(f => ({
      id:          f.id,
      name:        f.name,
      department:  f.department,
      subject:     f.subject_name || f.department,
      subjectCode: f.subject_code || null,
      evaluated:   evaluatedIds.has(Number(f.id)),
    }));

    res.json({ instructors });
  } catch (error) {
    console.error('Get enrolled instructors error:', error);
    res.status(500).json({ message: 'Server error fetching instructors.' });
  }
};

/**
 * GET /api/evaluation/analysis
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
 * DELETE /api/evaluation/clear-all
 */
const clearAllEvaluations = async (req, res) => {
  try {
    const evalCount = await Evaluation.count();
    await EvaluationResponse.deleteAll();
    await Evaluation.deleteAll();
    res.json({
      message:      `Successfully cleared ${evalCount} evaluation(s) and all associated responses.`,
      deletedCount: evalCount,
    });
  } catch (error) {
    console.error('Clear evaluations error:', error);
    res.status(500).json({ message: 'Server error clearing evaluation data.' });
  }
};

/**
 * GET /api/evaluation/my-report
 * FIXED: req.user.id IS the faculty ID directly — no findByUserId needed.
 */
const getMyFacultyReport = async (req, res) => {
  try {
    const facultyId = req.user.id;

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty record not found.' });
    }

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
      faculty,
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
  getMyFacultyReport,
  clearAllEvaluations,
};