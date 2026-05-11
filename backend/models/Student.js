const { pool } = require('../config/db');

const Student = {
  // Get all students with their subjects
  findAll: async () => {
    const [rows] = await pool.execute(
      `SELECT st.id, st.name, st.email, st.year_level, st.section, st.department,
              st.email_verified, st.created_at, st.updated_at,
              GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
              GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
              GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names
       FROM students st
       LEFT JOIN student_subjects ss ON ss.student_id = st.id
       LEFT JOIN subjects s ON s.id = ss.subject_id
       GROUP BY st.id
       ORDER BY st.name ASC`
    );
    return rows;
  },

  // Find student by ID with subjects
  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT st.id, st.name, st.email, st.year_level, st.section, st.department,
              st.email_verified, st.created_at, st.updated_at,
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
    return rows[0];
  },

  // Find student by email
  findByEmail: async (email) => {
    const [rows] = await pool.execute(
      `SELECT st.id, st.name, st.email, st.year_level, st.section, st.department,
              st.email_verified, st.created_at, st.updated_at,
              GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
              GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
              GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names
       FROM students st
       LEFT JOIN student_subjects ss ON ss.student_id = st.id
       LEFT JOIN subjects s ON s.id = ss.subject_id
       WHERE st.email = ?
       GROUP BY st.id`,
      [email]
    );
    return rows[0];
  },

  // Find students by department
  findByDepartment: async (department) => {
    const [rows] = await pool.execute(
      `SELECT st.id, st.name, st.email, st.year_level, st.section, st.department,
              GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
              GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
              GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names
       FROM students st
       LEFT JOIN student_subjects ss ON ss.student_id = st.id
       LEFT JOIN subjects s ON s.id = ss.subject_id
       WHERE st.department = ?
       GROUP BY st.id
       ORDER BY st.name ASC`,
      [department]
    );
    return rows;
  },

  // Find students by subject (through junction table)
  findBySubject: async (subject_id) => {
    const [rows] = await pool.execute(
      `SELECT st.id, st.name, st.email, st.year_level, st.section, st.department
       FROM students st
       INNER JOIN student_subjects ss ON ss.student_id = st.id
       WHERE ss.subject_id = ?
       ORDER BY st.name ASC`,
      [subject_id]
    );
    return rows;
  },

  // Count total students
  count: async () => {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM students');
    return rows[0].count;
  },

  // Count students by department
  countByDepartment: async (department) => {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM students WHERE department = ?',
      [department]
    );
    return rows[0].count;
  },

  // Get student population grouped by department and year level
  getPopulationByDepartment: async () => {
    const [rows] = await pool.execute(
      `SELECT
         st.department,
         st.year_level,
         GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') as subject_name,
         GROUP_CONCAT(DISTINCT s.code SEPARATOR ', ') as subject_code,
         COUNT(DISTINCT st.id) as total_students,
         COUNT(DISTINCT e.student_id) as evaluated_students
       FROM students st
       LEFT JOIN student_subjects ss ON ss.student_id = st.id
       LEFT JOIN subjects s ON s.id = ss.subject_id
       LEFT JOIN evaluations e ON e.student_id = st.id
       WHERE st.department IS NOT NULL
         AND st.year_level IS NOT NULL
       GROUP BY st.department, st.year_level
       ORDER BY st.department ASC, st.year_level ASC`
    );
    return rows;
  },

  // Set subjects for a student (replaces all existing)
  setSubjects: async (studentId, subjectIds) => {
    await pool.execute('DELETE FROM student_subjects WHERE student_id = ?', [studentId]);
    if (subjectIds && subjectIds.length > 0) {
      const values = subjectIds.map(sid => `(${parseInt(studentId)}, ${parseInt(sid)})`).join(', ');
      await pool.execute(`INSERT INTO student_subjects (student_id, subject_id) VALUES ${values}`);
    }
  },

  // Update student
  update: async (id, { name, department, year_level, section }) => {
    const [result] = await pool.execute(
      'UPDATE students SET name = ?, department = ?, year_level = ?, section = ? WHERE id = ?',
      [name, department, year_level, section, id]
    );
    return result;
  },

  // Delete student
  delete: async (id) => {
    const [result] = await pool.execute('DELETE FROM students WHERE id = ?', [id]);
    return result;
  },
};

module.exports = Student;
