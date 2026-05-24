const AcademicPeriod = require('../models/AcademicPeriod');

/**
 * GET /api/academic-periods
 * Get all academic periods
 */
const getAll = async (req, res) => {
  try {
    const periods = await AcademicPeriod.findAll();
    const active = periods.find(p => p.is_active) || null;
    res.json({ success: true, periods, active });
  } catch (error) {
    console.error('Error fetching academic periods:', error);
    res.status(500).json({ message: 'Server error fetching academic periods.' });
  }
};

/**
 * GET /api/academic-periods/active
 * Get the currently active academic period
 */
const getActive = async (req, res) => {
  try {
    const active = await AcademicPeriod.getActive();
    res.json({ success: true, active });
  } catch (error) {
    console.error('Error fetching active period:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * POST /api/academic-periods
 * Create a new academic period (admin only)
 */
const create = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { academic_year, semester, start_date, end_date } = req.body;

    if (!academic_year || !semester) {
      return res.status(400).json({ message: 'Academic year and semester are required.' });
    }

    if (!['1st', '2nd'].includes(semester)) {
      return res.status(400).json({ message: 'Semester must be 1st or 2nd.' });
    }

    const result = await AcademicPeriod.create({ academic_year, semester, start_date, end_date });
    res.status(201).json({
      success: true,
      message: 'Academic period created successfully.',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Error creating academic period:', error);
    res.status(500).json({ message: 'Server error creating academic period.' });
  }
};

/**
 * PUT /api/academic-periods/:id
 * Update an academic period (admin only)
 */
const update = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { id } = req.params;
    const { academic_year, semester, start_date, end_date } = req.body;

    const existing = await AcademicPeriod.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Academic period not found.' });
    }

    await AcademicPeriod.update(id, {
      academic_year: academic_year || existing.academic_year,
      semester: semester || existing.semester,
      start_date: start_date !== undefined ? start_date : existing.start_date,
      end_date: end_date !== undefined ? end_date : existing.end_date,
    });

    res.json({ success: true, message: 'Academic period updated.' });
  } catch (error) {
    console.error('Error updating academic period:', error);
    res.status(500).json({ message: 'Server error updating academic period.' });
  }
};

/**
 * PUT /api/academic-periods/:id/activate
 * Set an academic period as active (admin only)
 */
const activate = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { id } = req.params;

    const existing = await AcademicPeriod.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Academic period not found.' });
    }

    await AcademicPeriod.setActive(id);
    res.json({
      success: true,
      message: `${existing.academic_year} ${existing.semester} Semester is now active.`,
    });
  } catch (error) {
    console.error('Error activating academic period:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * DELETE /api/academic-periods/:id
 * Delete an academic period (admin only)
 */
const remove = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { id } = req.params;

    const existing = await AcademicPeriod.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Academic period not found.' });
    }

    if (existing.is_active) {
      return res.status(400).json({ message: 'Cannot delete the active academic period. Activate another one first.' });
    }

    await AcademicPeriod.delete(id);
    res.json({ success: true, message: 'Academic period deleted.' });
  } catch (error) {
    console.error('Error deleting academic period:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * PUT /api/academic-periods/toggle-evaluation
 * Admin opens or closes the evaluation window on the active period
 */
const toggleEvaluation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { open } = req.body;
    if (open === undefined) {
      return res.status(400).json({ message: 'Field "open" is required (true/false).' });
    }

    const active = await AcademicPeriod.getActive();
    if (!active) {
      return res.status(400).json({ message: 'No active academic period. Activate one first.' });
    }

    await AcademicPeriod.toggleEvaluation(open);
    res.json({
      success: true,
      message: open ? 'Evaluation is now open. Students can submit evaluations.' : 'Evaluation is now closed.',
      evaluation_open: !!open,
    });
  } catch (error) {
    console.error('Error toggling evaluation:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAll, getActive, create, update, activate, remove, toggleEvaluation };
