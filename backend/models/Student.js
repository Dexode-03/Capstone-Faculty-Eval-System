const { pool } = require('../config/db');

const Student = {
  // Get all students with subject info
  findAll: async () => {
    const [rows] = await pool.execute(
      `SELECT st.*, s.code as subject_code, s.name as subject_name
       FROM students st
       LEFT JOIN subjects s ON s.id = st.subject_id
       ORDER BY st.name ASC`
    );
    return rows;
  },

  // Find student by ID with subject info
  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT st.*, s.code as subject_code, s.name as subject_name
       FROM students st
       LEFT JOIN subjects s ON s.id = st.subject_id
       WHERE st.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Find student by email
  findByEmail: async (email) => {
    const [rows] = await pool.execute(
      `SELECT st.*, s.code as subject_code, s.name as subject_name
       FROM students st
       LEFT JOIN subjects s ON s.id = st.subject_id
       WHERE st.email = ?`,
      [email]
    );
    return rows[0];
  },

  // Find students by department
  findByDepartment: async (department) => {
    const [rows] = await pool.execute(
      `SELECT st.*, s.code as subject_code, s.name as subject_name
       FROM students st
       LEFT JOIN subjects s ON s.id = st.subject_id
       WHERE st.department = ?
       ORDER BY st.name ASC`,
      [department]
    );
    return rows;
  },

  // Find students by subject
  findBySubject: async (subject_id) => {
    const [rows] = await pool.execute(
      `SELECT st.*, s.code as subject_code, s.name as subject_name
       FROM students st
       LEFT JOIN subjects s ON s.id = st.subject_id
       WHERE st.subject_id = ?
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
         s.name as subject_name,
         s.code as subject_code,
         COUNT(DISTINCT st.id) as total_students,
         COUNT(DISTINCT e.student_id) as evaluated_students
       FROM students st
       LEFT JOIN subjects s ON s.id = st.subject_id
       LEFT JOIN evaluations e ON e.student_id = st.id
       WHERE st.department IS NOT NULL
         AND st.year_level IS NOT NULL
       GROUP BY st.department, st.year_level, st.subject_id
       ORDER BY st.department ASC, st.year_level ASC`
    );
    return rows;
  },

  // Update student
  update: async (id, { name, department, year_level, section, subject_id }) => {
    const [result] = await pool.execute(
      'UPDATE students SET name = ?, department = ?, year_level = ?, section = ?, subject_id = ? WHERE id = ?',
      [name, department, year_level, section, subject_id || null, id]
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
