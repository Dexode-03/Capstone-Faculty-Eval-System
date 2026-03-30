const express = require('express');
const router = express.Router();
const {
  getQuestions,
  submitEvaluation,
  getFacultyEvaluations,
  getMyEvaluations,
} = require('../controllers/evaluationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/questions', authenticate, getQuestions);
router.post('/submit', authenticate, authorize('student'), submitEvaluation);
router.get('/faculty/:id', authenticate, getFacultyEvaluations);
router.get('/my-evaluations', authenticate, authorize('student'), getMyEvaluations);

module.exports = router;
