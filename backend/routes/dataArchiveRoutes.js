'use strict';

const express = require('express');
const router = express.Router();
const DataArchiveController = require('../controllers/dataArchiveController');
const { authenticate, authorize } = require('../middleware/auth');

// All archive operations require an authenticated Administrator
router.use(authenticate, authorize('admin'));

// List periods and archive statuses
router.get('/periods', DataArchiveController.listPeriodArchives);

// Export JSON snapshot for a period
router.get('/export/:periodId', DataArchiveController.exportArchive);

// Wipe evaluations for a closed historical period
router.delete('/wipe/:periodId', DataArchiveController.wipePeriod);

// Restore evaluations from a JSON snapshot
router.post('/restore', DataArchiveController.restoreArchive);

module.exports = router;
