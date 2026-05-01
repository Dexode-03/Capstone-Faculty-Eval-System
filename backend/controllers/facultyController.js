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
 * Note: Faculty members should now be created through registration (User.createFaculty)
 * This endpoint provides an alternative admin-only method
 */
const createFaculty = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: 'Name, email, password, and department are required.' });
    }

    if (!email.endsWith('@psu.edu.ph')) {
      return res.status(400).json({ message: 'Only PSU email addresses (@psu.edu.ph) are allowed.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existingFaculty = await Faculty.findByEmail(email);
    if (existingFaculty) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const User = require('../models/User');
    const result = await User.createFaculty({
      name,
      email,
      password: hashedPassword,
      department,
      verification_token: null,
    });

    res.status(201).json({
      message: 'Faculty member created successfully.',
      faculty: { id: result.insertId, name, email, department },
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
