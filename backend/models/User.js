const { pool } = require('../config/db');

const User = {
  // Create a new admin
  createAdmin: async ({ name, email, password, verification_token }) => {
    const [result] = await pool.execute(
      'INSERT INTO admins (name, email, password, verification_token) VALUES (?, ?, ?, ?)',
      [name, email, password, verification_token]
    );
    return result;
  },

  // Create a new faculty
  createFaculty: async ({ name, email, password, department, subject_id, verification_token }) => {
    const [result] = await pool.execute(
      'INSERT INTO faculty (name, email, password, department, subject_id, verification_token) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, password, department, subject_id || null, verification_token]
    );
    return result;
  },

  // Create a new student
  createStudent: async ({ name, email, password, year_level, section, department, subject_id, verification_token }) => {
    const [result] = await pool.execute(
      'INSERT INTO students (name, email, password, year_level, section, department, subject_id, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, year_level, section, department, subject_id || null, verification_token]
    );
    return result;
  },

  // Generic create method (determine role and create accordingly)
  create: async ({ name, email, password, role, verification_token, year_level, section, department, subject_id }) => {
    if (role === 'admin') {
      return User.createAdmin({ name, email, password, verification_token });
    } else if (role === 'faculty') {
      return User.createFaculty({ name, email, password, department, subject_id, verification_token });
    } else if (role === 'student') {
      return User.createStudent({ name, email, password, year_level, section, department, subject_id, verification_token });
    }
    throw new Error('Invalid role');
  },

  // Find user by email (searches all three tables)
  findByEmail: async (email) => {
    // Check admin table
    const [adminRows] = await pool.execute('SELECT *, "admin" as role FROM admins WHERE email = ?', [email]);
    if (adminRows.length > 0) return adminRows[0];

    // Check faculty table
    const [facultyRows] = await pool.execute('SELECT *, "faculty" as role FROM faculty WHERE email = ?', [email]);
    if (facultyRows.length > 0) return facultyRows[0];

    // Check student table
    const [studentRows] = await pool.execute('SELECT *, "student" as role FROM students WHERE email = ?', [email]);
    if (studentRows.length > 0) return studentRows[0];

    return null;
  },

  // Find user by ID and role (more efficient when you know the role)
  findById: async (id, role) => {
    if (role === 'admin') {
      const [rows] = await pool.execute('SELECT id, name, email, email_verified, created_at FROM admins WHERE id = ?', [id]);
      if (rows.length > 0) return { ...rows[0], role: 'admin' };
    } else if (role === 'faculty') {
      const [rows] = await pool.execute(
        `SELECT f.id, f.name, f.email, f.department, f.subject_id, s.code as subject_code, s.name as subject_name,
                f.email_verified, f.created_at
         FROM faculty f
         LEFT JOIN subjects s ON s.id = f.subject_id
         WHERE f.id = ?`,
        [id]
      );
      if (rows.length > 0) return { ...rows[0], role: 'faculty' };
    } else if (role === 'student') {
      const [rows] = await pool.execute(
        `SELECT st.id, st.name, st.email, st.year_level, st.section, st.department, st.subject_id,
                s.code as subject_code, s.name as subject_name, st.email_verified, st.created_at
         FROM students st
         LEFT JOIN subjects s ON s.id = st.subject_id
         WHERE st.id = ?`,
        [id]
      );
      if (rows.length > 0) return { ...rows[0], role: 'student' };
    }
    return null;
  },

  // Find user by verification token (searches all three tables)
  findByVerificationToken: async (token) => {
    // Check admin table
    const [adminRows] = await pool.execute('SELECT *, "admin" as role FROM admins WHERE verification_token = ?', [token]);
    if (adminRows.length > 0) return adminRows[0];

    // Check faculty table
    const [facultyRows] = await pool.execute('SELECT *, "faculty" as role FROM faculty WHERE verification_token = ?', [token]);
    if (facultyRows.length > 0) return facultyRows[0];

    // Check student table
    const [studentRows] = await pool.execute('SELECT *, "student" as role FROM students WHERE verification_token = ?', [token]);
    if (studentRows.length > 0) return studentRows[0];

    return null;
  },

  // Verify user email
  verifyEmail: async (id, role) => {
    let result;
    if (role === 'admin') {
      [result] = await pool.execute(
        'UPDATE admins SET email_verified = TRUE, verification_token = NULL WHERE id = ?',
        [id]
      );
    } else if (role === 'faculty') {
      [result] = await pool.execute(
        'UPDATE faculty SET email_verified = TRUE, verification_token = NULL WHERE id = ?',
        [id]
      );
    } else if (role === 'student') {
      [result] = await pool.execute(
        'UPDATE students SET email_verified = TRUE, verification_token = NULL WHERE id = ?',
        [id]
      );
    }
    return result;
  },

  // Update user password
  updatePassword: async (email, password) => {
    // Try updating in each table
    const [adminResult] = await pool.execute(
      'UPDATE admins SET password = ? WHERE email = ?',
      [password, email]
    );
    if (adminResult.affectedRows > 0) return adminResult;

    const [facultyResult] = await pool.execute(
      'UPDATE faculty SET password = ? WHERE email = ?',
      [password, email]
    );
    if (facultyResult.affectedRows > 0) return facultyResult;

    const [studentResult] = await pool.execute(
      'UPDATE students SET password = ? WHERE email = ?',
      [password, email]
    );
    return studentResult;
  },

  // Count users by role
  countByRole: async (role) => {
    let table = '';
    if (role === 'admin') table = 'admins';
    else if (role === 'faculty') table = 'faculty';
    else if (role === 'student') table = 'students';
    
    if (!table) return 0;
    
    const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
    return rows[0].count;
  },
};

module.exports = User;
