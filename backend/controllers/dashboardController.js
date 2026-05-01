const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Evaluation = require('../models/Evaluation');

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
      const totalStudents    = await User.countByRole('student');
      const totalFaculty     = await Faculty.count();
      const totalEvaluations = await Evaluation.count();
      const sentimentOverview = await Evaluation.getSentimentOverview();
      const departmentStats   = await Evaluation.getStatsByDepartment();

      // Get faculty count per department
      const allFaculty = await Faculty.findAll();
      const deptFacultyCount = {};
      allFaculty.forEach(f => {
        deptFacultyCount[f.department] = (deptFacultyCount[f.department] || 0) + 1;
      });

      const sentimentData = { positive: 0, neutral: 0, negative: 0 };
      sentimentOverview.forEach(item => { sentimentData[item.sentiment] = item.count; });

      // Build department breakdown
      const departments = departmentStats.map(d => ({
        name:             d.department,
        facultyCount:     deptFacultyCount[d.department] || 0,
        totalEvaluations: d.total_evaluations,
        avgRating:        parseFloat(d.avg_rating) || 0,
        sentiment: {
          positive: parseInt(d.positive) || 0,
          neutral:  parseInt(d.neutral)  || 0,
          negative: parseInt(d.negative) || 0,
        },
      }));

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
 * Faculty member's own stats — their evaluations, average rating, sentiment breakdown
 */
const getFacultyDashboard = async (req, res) => {
  try {
    const userId = req.user.id; // FIXED: was [req.user.id](http://req.user.id)

    const facultyRecord = await Faculty.findByUserId(userId);
    if (!facultyRecord) {
      return res.json({
        overallRating:     0,
        totalEvaluations:  0,
        sentimentOverview: { positive: 0, neutral: 0, negative: 0 },
        subjects:          [],
      });
    }

    const evaluations   = await Evaluation.findByFacultyId(facultyRecord.id); // FIXED
    const avgRating     = await Evaluation.getAverageRating(facultyRecord.id); // FIXED

    const sentimentOverview = { positive: 0, neutral: 0, negative: 0 };
    evaluations.forEach(e => { sentimentOverview[e.sentiment]++; });

    // Group evaluations by month as a proxy for subjects (no subjects table yet)
    const monthMap = {};
    evaluations.forEach(e => {
      const date = new Date(e.created_at);
      const key  = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthMap[key]) {
        monthMap[key] = { id: key, name: key, ratings: [], count: 0 };
      }
      monthMap[key].ratings.push(e.rating);
      monthMap[key].count++;
    });

    const subjects = Object.values(monthMap).map((m, i) => ({
      id:   i + 1,
      name: m.name, // FIXED: was [m.name](http://m.name)
      blocks: [{
        id:        i + 1,
        name:      `${m.count} evaluation${m.count !== 1 ? 's' : ''}`,
        students:  m.count,
        evaluated: m.count,
      }],
    }));

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