# FEFAS — Faculty Evaluation and Feedback Analysis System

## Complete System Guide

---

## 1. What is FEFAS?

FEFAS is a **web-based Faculty Evaluation System** built for Pangasinan State University (PSU). It allows **students** to evaluate their instructors' teaching performance through structured questionnaires and open-ended feedback. The system then uses **AI-powered Sentiment Analysis** and **Prescriptive Analysis** to automatically interpret student comments and generate actionable recommendations for faculty improvement.

### In Simple Terms

Think of it like a digital suggestion box — but smarter. Instead of just collecting feedback and leaving it in a pile, FEFAS:
1. **Collects** student ratings and written comments about their teachers
2. **Analyzes** the comments using a **Machine Learning (ML) algorithm** — specifically a Naive Bayes classifier — to determine if they are positive, negative, or neutral
3. **Generates recommendations** — telling the school what specific actions to take based on the feedback

---

## 2. Who Uses the System?

FEFAS has **three types of users** (roles), each with different access levels:

| Role | What They Can Do |
|------|-----------------|
| **Student** | Submit evaluations for their assigned instructors, view their own submission history |
| **Faculty** | View their own evaluation results, sentiment breakdown, and prescriptive recommendations |
| **Admin** | View all reports system-wide, manage accounts (create/edit/delete students, faculty, admins), view department statistics |

---

## 3. How the System Works (Step by Step)

### Step 1: Student Logs In
- Students use their `@psu.edu.ph` email and password
- Email must be verified before first login

### Step 2: Student Submits an Evaluation
- The system shows only the faculty assigned to the student's enrolled subject
- The evaluation form has **3 categories with 15 rating questions** (1-5 scale):
  - **A. Management of Teaching and Learning** (6 questions) — punctuality, time management, critical thinking activities, feedback
  - **B. Content Knowledge, Pedagogy and Technology** (5 questions) — subject mastery, simplifying concepts, ICT tools, assessments
  - **C. Commitment and Transparency** (4 questions) — diversity, consulting hours, feedback timeliness, grading criteria
- Plus **2 open-ended text questions**:
  - Strengths of the instructor
  - Weaknesses of the instructor

### Step 3: AI Analyzes the Feedback
When a student submits, the system automatically:
1. **Sanitizes** the text input (removes HTML, spam, gibberish)
2. **Runs Sentiment Analysis** on the strengths and weaknesses using a trained Naive Bayes classifier
3. **Calculates a sentiment score** (-1 to +1) and labels it as positive, neutral, or negative
4. **Encrypts** the student's identity so feedback is anonymous

### Step 4: Reports Are Generated
- **Faculty** can view their own report with ratings, sentiment breakdown, and AI recommendations
- **Admin** can view all faculty reports, department comparisons, and system-wide analysis

---

## 4. Key Features Explained

### 4.1 Sentiment Analysis (AI Feature)

**What it does:** Reads the text comments students write and determines if the overall tone is positive, negative, or neutral.

**How it works:**
- Uses the **Natural** library (a JavaScript NLP library) with a **Naive Bayes classifier**
- The classifier is trained on **hundreds of labeled examples** covering English, Filipino, and Taglish feedback
- Uses both **unigrams** (single words) and **bigrams** (word pairs like "not good") for better accuracy with negations
- Filters out emojis, gibberish, and non-word characters before analysis
- Returns a **confidence score** (0-1) indicating how sure the AI is

**Example:**
- "Very helpful and knowledgeable teacher" → **Positive** (confidence: 0.89)
- "Always late and boring lectures" → **Negative** (confidence: 0.82)
- "Okay lang naman" → **Neutral** (confidence: 0.65)

### 4.2 Prescriptive Analysis (AI Feature)

**What it does:** Goes beyond just identifying sentiment — it tells the school **what to do about it**.

**How it works:**
1. **Rating-based recommendations:** Based on the faculty member's average score (e.g., below 2.5 = "Immediate intervention recommended")
2. **Sentiment-based recommendations:** Based on the percentage of negative vs positive feedback
3. **Keyword-based recommendations:** Scans feedback for specific themes and generates targeted advice

**Keyword themes detected:**

| Theme | Trigger Words (EN/Filipino) | Sample Recommendation |
|-------|---------------------------|----------------------|
| Clarity | unclear, confusing, malabo, labo | "Use more concrete examples, visual aids, and step-by-step explanations" |
| Pacing | fast, rushed, bilis | "Incorporate structured pauses and comprehension checks" |
| Engagement | boring, monotone, nakakaantok | "Incorporate interactive activities and group discussions" |
| Punctuality | late, absent, laging | "Ensure consistent class schedules" |
| Grading | grading, feedback, tagal | "Return evaluations promptly with constructive comments" |
| Fairness | unfair, bias, favoritism | "Review grading criteria transparency" |
| Respect | rude, bastos, masungit | "Foster a respectful and inclusive learning environment" |

**Strength themes also detected:** Supportiveness (helpful, mabait), Expertise (knowledgeable, magaling), Organization (prepared, structured), Engagement (fun, masaya), Clarity (clear, linaw)

### 4.3 Student Anonymity & Privacy

- Student identity is **encrypted** using AES-256-GCM encryption before storage
- The sentiment analysis engine **never receives** student identity data — only the comment text
- Faculty members can see feedback content but **cannot identify** which student wrote it
- An anonymous reference token is stored instead of the student ID in plain text

### 4.4 Role-Based Access Control

- Every API request requires a **JWT (JSON Web Token)** for authentication
- Middleware checks the user's role before granting access to protected routes
- Students can only evaluate faculty assigned to their subject
- Faculty can only see their own reports
- Only admins can manage accounts and view system-wide data

---

## 5. System Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite 7, TailwindCSS 4 | User interface |
| **Backend** | Node.js, Express 4 | API server |
| **Database** | MariaDB 10.4 (MySQL compatible) | Data storage |
| **AI/NLP** | Natural.js (Naive Bayes) | Sentiment analysis |
| **Auth** | JWT + bcrypt | Login and security |
| **Email** | Nodemailer (Gmail SMTP) | Verification and password reset |
| **Encryption** | Node.js crypto (AES-256-GCM) | Student anonymity |

### Folder Structure

```
faculty-evaluation-system/
├── backend/
│   ├── config/          # Database connection settings
│   ├── controllers/     # Business logic (5 controllers)
│   │   ├── authController.js        # Login, register, password management
│   │   ├── dashboardController.js   # Dashboard statistics
│   │   ├── evaluationController.js  # Evaluation submission & reports
│   │   ├── facultyController.js     # Faculty listing
│   │   └── subjectController.js     # Subject management
│   ├── middleware/      # Auth & role verification
│   ├── models/          # Database queries (8 models)
│   │   ├── User.js                  # Shared user operations (CRUD)
│   │   ├── Student.js               # Student-specific queries
│   │   ├── Faculty.js               # Faculty-specific queries
│   │   ├── Evaluation.js            # Evaluation data queries
│   │   ├── EvaluationQuestion.js    # Question bank queries
│   │   ├── EvaluationResponse.js    # Individual response queries
│   │   ├── Subject.js               # Subject queries
│   │   └── PasswordReset.js         # Password reset tokens
│   ├── routes/          # API endpoint definitions
│   ├── utils/           # Helpers
│   │   ├── sentimentAnalyzer.js     # AI sentiment + prescriptive engine
│   │   ├── trainingData.js          # NLP training dataset
│   │   └── privacy.js               # Encryption utilities
│   ├── seed.js          # Database seeder
│   └── server.js        # App entry point
├── frontend/
│   └── src/
│       ├── pages/       # 13 page components
│       │   ├── Login.jsx             # Login page
│       │   ├── Dashboard.jsx         # Role-aware dashboard
│       │   ├── EvaluationForm.jsx    # Student evaluation form
│       │   ├── Reports.jsx           # Admin system-wide reports
│       │   ├── FacultyReport.jsx     # Individual faculty report
│       │   ├── FacultyList.jsx       # Browse faculty members
│       │   ├── AdminAccounts.jsx     # Account management table
│       │   ├── CreateAccount.jsx     # Create new account form
│       │   ├── EditAccount.jsx       # Edit existing account
│       │   ├── ChangePassword.jsx    # Change own password
│       │   ├── ForgotPassword.jsx    # Request password reset
│       │   ├── ResetPassword.jsx     # Reset via email link
│       │   └── VerifyEmail.jsx       # Email verification
│       ├── components/  # Reusable UI components
│       ├── context/     # React auth context (global state)
│       ├── hooks/       # Custom React hooks
│       └── services/    # API call functions (Axios)
└── database/
    └── faculty_evaluation_db.sql    # Complete database schema
```

### Database Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `admins` | Admin accounts | name, email, password, email_verified |
| `students` | Student accounts | name, email, year_level, section, department, subject_id |
| `faculty` | Faculty accounts | name, email, department, subject_id |
| `subjects` | Course/subject list | code (e.g., CS101), name, department |
| `evaluations` | Submitted evaluations | student_id, faculty_id, rating, comment, strengths, weaknesses, sentiment, sentiment_score |
| `evaluation_questions` | Question bank (17 questions) | category, question_type (rating/text), question, sort_order |
| `evaluation_responses` | Individual question answers | evaluation_id, question_id, rating, text_response |
| `password_resets` | Temporary reset tokens | email, token, expires_at |

### API Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/auth/login` | Public | User login |
| POST | `/api/auth/register` | Public | User registration |
| POST | `/api/auth/forgot-password` | Public | Request password reset email |
| POST | `/api/auth/reset-password` | Public | Reset password with token |
| GET | `/api/auth/verify-email/:token` | Public | Verify email address |
| GET | `/api/auth/accounts` | Admin | List all accounts |
| POST | `/api/auth/accounts` | Admin | Create new account |
| PUT | `/api/auth/accounts/:id` | Admin | Update account |
| DELETE | `/api/auth/accounts/:id` | Admin | Delete account |
| PUT | `/api/auth/change-password` | All | Change own password |
| GET | `/api/dashboard/stats` | Admin/Student | Dashboard statistics |
| GET | `/api/dashboard/faculty` | Faculty | Faculty's own dashboard |
| GET | `/api/evaluation/questions` | Student | Get evaluation form questions |
| POST | `/api/evaluation/submit` | Student | Submit an evaluation |
| GET | `/api/evaluation/faculty/:id` | Admin | Get a faculty member's report |
| GET | `/api/evaluation/my-report` | Faculty | Get own report |
| GET | `/api/evaluation/my-evaluations` | Student | Get own submission history |
| GET | `/api/evaluation/enrolled-instructors` | Student | Get assigned faculty list |
| GET | `/api/evaluation/analysis` | Admin | System-wide prescriptive analysis |
| DELETE | `/api/evaluation/clear-all` | Admin | Clear all evaluation data |
| GET | `/api/faculty` | All | List all faculty |
| GET | `/api/subjects` | All | List all subjects |

---

## 6. How to Set Up and Run the System

### Prerequisites
- **Node.js** (version 18 or higher)
- **XAMPP** with MariaDB/MySQL running on port 3307
- **Git** (optional, for cloning)

### Step-by-Step Setup

#### 1. Set Up the Database
1. Open **phpMyAdmin** (usually at `http://localhost/phpmyadmin`)
2. Create a new database called `faculty_evaluation_db`
3. Import the file `database/faculty_evaluation_db.sql`

#### 2. Configure the Backend
1. Navigate to `backend/` folder
2. Copy `.env.example` to `.env` and update values if needed:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3307
   DB_USER=root
   DB_PASSWORD=""
   DB_NAME=faculty_evaluation_db
   JWT_SECRET=your-secret-key
   CLIENT_URL=http://localhost:5173
   ```
3. Install dependencies: `npm install`
4. (Optional) Seed sample data: `npm run seed`
5. Start the server: `npm run dev`
   - Server runs on `http://localhost:5000`

#### 3. Configure the Frontend
1. Navigate to `frontend/` folder
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
   - App opens on `http://localhost:5173`

#### 4. For Production / Remote Access
1. Build the frontend: `cd frontend && npm run build`
2. The backend automatically serves the built frontend from `frontend/dist/`
3. Run the backend only: `cd backend && npm start`
4. Access everything on `http://localhost:5000`
5. (Optional) Use **ngrok** for public access: `ngrok http 5000`

### Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@psu.edu.ph | password123 |
| Faculty | faculty@psu.edu.ph | password123 |
| Faculty | faculty2@psu.edu.ph | password123 |
| Student | student1@psu.edu.ph | password123 |
| Student | student2@psu.edu.ph | password123 |

---

## 7. How Each Page Works

### Login Page
- Users enter their email and password
- System detects the role (admin/faculty/student) automatically
- Redirects to the appropriate dashboard after login
- Links to "Forgot Password" and email verification

### Dashboard (Role-Aware)
- **Admin Dashboard:** Shows total students, total faculty, total evaluations, sentiment overview (positive/neutral/negative counts), and department-by-department statistics including faculty count, average rating, and student population breakdowns by year level
- **Student Dashboard:** Shows how many evaluations they've submitted, average rating given, their personal sentiment summary, and recent submissions
- **Faculty Dashboard:** Shows their overall rating, total evaluations received, sentiment breakdown, and enrolled student completion rates

### Evaluation Form (Students Only)
1. Student selects a faculty member from their enrolled instructors
2. If already evaluated, the faculty shows as "Already Evaluated"
3. The form displays 15 rating questions grouped by 3 categories
4. Each question uses a dropdown selector (1-5 scale): 1=Poor, 2=Fair, 3=Satisfactory, 4=Very Satisfactory, 5=Outstanding
5. Two open-ended text fields for strengths and weaknesses
6. Input validation prevents spam and repeated text
7. On submit: AI analyzes the feedback, calculates sentiment, and stores everything anonymously

### Reports Page (Admin)
- **System Health:** Overall sentiment health (excellent/good/fair/needs improvement)
- **Sentiment Heatmap:** Visual grid showing positive/neutral/negative rates per department
- **Faculty Summary Table:** All faculty ranked by average rating with sentiment percentages
- **Faculty Flags:** Automatically identifies "Needs Attention" (low rating or high negative sentiment) and "High Performers" (high rating and high positive sentiment)
- **Department Insights:** Per-department average ratings, sentiment rates, and AI-detected keyword themes
- **System-Wide Trends:** AI-detected recurring themes across all evaluations with recommendations
- **System Recommendations:** Actionable institutional-level recommendations

### Faculty Report Page
- Displays individual faculty member's complete evaluation results
- **Category Averages:** Bar/chart showing average score per evaluation category
- **Sentiment Overview:** Pie/chart showing positive/neutral/negative distribution
- **Recent Feedback:** Latest student comments with sentiment labels
- **AI Recommendations:** Specific, actionable improvement suggestions generated by the prescriptive analysis engine

### Account Management (Admin Only)
- **Accounts List:** Table of all users with search, filter by role
- **Create Account:** Form to add new student, faculty, or admin accounts with auto email verification
- **Edit Account:** Update user details, department, assigned subject
- **Delete Account:** Remove users from the system

---

## 8. Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with 10 salt rounds — passwords are never stored in plain text |
| **JWT Authentication** | Tokens expire after 7 days; required for all API calls |
| **Role Authorization** | Middleware checks user role before granting access |
| **Student Anonymity** | AES-256-GCM encryption on student references |
| **Input Sanitization** | HTML tags, scripts, and XSS attempts are stripped from all inputs |
| **Spam Detection** | Repeated characters and word patterns are flagged and rejected |
| **Email Verification** | Accounts must verify their email before accessing the system |
| **CORS Protection** | Only the configured frontend URL can make API requests |

---

## 9. Glossary of Terms

| Term | Meaning |
|------|---------|
| **Sentiment Analysis** | AI technique that determines if text expresses a positive, negative, or neutral opinion |
| **Prescriptive Analysis** | AI technique that not only identifies problems but recommends specific actions to solve them |
| **Naive Bayes Classifier** | A machine learning algorithm that classifies text into categories based on word probabilities learned from training data |
| **NLP** | Natural Language Processing — the field of AI that deals with understanding human language |
| **JWT** | JSON Web Token — a secure, compact way to transmit user identity between client and server |
| **AES-256-GCM** | Advanced Encryption Standard with 256-bit key — military-grade encryption used to protect student identity |
| **Unigram** | A single word used as a feature for text classification (e.g., "good") |
| **Bigram** | A pair of consecutive words used as a feature (e.g., "not_good") — helps detect negation |
| **CRUD** | Create, Read, Update, Delete — the four basic database operations |
| **API** | Application Programming Interface — the communication layer between frontend and backend |
| **FEFAS** | Faculty Evaluation and Feedback Analysis System — this system's name |

---

---

## 10. Codebase Summary

### 10.1 Backend Codebase (`backend/`)

The backend is a **Node.js + Express REST API** that handles all business logic, database queries, authentication, and AI analysis. It runs on port 5000.

#### Entry Point

| File | Purpose |
|------|---------|
| `server.js` | Starts the Express server, registers all middleware (CORS, JSON parsing), mounts API routes (`/api/auth`, `/api/dashboard`, `/api/evaluation`, `/api/faculty`, `/api/subjects`), serves the built frontend in production, and includes a global error handler. |
| `seed.js` | Populates the database with sample test accounts (admin, faculty, students) for development and demo purposes. |

#### Controllers (Business Logic) — `backend/controllers/`

| File | Lines | What It Does |
|------|-------|-------------|
| `authController.js` | 548 | Handles all authentication and account management: user registration (with PSU email validation), login (with JWT token generation), email verification, forgot/reset password, profile retrieval, change password, and full admin CRUD for managing accounts (list, create, update, delete). |
| `evaluationController.js` | 410 | Core evaluation logic: fetches the question bank, handles student evaluation submissions (with input sanitization, spam detection, AI sentiment analysis, and anonymous encryption), retrieves faculty reports with category averages and AI-generated recommendations, returns student submission history, scopes enrolled instructors by subject, runs system-wide prescriptive analysis, and provides an admin clear-all function. |
| `dashboardController.js` | 182 | Generates dashboard statistics based on user role. For admins: total counts, system-wide sentiment overview, and department-by-department breakdowns (faculty count, average rating, sentiment, student populations by year level). For students: personal submission stats. For faculty: own rating, enrollment completion rates. |
| `facultyController.js` | ~100 | Simple controller to list all faculty members or retrieve a single faculty member's details. |
| `subjectController.js` | ~30 | Returns the list of all subjects/courses from the database. |

#### Models (Database Queries) — `backend/models/`

| File | What It Queries |
|------|----------------|
| `User.js` | Shared user operations across all 3 role tables (admins, faculty, students). Includes `findByEmail` (searches all 3 tables), `findById`, `create`, `findByVerificationToken`, `verifyEmail`, `updatePassword`, `findAllByRole`, `updateById`, and `deleteById`. |
| `Student.js` | Student-specific queries: `findById`, `findAll`, `count`, `findBySubject`, and `getPopulationByDepartment` (aggregates student counts and evaluation completion by department and year level). |
| `Faculty.js` | Faculty-specific queries: `findById` (with JOIN to subjects table for subject_code and subject_name), `findAll`, `findBySubject`, and `count`. |
| `Evaluation.js` | Evaluation CRUD: `create`, `findByFacultyId`, `findByStudentId`, `findAll` (with JOIN to faculty for department/name), `getAverageRating`, `getSentimentOverview`, `getStatsByDepartment`, `count`, `deleteAll`. |
| `EvaluationQuestion.js` | Retrieves active evaluation questions ordered by `sort_order`. |
| `EvaluationResponse.js` | Stores individual question responses: `createBulk` (batch insert), `getAveragesByFaculty` (averages per question with category grouping), and `deleteAll`. |
| `Subject.js` | Basic CRUD for the subjects table: `findAll`, `findById`. |
| `PasswordReset.js` | Manages temporary password reset tokens: `create`, `findByToken` (only non-expired), `deleteByEmail`. |

#### Middleware — `backend/middleware/`

| File | What It Does |
|------|-------------|
| `auth.js` | Two middleware functions: `authenticate` — extracts and verifies the JWT from the `Authorization: Bearer <token>` header, attaches `req.user` with `{id, email, role}`. `authorize(...roles)` — checks if `req.user.role` is in the allowed roles list, returns 403 if not. |

#### Utilities — `backend/utils/`

| File | Lines | What It Does |
|------|-------|-------------|
| `sentimentAnalyzer.js` | 702 | The AI engine. Trains a Naive Bayes classifier on startup using unigram+bigram tokenization. Exports 3 functions: `analyzeSentiment(text)` — classifies text as positive/neutral/negative with a confidence score; `generateRecommendations(evaluations)` — generates per-faculty prescriptive recommendations based on ratings, sentiment percentages, and keyword themes; `generateSystemRecommendations(allEvaluations, facultyList)` — generates institution-wide analysis including department insights, faculty flags, sentiment heatmaps, and trend detection. |
| `trainingData.js` | 700+ | Array of `[text, label]` pairs used to train the Naive Bayes classifier. Contains hundreds of examples in English, Filipino, and Taglish covering positive, negative, and neutral academic feedback. |
| `privacy.js` | 52 | Encryption utilities for student anonymity. Uses AES-256-GCM to encrypt student metadata into a versioned token (`v1.iv.tag.data`). Exports `buildAnonymousRespondentRef` (encrypts student ID) and `buildDecoupledSentimentText` (combines strengths/weaknesses text without any identity info for sentiment analysis). |

#### Configuration — `backend/config/`

| File | What It Does |
|------|-------------|
| `db.js` | Creates a MySQL2 connection pool using environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). Exports the pool and a `testConnection` function. |
| `email.js` | Configures Nodemailer with Gmail SMTP. Exports `sendVerificationEmail` and `sendPasswordResetEmail` functions that send HTML-formatted emails with token links. |

#### Routes — `backend/routes/`

| File | Endpoints Defined |
|------|-------------------|
| `authRoutes.js` | POST `/login`, POST `/register`, GET `/verify-email/:token`, POST `/forgot-password`, POST `/reset-password`, GET `/me`, PUT `/change-password`, GET `/admin/accounts`, GET `/admin/accounts/:id`, POST `/admin/accounts`, PUT `/admin/accounts/:id`, DELETE `/admin/accounts/:id` |
| `evaluationRoutes.js` | GET `/questions`, POST `/submit`, GET `/faculty/:id`, GET `/my-evaluations`, GET `/enrolled-instructors`, GET `/analysis`, GET `/my-report`, DELETE `/clear-all` |
| `dashboardRoutes.js` | GET `/stats`, GET `/faculty` |
| `facultyRoutes.js` | GET `/`, GET `/:id` |
| `subjectRoutes.js` | GET `/` |

---

### 10.2 Frontend Codebase (`frontend/src/`)

The frontend is a **React 19 + Vite 7** single-page application using TailwindCSS 4 for styling. It communicates with the backend via Axios HTTP requests.

#### Core Files

| File | What It Does |
|------|-------------|
| `main.jsx` | React entry point. Mounts the `<App />` component into the DOM root element. |
| `App.jsx` | Defines all client-side routes using React Router v7. Sets up the `AuthProvider` context wrapper. Routes include: public routes (login, forgot/reset password), protected routes wrapped in `<ProtectedRoute>` (dashboard, faculty list, reports, evaluation, change password, admin account management), and a `ReportsRouter` component that renders either `<FacultyReport>` or `<Reports>` based on the logged-in user's role. |
| `index.css` | Global CSS file. Imports TailwindCSS base, components, and utilities. Includes custom utility classes. |

#### Context & Hooks — `frontend/src/context/` and `frontend/src/hooks/`

| File | What It Does |
|------|-------------|
| `AuthContext.jsx` | React Context provider that manages global authentication state. On mount, checks if a saved JWT token in `localStorage` is still valid by calling `GET /api/auth/me`. Provides `user`, `token`, `loading`, `login()`, `logout()`, and `isAuthenticated` to all child components. Waits for auth check to complete before rendering children (prevents flicker). |
| `useAuth.js` | Custom hook that wraps `useContext(AuthContext)` for convenient access to auth state in any component. |

#### Services (API Calls) — `frontend/src/services/`

| File | What It Does |
|------|-------------|
| `api.js` | Creates a pre-configured Axios instance with base URL `/api`. Includes a request interceptor that attaches the JWT token from `localStorage` to every request's `Authorization` header. Includes a response interceptor that auto-redirects to `/login` and clears storage on any 401 response. |
| `authService.js` | API functions: `login(credentials)`, `register(data)`, `getProfile()`, `changePassword(data)`, `forgotPassword(email)`, `resetPassword(data)`. |
| `dashboardService.js` | API functions: `getStats()`, `getFacultyDashboard()`. |
| `evaluationService.js` | API functions: `getQuestions()`, `submitEvaluation(data)`, `getFacultyEvaluations(id)`, `getMyEvaluations()`, `getEnrolledInstructors()`, `getSystemAnalysis()`, `getMyReport()`, `clearAllEvaluations()`. |
| `facultyService.js` | API functions: `getAllFaculty()`, `getFacultyById(id)`. |
| `subjectService.js` | API functions: `getAllSubjects()`. |

#### Components (Reusable UI) — `frontend/src/components/`

| File | What It Does |
|------|-------------|
| `Layout.jsx` | Wrapper component that renders the `<Navbar>` above an `<Outlet>` (React Router's slot for child routes). Every protected page is rendered inside this layout. |
| `Navbar.jsx` | Navigation bar displayed on all authenticated pages. Shows different menu items based on user role (admin sees "Accounts", student sees "Evaluate", faculty sees "My Report"). Includes user name display, role badge, and logout button. Responsive with mobile menu toggle. |
| `ProtectedRoute.jsx` | Route guard component. Redirects unauthenticated users to `/login`. Optionally accepts a `roles` prop — if provided, checks if the current user's role is in the allowed list and redirects if not authorized. |

#### Pages — `frontend/src/pages/`

| File | Lines | What It Does |
|------|-------|-------------|
| `Login.jsx` | 140 | Login form with email/password fields. Calls `authService.login()`, stores JWT and user data in context, redirects to `/dashboard`. Shows validation errors. Links to forgot password and registration. |
| `Dashboard.jsx` | 650 | Role-aware dashboard. For **admin**: displays stat cards (total students, faculty, evaluations), system-wide sentiment bar, and per-department accordion panels showing faculty count, average rating, sentiment breakdown, and student population by year level with evaluation completion rates. For **student**: shows personal evaluation count, average rating given, and recent submissions. For **faculty**: shows overall rating, evaluation count, sentiment pie chart, and enrolled student completion stats. |
| `EvaluationForm.jsx` | 680 | Two-step evaluation flow. **Step 1**: Student selects a faculty member from their enrolled instructors (already-evaluated ones are disabled). **Step 2**: Renders all 15 rating questions grouped by 3 categories with dropdown selectors (1-5 scale), plus 2 open-ended text fields for strengths and weaknesses. Validates all fields, submits to the API, and shows a success confirmation with the AI sentiment result. |
| `Reports.jsx` | 640 | Admin system-wide analytics page. Displays: overall system health indicator, sentiment heatmap by department, faculty summary table (sortable by rating), faculty flags (needs attention / high performers), department insights with AI-detected keyword themes, system-wide trend analysis, and prescriptive recommendations. All data comes from the `/api/evaluation/analysis` endpoint. |
| `FacultyReport.jsx` | 370 | Individual faculty evaluation report. Shows: faculty name and department, overall average rating, total evaluations, sentiment overview chart (positive/neutral/negative), per-category average ratings, recent student feedback with sentiment labels, and AI-generated prescriptive recommendations. Used both for admin viewing (via `/reports/:id`) and faculty self-view (via `/reports` when logged in as faculty). |
| `FacultyList.jsx` | 130 | Simple page listing all faculty members with their name, department, and a "View Report" link. Used by admin to navigate to individual faculty reports. |
| `AdminAccounts.jsx` | 260 | Account management table. Tabs to switch between viewing admins, faculty, and students. Displays a searchable table with name, email, department, and action buttons (edit/delete). Links to create account and edit account pages. Includes delete confirmation dialog. |
| `CreateAccount.jsx` | 300 | Form to create new accounts. Dropdown to select role (admin/faculty/student). Dynamically shows relevant fields: department and subject for faculty; department, subject, year level, and section for students. Validates email format (@psu.edu.ph), password length, and required fields. |
| `EditAccount.jsx` | 270 | Pre-populated form to edit existing account details. Fetches current account data on load. Same dynamic field visibility as create form. Only allows editing permitted fields per role. |
| `ChangePassword.jsx` | 140 | Simple form with current password, new password, and confirm new password fields. Validates match and minimum length before submitting. |
| `ForgotPassword.jsx` | 80 | Form with email input. Sends password reset request to API. Shows success message regardless of whether email exists (security best practice). |
| `ResetPassword.jsx` | 120 | Form with new password and confirm password fields. Reads reset token from URL params. Validates and submits to reset password endpoint. |
| `VerifyEmail.jsx` | 80 | Auto-verifies email on page load using the token from the URL. Shows success or error message. Links to login page after verification. |

---

*Document generated for FEFAS Capstone Project — Pangasinan State University*
*Last updated: May 2026*
