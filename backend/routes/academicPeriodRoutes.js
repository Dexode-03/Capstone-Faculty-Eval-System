const express = require('express');
const router = express.Router();
const {
  getAll,
  getActive,
  create,
  update,
  activate,
  remove,
  toggleEvaluation,
} = require('../controllers/academicPeriodController');
const { authenticate } = require('../middleware/auth');

// Public — any authenticated user can see the active period
router.get('/', authenticate, getAll);
router.get('/active', authenticate, getActive);

// Admin only
router.post('/', authenticate, create);
router.put('/toggle-evaluation', authenticate, toggleEvaluation);
router.put('/:id', authenticate, update);
router.put('/:id/activate', authenticate, activate);
router.delete('/:id', authenticate, remove);

module.exports = router;
