const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middleware/auth');

// Admin-only read-only
router.get('/', authenticate, authorize('admin'), getLogs);

module.exports = router;
