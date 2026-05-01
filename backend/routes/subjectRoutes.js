const express = require('express');
const router = express.Router();
const { getAllSubjects, getSubjectById } = require('../controllers/subjectController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getAllSubjects);
router.get('/:id', authenticate, getSubjectById);

module.exports = router;
