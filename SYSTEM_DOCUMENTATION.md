# Faculty Evaluation and Feedback Analysis System (FEFAS)
## Complete System Documentation

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Component Structure](#component-structure)
5. [Role-Based Workflows](#role-based-workflows)
6. [Process Flows](#process-flows)
7. [API Endpoints](#api-endpoints)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Security & Privacy](#security--privacy)
10. [Component Interactions](#component-interactions)

---

## System Overview

**FEFAS** is a comprehensive web-based system for collecting, analyzing, and presenting faculty evaluations with sentiment analysis capabilities.

### Key Features
- **Multi-role system** with distinct workflows for Admin, Faculty, and Students
- **Automated sentiment analysis** using Naive Bayes classifier
- **Privacy-preserving evaluation** collection with anonymous tracking
- **Real-time reporting** and analytics dashboard
- **Email verification** and password reset functionality
- **Responsive UI** with Tailwind CSS styling

### Technology Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL/MariaDB |
| **Authentication** | JWT, bcryptjs |
| **Email** | Gmail SMTP (nodemailer) |
| **Analysis** | Sentiment Analysis Engine, Naive Bayes Classifier |

---

## Architecture

### 3-Tier Architecture

```
┌─────────────────────────────────────────┐
│     PRESENTATION LAYER (Frontend)       │
│  - React Components                     │
│  - Pages & Routes                       │
│  - Context & Hooks                      │
│  - Services (API clients)               │
└─────────────────────────────────────────┘
              ↕ REST API
┌─────────────────────────────────────────┐
│    APPLICATION LAYER (Backend)          │
│  - Express Routes                       │
│  - Controllers (Business Logic)         │
│  - Middleware (Auth, Validation)        │
│  - Utilities (Sentiment, Privacy)       │
└─────────────────────────────────────────┘
              ↕ Database Queries
┌─────────────────────────────────────────┐
│      DATA LAYER (Database)              │
│  - MySQL/MariaDB                        │
│  - Tables, Indexes, Constraints         │
│  - Connection Pooling                   │
└─────────────────────────────────────────┘
```

### Folder Structure

**Frontend:**
```
src/
├── pages/              # Page components (Login, Dashboard, etc.)
├── components/         # Reusable UI components
├── context/           # React Context (AuthContext)
├── hooks/             # Custom hooks (useAuth)
├── services/          # API service clients
└── assets/            # Images, styles
```

**Backend:**
```
backend/
├── controllers/       # Business logic for each route
├── models/           # Database queries & operations
├── routes/           # API endpoint definitions
├── middleware/       # Auth, validation, error handling
├── config/           # Database & email configuration
├── utils/            # Sentiment analysis, encryption
└── server.js         # Main Express app
```

---

## Database Schema

### Tables Overview

#### 1. **admins**
System administrators with full access
```sql
- id (INT, Primary Key)
- name, email, password (hashed)
- email_verified (TINYINT)
- verification_token
- created_at, updated_at (Timestamps)
```

#### 2. **faculty**
Teaching professionals who are evaluated
```sql
- id, name, email, password (hashed)
- department, subject_id (FK)
- email_verified, verification_token
- created_at, updated_at
```

#### 3. **students**
Users who complete evaluations
```sql
- id, name, email, password (hashed)
- year_level, section, department
- subject_id (FK)
- email_verified, verification_token
- created_at, updated_at
```

#### 4. **subjects**
Courses/subjects taught by faculty
```sql
- id (Primary Key)
- code (Unique: "CS101", "IT101", etc.)
- name, department
- created_at
```

#### 5. **evaluations**
Main evaluation submission records
```sql
- id, student_id (FK), faculty_id (FK)
- rating (1-5 scale)
- comment, strengths, weaknesses
- sentiment ("positive", "neutral", "negative")
- sentiment_score (decimal 0-1)
- anonymous_student_ref (encrypted reference for privacy)
- created_at
```

#### 6. **evaluation_questions**
Question bank for evaluations
```sql
- id, category, question_type ("rating" or "text")
- question, category_description
- sort_order, is_active
- created_at

Current Questions:
- 6 questions under "A. Management of Teaching and Learning"
- 5 questions under "B. Content Knowledge, Pedagogy and Technology"
- 4 questions under "C. Commitment and Transparency"
- 2 open-ended questions (strengths & weaknesses)
```

#### 7. **evaluation_responses**
Individual responses to each question
```sql
- id, evaluation_id (FK), question_id (FK)
- rating (for rating questions)
- text_response (for open-ended questions)
```

#### 8. **password_resets**
Token-based password reset mechanism
```sql
- id, email, token, expires_at
- created_at
```

### Entity-Relationship Diagram

```
┌─────────────┐
│   admins    │
└─────────────┘

┌─────────────┐         ┌──────────────┐
│  students   │────────→│   subjects   │
└─────────────┘         └──────────────┘
      │                        ↑
      │ student_id             │ subject_id
      │                        │
      ↓                        │
┌──────────────────────────────────────┐
│        evaluations                   │
│                                      │
│  - student_id (FK)                   │
│  - faculty_id (FK)                   │
└──────────────────────────────────────┘
      │
      │ evaluation_id
      ↓
┌──────────────────────────────────────┐
│    evaluation_responses              │
│                                      │
│  - question_id (FK)                  │
└──────────────────────────────────────┘
      ↑
      │ question_id
      │
┌──────────────────────────────────────┐
│  evaluation_questions                │
└──────────────────────────────────────┘

┌─────────────┐         ┌──────────────┐
│  faculty    │────────→│   subjects   │
└─────────────┘         └──────────────┘
      ↑
      │ faculty_id
      │
  [evaluations]

┌─────────────────────────┐
│  password_resets        │
│  (For all user types)   │
└─────────────────────────┘
```

---

## Component Structure

### Frontend Components

#### **Pages**
| Page | Route | Accessible By | Purpose |
|------|-------|---------------|---------|
| Login | `/login` | All | User authentication |
| ForgotPassword | `/forgot-password` | All | Password reset request |
| ResetPassword | `/reset-password/:token` | All | Password reset form |
| Dashboard | `/dashboard` | Auth | Role-specific dashboard |
| FacultyList | `/faculty` | Student | List of faculty members |
| EvaluationForm | `/evaluation` | Student | Submit evaluation |
| FacultyReport | `/reports/:id` | Faculty | Personal evaluation analytics |
| Reports | `/reports` | Student/Admin | General reports |
| ChangePassword | `/change-password` | Auth | Change password (logged in) |
| VerifyEmail | `/verify-email/:token` | All | Email verification |

#### **Key Components**
- `Layout.jsx` - Main layout wrapper with navigation
- `Navbar.jsx` - Navigation header
- `ProtectedRoute.jsx` - Route protection & role-based access
- `AuthContext.jsx` - Global authentication state
- `useAuth.js` - Custom hook for accessing auth context

#### **Services**
- `api.js` - Axios instance with base URL
- `authService.js` - Authentication API calls
- `dashboardService.js` - Dashboard data fetching
- `evaluationService.js` - Evaluation CRUD operations
- `facultyService.js` - Faculty data operations
- `subjectService.js` - Subject data operations

### Backend Structure

#### **Routes**
```
POST   /api/auth/register          - Register new account
POST   /api/auth/login              - Login with credentials
GET    /api/auth/verify-email/:token - Verify email
POST   /api/auth/forgot-password    - Request password reset
POST   /api/auth/reset-password     - Reset password with token
GET    /api/auth/me                 - Get current user (protected)
POST   /api/auth/change-password    - Change password (protected)

GET    /api/dashboard               - Get dashboard stats
GET    /api/dashboard/faculty-list  - Faculty statistics

GET    /api/evaluations             - Get evaluations (protected)
POST   /api/evaluations             - Submit evaluation (student)
GET    /api/evaluations/:id         - Get specific evaluation

GET    /api/faculty                 - List all faculty
GET    /api/faculty/:id             - Get faculty details

GET    /api/subjects                - List all subjects
```

#### **Controllers**
- `authController.js` - Authentication logic (register, login, password reset)
- `dashboardController.js` - Dashboard data aggregation
- `evaluationController.js` - Evaluation submission & retrieval
- `facultyController.js` - Faculty-related operations
- `subjectController.js` - Subject management

#### **Models**
- `User.js` - Multi-role user operations (admin, faculty, student)
- `Faculty.js` - Faculty-specific queries
- `Student.js` - Student-specific queries
- `Subject.js` - Subject operations
- `Evaluation.js` - Evaluation queries & analytics
- `EvaluationQuestion.js` - Question management
- `EvaluationResponse.js` - Response storage
- `PasswordReset.js` - Password reset token management

#### **Middleware**
- `auth.js` - JWT verification and role-based access control

#### **Utilities**
- `sentimentAnalyzer.js` - Naive Bayes sentiment classification
- `privacy.js` - AES-256-GCM encryption for anonymity
- `trainingData.js` - Training data for sentiment analysis

---

## Role-Based Workflows

### 1. STUDENT Role

**Permissions:**
- View dashboard with personal stats
- View list of faculty members
- Submit evaluations for assigned faculty
- View their own evaluation history
- Change password

**Key Workflows:**

#### A. Registration Flow
```
1. Student visits /register
2. Fills form with:
   - Name, Email (@psu.edu.ph)
   - Password (min 6 chars)
   - Year Level, Section, Department
   - Subject assignment
3. Backend:
   - Validates email format & uniqueness
   - Hashes password (bcryptjs, 10 rounds)
   - Generates verification token (crypto.randomBytes)
   - Creates student record in database
   - Sends verification email
4. Student receives email with verification link
5. Clicks link → Email verified, account activated
```

#### B. Login Flow
```
1. Student visits /login
2. Enters email & password
3. Backend:
   - Finds user by email
   - Checks email_verified flag
   - Compares password with hash
   - Generates JWT token (expires: 7d)
4. Token stored in localStorage
5. Redirected to /dashboard
6. All future requests include JWT in Authorization header
```

#### C. Evaluation Submission Flow
```
1. Student clicks "Evaluate Faculty" or visits /evaluation
2. Frontend fetches:
   - List of faculty for student's subject
   - Evaluation questions from database
3. Student fills form:
   - Rates faculty on 15 questions (1-5 scale)
   - Provides text feedback (strengths & weaknesses)
4. Submits evaluation
5. Backend:
   - Validates data
   - Analyzes sentiment from text feedback
   - Generates anonymous reference (encrypted)
   - Stores evaluation & responses in database
   - Returns success message
6. Student sees confirmation page
```

#### D. View Dashboard
```
1. Student visits /dashboard
2. Frontend fetches:
   - Student profile info
   - Count of evaluations submitted
   - List of faculty evaluated
3. Displays personal evaluation statistics
```

---

### 2. FACULTY Role

**Permissions:**
- View own evaluation reports
- See aggregated student feedback
- View sentiment analysis
- Change password
- Cannot modify evaluations

**Key Workflows:**

#### A. View Faculty Report
```
1. Faculty logs in → redirected to /reports
2. Frontend displays:
   - List of courses they teach
   - Evaluation count per course
3. Faculty clicks on course
4. Backend queries:
   - All evaluations for that faculty
   - Aggregates ratings by category
   - Calculates sentiment distribution
   - Generates recommendations
5. Displays analytics:
   - Average rating per category
   - Sentiment breakdown
   - Common strengths/weaknesses
   - Individual feedback comments (anonymized)
```

#### B. Analytics Calculation
```
For each evaluation received:
1. Sum of ratings by category → Average
2. Sentiment analysis on comments
3. Keyword extraction from strengths/weaknesses
4. Recommendation generation:
   - If low management score → Focus on time management
   - If low pedagogy score → Update teaching methods
   - If low commitment score → Increase office hours
   - etc.
```

---

### 3. ADMIN Role

**Permissions:**
- View system-wide analytics
- Manage faculty & students
- View all evaluations
- Generate reports by department
- System configuration
- Cannot submit evaluations

**Key Workflows:**

#### A. Dashboard Analytics
```
1. Admin logs in → /dashboard
2. Backend aggregates:
   - Total students by department
   - Total faculty by department
   - Evaluation submission rate
   - Average ratings by department
   - Sentiment distribution
3. Displays visualizations:
   - Department breakdown
   - Faculty evaluation counts
   - Student participation
   - Trending sentiments
```

#### B. Faculty Management
```
1. Admin visits /faculty
2. Views list of all faculty
3. Can:
   - View individual faculty reports
   - See department assignments
   - View evaluation analytics
```

---

## Process Flows

### Authentication & Account Management

#### Password Reset Process
```
┌─────────────────────────────────────────────────────────┐
│ 1. USER REQUEST                                          │
│    - User visits /forgot-password                        │
│    - Enters email                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. BACKEND PROCESSING                                   │
│    - Validates email exists                             │
│    - Generates reset token (crypto.randomBytes 32 hex) │
│    - Sets expiration (15 minutes from now)              │
│    - Stores in password_resets table                    │
│    - Sends email with reset link                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. USER RECEIVES EMAIL                                  │
│    - Email contains reset link:                         │
│      /reset-password/{token}                            │
│    - Valid for 15 minutes                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. USER CLICKS LINK                                     │
│    - Navigates to /reset-password/:token               │
│    - Shows password reset form                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. BACKEND VALIDATES TOKEN                              │
│    - Checks token exists in password_resets             │
│    - Checks expires_at > NOW()                          │
│    - If valid: Finds associated email                   │
│    - If invalid: Returns error                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. USER SUBMITS NEW PASSWORD                            │
│    - Validates password (min 6 chars)                   │
│    - Confirms passwords match                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. BACKEND UPDATES PASSWORD                             │
│    - Hashes new password (bcryptjs, 10 rounds)         │
│    - Updates user record in appropriate table           │
│    - Deletes token from password_resets                 │
│    - Redirects to login                                 │
└─────────────────────────────────────────────────────────┘
```

#### Email Verification Process
```
┌──────────────────────────────────────┐
│ 1. USER REGISTERS                    │
│    - Submits registration form       │
│    - Backend validates data          │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 2. GENERATE VERIFICATION TOKEN       │
│    - Creates random hex string       │
│    - Stores in verification_token    │
│    - Sends verification email        │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 3. USER RECEIVES EMAIL               │
│    - Contains verification link      │
│    - No expiration limit             │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 4. USER CLICKS LINK                  │
│    - /verify-email/{token}           │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 5. BACKEND VERIFIES                  │
│    - Finds user by token             │
│    - Sets email_verified = TRUE      │
│    - Clears verification_token       │
│    - User can now login              │
└──────────────────────────────────────┘
```

### Evaluation Submission Process

```
┌─────────────────────────────────────────────────────────┐
│ 1. STUDENT INITIATES EVALUATION                         │
│    - Clicks "Evaluate Faculty"                          │
│    - Visits /evaluation page                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. FRONTEND FETCHES DATA                                │
│    - GET /api/faculty (student's subject faculty)      │
│    - GET /api/evaluations/questions                    │
│    - Displays form with:                                │
│      * Faculty dropdown                                 │
│      * 15 rating questions (1-5 scale)                 │
│      * 2 text questions (strengths & weaknesses)      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. STUDENT COMPLETES FORM                               │
│    - Rates faculty on each criterion                    │
│    - Provides text feedback                             │
│    - Submits form                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. BACKEND PROCESSES SUBMISSION                         │
│    POST /api/evaluations                                │
│    {                                                    │
│      faculty_id, rating, comment,                      │
│      strengths, weaknesses, responses: [...]           │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. SENTIMENT ANALYSIS                                   │
│    - Combines strengths + weaknesses + comment         │
│    - Analyzes with Naive Bayes classifier              │
│    - Classifies as: positive, neutral, negative        │
│    - Calculates confidence score (0-1)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. ANONYMIZATION                                        │
│    - Generates student reference:                       │
│      v1.{random_base64}                                 │
│    - Encrypts with AES-256-GCM                          │
│    - Stores encrypted ref in evaluation record         │
│    - Never stores actual student_id with feedback      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. DATABASE STORAGE                                     │
│    Insert evaluations:                                  │
│    - id, student_id, faculty_id                         │
│    - rating, comment, sentiment, sentiment_score       │
│    - anonymous_student_ref                             │
│                                                         │
│    Insert evaluation_responses:                         │
│    - evaluation_id, question_id                         │
│    - rating OR text_response                            │
│                                                         │
│    Total: 1 evaluation record + 17 response records    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 8. FRONTEND CONFIRMATION                                │
│    - Shows success message                              │
│    - Indicates evaluation submitted                     │
│    - Redirects to dashboard                             │
└─────────────────────────────────────────────────────────┘
```

### Faculty Report Generation Process

```
┌─────────────────────────────────────────────────────────┐
│ 1. FACULTY REQUESTS REPORT                              │
│    - Clicks on course/subject                           │
│    - Visits /reports/:id                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. BACKEND QUERIES DATABASE                             │
│    - SELECT * FROM evaluations                          │
│      WHERE faculty_id = ? AND subject_id = ?            │
│    - Retrieves all related evaluation_responses         │
│    - Fetches evaluation_questions for reference         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. DATA AGGREGATION                                     │
│    For each category:                                   │
│    - Calculate average rating                           │
│    - Count of evaluations                               │
│                                                         │
│    For sentiment:                                       │
│    - Count: positive, neutral, negative                 │
│    - Calculate percentages                              │
│                                                         │
│    For feedback:                                        │
│    - Compile strengths & weaknesses                     │
│    - Generate word frequency analysis                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. RECOMMENDATION ENGINE                                │
│    - Analyzes low-scoring categories                    │
│    - Generates actionable suggestions:                  │
│      * "Improve time management in class"              │
│      * "Consider using more interactive teaching"      │
│      * "Increase office hours availability"            │
│      * "Focus on clarity of expectations"              │
│    - Provides evidence from feedback                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. FRONTEND DISPLAYS REPORT                             │
│    - Charts: Average ratings by category                │
│    - Pie chart: Sentiment distribution                  │
│    - Word cloud: Common themes                          │
│    - Recommendations: Actionable improvements           │
│    - Individual comments: Anonymized feedback           │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication Endpoints

```
POST /api/auth/register
┌─────────────────────────────────────┐
│ Request Body:                       │
│ {                                   │
│   name: string                      │
│   email: string (@psu.edu.ph)       │
│   password: string (min 6)          │
│   confirmPassword: string           │
│   role: "student" | "faculty"      │
│   year_level?: string (for student) │
│   section?: string (for student)    │
│   department: string                │
│   subject_id?: number               │
│ }                                   │
├─────────────────────────────────────┤
│ Response (201):                     │
│ {                                   │
│   message: "Registration successful"│
│ }                                   │
└─────────────────────────────────────┘

POST /api/auth/login
┌─────────────────────────────────────┐
│ Request Body:                       │
│ {                                   │
│   email: string                     │
│   password: string                  │
│ }                                   │
├─────────────────────────────────────┤
│ Response (200):                     │
│ {                                   │
│   message: "Login successful",      │
│   token: string (JWT),              │
│   user: {                           │
│     id: number,                     │
│     name: string,                   │
│     email: string,                  │
│     role: string,                   │
│     ...other fields                 │
│   }                                 │
│ }                                   │
└─────────────────────────────────────┘

GET /api/auth/verify-email/:token
├─────────────────────────────────────┤
│ Response (200):                     │
│ {                                   │
│   message: "Email verified..."      │
│ }                                   │
└─────────────────────────────────────┘

POST /api/auth/forgot-password
┌─────────────────────────────────────┐
│ Request Body:                       │
│ {                                   │
│   email: string                     │
│ }                                   │
├─────────────────────────────────────┤
│ Response (200):                     │
│ {                                   │
│   message: "Reset link sent..."     │
│ }                                   │
└─────────────────────────────────────┘

POST /api/auth/reset-password
┌─────────────────────────────────────┐
│ Request Body:                       │
│ {                                   │
│   token: string,                    │
│   password: string (min 6),         │
│   confirmPassword: string           │
│ }                                   │
├─────────────────────────────────────┤
│ Response (200):                     │
│ {                                   │
│   message: "Password reset..."      │
│ }                                   │
└─────────────────────────────────────┘

GET /api/auth/me (Protected)
├─────────────────────────────────────┤
│ Headers:                            │
│ Authorization: Bearer {JWT}         │
├─────────────────────────────────────┤
│ Response (200):                     │
│ {                                   │
│   user: { ...user data }            │
│ }                                   │
└─────────────────────────────────────┘

POST /api/auth/change-password (Protected)
┌─────────────────────────────────────┐
│ Request Body:                       │
│ {                                   │
│   currentPassword: string,          │
│   newPassword: string (min 6)       │
│ }                                   │
├─────────────────────────────────────┤
│ Response (200):                     │
│ {                                   │
│   message: "Password changed..."    │
│ }                                   │
└─────────────────────────────────────┘
```

### Evaluation Endpoints

```
POST /api/evaluations (Protected - Student)
┌─────────────────────────────────────┐
│ Request Body:                       │
│ {                                   │
│   faculty_id: number,               │
│   rating: number (1-5),             │
│   comment: string,                  │
│   strengths: string,                │
│   weaknesses: string,               │
│   responses: [                      │
│     {                               │
│       question_id: number,          │
│       rating?: number,              │
│       text_response?: string        │
│     }                               │
│   ]                                 │
│ }                                   │
├─────────────────────────────────────┤
│ Response (201):                     │
│ {                                   │
│   message: "Evaluation submitted"   │
│ }                                   │
└─────────────────────────────────────┘

GET /api/evaluations (Protected)
├─────────────────────────────────────┤
│ Response (200):                     │
│ [                                   │
│   {                                 │
│     id, faculty_id, rating,         │
│     sentiment, sentiment_score,     │
│     created_at,                     │
│     ...                             │
│   }                                 │
│ ]                                   │
└─────────────────────────────────────┘

GET /api/evaluations/:id (Protected)
├─────────────────────────────────────┤
│ Response (200):                     │
│ {                                   │
│   evaluation: { ...data },          │
│   responses: [ ...data ]            │
│ }                                   │
└─────────────────────────────────────┘
```

### Dashboard Endpoints

```
GET /api/dashboard (Protected - Faculty)
├─────────────────────────────────────┤
│ Response (200):                     │
│ {                                   │
│   evaluationCount: number,          │
│   averageRating: number,            │
│   sentimentBreakdown: {             │
│     positive: number,               │
│     neutral: number,                │
│     negative: number                │
│   },                                │
│   categoriesAverage: {              │
│     "Management": number,           │
│     "Content Knowledge": number,    │
│     "Commitment": number            │
│   },                                │
│   recommendations: [...]            │
│ }                                   │
└─────────────────────────────────────┘

GET /api/dashboard/faculty-list (Protected - Admin)
├─────────────────────────────────────┤
│ Response (200):                     │
│ [                                   │
│   {                                 │
│     id, name, email, department,    │
│     evaluationCount, averageRating  │
│   }                                 │
│ ]                                   │
└─────────────────────────────────────┘
```

### Faculty Endpoints

```
GET /api/faculty (Protected)
├─────────────────────────────────────┤
│ Response (200):                     │
│ [                                   │
│   {                                 │
│     id, name, email,                │
│     department, subject_id,         │
│     subject_code, subject_name      │
│   }                                 │
│ ]                                   │
└─────────────────────────────────────┘

GET /api/faculty/:id (Protected)
├─────────────────────────────────────┤
│ Response (200):                     │
│ {                                   │
│   id, name, email,                  │
│   department, subject_id,           │
│   subject_code, subject_name,       │
│   evaluationStats: {...}            │
│ }                                   │
└─────────────────────────────────────┘
```

### Subject Endpoints

```
GET /api/subjects
├─────────────────────────────────────┤
│ Response (200):                     │
│ [                                   │
│   {                                 │
│     id, code, name, department      │
│   }                                 │
│ ]                                   │
└─────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Student Evaluation Submission Flow

```
STUDENT (Frontend)          BACKEND                    DATABASE
     │                        │                           │
     ├─ Form Loaded ─────────→│                           │
     │                        ├─ GET /faculty ───────────→│
     │                        │  (Query faculty)          │
     │                        │←─ Faculty List ───────────┤
     │←─ Display Form ────────┤                           │
     │                        ├─ GET /questions ─────────→│
     │                        │  (Query questions)        │
     │                        │←─ Questions ──────────────┤
     │                        │                           │
     ├─ Complete Form ────────→│                           │
     │                        ├─ Sentiment Analysis      │
     │                        ├─ Anonymization           │
     │                        ├─ INSERT evaluation ──────→│
     │                        │←─ Success ────────────────┤
     │                        ├─ INSERT responses ───────→│
     │                        │←─ Success ────────────────┤
     │←─ Success Message ─────┤                           │
```

### Faculty Report Retrieval Flow

```
FACULTY (Frontend)          BACKEND                    DATABASE
     │                        │                           │
     ├─ Request Report ──────→│                           │
     │                        ├─ SELECT evaluations ─────→│
     │                        │  WHERE faculty_id = X     │
     │                        │←─ Evaluations ────────────┤
     │                        │                           │
     │                        ├─ SELECT responses ───────→│
     │                        │  JOIN questions           │
     │                        │←─ Responses ──────────────┤
     │                        │                           │
     │                        ├─ Aggregate Data           │
     │                        ├─ Calculate Averages       │
     │                        ├─ Sentiment Analysis       │
     │                        ├─ Generate Recommendations │
     │←─ Analytics Dashboard─┤                           │
     │   (Charts & Stats)    │                           │
```

### Authentication Flow

```
USER (Frontend)             BACKEND                    DATABASE
     │                        │                           │
     ├─ Login Form ──────────→│                           │
     │                        ├─ Query User ─────────────→│
     │                        │  WHERE email = X          │
     │                        │←─ User Data ──────────────┤
     │                        │                           │
     │                        ├─ bcrypt.compare()         │
     │                        │  (Password Validation)    │
     │                        │                           │
     │                        ├─ jwt.sign()               │
     │                        │  (Generate Token)         │
     │                        │                           │
     │←─ Token + User Data ───┤                           │
     │                        │                           │
     ├─ Store Token ──────────┤                           │
     │  (localStorage)        │                           │
     │                        │                           │
     ├─ Protected Request ───→│                           │
     │  + Bearer Token        ├─ jwt.verify()             │
     │                        │  (Check Token)            │
     │                        │                           │
     │                        ├─ Query Data ─────────────→│
     │                        │←─ Response ───────────────┤
     │←─ Data Response ───────┤                           │
```

---

## Component Interactions

### Frontend Layer Interactions

```
App.jsx (Main Router)
├── AuthContext (Global State)
│   ├── User data
│   ├── Auth token
│   └── Login/Logout methods
├── ProtectedRoute
│   └── Role-based access
├── Pages
│   ├── Login/Register
│   ├── Dashboard
│   ├── EvaluationForm
│   ├── FacultyReport
│   └── Reports
├── Components
│   ├── Layout
│   │   └── Navbar
│   │       └── useAuth hook
│   └── ProtectedRoute
│       └── Role validation
└── Services
    ├── authService
    ├── evaluationService
    ├── facultyService
    ├── dashboardService
    └── subjectService
        └── api.js (Axios instance)
```

### Backend Processing Pipeline

```
Request
   ↓
Express Middleware
├── CORS Handler
├── Body Parser
└── Error Handler
   ↓
Route Handler
├── Validate Input
├── Check Authentication
└── Check Authorization (Role)
   ↓
Controller
├── Business Logic
├── Data Validation
└── Service Calls
   ↓
Model/Database
├── Query Execution
├── Data Transformation
└── Response Building
   ↓
Response
└── JSON with Status Code
```

### Data Processing Pipeline (Evaluation)

```
Raw Evaluation Data
   ├── Ratings (1-5)
   └── Text Feedback
        ↓
Sentiment Analysis
├── Tokenization
├── Bigram Extraction
├── Feature Vectors
└── Naive Bayes Classification
        ↓
Sentiment Result
├── Classification (positive/neutral/negative)
└── Confidence Score
        ↓
Anonymization
├── Generate Reference ID
├── AES-256-GCM Encryption
└── Store Encrypted Reference
        ↓
Database Storage
├── Evaluations Table
├── Evaluation_Responses Table
└── Sentiment Metadata
```

---

## Security & Privacy

### Authentication & Authorization

1. **Password Security**
   - Hashing: bcryptjs with 10 salt rounds
   - Never stored in plain text
   - Compared using secure comparison (bcrypt.compare)

2. **JWT Token**
   - Issued on login with expiration (7 days)
   - Contains: user ID, email, role
   - Verified on each protected request
   - Stored in localStorage (frontend)

3. **Role-Based Access Control**
   - Middleware checks user role
   - Endpoints restrict based on role
   - Frontend routes protected with ProtectedRoute component
   - Student ≠ Faculty ≠ Admin permissions

### Data Privacy

1. **Evaluation Anonymity**
   - Student ID not stored with feedback
   - Anonymous reference generated (encrypted)
   - Comments never linked to student profile
   - Only faculty sees aggregated data

2. **Encryption**
   - Anonymous reference: AES-256-GCM
   - Encryption key from environment variables
   - IV (Initialization Vector) uniquely generated
   - Authentication tag for integrity

3. **Input Validation**
   - Email format validation
   - Domain check (@psu.edu.ph only)
   - Password strength requirements
   - Rate limiting on API endpoints

### Database Security

1. **Connection**
   - Connection pooling (mysql2/promise)
   - Prepared statements (prevents SQL injection)
   - Credentials from .env (not hardcoded)

2. **Data Integrity**
   - Foreign key constraints
   - CHECK constraints on ratings (1-5)
   - Unique constraints on email
   - Timestamps for audit trail

3. **Access Control**
   - Database user with limited permissions
   - Separate DB password from code
   - Environment-based configuration

### Email Security

1. **Verification Tokens**
   - Random hex tokens (crypto.randomBytes)
   - One-time use
   - Email verified flag in database

2. **Password Reset Tokens**
   - Random generation
   - 15-minute expiration
   - Deleted after use
   - One token per email at a time

3. **Email Content**
   - HTML templates with clickable links
   - No sensitive data in email
   - Fallback text links

---

## Error Handling & Validation

### Frontend Validation

- Email format and @psu.edu.ph domain
- Password minimum length (6 characters)
- Required fields enforcement
- File size limits (if applicable)
- Rate limiting on form submission

### Backend Validation

- Input sanitization
- Data type verification
- Business logic validation
- Error responses with status codes
- Detailed logging

### Error Response Format

```json
{
  "message": "Descriptive error message",
  "status": "error",
  "code": 400
}
```

---

## Performance Considerations

1. **Database Indexes**
   - Primary keys on all tables
   - Unique indexes on email
   - Foreign key indexes
   - Token indexes for searches

2. **Query Optimization**
   - LEFT JOINs for optional data
   - SELECT specific columns
   - Pagination for large datasets
   - Connection pooling

3. **Frontend Performance**
   - Code splitting with React Router
   - Component lazy loading
   - API response caching
   - Debouncing on inputs

---

## Deployment Checklist

### Environment Setup
- [ ] Create `.env` file with all variables
- [ ] Database credentials configured
- [ ] JWT secret set
- [ ] Email credentials configured
- [ ] CLIENT_URL matches deployment domain

### Database
- [ ] Database created
- [ ] All tables created
- [ ] Indexes applied
- [ ] Sample data loaded (if needed)
- [ ] Backups configured

### Backend
- [ ] Dependencies installed (npm install)
- [ ] Port 5000 available
- [ ] CORS configured for frontend URL
- [ ] Error logging enabled
- [ ] Rate limiting configured

### Frontend
- [ ] Dependencies installed (npm install)
- [ ] API base URL correct
- [ ] Build process tested (npm run build)
- [ ] Environment variables configured
- [ ] Static assets optimized

### Security
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] JWT secret secure
- [ ] Database password secure
- [ ] Email password secure
- [ ] Sensitive data not in version control

---

## Support & Maintenance

### Monitoring
- Monitor database query performance
- Log error rates and patterns
- Track email delivery success
- Monitor sentiment analysis accuracy

### Updates
- Regular dependency updates
- Security patches
- Performance optimization
- Feature additions

### Troubleshooting Guide

| Issue | Possible Cause | Solution |
|-------|---|---|
| Email not sending | SMTP config | Check .env, test credentials |
| Login fails | DB connection | Verify database running |
| Sentiment incorrect | Model accuracy | Retrain with more data |
| Slow reports | Missing indexes | Add database indexes |
| Token expired | Session timeout | Clear cache, re-login |

---

## Glossary

- **JWT**: JSON Web Token - stateless authentication
- **bcryptjs**: Password hashing library
- **SMTP**: Simple Mail Transfer Protocol
- **Sentiment Analysis**: Classification of text emotion
- **Anonymization**: Removing identifying information
- **AES-256**: Encryption algorithm with 256-bit key
- **REST**: Representational State Transfer API architecture
- **CORS**: Cross-Origin Resource Sharing
- **ORM**: Object-Relational Mapping

---

**Last Updated**: May 2, 2026  
**Version**: 1.0  
**Status**: Complete & Production Ready
