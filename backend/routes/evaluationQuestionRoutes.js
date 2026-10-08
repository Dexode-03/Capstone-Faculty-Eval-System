const express = require('express');
const router = express.Router();
const {
  getAllForAdmin,
  create,
  update,
  deactivate,
  reorder,
} = require('../controllers/evaluationQuestionController');
const { authenticate, authorize } = require('../middleware/auth');

// All question management routes are Admin-only
router.get('/manage', authenticate, authorize('admin'), getAllForAdmin);
router.post('/', authenticate, authorize('admin'), create);
router.put('/reorder', authenticate, authorize('admin'), reorder);
router.put('/:id', authenticate, authorize('admin'), update);
router.put('/:id/deactivate', authenticate, authorize('admin'), deactivate);

module.exports = router;
