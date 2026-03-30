const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Evaluation = require('../models/Evaluation');

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics (role-aware)
 */
const getStats = async (req, res) => {
  try {
    const { role, id } = req.user;

    if (role === 'student') {
      // Student sees only their own data
      const myEvaluations = await Evaluation.findByStudentId(id);
      const totalSubmitted = myEvaluations.length;
      const totalFaculty = await Faculty.count();

      // Student's own sentiment breakdown
      const mySentiment = { positive: 0, neutral: 0, negative: 0 };
      myEvaluations.forEach((e) => {
        mySentiment[e.sentiment]++;
      });

      // Average rating the student has given
      const avgGiven = totalSubmitted > 0
        ? (myEvaluations.reduce((sum, e) => sum + e.rating, 0) / totalSubmitted).toFixed(1)
        : null;

      // Recent evaluations (last 5)
      const recentEvaluations = myEvaluations.slice(0, 5);

      res.json({
        role: 'student',
        totalSubmitted,
        totalFaculty,
        averageGiven: avgGiven,
        sentimentOverview: mySentiment,
        recentEvaluations,
      });
    } else {
      // Admin/faculty sees system-wide stats
      const totalStudents = await User.countByRole('student');
      const totalFaculty = await Faculty.count();
      const totalEvaluations = await Evaluation.count();
      const sentimentOverview = await Evaluation.getSentimentOverview();

      const sentimentData = { positive: 0, neutral: 0, negative: 0 };
      sentimentOverview.forEach((item) => {
        sentimentData[item.sentiment] = item.count;
      });

      res.json({
        role: 'admin',
        totalStudents,
        totalFaculty,
        totalEvaluations,
        sentimentOverview: sentimentData,
      });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats.' });
  }
};

module.exports = { getStats };
