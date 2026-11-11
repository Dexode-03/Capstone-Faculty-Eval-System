'use strict';

const DataArchiveService = require('../services/dataArchiveService');
const AcademicPeriod = require('../models/academicPeriod');
const { pool } = require('../config/db');

const DataArchiveController = {
  /**
   * List all periods with their evaluation counts and archive status
   * GET /api/archive/periods
   */
  listPeriodArchives: async (req, res) => {
    try {
      const periods = await AcademicPeriod.findAll();

      // Get count of evaluations per period
      const [counts] = await pool.execute(`
        SELECT academic_period_id, COUNT(*) as evaluation_count
        FROM evaluations
        GROUP BY academic_period_id
      `);

      const countMap = {};
      counts.forEach(c => {
        countMap[c.academic_period_id] = c.evaluation_count;
      });

      const result = periods.map(p => ({
        id: p.id,
        academic_year: p.academic_year,
        semester: p.semester,
        start_date: p.start_date,
        end_date: p.end_date,
        is_active: p.is_active,
        evaluation_count: countMap[p.id] || 0,
        is_archived: (countMap[p.id] || 0) === 0 && p.is_active === 0
      }));

      res.json(result);
    } catch (error) {
      console.error('listPeriodArchives error:', error);
      res.status(500).json({ message: error.message || 'Error fetching archive status.' });
    }
  },

  /**
   * Export archive snapshot for a period
   * GET /api/archive/export/:periodId
   */
  exportArchive: async (req, res) => {
    try {
      const periodId = parseInt(req.params.periodId, 10);
      if (!periodId) {
        return res.status(400).json({ message: 'Invalid academic period ID.' });
      }

      const snapshot = await DataArchiveService.exportPeriodArchive(periodId);

      const filename = `fefas_archive_${snapshot.academic_period.academic_year.replace(/\s+/g, '_')}_${snapshot.academic_period.semester.replace(/\s+/g, '_')}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(JSON.stringify(snapshot, null, 2));
    } catch (error) {
      console.error('exportArchive error:', error);
      res.status(error.status || 500).json({ message: error.message || 'Error exporting period archive.' });
    }
  },

  /**
   * Wipe evaluations for a closed period
   * DELETE /api/archive/wipe/:periodId
   */
  wipePeriod: async (req, res) => {
    try {
      const periodId = parseInt(req.params.periodId, 10);
      const { password, phrase, confirmation } = req.body;
      const confirmText = phrase || confirmation;

      if (!periodId) {
        return res.status(400).json({ message: 'Invalid academic period ID.' });
      }

      if (!password) {
        return res.status(400).json({ message: 'Administrator password is required to wipe archive data.' });
      }

      if (confirmText !== 'DELETE ARCHIVE EVALUATIONS') {
        return res.status(400).json({ message: 'Confirmation phrase "DELETE ARCHIVE EVALUATIONS" is required.' });
      }

      const ip = req.ip || req.connection.remoteAddress;
      const result = await DataArchiveService.wipePeriodEvaluations(periodId, req.user.id, password, ip);
      res.json(result);
    } catch (error) {
      console.error('wipePeriod error:', error);
      res.status(error.status || 500).json({ message: error.message || 'Error wiping period data.' });
    }
  },

  /**
   * Restore an archive snapshot
   * POST /api/archive/restore
   */
  restoreArchive: async (req, res) => {
    try {
      const archivePayload = req.body.archiveData || req.body;
      if (!archivePayload) {
        return res.status(400).json({ message: 'No archive snapshot payload provided.' });
      }

      const ip = req.ip || req.connection.remoteAddress;
      const result = await DataArchiveService.restorePeriodArchive(archivePayload, req.user.id, ip);
      res.json(result);
    } catch (error) {
      console.error('restoreArchive error:', error);
      res.status(error.status || 500).json({ message: error.message || 'Error restoring archive data.' });
    }
  }
};

module.exports = DataArchiveController;

