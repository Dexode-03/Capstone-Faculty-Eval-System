const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Evaluation = require('../models/Evaluation');
const { pool } = require('../config/db');

/**
 * GET /api/dashboard/stats
 * Admin and student stats
 */
const getStats = async (req, res) => {
  try {
    const { role, id } = req.user;

    if (role === 'student') {
      const myEvaluations  = await Evaluation.findByStudentId(id);
      const totalSubmitted = myEvaluations.length;
      const totalFaculty   = await Faculty.count();

      const mySentiment = { positive: 0, neutral: 0, negative: 0 };
      myEvaluations.forEach(e => { mySentiment[e.sentiment]++; });

      const avgGiven = totalSubmitted > 0
        ? (myEvaluations.reduce((sum, e) => sum + e.rating, 0) / totalSubmitted).toFixed(1)
        : null;

      res.json({
        role: 'student',
        totalSubmitted,
        totalFaculty,
        averageGiven:      avgGiven,
        sentimentOverview: mySentiment,
        recentEvaluations: myEvaluations.slice(0, 5),
      });
    } else {
      const totalStudents     = await Student.count();
      const totalFaculty      = await Faculty.count();
      const totalEvaluations  = await Evaluation.count();
      const sentimentOverview = await Evaluation.getSentimentOverview();
      const departmentStats   = await Evaluation.getStatsByDepartment();

      // Use Student model for population — queries students table directly
      const populationStats   = await Student.getPopulationByDepartment();

      // Faculty count per department
      const allFaculty = await Faculty.findAll();
      const deptFacultyCount = {};
      allFaculty.forEach(f => {
        if (f.department) {
          deptFacultyCount[f.department] = (deptFacultyCount[f.department] || 0) + 1;
        }
      });

      // Build population map: { [department]: { [year_level]: { total, evaluated, subject } } }
      const populationMap = {};
      populationStats.forEach(row => {
        const dept = row.department;
        const yr   = row.year_level;
        if (!populationMap[dept]) populationMap[dept] = {};
        populationMap[dept][yr] = {
          yearLevel:         yr,
          totalStudents:     parseInt(row.total_students)     || 0,
          evaluatedStudents: parseInt(row.evaluated_students) || 0,
          subjectName:       row.subject_name || null,
          subjectCode:       row.subject_code || null,
        };
      });

      const sentimentData = { positive: 0, neutral: 0, negative: 0 };
      sentimentOverview.forEach(item => { sentimentData[item.sentiment] = item.count; });

      // Collect all departments from both evaluation stats and population stats
      const allDepts = new Set([
        ...departmentStats.map(d => d.department),
        ...Object.keys(populationMap),
      ]);

      const departments = [...allDepts].map(dept => {
        const evalStats  = departmentStats.find(d => d.department === dept) || {};
        const yearLevels = Object.values(populationMap[dept] || {});

        const totalStudentsInDept     = yearLevels.reduce((s, y) => s + y.totalStudents, 0);
        const evaluatedStudentsInDept = yearLevels.reduce((s, y) => s + y.evaluatedStudents, 0);

        return {
          name:              dept,
          facultyCount:      deptFacultyCount[dept] || 0,
          totalEvaluations:  parseInt(evalStats.total_evaluations) || 0,
          avgRating:         parseFloat(evalStats.avg_rating)       || 0,
          sentiment: {
            positive: parseInt(evalStats.positive) || 0,
            neutral:  parseInt(evalStats.neutral)  || 0,
            negative: parseInt(evalStats.negative) || 0,
          },
          totalStudents:     totalStudentsInDept,
          evaluatedStudents: evaluatedStudentsInDept,
          yearLevels:        yearLevels.sort((a, b) => a.yearLevel.localeCompare(b.yearLevel)),
        };
      }).sort((a, b) => a.name.localeCompare(b.name));

      res.json({
        role: 'admin',
        totalStudents,
        totalFaculty,
        totalEvaluations,
        sentimentOverview: sentimentData,
        departments,
      });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats.' });
  }
};

/**
 * GET /api/dashboard/faculty
 * Faculty member's own stats
 */
const getFacultyDashboard = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty record not found.' });
    }

    const evaluations = await Evaluation.findByFacultyId(facultyId);
    const avgRating   = await Evaluation.getAverageRating(facultyId);
    const sentimentOverview = { positive: 0, neutral: 0, negative: 0 };
    evaluations.forEach(e => { sentimentOverview[e.sentiment]++; });

    // Parse subject_ids from GROUP_CONCAT result
    const subjectIds = faculty.subject_ids
      ? faculty.subject_ids.split(',').map(Number)
      : [];

    if (subjectIds.length === 0) {
      return res.json({
        overallRating:     0,
        totalEvaluations:  evaluations.length,
        sentimentOverview,
        subjects:          [],
      });
    }

    // Show enrolled students for each subject handled by this faculty
    const subjects = [];
    const subjectCodes = faculty.subject_codes ? faculty.subject_codes.split(',') : [];
    const subjectNames = faculty.subject_names ? faculty.subject_names.split(', ') : [];

    for (let i = 0; i < subjectIds.length; i++) {
      const sid = subjectIds[i];
      const [enrollmentRows] = await pool.execute(
        `SELECT
           COUNT(DISTINCT st.id) as total_students,
           COUNT(DISTINCT e.student_id) as evaluated_students
         FROM students st
         INNER JOIN student_subjects ss ON ss.student_id = st.id AND ss.subject_id = ?
         LEFT JOIN evaluations e
           ON e.student_id = st.id
          AND e.faculty_id = ?`,
        [sid, facultyId]
      );

      const totals = enrollmentRows[0] || { total_students: 0, evaluated_students: 0 };
      const blocks = [{
        id: i + 1,
        name: 'Enrolled Students',
        students: parseInt(totals.total_students, 10) || 0,
        evaluated: parseInt(totals.evaluated_students, 10) || 0,
      }];

      const code = subjectCodes[i] || '';
      const name = subjectNames[i] || 'Subject';
      subjects.push({
        id:   sid,
        name: code ? `${code} - ${name}` : name,
        blocks,
      });
    }

    res.json({
      overallRating:     avgRating ? parseFloat(parseFloat(avgRating).toFixed(1)) : 0,
      totalEvaluations:  evaluations.length,
      sentimentOverview,
      subjects,
    });
  } catch (error) {
    console.error('Faculty dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching faculty dashboard.' });
  }
};

module.exports = { getStats, getFacultyDashboard };