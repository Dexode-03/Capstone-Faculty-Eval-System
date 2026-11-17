const { pool } = require('../config/db');

const AcademicPeriod = {
  // Get all academic periods
  findAll: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_periods ORDER BY academic_year DESC, semester DESC'
    );
    return rows;
  },

  // Get active academic period
  getActive: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_periods WHERE is_active = 1 LIMIT 1'
    );
    return rows[0] || null;
  },

  // Find by ID
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_periods WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // Find by Academic Year and Semester
  findByYearAndSemester: async (academic_year, semester) => {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_periods WHERE academic_year = ? AND semester = ? LIMIT 1',
      [academic_year, semester]
    );
    return rows[0] || null;
  },

  // Create a new academic period
  create: async ({ academic_year, semester, start_date, end_date, is_active = 0 }) => {
    if (is_active) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute('UPDATE academic_periods SET is_active = 0');
        const [result] = await connection.execute(
          'INSERT INTO academic_periods (academic_year, semester, is_active, start_date, end_date) VALUES (?, ?, 1, ?, ?)',
          [academic_year, semester, start_date || null, end_date || null]
        );
        await connection.commit();
        return result;
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO academic_periods (academic_year, semester, is_active, start_date, end_date) VALUES (?, ?, 0, ?, ?)',
      [academic_year, semester, start_date || null, end_date || null]
    );
    return result;
  },

  // Update an academic period
  update: async (id, { academic_year, semester, start_date, end_date, is_active }) => {
    if (is_active === 1 || is_active === true) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute('UPDATE academic_periods SET is_active = 0 WHERE id != ?', [id]);
        const [result] = await connection.execute(
          'UPDATE academic_periods SET academic_year = ?, semester = ?, is_active = 1, start_date = ?, end_date = ? WHERE id = ?',
          [academic_year, semester, start_date || null, end_date || null, id]
        );
        await connection.commit();
        return result;
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    }

    const [result] = await pool.execute(
      'UPDATE academic_periods SET academic_year = ?, semester = ?, start_date = ?, end_date = ? WHERE id = ?',
      [academic_year, semester, start_date || null, end_date || null, id]
    );
    return result;
  },

  // Set a period as active (deactivates all others inside an atomic transaction)
  setActive: async (id) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Deactivate all
      await connection.execute('UPDATE academic_periods SET is_active = 0');
      // Activate the selected one
      const [result] = await connection.execute(
        'UPDATE academic_periods SET is_active = 1 WHERE id = ?',
        [id]
      );
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  // Count evaluations linked to this academic period
  countLinkedEvaluations: async (id) => {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM evaluations WHERE academic_period_id = ?',
      [id]
    );
    return rows[0].count;
  },

  // Delete an academic period
  delete: async (id) => {
    const [result] = await pool.execute(
      'DELETE FROM academic_periods WHERE id = ?',
      [id]
    );
    return result;
  },

  // Toggle evaluation_open on the active period
  toggleEvaluation: async (open) => {
    const [result] = await pool.execute(
      'UPDATE academic_periods SET evaluation_open = ? WHERE is_active = 1',
      [open ? 1 : 0]
    );
    return result;
  },

  // Check if evaluation is currently open
  isEvaluationOpen: async () => {
    const [rows] = await pool.execute(
      'SELECT evaluation_open FROM academic_periods WHERE is_active = 1 LIMIT 1'
    );
    return rows.length > 0 && Number(rows[0].evaluation_open) === 1;
  },

  // Get all active academic periods
  findActivePeriods: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_periods WHERE is_active = 1'
    );
    return rows;
  },

  /**
   * Finds the academic period immediately preceding the given (or active) period in chronological order (Task 3B.3 / FR-15).
   * @param {Object|number|string} [currentPeriod]
   * @returns {Promise<Object|null>}
   */
  getPreviousPeriod: async (currentPeriod = null) => {
    let target = currentPeriod;
    if (!target) {
      target = await AcademicPeriod.getActive();
    } else if (typeof target === 'number' || typeof target === 'string') {
      target = await AcademicPeriod.findById(target);
    }
    if (!target) return null;

    const all = await AcademicPeriod.findAll();
    if (!all || all.length <= 1) return null;

    const parsePeriodOrder = (p) => {
      if (p.start_date) {
        return new Date(p.start_date).getTime();
      }
      const startYear = parseInt(p.academic_year, 10) || 0;
      let semWeight = 1;
      const semStr = (p.semester || '').toLowerCase();
      if (semStr.includes('2nd') || semStr.includes('second')) semWeight = 2;
      else if (semStr.includes('mid') || semStr.includes('sum')) semWeight = 3;
      return (startYear * 10) + semWeight;
    };

    const targetWeight = parsePeriodOrder(target);

    const earlier = all.filter(p => {
      if (String(p.id) === String(target.id)) return false;
      const w = parsePeriodOrder(p);
      if (w < targetWeight) return true;
      if (w === targetWeight && Number(p.id) < Number(target.id)) return true;
      return false;
    });

    if (earlier.length === 0) return null;

    earlier.sort((a, b) => {
      const wa = parsePeriodOrder(a);
      const wb = parsePeriodOrder(b);
      if (wb !== wa) return wb - wa;
      return Number(b.id) - Number(a.id);
    });

    return earlier[0];
  },
};

module.exports = AcademicPeriod;
