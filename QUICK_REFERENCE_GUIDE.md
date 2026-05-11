# FEFAS - Quick Reference Guide
## System Overview & Role Workflows

---

## System at a Glance

**FEFAS** is a Faculty Evaluation and Feedback Analysis System that enables students to evaluate faculty members while maintaining anonymity, with automated sentiment analysis and reporting.

```
┌──────────────────────────────────────────────────────────────┐
│                       FEFAS System                            │
├─────────────────────┬─────────────────────┬──────────────────┤
│   STUDENTS          │   FACULTY           │   ADMINS         │
├─────────────────────┼─────────────────────┼──────────────────┤
│ • Register/Login    │ • Login              │ • View Analytics │
│ • View Faculty      │ • View Evaluations   │ • Manage Faculty │
│ • Submit Evals      │ • Read Reports       │ • System Stats   │
│ • Change Password   │ • View Recommendations│ • Generate Reports│
│                     │ • Change Password    │                  │
└─────────────────────┴─────────────────────┴──────────────────┘
```

---

## Key Components

### Frontend (React)
```
Authentication          Main Application
├── Login              ├── Dashboard (role-specific)
├── Register           ├── Faculty List
├── Forgot Password    ├── Evaluation Form
└── Reset Password     ├── Reports & Analytics
                       └── Change Password
```

### Backend (Node.js/Express)
```
Core Routes
├── /api/auth          (Registration, Login, Password Reset)
├── /api/evaluations   (Submission, Retrieval, Analytics)
├── /api/dashboard     (Statistics, Analytics)
├── /api/faculty       (Faculty data & reports)
└── /api/subjects      (Subject information)
```

### Database (MySQL)
```
User Tables           Evaluation Tables       System Tables
├── admins            ├── evaluations         ├── password_resets
├── faculty           ├── evaluation_questions
├── students          └── evaluation_responses
└── subjects
```

---

## Student Workflow

### Step 1: Registration
```
Student visits /register
    ↓
Enters: Name, Email (@psu.edu.ph), Password
        Year Level, Section, Department, Subject
    ↓
System sends verification email
    ↓
Student clicks email link to verify account
    ↓
Account active → Ready to login
```

### Step 2: Login
```
Visits /login
    ↓
Enters email & password
    ↓
System validates credentials
    ↓
Issues JWT token (valid 7 days)
    ↓
Redirected to /dashboard
```

### Step 3: View Faculty
```
Clicks "Faculty List"
    ↓
System shows faculty in their subject
    ↓
Displays basic info: Name, Department, Subject
```

### Step 4: Submit Evaluation
```
Clicks "Evaluate Faculty"
    ↓
Selects faculty from dropdown
    ↓
Completes form:
  • Rates on 15 criteria (1-5 scale)
  • Provides text feedback
  • Adds strengths & weaknesses
    ↓
System analyzes sentiment (positive/neutral/negative)
    ↓
Generates anonymous reference (encrypted)
    ↓
Stores evaluation (never linked to student)
    ↓
Shows success confirmation
```

### Step 5: Track Activity
```
Dashboard shows:
  • Number of evaluations submitted
  • Faculty evaluated
  • Personal statistics
```

---

## Faculty Workflow

### Step 1: Login
```
Faculty visits /login
    ↓
Enters email & password
    ↓
Redirected to /reports (faculty dashboard)
```

### Step 2: View Evaluations
```
Dashboard displays:
  • Courses taught
  • Number of evaluations per course
```

### Step 3: Review Report
```
Clicks on specific course
    ↓
System displays analytics:

Category Ratings (Average 1-5):
  • Management of Teaching: 4.2/5
  • Content Knowledge: 4.5/5
  • Commitment & Transparency: 4.0/5

Sentiment Distribution:
  • Positive: 60%
  • Neutral: 30%
  • Negative: 10%

Common Themes:
  Strengths:
    • Clear explanations
    • Organized lectures
  
  Weaknesses:
    • Could use more examples
    • Sometimes rushes material

Recommendations:
  1. "Increase real-world examples in lectures"
  2. "Allocate more time for complex topics"
  3. "Hold more office hours for Q&A"
```

### Step 4: Review Comments
```
Can read anonymized feedback:
  • Comments are separated from identity
  • Identifies trends in student feedback
  • Prioritizes improvement areas
```

---

## Admin Workflow

### Step 1: Login
```
Admin visits /login
    ↓
Enters admin credentials
    ↓
Redirected to admin /dashboard
```

### Step 2: View System Analytics
```
Dashboard displays:

Overall Statistics:
  • Total Students: 150
  • Total Faculty: 25
  • Total Evaluations: 450
  • Avg Rating: 4.1/5

By Department:
  Computer Science:
    - Students: 50
    - Faculty: 10
    - Avg Rating: 4.2/5
  
  Information Technology:
    - Students: 100
    - Faculty: 15
    - Avg Rating: 4.0/5

Participation Metrics:
  • Evaluation Rate: 85%
  • Students Active: 128/150
```

### Step 3: Faculty Management
```
Can view:
  • Complete faculty list
  • Individual faculty analytics
  • Department assignments
  • Evaluation history
  
Can perform:
  • View detailed reports
  • Generate department comparisons
  • Export analytics
```

### Step 4: System Configuration
```
Can manage:
  • Evaluation questions
  • System settings
  • User accounts
  • Report generation
```

---

## Authentication & Security

### Registration Process
```
1. Validate Input
   ├── Email format (@psu.edu.ph only)
   ├── Password (min 6 characters)
   └── Required fields

2. Check for Duplicates
   └── Ensure email not already registered

3. Hash Password
   └── bcryptjs (10 salt rounds)

4. Create Account
   └── Store in appropriate table

5. Send Verification Email
   └── Contains verification link (no expiration)

6. User Verifies Email
   └── Account becomes active
```

### Login Security
```
1. Find user by email
2. Verify email is verified
3. Compare password with hash
4. Generate JWT token (expires 7 days)
5. Return token + user info
6. Store token in localStorage
7. Include token in all future API requests
```

### Password Reset Flow
```
1. User requests password reset
2. System generates reset token (crypto.randomBytes)
3. Token expires in 15 minutes
4. Email link sent to user
5. User clicks link within 15 minutes
6. Sets new password
7. Hash new password (bcryptjs)
8. Update in database
9. Delete used token
10. User logs in with new password
```

---

## Evaluation Anonymity

### How Anonymity Works

```
Student submits evaluation:
│
├─ Contains: Rating, Comments, Feedback
├─ Includes: Student ID (temporarily)
│
↓

System Processing:
├─ Extracts feedback text
├─ Performs sentiment analysis
├─ Generates anonymous reference:
│  └─ v1.{random_base64_string}
├─ Encrypts reference with AES-256-GCM
│
↓

Database Storage:
├─ Stores anonymous_student_ref (encrypted)
├─ Stores evaluation data
├─ Does NOT store direct link to student
│
↓

Faculty Access:
├─ Can see feedback & ratings
├─ Cannot identify who submitted
├─ Sees aggregated statistics
├─ Reads individual comments (anonymously)
│
↓

Student Cannot:
├─ Edit evaluation after submission
├─ See their own specific feedback
├─ Identify their own submission
```

---

## Sentiment Analysis

### Process Flow

```
Evaluation Submitted
    ↓
Extract Text Fields:
  • Comment
  • Strengths
  • Weaknesses
    ↓
Text Processing:
  • Tokenization (split into words)
  • Bigram extraction (word pairs)
  • Convert to feature vectors
    ↓
Naive Bayes Classifier:
  • Compare against training data
  • Calculate probabilities
  • Classify as positive/neutral/negative
    ↓
Generate Score:
  • Confidence level (0.0 - 1.0)
    ↓
Store Result:
  • Sentiment classification
  • Sentiment score
```

### Sentiment Categories

| Sentiment | Example |
|-----------|---------|
| **Positive** | "Excellent teacher, very helpful" |
| **Neutral** | "Covers material as expected" |
| **Negative** | "Difficult to understand, poor organization" |

---

## Database Relationships

### User Management
```
┌──────────────┐
│   admins     │  (System administrators)
├──────────────┤
│ id, name     │
│ email, pwd   │
└──────────────┘

┌──────────────┐
│   faculty    │  (Teachers - evaluated)
├──────────────┤
│ id, name     │
│ email, pwd   │
│ subject_id → subjects
└──────────────┘

┌──────────────┐
│   students   │  (Evaluators)
├──────────────┤
│ id, name     │
│ email, pwd   │
│ subject_id → subjects
└──────────────┘
```

### Evaluation Data
```
┌─────────────────────────────┐
│      evaluations            │
├─────────────────────────────┤
│ id                          │
│ student_id → students       │
│ faculty_id → faculty        │
│ rating, comment             │
│ sentiment, sentiment_score  │
│ anonymous_student_ref       │
│ created_at                  │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│   evaluation_responses      │
├─────────────────────────────┤
│ id                          │
│ evaluation_id → evaluations │
│ question_id → questions     │
│ rating OR text_response     │
└─────────────────────────────┘
           ↑
┌─────────────────────────────┐
│ evaluation_questions        │
├─────────────────────────────┤
│ id                          │
│ category                    │
│ question, question_type     │
│ sort_order                  │
└─────────────────────────────┘
```

---

## Question Structure

### Categories & Questions

**Category A: Management of Teaching and Learning** (6 questions)
- Comes to class on time
- Explains learning outcomes
- Maximizes learning time
- Facilitates critical thinking
- Guides independent learning
- Provides constructive feedback

**Category B: Content Knowledge, Pedagogy & Technology** (5 questions)
- Demonstrates subject knowledge
- Simplifies complex ideas
- Relates to real-world contexts
- Promotes active learning with ICT
- Uses appropriate assessments

**Category C: Commitment & Transparency** (4 questions)
- Recognizes student diversity
- Assists with learning challenges
- Provides immediate feedback
- Provides transparent grading criteria

**Open-Ended** (2 questions)
- What are faculty strengths?
- What are faculty weaknesses?

---

## Key Data Flows

### From Student to Faculty Feedback

```
STUDENT                    SYSTEM                    FACULTY
  │                          │                         │
  ├─ Submits Form ──────────→│                         │
  │ (name, rating, comment)  │                         │
  │                          ├─ Sentiment Analysis     │
  │                          ├─ Anonymization          │
  │                          ├─ Store in Database      │
  │                          │                         │
  │                          ├─ Aggregate Stats ──────→│
  │                          │  (no student identity)  │
  │                          │← Views Report           │
  │                          │  (Rating 4.2/5)         │
  │                          │  (Positive: 60%)        │
  │                          │  (Anonymous Comments)   │
```

### Analytics Generation

```
Multiple Evaluations          Aggregation              Faculty Report
│                             │                        │
├─ Eval 1: Rating 4           ├─ Sum all ratings       │
├─ Eval 2: Rating 5           ├─ Count total            │
├─ Eval 3: Rating 4           ├─ Calculate average     │
├─ Eval 4: Rating 3           │  (4+5+4+3)/4 = 4.0    ├─ Display 4.0/5
│                             │                        │
├─ Sentiment 1: Positive      ├─ Count by type         │
├─ Sentiment 2: Positive      ├─ Calculate percent     ├─ 75% Positive
├─ Sentiment 3: Neutral       │  3/4 = 75%             │
├─ Sentiment 4: Negative      │                        │
│                             ├─ Generate recs         │
│                             │                        ├─ Recommendations
```

---

## API Summary

### Quick Reference

**Authentication**
```
POST /api/auth/register         → Create account
POST /api/auth/login            → Login
GET  /api/auth/verify-email/:token → Verify email
POST /api/auth/forgot-password  → Request password reset
POST /api/auth/reset-password   → Reset password
POST /api/auth/change-password  → Change password (logged in)
GET  /api/auth/me              → Get current user (logged in)
```

**Evaluations**
```
POST /api/evaluations           → Submit evaluation
GET  /api/evaluations           → Get evaluations (logged in)
GET  /api/evaluations/:id       → Get specific evaluation
```

**Dashboard**
```
GET  /api/dashboard             → Get user dashboard
GET  /api/dashboard/faculty-list → Faculty statistics
```

**Faculty**
```
GET  /api/faculty               → List all faculty
GET  /api/faculty/:id           → Get faculty details
```

**Subjects**
```
GET  /api/subjects              → List all subjects
```

---

## Common Tasks

### How to Submit an Evaluation
1. Login as student
2. Click "Evaluate Faculty"
3. Select faculty from dropdown
4. Rate on 15 criteria (1-5)
5. Write strengths & weaknesses
6. Submit form
7. See confirmation

### How to View Evaluation Report (Faculty)
1. Login as faculty
2. System shows /reports page
3. Click on course/subject
4. View analytics dashboard
5. Review feedback (anonymized)
6. Read recommendations

### How to Reset Password
1. Go to /forgot-password
2. Enter email address
3. Check email for reset link
4. Click link within 15 minutes
5. Enter new password
6. Successfully reset
7. Login with new password

### How to Change Password (Logged In)
1. Login normally
2. Go to /change-password
3. Enter current password
4. Enter new password twice
5. Submit form
6. Password updated

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Email not verified" error | Didn't click verification link | Check email, click link |
| "Invalid password" | Wrong password | Use forgot password |
| Can't see evaluations | Not logged in | Login first |
| Report not showing | No evaluations yet | Wait for students to submit |
| Sentiment seems wrong | AI model accuracy | Feedback helps improve |
| Email not received | SMTP issue | Check email settings |

---

## Best Practices

### For Students
- ✓ Verify email immediately after registration
- ✓ Provide specific feedback in comments
- ✓ Be honest in evaluations
- ✓ Complete evaluations before deadline
- ✗ Don't share credentials
- ✗ Don't attempt to identify faculty from comments

### For Faculty
- ✓ Review all feedback regularly
- ✓ Focus on actionable recommendations
- ✓ Plan improvements based on feedback
- ✓ Share positive comments with students
- ✗ Don't try to identify anonymous students
- ✗ Don't ignore negative feedback

### For Admins
- ✓ Monitor system health regularly
- ✓ Ensure evaluations are happening
- ✓ Review system-wide trends
- ✓ Support faculty with analytics
- ✗ Don't compromise student anonymity
- ✗ Don't interfere with evaluations

---

## Contact & Support

For issues or questions:
- Check system documentation
- Review troubleshooting guide
- Contact system administrator
- Review API documentation for developers

---

**Version**: 1.0  
**Last Updated**: May 2, 2026  
**Status**: Complete
