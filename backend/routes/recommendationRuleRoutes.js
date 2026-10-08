const express = require('express');
const router = express.Router();
const {
  getAllRules,
  createRule,
  updateRule,
  deleteRule,
} = require('../controllers/recommendationRuleController');
const { authenticate, authorize } = require('../middleware/auth');

// All rule endpoints are Admin-only
router.get('/', authenticate, authorize('admin'), getAllRules);
router.post('/', authenticate, authorize('admin'), createRule);
router.put('/:id', authenticate, authorize('admin'), updateRule);
router.delete('/:id', authenticate, authorize('admin'), deleteRule);

module.exports = router;
