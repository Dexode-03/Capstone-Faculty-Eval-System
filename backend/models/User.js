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

  // Create a new faculty (no subject_id — use Faculty.setSubjects after)
  createFaculty: async ({ name, email, password, department, verification_token }) => {
    const [result] = await pool.execute(
      'INSERT INTO faculty (name, email, password, department, verification_token) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, department, verification_token]
    );
    return result;
  },

  // Create a new student (no subject_id — use Student.setSubjects after)
  createStudent: async ({ name, email, password, year_level, section, department, verification_token }) => {
    const [result] = await pool.execute(
      'INSERT INTO students (name, email, password, year_level, section, department, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, year_level, section, department, verification_token]
    );
    return result;
  },

  // Generic create method (determine role and create accordingly)
  create: async ({ name, email, password, role, verification_token, year_level, section, department }) => {
    if (role === 'admin') {
      return User.createAdmin({ name, email, password, verification_token });
    } else if (role === 'faculty') {
      return User.createFaculty({ name, email, password, department, verification_token });
    } else if (role === 'student') {
      return User.createStudent({ name, email, password, year_level, section, department, verification_token });
    }
    throw new Error('Invalid role');
  },

  // Find user by email (searches all three tables)
  findByEmail: async (email) => {
    const [adminRows] = await pool.execute('SELECT *, "admin" as role FROM admins WHERE email = ?', [email]);
    if (adminRows.length > 0) return adminRows[0];

    const [facultyRows] = await pool.execute('SELECT *, "faculty" as role FROM faculty WHERE email = ?', [email]);
    if (facultyRows.length > 0) return facultyRows[0];

    const [studentRows] = await pool.execute('SELECT *, "student" as role FROM students WHERE email = ?', [email]);
    if (studentRows.length > 0) return studentRows[0];

    return null;
  },

  // Find user by ID and role
  findById: async (id, role) => {
    if (role === 'admin') {
      const [rows] = await pool.execute('SELECT id, name, email, email_verified, created_at FROM admins WHERE id = ?', [id]);
      if (rows.length > 0) return { ...rows[0], role: 'admin' };
    } else if (role === 'faculty') {
      const [rows] = await pool.execute(
        `SELECT f.id, f.name, f.email, f.department, f.email_verified, f.created_at,
                GROUP_CONCAT(DISTINCT s.id ORDER BY s.id) as subject_ids,
                GROUP_CONCAT(DISTINCT s.code ORDER BY s.id) as subject_codes,
                GROUP_CONCAT(DISTINCT s.name ORDER BY s.id SEPARATOR ', ') as subject_names
         FROM faculty f
         LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id
         LEFT JOIN subjects s ON s.id = fs.subject_id
         WHERE f.id = ?
         GROUP BY f.id`,
        [id]
      );
      if (rows.length > 0) return { ...rows[0], role: 'faculty' };
    } else if (role === 'student') {
      const [rows] = await pool.execute(
        `SELECT st.id, st.name, st.email, st.year_level, st.section, st.department,
                st.email_verified, st.created_at,
                GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
                GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
                GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names
         FROM students st
         LEFT JOIN student_subjects ss ON ss.student_id = st.id
         LEFT JOIN subjects s ON s.id = ss.subject_id
         WHERE st.id = ?
         GROUP BY st.id`,
        [id]
      );
      if (rows.length > 0) return { ...rows[0], role: 'student' };
    }
    return null;
  },

  // Find user by verification token
  findByVerificationToken: async (token) => {
    const [adminRows] = await pool.execute('SELECT *, "admin" as role FROM admins WHERE verification_token = ?', [token]);
    if (adminRows.length > 0) return adminRows[0];

    const [facultyRows] = await pool.execute('SELECT *, "faculty" as role FROM faculty WHERE verification_token = ?', [token]);
    if (facultyRows.length > 0) return facultyRows[0];

    const [studentRows] = await pool.execute('SELECT *, "student" as role FROM students WHERE verification_token = ?', [token]);
    if (studentRows.length > 0) return studentRows[0];

    return null;
  },

  // Verify user email
  verifyEmail: async (id, role) => {
    let result;
    if (role === 'admin') {
      [result] = await pool.execute('UPDATE admins SET email_verified = TRUE, verification_token = NULL WHERE id = ?', [id]);
    } else if (role === 'faculty') {
      [result] = await pool.execute('UPDATE faculty SET email_verified = TRUE, verification_token = NULL WHERE id = ?', [id]);
    } else if (role === 'student') {
      [result] = await pool.execute('UPDATE students SET email_verified = TRUE, verification_token = NULL WHERE id = ?', [id]);
    }
    return result;
  },

  // Update user password
  updatePassword: async (email, password) => {
    const [adminResult] = await pool.execute('UPDATE admins SET password = ? WHERE email = ?', [password, email]);
    if (adminResult.affectedRows > 0) return adminResult;

    const [facultyResult] = await pool.execute('UPDATE faculty SET password = ? WHERE email = ?', [password, email]);
    if (facultyResult.affectedRows > 0) return facultyResult;

    const [studentResult] = await pool.execute('UPDATE students SET password = ? WHERE email = ?', [password, email]);
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

  // ADMIN CRUD OPERATIONS

  // Find all accounts by role (with subjects for faculty/students)
  findAllByRole: async (role) => {
    let query = '';
    if (role === 'admin') {
      query = 'SELECT id, name, email, email_verified, created_at, updated_at FROM admins ORDER BY created_at DESC';
    } else if (role === 'faculty') {
      query = `SELECT f.id, f.name, f.email, f.department,
               GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
               GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
               GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names,
               f.email_verified, f.created_at, f.updated_at
               FROM faculty f
               LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id
               LEFT JOIN subjects s ON s.id = fs.subject_id
               GROUP BY f.id
               ORDER BY f.created_at DESC`;
    } else if (role === 'student') {
      query = `SELECT st.id, st.name, st.email, st.year_level, st.section, st.department,
               GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
               GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
               GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names,
               st.email_verified, st.created_at, st.updated_at
               FROM students st
               LEFT JOIN student_subjects ss ON ss.student_id = st.id
               LEFT JOIN subjects s ON s.id = ss.subject_id
               GROUP BY st.id
               ORDER BY st.created_at DESC`;
    }
    const [rows] = await pool.execute(query);
    return rows;
  },

  // Update account by ID and role
  updateById: async (id, role, updateData) => {
    const table = role === 'admin' ? 'admins' : role === 'faculty' ? 'faculty' : 'students';
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    if (fields.length === 0) throw new Error('No fields to update.');
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const [result] = await pool.execute(
      `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id]
    );
    return result;
  },

  // Delete account by ID and role
  deleteById: async (id, role) => {
    const table = role === 'admin' ? 'admins' : role === 'faculty' ? 'faculty' : 'students';
    const [result] = await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return result;
  },

  // Find all accounts by role with optional filters (Phase 1)
  findAllByRoleFiltered: async (role, filters = {}) => {
    const { department, year_level, section, search } = filters;
    const params = [];

    if (role === 'admin') {
      let query = 'SELECT id, name, email, email_verified, created_at, updated_at FROM admins WHERE 1=1';
      if (search) {
        query += ' AND (name LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      query += ' ORDER BY created_at DESC';
      const [rows] = await pool.execute(query, params);
      return rows;
    }

    if (role === 'faculty') {
      let query = `SELECT f.id, f.name, f.email, f.department,
               GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
               GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
               GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names,
               f.email_verified, f.created_at, f.updated_at
               FROM faculty f
               LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id
               LEFT JOIN subjects s ON s.id = fs.subject_id
               WHERE 1=1`;
      if (department) {
        query += ' AND f.department = ?';
        params.push(department);
      }
      if (search) {
        query += ' AND (f.name LIKE ? OR f.email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      query += ' GROUP BY f.id ORDER BY f.created_at DESC';
      const [rows] = await pool.execute(query, params);
      return rows;
    }

    if (role === 'student') {
      let query = `SELECT st.id, st.name, st.email, st.year_level, st.section, st.department,
               GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
               GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
               GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names,
               st.email_verified, st.created_at, st.updated_at
               FROM students st
               LEFT JOIN student_subjects ss ON ss.student_id = st.id
               LEFT JOIN subjects s ON s.id = ss.subject_id
               WHERE 1=1`;
      if (department) {
        query += ' AND st.department = ?';
        params.push(department);
      }
      if (year_level) {
        query += ' AND st.year_level = ?';
        params.push(year_level);
      }
      if (section) {
        query += ' AND st.section = ?';
        params.push(section);
      }
      if (search) {
        query += ' AND (st.name LIKE ? OR st.email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      query += ' GROUP BY st.id ORDER BY st.created_at DESC';
      const [rows] = await pool.execute(query, params);
      return rows;
    }

    return [];
  },

  // Get distinct filter values for populating dropdowns (Phase 1)
  getDistinctFilterValues: async (role) => {
    const result = { departments: [], yearLevels: [], sections: [] };

    if (role === 'faculty') {
      const [depts] = await pool.execute(
        'SELECT DISTINCT department FROM faculty WHERE department IS NOT NULL AND department != \'\' ORDER BY department ASC'
      );
      result.departments = depts.map(r => r.department);
    } else if (role === 'student') {
      const [depts] = await pool.execute(
        'SELECT DISTINCT department FROM students WHERE department IS NOT NULL AND department != \'\' ORDER BY department ASC'
      );
      result.departments = depts.map(r => r.department);

      const [years] = await pool.execute(
        'SELECT DISTINCT year_level FROM students WHERE year_level IS NOT NULL AND year_level != \'\' ORDER BY year_level ASC'
      );
      result.yearLevels = years.map(r => r.year_level);

      const [sects] = await pool.execute(
        'SELECT DISTINCT section FROM students WHERE section IS NOT NULL AND section != \'\' ORDER BY section ASC'
      );
      result.sections = sects.map(r => r.section);
    }

    return result;
  },
};

module.exports = User;
