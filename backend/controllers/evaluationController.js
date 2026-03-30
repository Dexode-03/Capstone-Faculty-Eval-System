const Evaluation = require('../models/Evaluation');
const EvaluationQuestion = require('../models/EvaluationQuestion');
const EvaluationResponse = require('../models/EvaluationResponse');
const Faculty = require('../models/Faculty');
const { analyzeSentiment, generateRecommendations } = require('../utils/sentimentAnalyzer');

/**
 * GET /api/evaluation/questions
 * Get all active evaluation questions
 */
const getQuestions = async (req, res) => {
  try {
    const questions = await EvaluationQuestion.findAllActive();

    // Group by category
    const grouped = questions.reduce((acc, q) => {
      if (!acc[q.category]) acc[q.category] = [];
      acc[q.category].push(q);
      return acc;
    }, {});

    res.json({ questions, grouped });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Server error fetching questions.' });
  }
};

/**
 * POST /api/evaluation/submit
 * Submit a faculty evaluation with per-question ratings
 */
const submitEvaluation = async (req, res) => {
  try {
    const { faculty_id, rating, comment, responses } = req.body;
    const student_id = req.user.id;

    // Validation
    if (!faculty_id || !rating || !comment) {
      return res.status(400).json({ message: 'Faculty, overall rating, and comment are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    // Check if faculty exists
    const faculty = await Faculty.findById(faculty_id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found.' });
    }

    // Validate question responses if provided
    if (responses && Array.isArray(responses)) {
      for (const r of responses) {
        if (!r.question_id || !r.rating || r.rating < 1 || r.rating > 5) {
          return res.status(400).json({ message: 'All evaluation questions must be rated between 1 and 5.' });
        }
      }
    }

    // Analyze sentiment of the comment
    const sentimentResult = analyzeSentiment(comment);

    // Create evaluation
    const result = await Evaluation.create({
      student_id,
      faculty_id,
      rating: parseInt(rating),
      comment,
      sentiment: sentimentResult.label,
      sentiment_score: sentimentResult.score,
    });

    const evaluationId = result.insertId;

    // Save per-question responses
    if (responses && Array.isArray(responses) && responses.length > 0) {
      await EvaluationResponse.createBulk(evaluationId, responses);
    }

    res.status(201).json({
      message: 'Evaluation submitted successfully.',
      evaluation: {
        id: evaluationId,
        faculty_id,
        rating,
        comment,
        sentiment: sentimentResult.label,
        sentiment_score: sentimentResult.score,
      },
      sentimentAnalysis: sentimentResult,
    });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    res.status(500).json({ message: 'Server error submitting evaluation.' });
  }
};

/**
 * GET /api/evaluation/faculty/:id
 * Get evaluations for a specific faculty member
 */
const getFacultyEvaluations = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found.' });
    }

    const evaluations = await Evaluation.findByFacultyId(id);
    const avgRating = await Evaluation.getAverageRating(id);
    const questionAverages = await EvaluationResponse.getAveragesByFaculty(id);

    // Generate prescriptive recommendations
    const recommendations = generateRecommendations(evaluations);

    res.json({
      faculty,
      evaluations,
      averageRating: avgRating ? parseFloat(avgRating).toFixed(2) : null,
      totalEvaluations: evaluations.length,
      questionAverages,
      recommendations,
    });
  } catch (error) {
    console.error('Get faculty evaluations error:', error);
    res.status(500).json({ message: 'Server error fetching evaluations.' });
  }
};

/**
 * GET /api/evaluation/my-evaluations
 * Get evaluations submitted by the current student
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

module.exports = {
  getQuestions,
  submitEvaluation,
  getFacultyEvaluations,
  getMyEvaluations,
};
