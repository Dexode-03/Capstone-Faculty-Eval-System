# Faculty Evaluation and Feedback Analysis System (FEFAS)
## Comprehensive System Architecture & Analysis

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Database Schema](#database-schema)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
6. [Role-Based Workflows](#role-based-workflows)
7. [User Flows by Role](#user-flows-by-role)
8. [Component Interactions](#component-interactions)
9. [Data Processing & Analysis](#data-processing--analysis)
10. [Security & Privacy Features](#security--privacy-features)

---

## System Overview

**FEFAS** is a comprehensive faculty evaluation system designed for educational institutions (PSU - Pamantasan ng Lungsod ng Maynila) to collect, analyze, and report on student feedback regarding faculty teaching performance.

### Key Features:
- **Multi-role system** with distinct workflows for Admins, Faculty, and Students
- **Automated sentiment analysis** using Naive Bayes classifier
- **Privacy-preserving evaluation collection** with anonymous respondent tracking
- **Real-time dashboard analytics** with department-level insights
- **Role-based access control** with JWT token authentication
- **Comprehensive reporting** with sentiment breakdowns and recommendations

### Tech Stack:
- **Backend**: Node.js + Express.js (server.js on port 5000)
- **Frontend**: React 19 + React Router + Tailwind CSS + Vite (dev on port 5173)
- **Database**: MySQL 10.4.32 (MariaDB)
- **NLP**: Natural.js (tokenization, Porter stemmer, Naive Bayes classifier)
- **Email**: Nodemailer for verification and password reset emails
- **Authentication**: JWT tokens with bcryptjs password hashing
- **Encryption**: AES-256-GCM for metadata encryption

---

## Architecture Layers

### 1. **Presentation Layer (Frontend)**
Location: `/frontend/src/`

**Purpose**: React-based UI for all system interactions

**Key Technologies**:
- React 19 with Hooks for state management
- React Router v7 for navigation
- Tailwind CSS for styling
- Axios for HTTP requests
- React Icons for UI components

**Main Components**:
- `App.jsx` - Root component with route definitions
- `Layout.jsx` - Main application shell with navigation
- `ProtectedRoute.jsx` - Route guard for authenticated access
- `Navbar.jsx` - Top navigation bar with role-based menu

**Pages/Workflows**:
- `Login.jsx` - Authentication entry point
- `Dashboard.jsx` - Role-specific dashboard (Students/Admins)
- `EvaluationForm.jsx` - Multi-step evaluation form for students
- `FacultyList.jsx` - Browse and search faculty members
- `FacultyReport.jsx` - Detailed evaluation reports (Admin/Faculty view)
- `Reports.jsx` - System-wide analytics and reports (Admin only)
- `ChangePassword.jsx` - User account management
- `ForgotPassword.jsx` / `ResetPassword.jsx` - Password recovery flow

### 2. **Business Logic Layer (Backend)**
Location: `/backend/`

**Purpose**: API server handling authentication, evaluations, and analytics

**Key Components**:

#### Controllers (`/controllers/`)
- `authController.js` - Register, login, email verification, password reset
- `evaluationController.js` - Form submission, report generation, sentiment analysis
- `dashboardController.js` - Statistics and analytics aggregation
- `facultyController.js` - Faculty CRUD operations (admin only)
- `subjectController.js` - Subject/course management

#### Models (`/models/`)
- `User.js` - Multi-table user management (admins, faculty, students)
- `Faculty.js` - Faculty data access
- `Student.js` - Student data access with enrollment info
- `Evaluation.js` - Evaluation records with sentiment data
- `EvaluationQuestion.js` - Question bank management
- `EvaluationResponse.js` - Individual response tracking
- `Subject.js` - Course/subject records
- `PasswordReset.js` - Password reset token management

#### Routes (`/routes/`)
- `authRoutes.js` - Auth endpoints
- `evaluationRoutes.js` - Evaluation submission and retrieval
- `dashboardRoutes.js` - Dashboard data endpoints
- `facultyRoutes.js` - Faculty management
- `subjectRoutes.js` - Subject management

#### Middleware (`/middleware/`)
- `auth.js` - JWT verification and role-based authorization

#### Utilities (`/utils/`)
- `sentimentAnalyzer.js` - ML-based sentiment classification
- `privacy.js` - Encryption and anonymization
- `trainingData.js` - Training data for Naive Bayes classifier

#### Configuration (`/config/`)
- `db.js` - MySQL connection pool setup
- `email.js` - Email service configuration

### 3. **Data Layer (Database)**
Location: `/database/`

**Purpose**: Persistent data storage in MySQL/MariaDB

**Database Name**: `faculty_evaluation_db`

---

## Database Schema

### Core Tables

#### 1. **admins** - System administrators
```
id (INT PRIMARY KEY)
name (VARCHAR 255)
email (VARCHAR 255) UNIQUE
password (VARCHAR 255) - bcryptjs hashed
email_verified (TINYINT) - boolean flag
verification_token (VARCHAR 255) - for email verification
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### 2. **faculty** - Faculty members being evaluated
```
id (INT PRIMARY KEY)
name (VARCHAR 255)
email (VARCHAR 255) UNIQUE - @psu.edu.ph domain required
password (VARCHAR 255) - bcryptjs hashed
department (VARCHAR 255) - College/Department
subject_id (INT) - FK to subjects table
email_verified (TINYINT)
verification_token (VARCHAR 255)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)

INDEXES:
- email (UNIQUE)
- subject_id (FK to subjects)
```

#### 3. **students** - Students submitting evaluations
```
id (INT PRIMARY KEY)
name (VARCHAR 255)
email (VARCHAR 255) UNIQUE - @psu.edu.ph domain required
password (VARCHAR 255) - bcryptjs hashed
year_level (VARCHAR 20) - e.g., "4th Year"
section (VARCHAR 50) - e.g., "A", "B"
department (VARCHAR 255)
subject_id (INT) - FK to subjects (course enrolled)
email_verified (TINYINT)
verification_token (VARCHAR 255)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)

INDEXES:
- email (UNIQUE)
- subject_id (FK to subjects)
- department
```

#### 4. **subjects** - Courses/subjects
```
id (INT PRIMARY KEY)
code (VARCHAR 20) - e.g., "CS101", "IT101"
name (VARCHAR 255) - e.g., "Computer Programming 1"
department (VARCHAR 255)
created_at (TIMESTAMP)
```

#### 5. **evaluations** - Main evaluation records
```
id (INT PRIMARY KEY)
student_id (INT) - FK to students
anonymous_student_ref (VARCHAR 255) - Encrypted token for anonymity
faculty_id (INT) - FK to faculty
rating (INT) - 1-5 numeric rating CHECK (rating >= 1 AND rating <= 5)
comment (TEXT) - User-provided comment
strengths (TEXT) - Open-ended strengths feedback
weaknesses (TEXT) - Open-ended weaknesses feedback
sentiment (ENUM) - 'positive', 'neutral', 'negative'
sentiment_score (DECIMAL 5,2) - Signed score (-1 to 1)
created_at (TIMESTAMP)
student_id_new (INT) - Reserved field
faculty_id_new (INT) - Reserved field

INDEXES:
- student_id (FK)
- faculty_id (FK)
```

#### 6. **evaluation_questions** - Question bank
```
id (INT PRIMARY KEY)
category (VARCHAR 100) - Grouping category
question_type (ENUM) - 'rating' or 'text'
category_description (TEXT) - Category explanation for students
question (TEXT) - The actual question
sort_order (INT) - Display order
is_active (TINYINT) - Whether question is in use
created_at (TIMESTAMP)
```

**Questions are organized into 4 categories**:
1. **A. Management of Teaching and Learning** (6 rating questions)
   - Punctuality, communication, time management, critical thinking
   - Independence & decision-making, constructive feedback

2. **B. Content Knowledge, Pedagogy and Technology** (5 rating questions)
   - Subject knowledge, simplification, real-world context
   - Active learning & ICT, appropriate assessment

3. **C. Commitment and Transparency** (4 rating questions)
   - Diversity recognition, academic support, feedback timing
   - Rating transparency

4. **Open-ended** (2 text questions)
   - Strengths of instructor
   - Weaknesses of instructor

#### 7. **evaluation_responses** - Individual question responses
```
id (INT PRIMARY KEY)
evaluation_id (INT) - FK to evaluations
question_id (INT) - FK to evaluation_questions
rating (INT) - 1-5 rating (for rating-type questions)
text_response (TEXT) - Text feedback (for text-type questions)

INDEXES:
- evaluation_id (FK)
- question_id (FK)
```

#### 8. **password_resets** - Password reset tokens
```
id (INT PRIMARY KEY)
email (VARCHAR 255)
token (VARCHAR 255) - Unique reset token
expires_at (DATETIME) - Token expiration time
created_at (TIMESTAMP)

INDEXES:
- token
- email
```

### Database Relationships
```
students.subject_id ──→ subjects.id
faculty.subject_id ──→ subjects.id
evaluations.student_id ──→ students.id
evaluations.faculty_id ──→ faculty.id
evaluation_responses.evaluation_id ──→ evaluations.id
evaluation_responses.question_id ──→ evaluation_questions.id
```

---

## Data Models

### User Model (Multi-table)
**File**: `backend/models/User.js`

Handles three user types with a unified interface:

**Key Methods**:
- `createAdmin()` - Create admin account
- `createFaculty()` - Create faculty account
- `createStudent()` - Create student account
- `create()` - Generic create based on role parameter
- `findByEmail()` - Search across all three tables
- `findById(id, role)` - Efficient lookup when role known
  - Returns role-specific fields (subject info for faculty/students)

**Special Handling**:
- Students require year_level, section, department, subject_id
- Faculty require department and optional subject_id
- Admins are simple name/email/password

### Faculty Model
**File**: `backend/models/Faculty.js`

**Key Methods**:
- `findAll()` - Get all faculty with subject info
- `findByDepartment(dept)` - Department-level filtering
- `findById(id)` - Single faculty with subject details
- `findByEmail(email)`
- `findBySubject(subject_id)` - Faculty teaching specific course
- `count()` - Total faculty count
- `update()` - Admin can modify faculty details

**Joins**:
- LEFT JOIN subjects table for subject_code, subject_name

### Student Model
**File**: `backend/models/Student.js`

**Key Methods**:
- `findAll()` - All students with enrollment info
- `findById(id)` - Individual student
- `findByEmail(email)`
- `findByDepartment(dept)`
- `findBySubject(subject_id)` - Students in specific course
- `count()`, `countByDepartment()`
- `getPopulationByDepartment()` - Enrollment statistics

**Population Statistics Query**:
Groups students by department and year level, includes evaluation counts

### Evaluation Model
**File**: `backend/models/Evaluation.js`

**Key Methods**:
- `create()` - Insert evaluation with sentiment data
- `findByFacultyId(faculty_id)` - All evaluations for a faculty member
  - COALESCE logic: uses stored strengths/weaknesses or fetches from responses
  - Includes sentiment breakdown
- `findByStudentId(student_id)` - Evaluations submitted by a student
  - Joins faculty info (name, department)
- `findAll()` - System-wide evaluations (admin)
- `count()` - Total evaluation count
- `getSentimentOverview()` - Aggregated sentiment counts
- `getAverageRating()` - Faculty average rating (1-5)
- `getStatsByDepartment()` - Department-level analytics

**Query Features**:
- Sentiment aggregation (positive/neutral/negative counts)
- Rating statistics (averages, totals)
- Department grouping
- Anonymous respondent reference included

### Evaluation Questions Model
**File**: `backend/models/EvaluationQuestion.js`

**Key Methods**:
- `findAll()` - All questions including inactive
- `findAllActive()` - Questions marked as active
- `findByCategory(category)` - Questions in specific category
- `create()` - Add new question (admin)
- `update()` - Modify question
- `toggleActive()` - Enable/disable question
- `updateSortOrder()` - Reorder questions

### Evaluation Responses Model
**File**: `backend/models/EvaluationResponse.js`

**Key Methods**:
- `create()` - Insert individual response
- `findByEvaluationId()` - All responses for an evaluation
- `createMultiple()` - Batch insert (for form submission)
- `findByQuestionId()` - All responses to a specific question

---

## API Endpoints

### Authentication Endpoints
**Base**: `/api/auth`

```
POST   /register
  - Create account (faculty or student)
  - Required: name, email, password, confirmPassword, role
  - Student-specific: year_level, section, department, subject_id
  - Sends verification email
  - Response: 201 Created with message
  
POST   /login
  - Authenticate user and get JWT token
  - Required: email, password
  - Response: 200 OK with token and user object
  
GET    /verify-email/:token
  - Verify email using token from email link
  - Response: 200 OK or 400 Bad Request
  
POST   /forgot-password
  - Request password reset
  - Required: email
  - Sends reset email with token
  - Response: 200 OK
  
POST   /reset-password
  - Reset password with token
  - Required: token, password, confirmPassword
  - Response: 200 OK
  
GET    /me
  - Get current authenticated user profile
  - Auth: Required (Bearer token)
  - Response: User object with role-specific fields
  
POST   /change-password
  - Change password for authenticated user
  - Auth: Required
  - Required: oldPassword, newPassword, confirmNewPassword
  - Response: 200 OK
```

### Evaluation Endpoints
**Base**: `/api/evaluation`

```
GET    /questions
  - Get all evaluation questions grouped by category
  - Auth: Required
  - Query params: None
  - Response: 200 OK
    {
      questions: [...],
      grouped: {
        "A. Management of Teaching and Learning": {
          description: "...",
          questions: [...]
        },
        ...
      }
    }
  
POST   /submit
  - Submit completed evaluation form
  - Auth: Required (student)
  - Authorization: student role only
  - Body: {
      faculty_id: number,
      responses: [
        { question_id, rating },
        { question_id, rating },
        ...
      ],
      strengths: "...",
      weaknesses: "..."
    }
  - Processing:
    * Sanitizes text input
    * Checks for spam (repeated characters/words)
    * Analyzes sentiment of strengths/weaknesses
    * Calculates overall rating average
    * Encrypts student identity
    * Stores evaluation record
  - Response: 200 OK with evaluation details
  
GET    /faculty/:id
  - Get all evaluations for a specific faculty member
  - Auth: Required
  - Authorization: Any authenticated user
  - Response: 200 OK with array of evaluations
  
GET    /my-evaluations
  - Get evaluations submitted by current student
  - Auth: Required (student)
  - Authorization: student role only
  - Response: 200 OK with array of student's evaluations
  
GET    /enrolled-instructors
  - Get list of faculty teaching courses for enrolled student
  - Auth: Required (student)
  - Authorization: student role only
  - Response: 200 OK
    {
      instructors: [
        {
          id, name, department, subject,
          evaluated: boolean
        },
        ...
      ]
    }
  
GET    /my-report
  - Get evaluation report for current faculty member
  - Auth: Required (faculty)
  - Authorization: faculty role only
  - Response: 200 OK with full report
  
GET    /analysis
  - Get system-wide analytics (admin dashboard)
  - Auth: Required (admin)
  - Authorization: admin role only
  - Response: 200 OK with aggregated statistics
  
DELETE /clear-all
  - Clear all evaluations from system (admin only)
  - Auth: Required (admin)
  - Authorization: admin role only
  - Response: 200 OK
```

### Dashboard Endpoints
**Base**: `/api/dashboard`

```
GET    /stats
  - Get role-specific dashboard statistics
  - Auth: Required
  - Authorization: Any authenticated user
  - Returns different data based on role:
  
  Student Response:
    {
      role: "student",
      totalSubmitted: number,
      totalFaculty: number,
      averageGiven: decimal,
      sentimentOverview: { positive, neutral, negative },
      recentEvaluations: [...]
    }
  
  Admin Response:
    {
      role: "admin",
      totalStudents: number,
      totalFaculty: number,
      totalEvaluations: number,
      sentimentOverview: { positive, neutral, negative },
      departments: [
        {
          name, facultyCount, totalEvaluations, avgRating,
          sentiment: { positive, neutral, negative },
          totalStudents, evaluatedStudents,
          yearLevels: [...]
        },
        ...
      ]
    }
  
GET    /faculty
  - Get faculty member's own dashboard
  - Auth: Required (faculty)
  - Authorization: faculty role only
  - Response: {
      overallRating: decimal,
      totalEvaluations: number,
      sentimentOverview: { positive, neutral, negative },
      subjects: [...]
    }
```

### Faculty Endpoints
**Base**: `/api/faculty`

```
GET    /
  - Get all faculty members
  - Auth: Required
  - Query params: ?department=xxx (optional filter)
  - Response: 200 OK with faculty array
  
GET    /:id
  - Get specific faculty member details
  - Auth: Required
  - Response: 200 OK with faculty object
  
POST   /
  - Create new faculty member (alternative to registration)
  - Auth: Required (admin)
  - Authorization: admin role only
  - Body: { name, email, password, department, subject_id }
  - Response: 201 Created
  
PUT    /:id
  - Update faculty details
  - Auth: Required (admin)
  - Authorization: admin role only
  - Body: { name, department, subject_id }
  - Response: 200 OK
  
DELETE /:id
  - Delete faculty member
  - Auth: Required (admin)
  - Authorization: admin role only
  - Response: 200 OK
```

### Subject Endpoints
**Base**: `/api/subjects`

```
GET    /
  - Get all subjects/courses
  - Auth: Required
  - Response: 200 OK with subjects array
  
GET    /:id
  - Get specific subject details
  - Auth: Required
  - Response: 200 OK with subject object
  
POST   /
  - Create new subject
  - Auth: Required (admin)
  - Authorization: admin role only
  - Body: { code, name, department }
  - Response: 201 Created
```

### Health Check
```
GET    /api/health
  - Health check endpoint (no auth)
  - Response: 200 OK { status: 'OK', message: '...' }
```

---

## Role-Based Workflows

### Admin Workflow

**Responsibilities**:
- System administration and user management
- Viewing system-wide analytics and reports
- Managing faculty and subjects
- Viewing all evaluations submitted in the system

**Key Capabilities**:
1. **Dashboard Access**
   - System statistics: total students, faculty, evaluations
   - Department-level analytics
   - Sentiment distribution across all evaluations
   - Population statistics by department and year level

2. **Faculty Management**
   - View all faculty members
   - Create faculty accounts (alternative to self-registration)
   - Update faculty details (name, department, subject assignment)
   - Delete faculty records

3. **Evaluation Management**
   - View all evaluations in the system
   - Access system analysis endpoint
   - View evaluation report for any faculty member
   - Clear all evaluations (data management)

4. **Subject Management**
   - View all subjects/courses
   - Create new subjects
   - Update subject information

**Access Control**:
- Cannot view personal student evaluations
- Can only access through admin-protected endpoints
- JWT role-based authorization enforced

### Faculty Workflow

**Responsibilities**:
- View evaluations submitted by students
- Analyze feedback for performance improvement
- Track teaching effectiveness metrics

**Key Capabilities**:
1. **Profile Management**
   - View own profile information
   - Change password
   - Email verification

2. **Dashboard Access**
   - View own evaluations
   - See average rating and sentiment overview
   - Track evaluation count
   - View student enrollment for their subject

3. **Evaluation Viewing**
   - Access own evaluation report
   - See detailed feedback breakdown by category
   - View sentiment analysis of comments
   - See strengths and weaknesses extracted from open-ended responses
   - View ratings distribution
   - Get AI-generated recommendations based on feedback

4. **Reports**
   - Formatted report showing all evaluation data
   - Aggregated statistics
   - Trend analysis across evaluations
   - Category-wise performance breakdown

**Access Control**:
- Can only view own evaluations
- Cannot view other faculty evaluations
- Cannot access admin functions
- Cannot submit evaluations

### Student Workflow

**Responsibilities**:
- Submit course evaluations for enrolled faculty
- Provide feedback on teaching performance

**Key Capabilities**:
1. **Profile Management**
   - View profile with enrollment info
   - Change password
   - Email verification

2. **Dashboard Access**
   - View list of enrolled instructors (from subject_id)
   - See which instructors have been evaluated
   - Track total evaluations submitted
   - View average rating given

3. **Evaluation Submission**
   - Access evaluation form for each enrolled faculty
   - Rate faculty on 15 questions (1-5 scale)
   - Provide open-ended feedback (strengths/weaknesses)
   - Submit anonymously (identity encrypted)
   - View submitted evaluations

4. **Anonymous Submission**
   - Student identity stored separately from feedback
   - Metadata encrypted using AES-256-GCM
   - Sentiment analysis receives only text content
   - Faculty receives feedback without knowing student identity

**Access Control**:
- Can only view enrolled instructors
- Can only submit one evaluation per faculty (system checks)
- Can only view own submitted evaluations
- Cannot access faculty or admin sections

---

## User Flows by Role

### Student: Evaluation Submission Flow

```
1. LOGIN
   │
   ├─ Student enters email (@psu.edu.ph) + password
   ├─ Backend verifies credentials & checks email_verified
   ├─ JWT token generated with role: 'student'
   └─ Token stored in localStorage
   
2. NAVIGATE TO DASHBOARD
   │
   ├─ Dashboard page fetches /api/evaluation/enrolled-instructors
   ├─ Backend queries: students enrolled in student's subject
   ├─ For each faculty member, checks if evaluated:
   │  └─ Joins with evaluations table where student_id matches
   ├─ Returns list with { id, name, department, subject, evaluated: bool }
   └─ UI displays "Pending" vs "Completed" evaluations
   
3. SELECT FACULTY TO EVALUATE
   │
   ├─ Student clicks "Evaluate" on pending instructor
   ├─ Navigates to /evaluation?faculty=<id>
   └─ EvaluationForm page loads
   
4. LOAD EVALUATION FORM
   │
   ├─ Frontend calls /api/evaluation/questions
   ├─ Backend returns all active questions grouped by category
   ├─ Questions organized by:
   │  ├─ A. Management of Teaching & Learning (6 questions)
   │  ├─ B. Content Knowledge & Pedagogy (5 questions)
   │  ├─ C. Commitment & Transparency (4 questions)
   │  └─ Open-ended (2 questions for strengths/weaknesses)
   └─ Form rendered with:
       ├─ Category descriptions
       ├─ Rating dropdowns (1-5 scale)
       ├─ Text input fields
       └─ Submit button
   
5. FILL OUT FORM
   │
   ├─ Student selects ratings for each question
   ├─ Provides text feedback in open-ended fields
   ├─ Frontend validates:
   │  ├─ All rating questions have 1-5 values
   │  └─ At least one rating is provided
   └─ Can preview overall rating before submit
   
6. SUBMIT EVALUATION
   │
   ├─ Frontend collects:
   │  ├─ faculty_id
   │  ├─ array of responses: [{ question_id, rating }, ...]
   │  ├─ strengths text
   │  └─ weaknesses text
   │
   ├─ Frontend POST /api/evaluation/submit
   │
   ├─ Backend processes:
   │  ├─ Sanitizes text (removes HTML, limits length to 1000 chars)
   │  ├─ Validates spam (repeated chars/words patterns)
   │  ├─ Validates all ratings are 1-5
   │  ├─ Calculates overall rating: avg of all ratings
   │  ├─ Analyzes sentiment:
   │  │  ├─ Runs strengths text through Naive Bayes classifier
   │  │  ├─ Runs weaknesses text through classifier
   │  │  ├─ Combines probabilities with confidence weighting
   │  │  └─ Assigns: positive (≥0.15), negative (≤-0.15), neutral (else)
   │  ├─ Generates anonymous_student_ref:
   │  │  ├─ Encrypts metadata: { sid: student_id, ts: timestamp }
   │  │  ├─ Uses AES-256-GCM encryption
   │  │  └─ Stores only anonymous reference (v1.iv.tag.data format)
   │  │
   │  ├─ Creates evaluation record with:
   │  │  ├─ student_id
   │  │  ├─ faculty_id
   │  │  ├─ rating (calculated average)
   │  │  ├─ sentiment
   │  │  ├─ sentiment_score (signed -1 to 1)
   │  │  ├─ anonymous_student_ref
   │  │  ├─ strengths (sanitized text)
   │  │  └─ weaknesses (sanitized text)
   │  │
   │  ├─ Creates individual response records:
   │  │  ├─ For each rating question: evaluation_id, question_id, rating
   │  │  └─ For each text question: evaluation_id, question_id, text_response
   │  │
   │  └─ Returns: 200 OK with evaluation details
   │
   ├─ Frontend displays confirmation modal:
   │  ├─ Shows overall rating
   │  ├─ Shows sentiment badge
   │  └─ Option to evaluate another faculty or go back
   │
   └─ Evaluation marked as "Completed" on dashboard
   
7. FOLLOW-UP ACTIONS
   └─ Student can:
      ├─ Evaluate another pending instructor
      ├─ View all their submitted evaluations
      └─ Logout
```

### Faculty: View Evaluation Report Flow

```
1. LOGIN
   │
   ├─ Faculty enters email (@psu.edu.ph) + password
   ├─ Backend verifies credentials
   ├─ JWT token generated with role: 'faculty'
   └─ Token stored in localStorage
   
2. NAVIGATE TO DASHBOARD
   │
   ├─ Dashboard page fetches /api/dashboard/faculty
   ├─ Backend queries:
   │  ├─ Faculty record by ID
   │  ├─ All evaluations for this faculty_id
   │  ├─ Average rating calculation
   │  ├─ Student enrollment count for faculty's subject
   │  └─ Evaluated student count
   │
   ├─ Returns dashboard with:
   │  ├─ Overall rating (e.g., 4.2/5)
   │  ├─ Total evaluations count
   │  ├─ Sentiment overview: { positive: X, neutral: Y, negative: Z }
   │  └─ Enrollment stats (50 total students, 10 evaluated)
   │
   └─ Dashboard displays summary cards
   
3. VIEW FULL EVALUATION REPORT
   │
   ├─ Faculty clicks on Reports or Views Report button
   ├─ Navigates to /reports (self mode, no ID param)
   │
   ├─ FacultyReport page fetches:
   │  └─ GET /api/evaluation/my-report
   │
   ├─ Backend query (self mode):
   │  ├─ Fetches all evaluations for faculty_id
   │  ├─ Groups by category using evaluation_questions data
   │  ├─ Calculates statistics:
   │  │  ├─ Average rating per question
   │  │  ├─ Rating distribution (1-5 counts)
   │  │  ├─ Overall average
   │  │  └─ Sentiment distribution
   │  │
   │  ├─ Generates recommendations based on:
   │  │  ├─ Overall rating vs 3.0 baseline
   │  │  ├─ Sentiment distribution
   │  │  ├─ Comments containing key phrases
   │  │  ├─ Categories with lowest ratings
   │  │  └─ AI-generated suggestions for improvement
   │  │
   │  └─ Returns comprehensive report object
   │
   ├─ Report rendered with sections:
   │  ├─ Faculty info card
   │  ├─ Overall metrics (rating, evaluations, sentiment)
   │  ├─ Category breakdown:
   │  │  ├─ Category name & description
   │  │  ├─ Average rating for category
   │  │  ├─ Individual question ratings with heatmap
   │  │  └─ Feedback highlights
   │  │
   │  ├─ Sentiment analysis:
   │  │  ├─ Pie/bar chart of sentiment distribution
   │  │  ├─ Confidence scores
   │  │  └─ Trending (if multiple evaluation periods)
   │  │
   │  ├─ Feedback & Recommendations:
   │  │  ├─ Extracted strengths summary
   │  │  ├─ Extracted weaknesses summary
   │  │  ├─ AI-generated actionable recommendations
   │  │  └─ Best practices for improvement
   │  │
   │  └─ Export option (PDF/CSV)
   │
   └─ Faculty can review all details anonymously
   
4. ANALYZE FEEDBACK
   │
   ├─ Faculty reviews quantitative ratings
   ├─ Analyzes category performance
   ├─ Reads synthesized comments (anonymized)
   ├─ Reviews recommendations
   └─ Plans improvement actions
```

### Admin: System Analytics Flow

```
1. LOGIN
   │
   ├─ Admin enters credentials
   ├─ JWT token generated with role: 'admin'
   └─ Token stored in localStorage
   
2. NAVIGATE TO DASHBOARD
   │
   ├─ Dashboard page fetches /api/dashboard/stats
   ├─ Backend processes:
   │  ├─ Total student count
   │  ├─ Total faculty count
   │  ├─ Total evaluation count
   │  ├─ System-wide sentiment overview
   │  │
   │  ├─ Department statistics loop:
   │  │  ├─ For each unique department:
   │  │  │  ├─ Count faculty in department
   │  │  │  ├─ Count evaluations by department
   │  │  │  ├─ Calculate average rating
   │  │  │  ├─ Count sentiments (positive/neutral/negative)
   │  │  │  ├─ Get enrolled students by year level
   │  │  │  ├─ Count evaluated students
   │  │  │  └─ Determine evaluation completion percentage
   │  │  └─ Return department object with above stats
   │  │
   │  └─ Sort departments alphabetically
   │
   ├─ Dashboard displays:
   │  ├─ Key metrics (total students, faculty, evaluations)
   │  ├─ System-wide sentiment distribution chart
   │  │
   │  ├─ Department breakdown table:
   │  │  ├─ Department name
   │  │  ├─ Faculty count
   │  │  ├─ Total evaluations
   │  │  ├─ Average rating
   │  │  ├─ Sentiment breakdown (positive/neutral/negative bars)
   │  │  ├─ Student population vs evaluated count
   │  │  ├─ Completion percentage
   │  │  └─ Year-level breakdown (if expanded)
   │  │
   │  └─ Filterable/sortable department table
   │
   └─ Admin can drill down by department
   
3. VIEW ALL EVALUATIONS (System Analysis)
   │
   ├─ Admin navigates to Reports section
   ├─ Fetches GET /api/evaluation/analysis
   │
   ├─ Backend returns:
   │  ├─ All evaluation records with:
   │  │  ├─ Faculty name & department
   │  │  ├─ Overall rating
   │  │  ├─ Sentiment label & score
   │  │  ├─ Extracted strengths/weaknesses
   │  │  ├─ Submission timestamp
   │  │  └─ Anonymous student reference
   │  │
   │  └─ Optional: aggregate statistics
   │
   ├─ Reports page displays:
   │  ├─ Comprehensive evaluation listing
   │  ├─ Filters: department, sentiment, date range
   │  ├─ Search: faculty name, keywords in feedback
   │  ├─ Export to CSV/PDF for further analysis
   │  └─ Identify trends and outliers
   │
   └─ Admin can perform analysis
   
4. VIEW SPECIFIC FACULTY REPORT (Admin Mode)
   │
   ├─ Admin navigates to Faculty List or search
   ├─ Clicks on a specific faculty member
   ├─ Navigates to /reports/:id (admin mode, with ID)
   │
   ├─ FacultyReport page loads with faculty ID
   ├─ Fetches:
   │  ├─ GET /api/faculty/:id (get faculty details)
   │  └─ GET /api/evaluation/faculty/:id (get evaluations)
   │
   ├─ Backend returns:
   │  ├─ Full faculty information
   │  ├─ All evaluations for that faculty
   │  ├─ Aggregated statistics
   │  └─ Grouped feedback
   │
   ├─ Report rendered with:
   │  ├─ Faculty profile
   │  ├─ Complete evaluation metrics
   │  ├─ Category breakdown
   │  ├─ Sentiment analysis
   │  └─ Feedback synthesis
   │
   └─ Admin can compare faculty or generate recommendations
   
5. MANAGE FACULTY (Admin Operations)
   │
   ├─ Navigate to Faculty Management section
   ├─ Fetch GET /api/faculty (all faculty)
   │
   ├─ Display faculty list with actions:
   │  ├─ Create new faculty
   │  ├─ Edit faculty details
   │  ├─ Delete faculty records
   │  └─ View evaluation reports
   │
   ├─ Create Faculty: POST /api/faculty
   ├─ Update Faculty: PUT /api/faculty/:id
   ├─ Delete Faculty: DELETE /api/faculty/:id
   │
   └─ All operations require admin authorization
```

---

## Component Interactions

### Frontend Component Flow

```
App.jsx (Root)
│
├─ AuthProvider (Context)
│  ├─ user state
│  ├─ token state
│  ├─ login/logout functions
│  └─ useEffect: verify token on mount
│
├─ Router (React Router v7)
│  │
│  ├─ Public Routes (no auth required)
│  │  ├─ /login → Login.jsx
│  │  ├─ /forgot-password → ForgotPassword.jsx
│  │  └─ /reset-password/:token → ResetPassword.jsx
│  │
│  └─ Protected Routes (ProtectedRoute wrapper)
│     │
│     ├─ Layout.jsx (Main shell)
│     │  ├─ Navbar.jsx (Navigation with role-based menu)
│     │  └─ <Outlet> for nested routes
│     │
│     ├─ /dashboard → Dashboard.jsx
│     │  ├─ If student: StudentDashboard component
│     │  └─ If admin: AdminDashboard component
│     │
│     ├─ /faculty → FacultyList.jsx
│     │  └─ Displays searchable/filterable faculty list
│     │
│     ├─ /evaluation → EvaluationForm.jsx (students only)
│     │  ├─ RatingScaleTable (info display)
│     │  ├─ CategorySection (per-category grouping)
│     │  ├─ QuestionRow (individual rating row)
│     │  ├─ OpenEndedSection (strengths/weaknesses)
│     │  └─ ConfirmationModal (success confirmation)
│     │
│     ├─ /reports → ReportsRouter
│     │  ├─ If faculty: FacultyReport.jsx (self mode)
│     │  └─ If admin: Reports.jsx (system analysis)
│     │
│     ├─ /reports/:id → FacultyReport.jsx (admin mode with ID)
│     │  ├─ SentimentBadge (visual indicator)
│     │  ├─ CategorySection (with statistics)
│     │  ├─ RecommendationCard (AI suggestions)
│     │  ├─ Charts (rating distributions, sentiment pie)
│     │  └─ Export button
│     │
│     ├─ /change-password → ChangePassword.jsx
│     │
│     └─ ProtectedRoute roles=['student'] wrapper
│        └─ /evaluation → EvaluationForm.jsx
│           └─ Prevents non-student access
```

### Backend Service Flow

```
Server (Express.js)
├─ Middleware Stack
│  ├─ CORS middleware (origin: CLIENT_URL)
│  ├─ express.json() (JSON parser)
│  ├─ express.urlencoded() (form parser)
│  └─ Static files (frontend build)
│
├─ Route Groups
│  │
│  ├─ /api/auth
│  │  ├─ authController.js
│  │  ├─ → User model (multi-table)
│  │  ├─ → email service (nodemailer)
│  │  ├─ → JWT generation
│  │  └─ → password hashing (bcryptjs)
│  │
│  ├─ /api/evaluation
│  │  ├─ authenticator middleware
│  │  ├─ authorize middleware (role check)
│  │  ├─ evaluationController.js
│  │  ├─ → Evaluation model
│  │  ├─ → EvaluationQuestion model
│  │  ├─ → EvaluationResponse model
│  │  ├─ → Faculty model
│  │  ├─ → sentiment analyzer (natural.js)
│  │  └─ → privacy utils (encryption)
│  │
│  ├─ /api/dashboard
│  │  ├─ authenticator middleware
│  │  ├─ dashboardController.js
│  │  ├─ → Student model (population stats)
│  │  ├─ → Faculty model (count/aggregation)
│  │  └─ → Evaluation model (analytics)
│  │
│  ├─ /api/faculty
│  │  ├─ authenticator middleware
│  │  ├─ authorize middleware (admin check)
│  │  ├─ facultyController.js
│  │  └─ → Faculty model (CRUD)
│  │
│  ├─ /api/subjects
│  │  ├─ authenticator middleware
│  │  ├─ authorize middleware (admin check)
│  │  ├─ subjectController.js
│  │  └─ → Subject model (CRUD)
│  │
│  └─ /api/health
│     └─ Simple health check (no auth)
│
├─ Error Handler (global)
│  └─ Catches all unhandled errors
│
└─ Database Connection Pool
   ├─ mysql2/promise
   ├─ Pool limit: 10 connections
   └─ Queries: prepared statements
```

### Data Flow: Evaluation Submission

```
Frontend (EvaluationForm.jsx)
     ↓
User fills form and clicks Submit
     ↓
Validate client-side (all ratings provided)
     ↓
Collect data:
├─ faculty_id
├─ responses: [{ question_id, rating }]
├─ strengths text
└─ weaknesses text
     ↓
POST /api/evaluation/submit (with JWT token)
     ↓
Backend (evaluationController.js)
     ↓
1. Authenticate (check JWT, get student_id)
     ↓
2. Authorize (check role === 'student')
     ↓
3. Validate input:
   ├─ faculty_id exists
   ├─ responses array not empty
   ├─ All ratings 1-5
   └─ Faculty record exists
     ↓
4. Sanitize text:
   ├─ Strip HTML tags
   ├─ Remove XSS patterns
   └─ Limit to 1000 chars
     ↓
5. Check for spam patterns
     ↓
6. Sentiment Analysis (sentimentAnalyzer.js)
   ├─ Tokenize text (natural.js WordTokenizer)
   ├─ Porter stemming (natural.js)
   ├─ Build bigrams (word pairs)
   ├─ Classify with trained Naive Bayes
   ├─ Return: { label, confidence, score }
   └─ Combine strengths + weaknesses
     ↓
7. Anonymize student identity (privacy.js)
   ├─ Encrypt: { sid: student_id, ts: timestamp }
   ├─ AES-256-GCM encryption
   ├─ Format: v1.iv.tag.data (base64url)
   └─ Store as anonymous_student_ref
     ↓
8. Database transactions:
   ├─ INSERT evaluation
   │  ├─ student_id (actual ID)
   │  ├─ anonymous_student_ref (encrypted)
   │  ├─ faculty_id
   │  ├─ rating (calculated average)
   │  ├─ comment
   │  ├─ strengths
   │  ├─ weaknesses
   │  ├─ sentiment (label)
   │  └─ sentiment_score (signed decimal)
   │
   ├─ INSERT evaluation_responses (batch)
   │  ├─ For each response: evaluation_id, question_id, rating/text
   │  └─ Multiple rows per evaluation
   │
   └─ COMMIT transaction
     ↓
Response to Frontend:
├─ 200 OK
├─ Evaluation details (ID, timestamp, sentiment)
└─ Confirmation data
     ↓
Frontend Display:
├─ Success modal
├─ Show overall rating
├─ Show sentiment badge
├─ Offer next evaluation or return
└─ Mark as completed on dashboard
```

### Data Flow: Faculty Report Generation

```
Frontend (FacultyReport.jsx - Self Mode)
     ↓
GET /api/evaluation/my-report (with JWT token)
     ↓
Backend (evaluationController.js::getMyFacultyReport)
     ↓
1. Authenticate & get faculty_id from token
     ↓
2. Query all evaluations for faculty:
   SELECT e.* FROM evaluations e
   WHERE e.faculty_id = ?
   ORDER BY e.created_at DESC
     ↓
3. For each evaluation, fetch responses:
   SELECT er.* FROM evaluation_responses er
   JOIN evaluation_questions eq ON er.question_id = eq.id
   WHERE er.evaluation_id = ?
     ↓
4. Group responses by category:
   ├─ A. Management of Teaching & Learning
   ├─ B. Content Knowledge & Pedagogy
   ├─ C. Commitment & Transparency
   └─ Open-ended (strengths/weaknesses)
     ↓
5. Calculate statistics per category:
   ├─ Average rating for category
   ├─ Rating distribution (1, 2, 3, 4, 5 counts)
   ├─ Highest & lowest rated questions
   └─ Variance/standard deviation
     ↓
6. Generate recommendations (sentimentAnalyzer.js)
   ├─ Analyze overall rating vs baseline (3.0)
   ├─ Review sentiment distribution
   ├─ Parse feedback for key phrases
   ├─ Identify pattern in low-rated categories
   ├─ Generate 3-5 actionable recommendations
   └─ Format with urgency level
     ↓
7. Sentiment summary:
   ├─ Count: positive, neutral, negative evaluations
   ├─ Trending (if multiple periods available)
   ├─ Confidence distribution
   └─ Confidence averages per sentiment
     ↓
8. Build response object:
   {
     faculty: { id, name, department, subject },
     overallRating: decimal,
     totalEvaluations: count,
     categoryBreakdown: [
       {
         category: "A. Management...",
         avgRating: 4.2,
         questions: [
           {
             question_text: "Comes to class...",
             avgRating: 4.2,
             distribution: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }
           }
         ]
       }
     ],
     sentimentOverview: { positive: 6, neutral: 2, negative: 2 },
     recommendations: [
       { priority: "high", suggestion: "..." }
     ]
   }
     ↓
Response to Frontend (200 OK)
     ↓
Frontend Rendering:
├─ Faculty info card
├─ Overall metrics section
├─ Category breakdown with heatmap
├─ Question ratings with bars
├─ Sentiment distribution chart
├─ Strengths/weaknesses summary
├─ AI recommendations
└─ Export functionality
```

---

## Data Processing & Analysis

### Sentiment Analysis System

**File**: `backend/utils/sentimentAnalyzer.js`

**Approach**: Supervised Machine Learning (Naive Bayes Classifier)

**Training**:
- Uses `trainingData.js` - pre-labeled sentiment examples
- Train data contains both positive and negative examples
- Classifier trained on module load (console logs training count)

**Tokenization Strategy** (for accuracy):
```
Text Input → WordTokenizer
    ↓
Lowercase & Tokenize into words
    ↓
Porter Stemmer (reduce to root word)
    ↓
Build bigrams (consecutive word pairs)
    ↓
Return: [unigrams] + [bigrams]
    ↓
Example: "not helpful"
Output: ["not", "help", "not_help"]
    ↓
Bigrams help catch negation patterns:
├─ "not clear", "not helpful", "not good"
└─ These become single tokens for better classification
```

**Classification Process**:
1. Input: text string (strengths or weaknesses feedback)
2. Tokenize & stem using custom strategy above
3. Use Naive Bayes classifier trained on labeled data
4. Get classification: "positive", "neutral", or "negative"
5. Calculate probabilities for each class

**Combining Multiple Inputs**:
When evaluation has both strengths and weaknesses:
```
Sentiment(strengths) → { label, confidence }
Sentiment(weaknesses) → { label, confidence }
     ↓
Convert labels to signed probabilities:
├─ positive → +confidence
├─ negative → -confidence
└─ neutral → 0
     ↓
Combine: sum probabilities
     ↓
Threshold-based final classification:
├─ If combined_score ≥ 0.15 → "positive"
├─ If combined_score ≤ -0.15 → "negative"
└─ Else → "neutral"
```

**Output Format** (stored in evaluations table):
```
sentiment: ENUM ('positive', 'neutral', 'negative')
sentiment_score: DECIMAL(5,2) - signed score -1 to 1
```

### Category System

**File**: `database/faculty_evaluation_db.sql`

**Question Categories** (based on PSU evaluation form):

```
1. Management of Teaching and Learning
   └─ Questions 1-6
   ├─ Punctuality
   ├─ Communication of expectations
   ├─ Time management
   ├─ Critical thinking activities
   ├─ Independence & decision-making
   └─ Constructive feedback

2. Content Knowledge, Pedagogy and Technology
   └─ Questions 7-11
   ├─ Subject knowledge breadth
   ├─ Simplification of concepts
   ├─ Real-world context connection
   ├─ Active learning with ICT
   └─ Assessment alignment

3. Commitment and Transparency
   └─ Questions 12-15
   ├─ Diversity recognition
   ├─ Academic support availability
   ├─ Feedback timeliness
   └─ Grading transparency

4. Open-ended
   └─ Questions 16-17
   ├─ Strengths (text input)
   └─ Weaknesses (text input)
```

### Recommendation Generation

**File**: `backend/utils/sentimentAnalyzer.js::generateRecommendations`

**Inputs**:
- Faculty ID
- Overall rating (1-5)
- Category breakdown
- Sentiment distribution
- Feedback text

**Algorithm**:
```
1. Compare overall rating to baseline (3.0):
   ├─ If rating ≥ 4.5: "Excellent performer"
   ├─ If rating 3.5-4.5: "Good performance with room for growth"
   ├─ If rating 2.5-3.5: "Moderate performance, needs improvement"
   └─ If rating < 2.5: "Critical issues require attention"

2. Analyze category performance:
   ├─ Identify lowest-rated category
   ├─ Identify highest-rated category
   ├─ Calculate variance (consistency)
   └─ Flag inconsistencies

3. Sentiment distribution analysis:
   ├─ If negative % > 30%: "Address key concerns"
   ├─ If neutral % > 60%: "Clarify expectations and methods"
   └─ If positive % > 70%: "Maintain strengths"

4. Keyword extraction from feedback:
   ├─ Search for key phrases in comments
   ├─ Categorize into themes
   └─ Prioritize by frequency

5. Generate recommendations:
   ├─ Maximum 5 actionable items
   ├─ Prioritize by:
   │  ├─ Impact on overall performance
   │  ├─ Frequency in feedback
   │  └─ Importance to students
   └─ Format with priority level (high/medium/low)

Example recommendations:
├─ HIGH: "Improve punctuality - mentioned in 8 evaluations"
├─ HIGH: "Provide clearer grading criteria"
├─ MEDIUM: "Incorporate more real-world examples"
├─ MEDIUM: "Increase use of interactive activities"
└─ LOW: "Consider office hours during different times"
```

### Privacy & Anonymization

**File**: `backend/utils/privacy.js`

**Encryption Process**:
```
Metadata { studentId, timestamp } 
     ↓
JSON stringify
     ↓
AES-256-GCM Encryption:
├─ Key: SHA-256 hash of JWT_SECRET (32 bytes)
├─ IV: Random 12 bytes (nonce)
├─ Algorithm: AES-256-GCM
└─ Auth tag: Generated by GCM mode
     ↓
Concatenate versioned payload:
├─ Version: "v1"
├─ IV: base64url encoded
├─ Auth tag: base64url encoded
├─ Encrypted data: base64url encoded
└─ Format: "v1.{iv}.{tag}.{encrypted}" (max 255 chars)
```

**Why This Approach**:
- **Authenticated Encryption**: GCM mode provides both confidentiality and authenticity
- **No plain student IDs in evaluations table**: Only encrypted reference stored
- **Anonymous to faculty**: Faculty receives feedback without knowing student identity
- **Traceable if needed**: Admin can decrypt to identify student if required
- **Scalable**: Same encryption key for all evaluations

**Data Isolation**:
```
What sentiment analyzer receives:
├─ Strengths text
├─ Weaknesses text
└─ NO: student ID, name, email, or identity

Result:
- Sentiment analysis is objective (no bias based on identity)
- Recommendations based purely on feedback quality
- No personal factors influence analysis
```

---

## Security & Privacy Features

### Authentication & Authorization

1. **JWT Token-Based**:
   - Issued on login with expiry (configurable)
   - Bearer token in Authorization header
   - Verified on every protected request
   - Decoded to extract: id, email, role

2. **Role-Based Access Control (RBAC)**:
   ```
   /api/auth/login
   ├─ Public (no auth required)
   └─ Returns token + user object with role
   
   /api/evaluation/submit
   ├─ Requires: authenticate + authorize('student')
   └─ Prevents non-students from submitting
   
   /api/dashboard/stats
   ├─ Requires: authenticate
   ├─ Returns different data based on user.role
   └─ Admin sees system-wide, student sees personal
   
   /api/faculty
   ├─ GET: authenticate only
   ├─ POST/PUT/DELETE: authenticate + authorize('admin')
   └─ Only admins can modify faculty
   ```

3. **Email Verification**:
   - Account registration sends verification email
   - Token must be clicked before login allowed
   - Prevents fake/invalid email registrations
   - Verification status: email_verified flag in DB

### Password Security

1. **Hashing**: bcryptjs with salt rounds: 10
   - One-way hashing (cannot reverse)
   - Salted hashes prevent rainbow table attacks
   - Cost-based iterations for future-proofing

2. **Password Requirements**:
   - Minimum 6 characters
   - Enforced at registration and password reset
   - Can be enhanced with complexity requirements

3. **Password Reset**:
   - Token-based flow (not direct password assignment)
   - Token expires after set time (configurable)
   - One-time use tokens
   - Email verification required

### Data Privacy

1. **Anonymous Evaluations**:
   - Student identity encrypted before storage
   - Faculty never sees student identity
   - Admin can decrypt if needed for investigation

2. **Accessible Data**:
   - Faculty sees: ratings, feedback text (anonymously)
   - Faculty does NOT see: student names, emails, IDs
   - Admin sees: all data including encrypted student refs
   - Student sees: only their own submissions

3. **Email Domain Restriction**:
   - Only @psu.edu.ph email addresses allowed
   - Prevents outside actors from registering
   - Can be expanded to other domains if needed

4. **Input Sanitization**:
   - HTML tags stripped from text inputs
   - JavaScript patterns removed
   - Length limits enforced (1000 chars max)
   - Spam detection for repetitive content

### Database Security

1. **Connection Pool**:
   - Limited connections (10 max)
   - Prevents connection exhaustion attacks

2. **Prepared Statements**:
   - All queries use parameterized statements
   - Prevents SQL injection attacks
   - Values passed separately from query

3. **Transaction Support**:
   - Critical operations (evaluation submission) use transactions
   - All-or-nothing consistency for related records
   - Rollback on any error

### API Security

1. **CORS Configuration**:
   - Whitelist origin: CLIENT_URL environment variable
   - Credentials: true (allows cookies/auth headers)
   - Prevents cross-origin attacks

2. **Rate Limiting**: (Not yet implemented, recommended)
   - Limit login attempts
   - Prevent brute force attacks
   - Limit API calls per user

3. **HTTPS**: (In production)
   - All communication encrypted in transit
   - Tokens sent over encrypted connection
   - Environment: production vs development config

### Environment Variables (Sensitive Data)

```
.env file should contain:
├─ DB_HOST - database host
├─ DB_PORT - database port
├─ DB_USER - database user
├─ DB_PASSWORD - database password
├─ DB_NAME - database name
├─ JWT_SECRET - secret key for JWT signing
├─ JWT_EXPIRES_IN - token expiry time
├─ NODE_ENV - production/development
├─ CLIENT_URL - frontend URL for CORS
├─ EMAIL_USER - email service account
├─ EMAIL_PASSWORD - email service password
├─ EMAIL_SERVICE - email service provider
├─ PRIVACY_ENCRYPTION_KEY - encryption key (optional, uses JWT_SECRET if not set)
└─ PORT - server port (default: 5000)
```

**Never committed to version control** - .env in .gitignore

---

## System Integration Points

### Frontend ↔ Backend Communication

1. **Axios HTTP Client**:
   - Base URL: `/api`
   - Automatic JWT token attachment to all requests
   - Global error handling (401 redirects to login)

2. **Request/Response Pattern**:
   ```
   Frontend Request:
   POST /api/evaluation/submit
   Header: Authorization: Bearer {token}
   Body: { faculty_id, responses, strengths, weaknesses }
   
   Backend Response:
   Status: 200 OK or 4xx/5xx error
   Body: JSON { message, data }
   
   Frontend handles:
   ├─ Success: update UI state, show confirmation
   ├─ 401: redirect to login
   ├─ 403: show permission denied message
   ├─ 400/422: show validation errors
   └─ 500: show server error message
   ```

3. **State Management**:
   - AuthContext for user/token (global)
   - Component-level useState for page data
   - localStorage for persistence (token, user object)

### Database ↔ Backend Communication

1. **Connection Pool**:
   - mysql2/promise library
   - Async/await pattern
   - Connection reuse

2. **Query Types**:
   - READ: SELECT queries (no state change)
   - WRITE: INSERT queries (state change)
   - UPDATE: UPDATE queries (modify existing)
   - DELETE: DELETE queries (remove data)
   - Transactions: Multiple queries atomically

3. **Error Handling**:
   - Try-catch blocks around queries
   - Proper error responses to frontend
   - Logging to console for debugging

### Email Service ↔ Backend

1. **Nodemailer Integration** (`config/email.js`):
   - SMTP configuration
   - Email templates for:
     - Verification email
     - Password reset email
   - Async send operations

2. **Email Operations**:
   ```
   Registration
   └─ Send verification email
      └─ User clicks link
         └─ GET /api/auth/verify-email/:token
            └─ Mark email_verified = 1
   
   Password Reset
   └─ User requests: POST /api/auth/forgot-password
      └─ Send email with reset link
         └─ User clicks: /reset-password/:token page
            └─ User submits new password
               └─ POST /api/auth/reset-password
                  └─ Update password hash
   ```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     COMPLETE SYSTEM FLOW                      │
└─────────────────────────────────────────────────────────────┘

STUDENT SUBMISSION PATH:
┌──────────────┐      ┌────────────────┐      ┌─────────────────┐
│   Frontend   │─────▶│    Backend     │─────▶│    Database     │
│(React)       │      │(Express/Node)  │      │   (MySQL)       │
│              │      │                │      │                 │
│ 1. Fill form │─────▶│ 1. Validate   │─────▶│ 1. INSERT       │
│ 2. Submit    │      │ 2. Sanitize   │      │    evaluation   │
│ 3. Success   │◀─────│ 3. Analyze    │      │ 2. INSERT       │
│    modal     │      │    sentiment   │      │    responses    │
│              │      │ 4. Encrypt    │      │ 3. Commit       │
│              │      │    identity    │      │    transaction  │
└──────────────┘      └────────────────┘      └─────────────────┘

FACULTY VIEWING PATH:
┌──────────────┐      ┌────────────────┐      ┌─────────────────┐
│   Frontend   │─────▶│    Backend     │─────▶│    Database     │
│(React)       │      │(Express/Node)  │      │   (MySQL)       │
│              │      │                │      │                 │
│ 1. Click     │─────▶│ 1. Auth       │─────▶│ 1. SELECT       │
│    Reports   │      │ 2. Query      │      │    evaluations  │
│ 2. Load      │      │    evaluations │      │ 2. SELECT       │
│    report    │◀─────│ 3. Calculate  │      │    responses    │
│ 3. Display   │      │    stats      │      │ 3. SELECT       │
│    metrics   │      │ 4. Generate   │      │    questions    │
│              │      │    recommend. │      │                 │
└──────────────┘      └────────────────┘      └─────────────────┘

ADMIN DASHBOARD PATH:
┌──────────────┐      ┌────────────────┐      ┌─────────────────┐
│   Frontend   │─────▶│    Backend     │─────▶│    Database     │
│(React)       │      │(Express/Node)  │      │   (MySQL)       │
│              │      │                │      │                 │
│ 1. Dashboard │─────▶│ 1. Auth       │─────▶│ 1. SELECT       │
│ 2. View      │      │    (admin)     │      │    COUNT(*)     │
│    stats     │      │ 2. Aggregate  │      │ 2. GROUP BY     │
│ 3. See       │◀─────│    across all  │      │    dept/year    │
│    depts     │      │    tables      │      │ 3. JOIN for     │
│ 4. Export    │      │ 3. Calculate  │      │    details      │
│              │      │    metrics     │      │                 │
└──────────────┘      └────────────────┘      └─────────────────┘
```

---

## Summary

**FEFAS** is a comprehensive, role-based evaluation system with:

- **Multi-role access control**: Students submit, Faculty reviews, Admins analyze
- **Privacy-preserving submission**: Anonymous feedback via AES-256-GCM encryption
- **Intelligent sentiment analysis**: Naive Bayes ML classifier with bigram tokenization
- **Real-time analytics**: System-wide dashboards with department breakdowns
- **Scalable architecture**: Connection pooling, prepared statements, transactions
- **Professional UI/UX**: React components with Tailwind styling and responsive design
- **Secure authentication**: JWT tokens, email verification, password hashing

The system serves as a complete platform for educational institutions to collect, analyze, and act on faculty evaluation feedback to improve teaching quality.
