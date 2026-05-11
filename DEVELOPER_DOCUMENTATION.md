# FEFAS - Developer & Process Documentation
## Technical Architecture & Implementation Details

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Request/Response Cycle](#requestresponse-cycle)
3. [Database Operations](#database-operations)
4. [Authentication Flow](#authentication-flow)
5. [Evaluation Processing](#evaluation-processing)
6. [Sentiment Analysis](#sentiment-analysis)
7. [Error Handling](#error-handling)
8. [Code Organization](#code-organization)

---

## System Architecture

### Full Request Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  User interacts with UI                                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    [Axios HTTP Request]
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Middleware Stack                                           │  │
│  ├─ CORS Handler (Allow cross-origin from localhost:5173)    │  │
│  ├─ Body Parser (Parse JSON)                                │  │
│  ├─ Auth Middleware (Verify JWT on protected routes)        │  │
│  └─ Error Handler (Catch exceptions)                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Router (Route Matching)                                   │  │
│  │ - Identify endpoint (/api/auth/login)                    │  │
│  │ - Match HTTP method (POST, GET, etc.)                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Controller (Business Logic)                               │  │
│  │ - Validate request data                                  │  │
│  │ - Call model methods                                     │  │
│  │ - Transform data if needed                               │  │
│  │ - Build response                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Model/Data Layer                                          │  │
│  │ - Execute database queries                               │  │
│  │ - Apply business rules                                   │  │
│  │ - Return processed data                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│                    [Database Connection]                         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                              │
│  - Execute SQL query                                            │
│  - Return results                                               │
└──────────────────────────────────────────────────────────────────┘
                              ↓
        [Response flows back through same path]
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  - Parse JSON response                                           │
│  - Update state                                                  │
│  - Render UI                                                     │
└──────────────────────────────────────────────────────────────────┘
```

### Component Dependencies

```
server.js (Entry Point)
  │
  ├── config/db.js (MySQL Connection Pool)
  │
  ├── config/email.js (Nodemailer Setup)
  │
  ├── middleware/auth.js (JWT Verification)
  │
  ├── routes/
  │   ├── authRoutes.js
  │   ├── evaluationRoutes.js
  │   ├── dashboardRoutes.js
  │   ├── facultyRoutes.js
  │   └── subjectRoutes.js
  │
  ├── controllers/
  │   ├── authController.js
  │   ├── evaluationController.js
  │   ├── dashboardController.js
  │   ├── facultyController.js
  │   └── subjectController.js
  │
  ├── models/
  │   ├── User.js
  │   ├── Student.js
  │   ├── Faculty.js
  │   ├── Subject.js
  │   ├── Evaluation.js
  │   ├── EvaluationQuestion.js
  │   ├── EvaluationResponse.js
  │   └── PasswordReset.js
  │
  └── utils/
      ├── sentimentAnalyzer.js
      ├── privacy.js
      └── trainingData.js
```

---

## Request/Response Cycle

### Complete Example: Student Login

#### Step 1: Frontend Preparation
```javascript
// frontend/src/services/authService.js
const response = await api.post('/auth/login', {
  email: 'student@psu.edu.ph',
  password: 'password123'
});

// api.js creates request with:
// POST http://localhost:5000/api/auth/login
// Content-Type: application/json
// Body: {"email":"student@psu.edu.ph","password":"password123"}
```

#### Step 2: Backend Receipt
```javascript
// backend/routes/authRoutes.js
router.post('/login', login);  // Routes to controller

// backend/controllers/authController.js
const login = async (req, res) => {
  // Access request body
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  try {
    // Find user (any role)
    const account = await User.findByEmail(email);
    
    if (!account) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check email verified
    if (!account.email_verified) {
      return res.status(403).json({ message: 'Please verify email first' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, account.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: account.id, email: account.email, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }  // 7d
    );
    
    // Build response
    const response = {
      message: 'Login successful',
      token: token,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role
        // Additional fields based on role
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

#### Step 3: Response to Frontend
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 4,
    "name": "Raymond Heras",
    "email": "student1@psu.edu.ph",
    "role": "student",
    "year_level": "4th Year",
    "section": "A",
    "department": "Computer Science"
  }
}
```

#### Step 4: Frontend Processing
```javascript
// frontend/src/context/AuthContext.jsx
const login = (token, user) => {
  // Store token in localStorage
  localStorage.setItem('token', token);
  
  // Update context state
  setUser(user);
  setIsAuthenticated(true);
  
  // Future requests will include:
  // headers: { Authorization: `Bearer ${token}` }
};
```

---

## Database Operations

### Connection Management

```javascript
// backend/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});

// Connection pooling benefits:
// - Reuses connections (faster)
// - Limits concurrent connections
// - Automatic reconnection
// - Handles connection timeouts
```

### Query Execution Pattern

```javascript
// Example: User.findByEmail()
findByEmail: async (email) => {
  // Prepared statement (prevents SQL injection)
  const [rows] = await pool.execute(
    'SELECT *, "student" as role FROM students WHERE email = ?',
    [email]  // Parameters bound separately
  );
  return rows[0];
};

// SQL Injection Protected
// User input in email doesn't break query
// Example: email = 'admin@psu.edu.ph" OR "1"="1'
// Query still treats it as a single email value
```

### Common Database Patterns

#### CREATE (Insert)
```javascript
// Student.model.js
create: async ({ name, email, password, year_level, section, department, subject_id }) => {
  const [result] = await pool.execute(
    'INSERT INTO students (name, email, password, year_level, section, department, subject_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, email, password, year_level, section, department, subject_id || null]
  );
  return result;
};

// Returns: { affectedRows: 1, insertId: 15 }
```

#### READ (Query)
```javascript
// Faculty.model.js
findById: async (id) => {
  const [rows] = await pool.execute(
    `SELECT f.*, s.code as subject_code, s.name as subject_name
     FROM faculty f
     LEFT JOIN subjects s ON s.id = f.subject_id
     WHERE f.id = ?`,
    [id]
  );
  return rows[0];
};

// Returns: { id: 2, name: 'Dr. Maria Santos', subject_code: 'CS101', ... }
```

#### UPDATE
```javascript
// User.model.js
updatePassword: async (email, password) => {
  const [result] = await pool.execute(
    'UPDATE students SET password = ? WHERE email = ?',
    [password, email]
  );
  return result;
};

// Returns: { affectedRows: 1, changedRows: 1 }
```

#### DELETE
```javascript
// PasswordReset.model.js
deleteByEmail: async (email) => {
  const [result] = await pool.execute(
    'DELETE FROM password_resets WHERE email = ?',
    [email]
  );
  return result;
};

// Returns: { affectedRows: 1 }
```

#### JOIN (Complex Query)
```javascript
// Evaluation.model.js
findByFacultyWithStats: async (faculty_id) => {
  const [rows] = await pool.execute(
    `SELECT 
       e.id, e.student_id, e.faculty_id, e.rating, e.sentiment,
       s.name as student_name,
       f.name as faculty_name,
       AVG(e.rating) OVER (PARTITION BY e.faculty_id) as avg_rating
     FROM evaluations e
     LEFT JOIN students s ON e.student_id = s.id
     LEFT JOIN faculty f ON e.faculty_id = f.id
     WHERE e.faculty_id = ?
     ORDER BY e.created_at DESC`,
    [faculty_id]
  );
  return rows;
};
```

---

## Authentication Flow

### JWT Token Generation
```javascript
// authController.js
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,  // Secret from .env
    {
      expiresIn: process.env.JWT_EXPIRES_IN  // "7d"
    }
  );
};

// Token Structure (JWT has 3 parts):
// Header.Payload.Signature
// 
// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"id":4,"email":"student1@psu.edu.ph","role":"student","iat":1704067200,"exp":1704672000}
// Signature: HMACSHA256(base64(header) + "." + base64(payload), SECRET)
```

### JWT Verification Middleware
```javascript
// middleware/auth.js
const authenticate = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }
  
  // Expected format: "Bearer {token}"
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    // Verify and decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;  // Contains: id, email, role
    
    next();  // Proceed to controller
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
```

### Role-Based Access
```javascript
// middleware/auth.js (extended)
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this role' });
    }
    
    next();
  };
};

// Usage in routes:
// router.get('/dashboard', authenticate, authorize(['faculty', 'admin']), getDashboard);
```

---

## Evaluation Processing

### Complete Submission Flow

#### Step 1: Receive Request
```javascript
// evaluationController.js - submitEvaluation()
const submitEvaluation = async (req, res) => {
  try {
    const { faculty_id, rating, comment, strengths, weaknesses, responses } = req.body;
    const student_id = req.user.id;  // From JWT token
    
    // Validate
    if (!faculty_id || !rating || !responses) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be 1-5' });
    }
    
    // ... continue
  } catch (error) {
    // ... error handling
  }
};
```

#### Step 2: Sentiment Analysis
```javascript
// evaluationController.js
const { analyzeSentiment } = require('../utils/sentimentAnalyzer');

// Combine all text
const feedbackText = `${comment} ${strengths} ${weaknesses}`;

// Analyze
const sentimentResult = analyzeSentiment(feedbackText);

// Result: {
//   sentiment: "positive" | "neutral" | "negative",
//   score: 0.85 (confidence 0-1)
// }
```

#### Step 3: Anonymize
```javascript
// evaluationController.js
const { encryptReference } = require('../utils/privacy');
const crypto = require('crypto');

// Generate reference
const anonymousRef = `v1.${crypto.randomBytes(20).toString('base64')}`;

// Encrypt it
const encryptedRef = encryptReference(anonymousRef);

// encryptedRef is stored, not linking to student
```

#### Step 4: Store in Database
```javascript
// evaluationController.js
// 1. Insert main evaluation
const evaluationResult = await Evaluation.create({
  student_id,  // Still stored for student's own records
  faculty_id,
  rating,
  comment,
  sentiment: sentimentResult.sentiment,
  sentiment_score: sentimentResult.score,
  anonymous_student_ref: encryptedRef
});

const evaluationId = evaluationResult.insertId;

// 2. Insert each response
for (const response of responses) {
  await EvaluationResponse.create({
    evaluation_id: evaluationId,
    question_id: response.question_id,
    rating: response.rating || null,
    text_response: response.text_response || null
  });
}

// Result: 1 evaluation record + 17 response records
```

#### Step 5: Return Success
```javascript
// evaluationController.js
res.status(201).json({
  message: 'Evaluation submitted successfully',
  evaluation_id: evaluationId
});
```

---

## Sentiment Analysis

### Implementation Details

```javascript
// utils/sentimentAnalyzer.js
const { training_data } = require('./trainingData');

const sentimentAnalyzer = {
  
  // Tokenize text into words
  tokenize: (text) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  },
  
  // Extract bigrams (word pairs)
  getBigrams: (tokens) => {
    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
    return bigrams;
  },
  
  // Convert to feature vector
  extractFeatures: (tokens, bigrams) => {
    const features = {};
    
    // Unigram features
    tokens.forEach(token => {
      features[token] = (features[token] || 0) + 1;
    });
    
    // Bigram features
    bigrams.forEach(bigram => {
      features[bigram] = (features[bigram] || 0) + 1;
    });
    
    return features;
  },
  
  // Naive Bayes classification
  classify: (text) => {
    const tokens = this.tokenize(text);
    const bigrams = this.getBigrams(tokens);
    const features = this.extractFeatures(tokens, bigrams);
    
    // Calculate probabilities
    let positiveScore = 0;
    let negativeScore = 0;
    
    Object.entries(features).forEach(([feature, count]) => {
      if (training_data.positive[feature]) {
        positiveScore += training_data.positive[feature] * count;
      }
      if (training_data.negative[feature]) {
        negativeScore += training_data.negative[feature] * count;
      }
    });
    
    // Classify
    if (positiveScore > negativeScore + 2) {
      return {
        sentiment: 'positive',
        score: Math.min(positiveScore / (positiveScore + negativeScore), 1)
      };
    } else if (negativeScore > positiveScore + 2) {
      return {
        sentiment: 'negative',
        score: Math.min(negativeScore / (positiveScore + negativeScore), 1)
      };
    } else {
      return {
        sentiment: 'neutral',
        score: 0.5
      };
    }
  },
  
  // Main analysis function
  analyzeSentiment: (text) => {
    if (!text || text.trim().length === 0) {
      return { sentiment: 'neutral', score: 0.5 };
    }
    
    return this.classify(text);
  }
};

module.exports = sentimentAnalyzer;
```

### Training Data Structure
```javascript
// utils/trainingData.js
module.exports = {
  training_data: {
    positive: {
      'excellent': 2.5,
      'great': 2.3,
      'good': 1.5,
      'helpful': 2.2,
      'clear': 1.8,
      'organized': 2.0,
      'knowledgeable': 2.1,
      // ... more features
    },
    negative: {
      'poor': 2.5,
      'bad': 2.3,
      'confusing': 2.2,
      'disorganized': 2.0,
      'difficult': 1.5,
      'unclear': 1.8,
      // ... more features
    }
  }
};
```

---

## Encryption & Privacy

### Anonymous Reference Encryption
```javascript
// utils/privacy.js
const crypto = require('crypto');

const privacy = {
  
  // Encrypt reference
  encryptReference: (reference) => {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.PRIVACY_ENCRYPTION_KEY, 'hex');
    
    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(reference, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return: IV + authTag + encrypted data (all needed for decryption)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  },
  
  // Decrypt reference
  decryptReference: (encryptedData) => {
    try {
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(process.env.PRIVACY_ENCRYPTION_KEY, 'hex');
      
      // Split encrypted data
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
      
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }
};

module.exports = privacy;
```

### Encryption Key Generation
```bash
# Generate a secure 256-bit key (64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output: 7a3c2e8f9b1d4c6a9e2f5b8d1c4a7e9f2b5d8c1a4e7f2b5d8c1a4e7f2b5d8

# Add to .env:
# PRIVACY_ENCRYPTION_KEY=7a3c2e8f9b1d4c6a9e2f5b8d1c4a7e9f2b5d8c1a4e7f2b5d8c1a4e7f2b5d8
```

---

## Error Handling

### Error Response Format
```javascript
// Standard error responses

// Bad Request (400)
res.status(400).json({
  message: 'Invalid email format',
  code: 'INVALID_INPUT'
});

// Unauthorized (401)
res.status(401).json({
  message: 'Invalid email or password',
  code: 'AUTH_FAILED'
});

// Forbidden (403)
res.status(403).json({
  message: 'You do not have permission to access this resource',
  code: 'ACCESS_DENIED'
});

// Not Found (404)
res.status(404).json({
  message: 'User not found',
  code: 'NOT_FOUND'
});

// Server Error (500)
res.status(500).json({
  message: 'Internal server error',
  code: 'SERVER_ERROR'
});
```

### Try-Catch Pattern
```javascript
// controllers/authController.js
const login = async (req, res) => {
  try {
    // Business logic
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Determine error type
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    if (error.message.includes('Connection lost')) {
      return res.status(503).json({ message: 'Service unavailable' });
    }
    
    // Generic server error
    res.status(500).json({ message: 'Server error during login' });
  }
};
```

### Validation Error Handler
```javascript
// middleware/validation.js
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@psu\.edu\.ph$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRole = (role) => {
  return ['admin', 'faculty', 'student'].includes(role);
};

// Usage:
if (!validateEmail(email)) {
  return res.status(400).json({ message: 'Invalid email format' });
}
```

---

## Code Organization

### Controller Pattern
```javascript
// controllers/evaluationController.js
const bcrypt = require('bcryptjs');
const Evaluation = require('../models/Evaluation');
const { analyzeSentiment } = require('../utils/sentimentAnalyzer');
const { encryptReference } = require('../utils/privacy');

/**
 * POST /api/evaluations
 * Submit evaluation (Student only)
 */
const submitEvaluation = async (req, res) => {
  try {
    // Extract & validate
    const { faculty_id, rating, comment, strengths, weaknesses, responses } = req.body;
    const student_id = req.user.id;
    
    // Business logic
    const sentiment = analyzeSentiment(`${comment} ${strengths} ${weaknesses}`);
    const anonymousRef = encryptReference(`v1.${crypto.randomBytes(20).toString('base64')}`);
    
    // Database operation
    const result = await Evaluation.create({
      student_id,
      faculty_id,
      rating,
      comment,
      sentiment: sentiment.sentiment,
      sentiment_score: sentiment.score,
      anonymous_student_ref: anonymousRef
    });
    
    // Response
    res.status(201).json({ message: 'Evaluation submitted successfully' });
    
  } catch (error) {
    console.error('Submit evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitEvaluation,
  // ... other controller methods
};
```

### Model Pattern
```javascript
// models/Evaluation.js
const { pool } = require('../config/db');

const Evaluation = {
  
  create: async ({ student_id, faculty_id, rating, comment, sentiment, sentiment_score, anonymous_student_ref }) => {
    const [result] = await pool.execute(
      `INSERT INTO evaluations 
       (student_id, faculty_id, rating, comment, sentiment, sentiment_score, anonymous_student_ref) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [student_id, faculty_id, rating, comment, sentiment, sentiment_score, anonymous_student_ref]
    );
    return result;
  },
  
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT * FROM evaluations WHERE id = ?',
      [id]
    );
    return rows[0];
  },
  
  // ... other methods
};

module.exports = Evaluation;
```

### Route Pattern
```javascript
// routes/evaluationRoutes.js
const express = require('express');
const router = express.Router();
const {
  submitEvaluation,
  getEvaluations,
  getEvaluation
} = require('../controllers/evaluationController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
// (none)

// Authenticated routes
router.post('/evaluations', authenticate, submitEvaluation);
router.get('/evaluations', authenticate, getEvaluations);
router.get('/evaluations/:id', authenticate, getEvaluation);

module.exports = router;
```

---

## Testing Patterns

### Manual Testing with cURL
```bash
# Register student
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@psu.edu.ph",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "student",
    "year_level": "2nd Year",
    "section": "A",
    "department": "Computer Science",
    "subject_id": 1
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@psu.edu.ph",
    "password": "password123"
  }'

# Submit evaluation (using token from login)
curl -X POST http://localhost:5000/api/evaluations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_from_login}" \
  -d '{
    "faculty_id": 2,
    "rating": 4,
    "comment": "Great teacher",
    "strengths": "Excellent explanation",
    "weaknesses": "Could use more examples",
    "responses": [
      {"question_id": 1, "rating": 4},
      {"question_id": 2, "rating": 5}
    ]
  }'
```

---

## Performance Optimization

### Database Query Optimization
```javascript
// GOOD: Specific columns
const [rows] = await pool.execute(
  'SELECT id, name, email FROM students WHERE department = ?',
  [department]
);

// BAD: All columns
const [rows] = await pool.execute(
  'SELECT * FROM students WHERE department = ?',
  [department]
);

// GOOD: With pagination
const limit = 10;
const offset = (page - 1) * limit;
const [rows] = await pool.execute(
  'SELECT * FROM evaluations LIMIT ? OFFSET ?',
  [limit, offset]
);
```

### Caching Strategy
```javascript
// Simple in-memory cache
const cache = {};

const getCachedFaculty = async (id) => {
  const cacheKey = `faculty_${id}`;
  
  if (cache[cacheKey]) {
    console.log('Cache hit');
    return cache[cacheKey];
  }
  
  const faculty = await Faculty.findById(id);
  cache[cacheKey] = faculty;
  
  // Clear cache after 5 minutes
  setTimeout(() => {
    delete cache[cacheKey];
  }, 5 * 60 * 1000);
  
  return faculty;
};
```

---

## Debugging Tips

### Enable Query Logging
```javascript
// config/db.js - Log all queries
pool.on('connection', (connection) => {
  connection.on('query', (q) => {
    console.log('[SQL]', q.sql);
  });
});
```

### API Response Logging
```javascript
// Log all API responses
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode}`);
  });
  next();
});
```

### Error Stack Traces
```javascript
// Log full error information
catch (error) {
  console.error('Full error:', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    query: error.sql  // For database errors
  });
}
```

---

## Security Best Practices

### Input Sanitization
```javascript
// Trim whitespace
const email = req.body.email.trim();

// Validate type
if (typeof email !== 'string') {
  return res.status(400).json({ message: 'Invalid input' });
}

// Remove special characters if needed
const comment = req.body.comment.replace(/[<>]/g, '');

// Use prepared statements (already done with pool.execute)
```

### Rate Limiting
```javascript
// Implement rate limiting for login attempts
const loginAttempts = {};

const checkRateLimit = (email) => {
  if (!loginAttempts[email]) {
    loginAttempts[email] = { count: 0, resetTime: Date.now() };
  }
  
  if (Date.now() - loginAttempts[email].resetTime > 15 * 60 * 1000) {
    // Reset after 15 minutes
    loginAttempts[email] = { count: 0, resetTime: Date.now() };
  }
  
  if (loginAttempts[email].count >= 5) {
    return false;  // Too many attempts
  }
  
  loginAttempts[email].count++;
  return true;
};
```

---

**Last Updated**: May 2, 2026  
**Version**: 1.0  
**Audience**: Developers, Technical Leads
