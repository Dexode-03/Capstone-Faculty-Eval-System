const express = require('express');
const router  = express.Router();
const {
  getQuestions,
  submitEvaluation,
  getFacultyEvaluations,
  getMyEvaluations,
  getEnrolledInstructors,
  getSystemAnalysis,
  getMyFacultyReport,
  clearAllEvaluations,
  getAnalysisByYearDepartment,
} = require('../controllers/evaluationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/questions',             authenticate,                          getQuestions);
router.post('/submit',               authenticate, authorize('student'),    submitEvaluation);
router.get('/my-report',             authenticate, authorize('faculty'),    getMyFacultyReport);
router.get('/faculty/:id',           authenticate,                          getFacultyEvaluations);
router.get('/my-evaluations',        authenticate, authorize('student'),    getMyEvaluations);
router.get('/enrolled-instructors',  authenticate, authorize('student'),    getEnrolledInstructors);
router.get('/analysis',              authenticate, authorize('admin'),      getSystemAnalysis);
router.delete('/clear-all',            authenticate, authorize('admin'),      clearAllEvaluations);
router.get('/analysis/by-year-department', authenticate, authorize('admin'), getAnalysisByYearDepartment);
module.exports = router;