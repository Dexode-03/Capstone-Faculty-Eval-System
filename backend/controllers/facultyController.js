const Faculty = require('../models/Faculty');

/**
 * GET /api/faculty
 * Get all faculty members
 */
const getAllFaculty = async (req, res) => {
  try {
    const { department } = req.query;
    const faculty = department
      ? await Faculty.findByDepartment(department)
      : await Faculty.findAll();
    res.json({ faculty });
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ message: 'Server error fetching faculty list.' });
  }
};

/**
 * GET /api/faculty/:id
 * Get faculty by ID
 */
const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found.' });
    }
    res.json({ faculty });
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * POST /api/faculty
 * Create a new faculty member (admin only)
 */
const createFaculty = async (req, res) => {
  try {
    const { name, department, user_id } = req.body;

    if (!name || !department) {
      return res.status(400).json({ message: 'Name and department are required.' });
    }

    const result = await Faculty.create({ user_id: user_id || null, name, department });

    res.status(201).json({
      message: 'Faculty member created successfully.',
      faculty: { id: result.insertId, name, department },
    });
  } catch (error) {
    console.error('Create faculty error:', error);
    res.status(500).json({ message: 'Server error creating faculty.' });
  }
};

/**
 * PUT /api/faculty/:id
 * Update faculty member (admin only)
 */
const updateFaculty = async (req, res) => {
  try {
    const { name, department } = req.body;
    const { id } = req.params;

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found.' });
    }

    await Faculty.update(id, {
      name: name || faculty.name,
      department: department || faculty.department,
    });

    res.json({ message: 'Faculty member updated successfully.' });
  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({ message: 'Server error updating faculty.' });
  }
};

/**
 * DELETE /api/faculty/:id
 * Delete faculty member (admin only)
 */
const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found.' });
    }

    await Faculty.delete(req.params.id);
    res.json({ message: 'Faculty member deleted successfully.' });
  } catch (error) {
    console.error('Delete faculty error:', error);
    res.status(500).json({ message: 'Server error deleting faculty.' });
  }
};

module.exports = {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
};
