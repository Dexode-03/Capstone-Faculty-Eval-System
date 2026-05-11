# CRUD Implementation Guide: Admin Account & Evaluation Management
**Faculty Evaluation System**
**Date: May 5, 2026**

---

## TABLE OF CONTENTS
1. [System Architecture Overview](#system-architecture-overview)
2. [Current Implementation Patterns](#current-implementation-patterns)
3. [Part A: Account Management CRUD](#part-a-account-management-crud)
4. [Part B: Evaluation Process Management CRUD](#part-b-evaluation-process-management-crud)
5. [Implementation Checklist](#implementation-checklist)

---

## SYSTEM ARCHITECTURE OVERVIEW

### Stack Information
- **Backend**: Node.js + Express.js
- **Database**: MySQL/MariaDB (mysql2/promise pool)
- **Frontend**: React with Vite
- **Authentication**: JWT + bcryptjs
- **API Style**: RESTful endpoints

### Key Directory Structure
```
backend/
├── models/          (Database queries and operations)
├── controllers/     (Business logic and request handlers)
├── routes/          (API endpoint definitions)
├── middleware/      (Auth verification, validation)
├── config/          (Database, email configuration)
└── utils/           (Helper functions)

frontend/
├── src/
│   ├── pages/       (React page components)
│   ├── services/    (API service calls)
│   ├── context/     (Global state management)
│   └── components/  (Reusable UI components)
```

### Database Tables (Relevant)
- `admins` - Admin user accounts
- `faculty` - Faculty user accounts
- `students` - Student user accounts
- `evaluation_questions` - Question templates for evaluations
- `evaluations` - Submitted evaluations
- `evaluation_responses` - Individual question responses

---

## CURRENT IMPLEMENTATION PATTERNS

### Pattern 1: Model Layer (Database Operations)
**File**: `backend/models/User.js`

Models use MySQL connection pool and return raw data:
```javascript
const User = {
  create: async ({ name, email, password, role, ... }) => {
    const [result] = await pool.execute(
      'INSERT INTO table_name (field1, field2) VALUES (?, ?)',
      [value1, value2]
    );
    return result; // { insertId, affectedRows }
  },

  findByEmail: async (email) => {
    const [rows] = await pool.execute(
      'SELECT * FROM table_name WHERE email = ?',
      [email]
    );
    return rows[0]; // First row or undefined
  }
};
```

### Pattern 2: Controller Layer (Business Logic)
**File**: `backend/controllers/authController.js`

Controllers validate input, call models, and return JSON responses:
```javascript
const register = async (req, res) => {
  try {
    // 1. Validate input
    if (!name || !email) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    // 2. Business logic (e.g., hash password)
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Call model
    const result = await User.create({ name, email, password: hashedPassword });

    // 4. Return response
    res.status(201).json({ message: 'Created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
```

### Pattern 3: Route Layer (Endpoint Mapping)
**File**: `backend/routes/authRoutes.js`

Routes map HTTP methods to controller functions:
```javascript
router.post('/create', authenticate, createController);
router.get('/:id', authenticate, getByIdController);
router.put('/:id', authenticate, updateController);
router.delete('/:id', authenticate, deleteController);
```

### Pattern 4: Authentication Middleware
**File**: `backend/middleware/auth.js`

Validates JWT and attaches user to request:
```javascript
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided.' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};
```

### Pattern 5: Frontend Service Layer
**File**: `backend/services/api.js`

Centralized API calls with axios:
```javascript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

export const apiCall = async (method, endpoint, data = null) => {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await axios({
      method,
      url: `${API_BASE}${endpoint}`,
      data,
      headers
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
```

---

## PART A: ACCOUNT MANAGEMENT CRUD

### A1. READ - List All Accounts (Admin Only)

#### 1.1 Backend Model - `backend/models/User.js`
```javascript
// Add this method to User object:
findAllByRole: async (role) => {
  const table = role === 'admin' ? 'admins' : role === 'faculty' ? 'faculty' : 'students';
  
  const [rows] = await pool.execute(
    `SELECT id, name, email, ${role === 'faculty' ? 'department, subject_id' : 
     role === 'student' ? 'year_level, section, department' : ''} 
     created_at FROM ${table} ORDER BY created_at DESC`
  );
  
  return rows;
},

findById: async (id, role) => {
  const table = role === 'admin' ? 'admins' : role === 'faculty' ? 'faculty' : 'students';
  
  const [rows] = await pool.execute(
    `SELECT * FROM ${table} WHERE id = ?`,
    [id]
  );
  
  return rows[0];
}
```

#### 1.2 Backend Controller - `backend/controllers/authController.js`
```javascript
/**
 * GET /api/admin/accounts?role=faculty
 * Admin retrieves all accounts by role
 */
const getAllAccounts = async (req, res) => {
  try {
    const { role } = req.query; // 'admin', 'faculty', 'student'
    
    // Authorization check
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    
    // Validation
    if (!role || !['admin', 'faculty', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Valid role required: admin, faculty, or student.' });
    }
    
    // Fetch accounts
    const accounts = await User.findAllByRole(role);
    
    res.json({ 
      success: true, 
      count: accounts.length,
      data: accounts 
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Server error fetching accounts.' });
  }
};

/**
 * GET /api/admin/accounts/:id
 * Admin retrieves single account details
 */
const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    
    if (!role || !['admin', 'faculty', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Valid role required.' });
    }
    
    const account = await User.findById(id, role);
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }
    
    res.json({ success: true, data: account });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
```

#### 1.3 Backend Routes - `backend/routes/authRoutes.js`
```javascript
// Add these routes:
router.get('/admin/accounts', authenticate, getAllAccounts);
router.get('/admin/accounts/:id', authenticate, getAccountById);
```

#### 1.4 Frontend Service - `frontend/src/services/authService.js`
```javascript
// Add these functions:
export const getAllAccounts = async (role) => {
  return apiCall('GET', `/api/auth/admin/accounts?role=${role}`);
};

export const getAccountById = async (id, role) => {
  return apiCall('GET', `/api/auth/admin/accounts/${id}?role=${role}`);
};
```

#### 1.5 Frontend Component - `frontend/src/pages/AdminAccounts.jsx`
```javascript
import { useState, useEffect } from 'react';
import { getAllAccounts } from '../services/authService';

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [role, setRole] = useState('faculty');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const result = await getAllAccounts(role);
        setAccounts(result.data || []);
      } catch (error) {
        console.error('Error:', error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccounts();
  }, [role]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Accounts</h1>
      
      <div className="mb-4">
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="faculty">Faculty</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Created</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <tr key={account.id}>
                <td className="border p-2">{account.id}</td>
                <td className="border p-2">{account.name}</td>
                <td className="border p-2">{account.email}</td>
                <td className="border p-2">{new Date(account.created_at).toLocaleDateString()}</td>
                <td className="border p-2">
                  <button className="text-blue-500 mr-2">Edit</button>
                  <button className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

### A2. CREATE - Add New Account

#### 2.1 Backend Model - `backend/models/User.js`
```javascript
// Already exists, but reference:
createAdmin: async ({ name, email, password, verification_token }) => {
  const [result] = await pool.execute(
    'INSERT INTO admins (name, email, password, verification_token) VALUES (?, ?, ?, ?)',
    [name, email, password, verification_token]
  );
  return result;
},

createFaculty: async ({ name, email, password, department, subject_id, verification_token }) => {
  const [result] = await pool.execute(
    'INSERT INTO faculty (name, email, password, department, subject_id, verification_token) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, password, department, subject_id || null, verification_token]
  );
  return result;
}
```

#### 2.2 Backend Controller - `backend/controllers/authController.js`
```javascript
/**
 * POST /api/admin/accounts
 * Admin creates a new account (any role)
 */
const adminCreateAccount = async (req, res) => {
  try {
    const { name, email, password, role, department, subject_id, year_level, section } = req.body;

    // Authorization
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    // Email format validation
    if (!email.endsWith('@psu.edu.ph')) {
      return res.status(400).json({ message: 'Only PSU email addresses (@psu.edu.ph) allowed.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const existingAccount = await User.findByEmail(email);
    if (existingAccount) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token (can be null if admin creates verified account)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create account based on role
    const result = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      verification_token: verificationToken,
      department: department || null,
      subject_id: subject_id || null,
      year_level: year_level || null,
      section: section || null
    });

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'Server error creating account.' });
  }
};
```

#### 2.3 Backend Routes - `backend/routes/authRoutes.js`
```javascript
router.post('/admin/accounts', authenticate, adminCreateAccount);
```

#### 2.4 Frontend Service - `frontend/src/services/authService.js`
```javascript
export const createAccount = async (accountData) => {
  return apiCall('POST', '/api/auth/admin/accounts', accountData);
};
```

#### 2.5 Frontend Component - `frontend/src/pages/CreateAccount.jsx`
```javascript
import { useState } from 'react';
import { createAccount } from '../services/authService';

export default function CreateAccount() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'faculty',
    department: '',
    subject_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createAccount(formData);
      setMessage('Account created successfully!');
      setFormData({ name: '', email: '', password: '', role: 'faculty', department: '', subject_id: '' });
    } catch (error) {
      setMessage(error.message || 'Error creating account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Account</h1>
      
      {message && <p className="mb-4 p-2 bg-gray-200 rounded">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="PSU Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password (min 6 chars)"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded"
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

        {formData.role === 'faculty' && (
          <input
            type="text"
            name="department"
            placeholder="Department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
```

---

### A3. UPDATE - Edit Account Details

#### 3.1 Backend Model - `backend/models/User.js`
```javascript
updateById: async (id, role, updateData) => {
  const table = role === 'admin' ? 'admins' : role === 'faculty' ? 'faculty' : 'students';
  
  // Build dynamic update query
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  
  if (fields.length === 0) {
    throw new Error('No fields to update.');
  }
  
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  
  const [result] = await pool.execute(
    `UPDATE ${table} SET ${setClause} WHERE id = ?`,
    [...values, id]
  );
  
  return result;
}
```

#### 3.2 Backend Controller - `backend/controllers/authController.js`
```javascript
/**
 * PUT /api/admin/accounts/:id
 * Admin updates account details
 */
const adminUpdateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query;
    const updateData = req.body;

    // Authorization
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    // Validation
    if (!role || !['admin', 'faculty', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Valid role required.' });
    }

    // Verify account exists
    const account = await User.findById(id, role);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    // Prevent field modification restrictions
    const allowedFields = {
      'admin': ['name', 'email'],
      'faculty': ['name', 'email', 'department', 'subject_id'],
      'student': ['name', 'email', 'year_level', 'section', 'department', 'subject_id']
    };

    // Filter out disallowed fields
    const filteredData = {};
    for (const key of allowedFields[role]) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    // Update account
    await User.updateById(id, role, filteredData);

    res.json({ success: true, message: 'Account updated successfully.' });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ message: 'Server error updating account.' });
  }
};
```

#### 3.3 Backend Routes - `backend/routes/authRoutes.js`
```javascript
router.put('/admin/accounts/:id', authenticate, adminUpdateAccount);
```

#### 3.4 Frontend Service
```javascript
export const updateAccount = async (id, role, updateData) => {
  return apiCall('PUT', `/api/auth/admin/accounts/${id}?role=${role}`, updateData);
};
```

---

### A4. DELETE - Remove Account

#### 4.1 Backend Model - `backend/models/User.js`
```javascript
deleteById: async (id, role) => {
  const table = role === 'admin' ? 'admins' : role === 'faculty' ? 'faculty' : 'students';
  
  const [result] = await pool.execute(
    `DELETE FROM ${table} WHERE id = ?`,
    [id]
  );
  
  return result;
}
```

#### 4.2 Backend Controller - `backend/controllers/authController.js`
```javascript
/**
 * DELETE /api/admin/accounts/:id
 * Admin deletes an account
 */
const adminDeleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query;

    // Authorization
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    // Validation
    if (!role || !['admin', 'faculty', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Valid role required.' });
    }

    // Verify account exists
    const account = await User.findById(id, role);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    // Prevent self-deletion
    if (req.user.id === parseInt(id) && req.user.role === role) {
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    }

    // Delete account
    await User.deleteById(id, role);

    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error deleting account.' });
  }
};
```

#### 4.3 Backend Routes
```javascript
router.delete('/admin/accounts/:id', authenticate, adminDeleteAccount);
```

#### 4.4 Frontend Service
```javascript
export const deleteAccount = async (id, role) => {
  return apiCall('DELETE', `/api/auth/admin/accounts/${id}?role=${role}`);
};
```

---

## PART B: EVALUATION PROCESS MANAGEMENT CRUD

### B1. READ - List All Evaluation Questions

#### 1.1 Backend Model - `backend/models/EvaluationQuestion.js`
```javascript
// Add methods to existing model:
findAll: async () => {
  const [rows] = await pool.execute(
    `SELECT * FROM evaluation_questions 
     ORDER BY category, sort_order ASC`
  );
  return rows;
},

findAllActive: async () => {
  const [rows] = await pool.execute(
    `SELECT * FROM evaluation_questions 
     WHERE is_active = 1 
     ORDER BY category, sort_order ASC`
  );
  return rows;
},

findByCategory: async (category) => {
  const [rows] = await pool.execute(
    `SELECT * FROM evaluation_questions 
     WHERE category = ? 
     ORDER BY sort_order ASC`,
    [category]
  );
  return rows;
},

findById: async (id) => {
  const [rows] = await pool.execute(
    `SELECT * FROM evaluation_questions WHERE id = ?`,
    [id]
  );
  return rows[0];
}
```

#### 1.2 Backend Controller - `backend/controllers/evaluationController.js`
```javascript
/**
 * GET /api/evaluation/admin/questions
 * Admin views all evaluation questions
 */
const adminGetAllQuestions = async (req, res) => {
  try {
    // Authorization
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const questions = await EvaluationQuestion.findAll();

    // Group by category
    const grouped = {};
    questions.forEach(q => {
      if (!grouped[q.category]) {
        grouped[q.category] = {
          description: q.category_description,
          questions: []
        };
      }
      grouped[q.category].questions.push(q);
    });

    res.json({
      success: true,
      count: questions.length,
      data: questions,
      grouped: grouped
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/evaluation/admin/questions/:id
 * Admin views single question
 */
const adminGetQuestionById = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { id } = req.params;
    const question = await EvaluationQuestion.findById(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    res.json({ success: true, data: question });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
```

#### 1.3 Backend Routes - `backend/routes/evaluationRoutes.js`
```javascript
router.get('/admin/questions', authenticate, adminGetAllQuestions);
router.get('/admin/questions/:id', authenticate, adminGetQuestionById);
```

---

### B2. CREATE - Add Evaluation Question

#### 2.1 Backend Model - `backend/models/EvaluationQuestion.js`
```javascript
create: async ({ category, category_description, question, question_type, sort_order }) => {
  const [result] = await pool.execute(
    `INSERT INTO evaluation_questions 
     (category, category_description, question, question_type, sort_order, is_active) 
     VALUES (?, ?, ?, ?, ?, 1)`,
    [category, category_description || null, question, question_type || 'rating', sort_order || 0]
  );
  return result;
}
```

#### 2.2 Backend Controller - `backend/controllers/evaluationController.js`
```javascript
/**
 * POST /api/evaluation/admin/questions
 * Admin creates a new evaluation question
 */
const adminCreateQuestion = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { category, category_description, question, question_type, sort_order } = req.body;

    // Validation
    if (!category || !question) {
      return res.status(400).json({ message: 'Category and question text are required.' });
    }

    const validTypes = ['rating', 'text'];
    if (question_type && !validTypes.includes(question_type)) {
      return res.status(400).json({ message: 'Question type must be "rating" or "text".' });
    }

    if (question.length < 5) {
      return res.status(400).json({ message: 'Question must be at least 5 characters.' });
    }

    // Create question
    const result = await EvaluationQuestion.create({
      category,
      category_description,
      question,
      question_type: question_type || 'rating',
      sort_order: sort_order || 0
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
```

#### 2.3 Backend Routes
```javascript
router.post('/admin/questions', authenticate, adminCreateQuestion);
```

#### 2.4 Frontend Service - `frontend/src/services/evaluationService.js`
```javascript
export const createEvaluationQuestion = async (questionData) => {
  return apiCall('POST', '/api/evaluation/admin/questions', questionData);
};
```

#### 2.5 Frontend Component - `frontend/src/pages/AdminQuestions.jsx`
```javascript
import { useState } from 'react';
import { createEvaluationQuestion } from '../services/evaluationService';

export default function CreateQuestion() {
  const [form, setForm] = useState({
    category: '',
    category_description: '',
    question: '',
    question_type: 'rating',
    sort_order: 0
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEvaluationQuestion(form);
      setMessage('Question created successfully!');
      setForm({ category: '', category_description: '', question: '', question_type: 'rating', sort_order: 0 });
    } catch (error) {
      setMessage(error.message || 'Error creating question.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Evaluation Question</h1>
      
      {message && <p className="mb-4 p-2 bg-gray-200 rounded">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="category"
          placeholder="Category (e.g., A. Management of Teaching)"
          value={form.category}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded"
        />

        <textarea
          name="category_description"
          placeholder="Category description (optional)"
          value={form.category_description}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border rounded"
        />

        <textarea
          name="question"
          placeholder="Question text"
          value={form.question}
          onChange={handleChange}
          required
          rows="2"
          className="w-full px-3 py-2 border rounded"
        />

        <select
          name="question_type"
          value={form.question_type}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="rating">Rating (1-5)</option>
          <option value="text">Text Response</option>
        </select>

        <input
          type="number"
          name="sort_order"
          placeholder="Sort order"
          value={form.sort_order}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          Create Question
        </button>
      </form>
    </div>
  );
}
```

---

### B3. UPDATE - Edit Evaluation Question

#### 3.1 Backend Model - `backend/models/EvaluationQuestion.js`
```javascript
updateById: async (id, updateData) => {
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  
  if (fields.length === 0) {
    throw new Error('No fields to update.');
  }
  
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  
  const [result] = await pool.execute(
    `UPDATE evaluation_questions SET ${setClause} WHERE id = ?`,
    [...values, id]
  );
  
  return result;
}
```

#### 3.2 Backend Controller - `backend/controllers/evaluationController.js`
```javascript
/**
 * PUT /api/evaluation/admin/questions/:id
 * Admin updates evaluation question
 */
const adminUpdateQuestion = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Verify question exists
    const question = await EvaluationQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    // Allowed fields
    const allowedFields = ['category', 'category_description', 'question', 'question_type', 'sort_order', 'is_active'];
    
    // Filter data
    const filteredData = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    // Update
    await EvaluationQuestion.updateById(id, filteredData);

    res.json({ success: true, message: 'Question updated successfully.' });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
```

#### 3.3 Backend Routes
```javascript
router.put('/admin/questions/:id', authenticate, adminUpdateQuestion);
```

---

### B4. DELETE - Remove Evaluation Question

#### 4.1 Backend Model - `backend/models/EvaluationQuestion.js`
```javascript
deleteById: async (id) => {
  const [result] = await pool.execute(
    `DELETE FROM evaluation_questions WHERE id = ?`,
    [id]
  );
  return result;
},

// Alternative: Soft delete (mark as inactive)
deactivateById: async (id) => {
  const [result] = await pool.execute(
    `UPDATE evaluation_questions SET is_active = 0 WHERE id = ?`,
    [id]
  );
  return result;
}
```

#### 4.2 Backend Controller - `backend/controllers/evaluationController.js`
```javascript
/**
 * DELETE /api/evaluation/admin/questions/:id
 * Admin deletes evaluation question (soft delete recommended)
 */
const adminDeleteQuestion = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { id } = req.params;

    // Verify question exists
    const question = await EvaluationQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    // Check if question is used in active evaluations
    const [activeEvals] = await pool.execute(
      `SELECT COUNT(*) as count FROM evaluation_responses 
       WHERE question_id = ? AND evaluation_id IN 
       (SELECT id FROM evaluations WHERE created_at > DATE_SUB(NOW(), INTERVAL 3 MONTH))`,
      [id]
    );

    if (activeEvals[0].count > 0) {
      // Soft delete instead
      await EvaluationQuestion.deactivateById(id);
      return res.json({ 
        success: true, 
        message: 'Question deactivated (used in recent evaluations).',
        method: 'soft-delete'
      });
    }

    // Hard delete if not recently used
    await EvaluationQuestion.deleteById(id);

    res.json({ 
      success: true, 
      message: 'Question deleted successfully.',
      method: 'hard-delete'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
```

#### 4.3 Backend Routes
```javascript
router.delete('/admin/questions/:id', authenticate, adminDeleteQuestion);
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Backend Setup (Estimated 2-3 hours)
- [ ] Add all model methods to `backend/models/User.js`
- [ ] Add all model methods to `backend/models/EvaluationQuestion.js`
- [ ] Add all controller functions to `backend/controllers/authController.js`
- [ ] Add all controller functions to `backend/controllers/evaluationController.js`
- [ ] Add all routes to `backend/routes/authRoutes.js`
- [ ] Add all routes to `backend/routes/evaluationRoutes.js`
- [ ] Test all API endpoints using Postman or REST client
- [ ] Verify error handling and validation

### Phase 2: Frontend Setup (Estimated 2-3 hours)
- [ ] Update `frontend/src/services/authService.js` with new functions
- [ ] Update `frontend/src/services/evaluationService.js` with new functions
- [ ] Create admin pages: AdminAccounts.jsx, CreateAccount.jsx
- [ ] Create evaluation pages: AdminQuestions.jsx, EditQuestion.jsx
- [ ] Add navigation menu items for admin features
- [ ] Integrate components into main App.jsx routing
- [ ] Test UI flows end-to-end

### Phase 3: Security & Testing (Estimated 1-2 hours)
- [ ] Verify authentication middleware on all routes
- [ ] Test authorization (admin-only endpoints)
- [ ] Test input validation and error messages
- [ ] Test data consistency (no orphaned records)
- [ ] Perform SQL injection tests
- [ ] Test CORS headers
- [ ] Load testing with multiple concurrent requests

### Phase 4: Documentation & Deployment (Estimated 1 hour)
- [ ] Update API documentation
- [ ] Add comments to new code
- [ ] Create deployment checklist
- [ ] Deploy to staging environment
- [ ] Final UAT testing
- [ ] Deploy to production

---

## API ENDPOINTS SUMMARY

### Account Management
```
GET    /api/auth/admin/accounts?role=faculty          - List all accounts by role
GET    /api/auth/admin/accounts/:id?role=faculty      - Get single account
POST   /api/auth/admin/accounts                        - Create new account
PUT    /api/auth/admin/accounts/:id?role=faculty      - Update account
DELETE /api/auth/admin/accounts/:id?role=faculty      - Delete account
```

### Evaluation Management
```
GET    /api/evaluation/admin/questions                - List all questions
GET    /api/evaluation/admin/questions/:id            - Get single question
POST   /api/evaluation/admin/questions                - Create question
PUT    /api/evaluation/admin/questions/:id            - Update question
DELETE /api/evaluation/admin/questions/:id            - Delete question
```

---

## ERROR HANDLING PATTERNS

All responses follow this structure:

**Success Response (2xx)**
```json
{
  "success": true,
  "message": "Operation successful.",
  "data": { /* response data */ },
  "count": 5
}
```

**Error Response (4xx/5xx)**
```json
{
  "success": false,
  "message": "Error description.",
  "errorCode": "VALIDATION_ERROR"
}
```

**Standard HTTP Status Codes**
- `200` - OK (GET, PUT successful)
- `201` - Created (POST successful)
- `204` - No Content (DELETE successful)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Server Error

---

## SECURITY BEST PRACTICES IMPLEMENTED

1. **Authentication**: JWT tokens required for all admin operations
2. **Authorization**: Role-based access control (admin-only endpoints)
3. **Input Validation**: Required fields, type checking, length limits
4. **Password Security**: Bcrypt hashing with salt
5. **Email Validation**: PSU email domain restriction
6. **SQL Injection Prevention**: Parameterized queries (?)
7. **Self-deletion Prevention**: Users cannot delete their own accounts
8. **Soft Deletes**: Questions deactivated if used in recent evaluations

---

## TESTING EXAMPLE (Using cURL or REST Client)

### Create Account
```bash
curl -X POST http://localhost:5000/api/auth/admin/accounts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. John Smith",
    "email": "john.smith@psu.edu.ph",
    "password": "SecurePassword123",
    "role": "faculty",
    "department": "Computer Science"
  }'
```

### List Faculty Accounts
```bash
curl -X GET "http://localhost:5000/api/auth/admin/accounts?role=faculty" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Evaluation Question
```bash
curl -X POST http://localhost:5000/api/evaluation/admin/questions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "A. Management of Teaching",
    "question": "Comes to class on time.",
    "question_type": "rating",
    "sort_order": 1
  }'
```

---

**Document Version**: 1.0  
**Last Updated**: May 5, 2026  
**Status**: Ready for Implementation
