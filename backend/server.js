const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const academicPeriodRoutes = require('./routes/academicPeriodRoutes');
const evaluationQuestionRoutes = require('./routes/evaluationQuestionRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const recommendationRuleRoutes = require('./routes/recommendationRuleRoutes');
const dataArchiveRoutes = require('./routes/dataArchiveRoutes');
const securityHeaders = require('./middleware/securityHeaders');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers (Task 4.3 / NFR-01)
app.use(securityHeaders);

// Strict CORS Origin Verification (Task 4.3)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin) or origins in allowed list
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy: Origin not allowed.'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/evaluation-questions', evaluationQuestionRoutes);
app.use('/api/recommendation-rules', recommendationRuleRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/academic-periods', academicPeriodRoutes);
app.use('/api/archive', dataArchiveRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FEFAS API is running.' });
});

// ── Serve frontend build (if built locally or bundled) ───────────────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // When running API-only (e.g. Render backend with separate Vercel frontend)
  app.get('/', (req, res) => {
    res.json({
      status: 'OK',
      service: 'FEFAS API',
      message: 'Faculty Evaluation and Feedback Analysis System API is running live.'
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// Validate critical security environment variables at startup
const validateSecurityEnv = () => {
  const jwtSecret = process.env.JWT_SECRET;
  const encryptionKey = process.env.PRIVACY_ENCRYPTION_KEY;

  if (!jwtSecret || jwtSecret.trim() === '') {
    throw new Error('FATAL: JWT_SECRET environment variable is missing or empty. Server cannot start.');
  }

  if (!encryptionKey || encryptionKey.trim() === '') {
    throw new Error('FATAL: PRIVACY_ENCRYPTION_KEY environment variable is missing or empty. Server cannot start.');
  }

  if (jwtSecret.trim() === encryptionKey.trim()) {
    throw new Error('FATAL: PRIVACY_ENCRYPTION_KEY must not be identical to JWT_SECRET. Use a distinct secret for privacy encryption.');
  }
};

// Start server
const startServer = async () => {
  try {
    validateSecurityEnv();
  } catch (envErr) {
    console.error(envErr.message);
    process.exit(1);
  }

  await testConnection();
  return app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

if (require.main === module) {
  startServer();
}

app.validateSecurityEnv = validateSecurityEnv;
module.exports = app;
