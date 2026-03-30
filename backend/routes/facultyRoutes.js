const express = require('express');
const router = express.Router();
const {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require('../controllers/facultyController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getAllFaculty);
router.get('/:id', authenticate, getFacultyById);
router.post('/', authenticate, authorize('admin'), createFaculty);
router.put('/:id', authenticate, authorize('admin'), updateFaculty);
router.delete('/:id', authenticate, authorize('admin'), deleteFaculty);

module.exports = router;
