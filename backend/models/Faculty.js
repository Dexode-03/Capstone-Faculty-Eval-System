const { pool } = require('../config/db');

const Faculty = {
  // Get all faculty members with their subjects
  findAll: async () => {
    const [rows] = await pool.execute(
      `SELECT f.id, f.name, f.email, f.department, f.email_verified, f.created_at, f.updated_at,
              GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
              GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
              GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names
       FROM faculty f
       LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id
       LEFT JOIN subjects s ON s.id = fs.subject_id
       GROUP BY f.id
       ORDER BY f.name ASC`
    );
    return rows;
  },

  // Find faculty by department
  findByDepartment: async (department) => {
    const [rows] = await pool.execute(
      `SELECT f.id, f.name, f.email, f.department, f.email_verified, f.created_at, f.updated_at,
              GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
              GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
              GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names
       FROM faculty f
       LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id
       LEFT JOIN subjects s ON s.id = fs.subject_id
       WHERE f.department = ?
       GROUP BY f.id
       ORDER BY f.name ASC`,
      [department]
    );
    return rows;
  },

  // Find faculty by ID with all subjects
  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT f.id, f.name, f.email, f.department, f.email_verified, f.created_at, f.updated_at,
              GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
              GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
              GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names
       FROM faculty f
       LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id
       LEFT JOIN subjects s ON s.id = fs.subject_id
       WHERE f.id = ?
       GROUP BY f.id`,
      [id]
    );
    return rows[0];
  },

  // Find faculty by email
  findByEmail: async (email) => {
    const [rows] = await pool.execute(
      `SELECT f.id, f.name, f.email, f.department, f.email_verified, f.created_at, f.updated_at,
              GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
              GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
              GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names
       FROM faculty f
       LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id
       LEFT JOIN subjects s ON s.id = fs.subject_id
       WHERE f.email = ?
       GROUP BY f.id`,
      [email]
    );
    return rows[0];
  },

  // Find faculty by subject (through junction table)
  findBySubject: async (subject_id) => {
    const [rows] = await pool.execute(
      `SELECT f.id, f.name, f.email, f.department,
              GROUP_CONCAT(s.id ORDER BY s.id) as subject_ids,
              GROUP_CONCAT(s.code ORDER BY s.id) as subject_codes,
              GROUP_CONCAT(s.name ORDER BY s.id SEPARATOR ', ') as subject_names
       FROM faculty f
       INNER JOIN faculty_subjects fs ON fs.faculty_id = f.id
       LEFT JOIN subjects s ON s.id = fs.subject_id
       WHERE f.id IN (SELECT faculty_id FROM faculty_subjects WHERE subject_id = ?)
       GROUP BY f.id
       ORDER BY f.name ASC`,
      [subject_id]
    );
    return rows;
  },

  // Count total faculty
  count: async () => {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM faculty');
    return rows[0].count;
  },

  // Set subjects for a faculty member (replaces all existing)
  // Accepts either:
  //   - Plain IDs: [1, 2, 3]
  //   - Enriched objects: [{ subject_id: 1, section: 'A', year_level: '4th Year', semester: '1st' }]
  setSubjects: async (facultyId, subjectData) => {
    // Remove old assignments
    await pool.execute('DELETE FROM faculty_subjects WHERE faculty_id = ?', [facultyId]);
    // Insert new assignments
    if (subjectData && subjectData.length > 0) {
      const values = subjectData.map(item => {
        if (typeof item === 'object' && item !== null && item.subject_id !== undefined) {
          // Enriched format
          const sid = parseInt(item.subject_id);
          const section = item.section ? `'${item.section}'` : 'NULL';
          return `(${parseInt(facultyId)}, ${sid}, ${section})`;
        } else {
          // Plain ID format (backward compatible)
          return `(${parseInt(facultyId)}, ${parseInt(item)}, NULL)`;
        }
      }).join(', ');
      await pool.execute(
        `INSERT INTO faculty_subjects (faculty_id, subject_id, section) VALUES ${values}`
      );
    }
  },

  // Get enriched subject assignments for a faculty member
  getSubjectAssignments: async (facultyId) => {
    const [rows] = await pool.execute(
      `SELECT fs.subject_id, fs.section, s.year_level, s.semester,
              s.code as subject_code, s.name as subject_name
       FROM faculty_subjects fs
       INNER JOIN subjects s ON s.id = fs.subject_id
       WHERE fs.faculty_id = ?
       ORDER BY s.id ASC`,
      [facultyId]
    );
    return rows;
  },

  // Get ALL subject assignments for ALL faculty members
  getAllSubjectAssignments: async () => {
    const [rows] = await pool.execute(
      `SELECT fs.faculty_id, fs.subject_id, fs.section, s.year_level, s.semester,
              f.name as faculty_name, s.code as subject_code, s.name as subject_name
       FROM faculty_subjects fs
       INNER JOIN faculty f ON f.id = fs.faculty_id
       INNER JOIN subjects s ON s.id = fs.subject_id
       ORDER BY s.id ASC`
    );
    return rows;
  },

  // Update faculty
  update: async (id, { name, department }) => {
    const [result] = await pool.execute(
      'UPDATE faculty SET name = ?, department = ? WHERE id = ?',
      [name, department, id]
    );
    return result;
  },

  // Delete faculty
  delete: async (id) => {
    const [result] = await pool.execute('DELETE FROM faculty WHERE id = ?', [id]);
    return result;
  },
};

module.exports = Faculty;