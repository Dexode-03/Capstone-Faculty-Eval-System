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

    if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }

    const duplicate = await AcademicPeriod.findByYearAndSemester(academic_year, semester);
    if (duplicate) {
      return res.status(409).json({ message: `Academic period for ${academic_year} ${semester} Semester already exists.` });
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

    const newStartDate = start_date !== undefined ? start_date : existing.start_date;
    const newEndDate = end_date !== undefined ? end_date : existing.end_date;

    if (newStartDate && newEndDate && new Date(newEndDate) <= new Date(newStartDate)) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }

    const newYear = academic_year || existing.academic_year;
    const newSem  = semester || existing.semester;
    if (newYear !== existing.academic_year || newSem !== existing.semester) {
      const duplicate = await AcademicPeriod.findByYearAndSemester(newYear, newSem);
      if (duplicate && duplicate.id !== Number(id)) {
        return res.status(409).json({ message: `Academic period for ${newYear} ${newSem} Semester already exists.` });
      }
    }

    await AcademicPeriod.update(id, {
      academic_year: newYear,
      semester: newSem,
      start_date: newStartDate,
      end_date: newEndDate,
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

    const linkedCount = await AcademicPeriod.countLinkedEvaluations(id);
    if (linkedCount > 0) {
      return res.status(400).json({
        message: `Cannot delete academic period because ${linkedCount} evaluation(s) are associated with it.`,
      });
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
