const Subject = require('../models/Subject');

const getAllSubjects = async (req, res) => {
  try {
    const { department } = req.query;
    const subjects = department
      ? await Subject.findByDepartment(department)
      : await Subject.findAll();

    res.json({ subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error fetching subjects.' });
  }
};

const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    res.json({ subject });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Server error fetching subject.' });
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
};
