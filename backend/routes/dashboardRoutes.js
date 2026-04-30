const express = require('express');
const router  = express.Router();
const { getStats, getFacultyDashboard } = require('../controllers/dashboardController');
const { authenticate, authorize }       = require('../middleware/auth');

router.get('/stats',   authenticate, getStats);
router.get('/faculty', authenticate, authorize('faculty'), getFacultyDashboard);

module.exports = router;