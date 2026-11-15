'use strict';

const crypto = require('crypto');
const { pool } = require('../config/db');
const AcademicPeriod = require('../models/AcademicPeriod');
const AuditLog = require('../models/auditLog');
const bcrypt = require('bcryptjs');

/**
 * Service to handle Granular Per-Period Archiving:
 * 1. Export: Full snapshot of period evaluations, responses, and submissions ledger with SHA-256 checksum.
 * 2. Wipe: Safe purge of evaluation data for closed historical periods (frees storage while keeping period metadata).
 * 3. Restore: Re-imports snapshot with referential integrity verification inside an atomic transaction.
 */
const DataArchiveService = {
  /**
   * Export archive snapshot for an academic period.
   * @param {number} academicPeriodId
   * @returns {Promise<Object>} Snapshot object
   */
  exportPeriodArchive: async (academicPeriodId) => {
    const period = await AcademicPeriod.findById(academicPeriodId);
    if (!period) {
      const err = new Error('Academic period not found.');
      err.status = 404;
      throw err;
    }

    // 1. Fetch evaluations
    const [evaluations] = await pool.execute(
      `SELECT * FROM evaluations WHERE academic_period_id = ? ORDER BY id ASC`,
      [academicPeriodId]
    );

    const evalIds = evaluations.map(e => e.id);

    // 2. Fetch responses
    let responses = [];
    if (evalIds.length > 0) {
      // Chunking if many evaluations exist
      const placeholders = evalIds.map(() => '?').join(',');
      const [respRows] = await pool.execute(
        `SELECT * FROM evaluation_responses WHERE evaluation_id IN (${placeholders}) ORDER BY id ASC`,
        evalIds
      );
      responses = respRows;
    }

    // 3. Fetch submissions ledger
    const [submissions] = await pool.execute(
      `SELECT * FROM evaluation_submissions WHERE academic_period_id = ? ORDER BY id ASC`,
      [academicPeriodId]
    );

    const dataPayload = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      academic_period: {
        id: period.id,
        academic_year: period.academic_year,
        semester: period.semester,
        start_date: period.start_date,
        end_date: period.end_date,
        is_active: period.is_active
      },
      counts: {
        evaluations: evaluations.length,
        evaluation_responses: responses.length,
        evaluation_submissions: submissions.length
      },
      evaluations,
      evaluation_responses: responses,
      evaluation_submissions: submissions
    };

    // Calculate SHA-256 checksum of payload content for verification
    const contentString = JSON.stringify({
      academic_period: dataPayload.academic_period,
      evaluations: dataPayload.evaluations,
      evaluation_responses: dataPayload.evaluation_responses,
      evaluation_submissions: dataPayload.evaluation_submissions
    });
    const checksum = crypto.createHash('sha256').update(contentString).digest('hex');
    dataPayload.checksum = checksum;

    return dataPayload;
  },

  /**
   * Safe wipe of evaluations for a closed academic period.
   * @param {number} academicPeriodId
   * @param {number} adminId
   * @param {string} confirmationPassword
   * @param {string} ipAddress
   * @returns {Promise<Object>} Deletion summary
   */
  wipePeriodEvaluations: async (academicPeriodId, adminId, confirmationPassword, ipAddress = '127.0.0.1') => {
    // 1. Verify admin password
    const [adminRows] = await pool.execute('SELECT * FROM admins WHERE id = ?', [adminId]);
    const admin = adminRows[0];
    if (!admin) {
      const err = new Error('Unauthorized. Only administrators can wipe archived periods.');
      err.status = 403;
      throw err;
    }

    const isMatch = await bcrypt.compare(confirmationPassword, admin.password);
    if (!isMatch) {
      const err = new Error('Invalid administrator password confirmation.');
      err.status = 401;
      throw err;
    }

    // 2. Verify period is closed
    const period = await AcademicPeriod.findById(academicPeriodId);
    if (!period) {
      const err = new Error('Academic period not found.');
      err.status = 404;
      throw err;
    }

    if (period.is_active === 1) {
      const err = new Error('Cannot wipe evaluations from an ACTIVE academic period. Close or switch period first.');
      err.status = 400;
      throw err;
    }

    // 3. Transactional cascade purge
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Find evaluation IDs to delete
      const [evalRows] = await connection.execute(
        'SELECT id FROM evaluations WHERE academic_period_id = ?',
        [academicPeriodId]
      );
      const evalIds = evalRows.map(r => r.id);

      let deletedResponses = 0;
      if (evalIds.length > 0) {
        const placeholders = evalIds.map(() => '?').join(',');
        const [respResult] = await connection.execute(
          `DELETE FROM evaluation_responses WHERE evaluation_id IN (${placeholders})`,
          evalIds
        );
        deletedResponses = respResult.affectedRows || 0;
      }

      // Delete submissions ledger
      const [subResult] = await connection.execute(
        'DELETE FROM evaluation_submissions WHERE academic_period_id = ?',
        [academicPeriodId]
      );
      const deletedSubmissions = subResult.affectedRows || 0;

      // Delete evaluations
      const [evalResult] = await connection.execute(
        'DELETE FROM evaluations WHERE academic_period_id = ?',
        [academicPeriodId]
      );
      const deletedEvaluations = evalResult.affectedRows || 0;

      await connection.commit();

      // 4. Audit Log
      await AuditLog.log({
        actor_role: 'admin',
        actor_id: adminId,
        action: 'PERIOD_EVALUATIONS_WIPED',
        target: `academic_period:${academicPeriodId}`,
        details: {
          academic_year: period.academic_year,
          semester: period.semester,
          deleted_evaluations: deletedEvaluations,
          deleted_responses: deletedResponses,
          deleted_submissions: deletedSubmissions
        },
        ip_address: ipAddress
      });

      return {
        message: `Successfully purged evaluation records for ${period.academic_year} (${period.semester}).`,
        deleted: {
          evaluations: deletedEvaluations,
          evaluation_responses: deletedResponses,
          evaluation_submissions: deletedSubmissions
        }
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Restore an archived snapshot into the database.
   * @param {Object} archivePayload
   * @param {number} adminId
   * @param {string} ipAddress
   * @returns {Promise<Object>} Restore summary
   */
  restorePeriodArchive: async (archivePayload, adminId, ipAddress = '127.0.0.1') => {
    if (!archivePayload || !archivePayload.academic_period || !Array.isArray(archivePayload.evaluations)) {
      const err = new Error('Invalid archive snapshot format.');
      err.status = 400;
      throw err;
    }

    // Verify Checksum if present
    if (archivePayload.checksum) {
      const contentString = JSON.stringify({
        academic_period: archivePayload.academic_period,
        evaluations: archivePayload.evaluations,
        evaluation_responses: archivePayload.evaluation_responses,
        evaluation_submissions: archivePayload.evaluation_submissions
      });
      const computed = crypto.createHash('sha256').update(contentString).digest('hex');
      if (computed !== archivePayload.checksum) {
        const err = new Error('Archive checksum verification failed. The archive file may have been modified or corrupted.');
        err.status = 400;
        throw err;
      }
    }

    const targetPeriodInfo = archivePayload.academic_period;

    // Check if period exists or match by academic_year + semester
    let targetPeriodId = targetPeriodInfo.id;
    let existingPeriod = await AcademicPeriod.findById(targetPeriodId);
    if (!existingPeriod) {
      existingPeriod = await AcademicPeriod.findByYearAndSemester(targetPeriodInfo.academic_year, targetPeriodInfo.semester);
      if (existingPeriod) {
        targetPeriodId = existingPeriod.id;
      } else {
        // Re-create the academic period if it was also removed
        const createResult = await AcademicPeriod.create({
          academic_year: targetPeriodInfo.academic_year,
          semester: targetPeriodInfo.semester,
          start_date: targetPeriodInfo.start_date,
          end_date: targetPeriodInfo.end_date,
          is_active: 0
        });
        targetPeriodId = createResult.insertId;
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if evaluations already exist for this period
      const [existingEvals] = await connection.execute(
        'SELECT COUNT(*) as count FROM evaluations WHERE academic_period_id = ?',
        [targetPeriodId]
      );
      if (existingEvals[0].count > 0) {
        const err = new Error(`Period ${targetPeriodInfo.academic_year} (${targetPeriodInfo.semester}) already contains active evaluation records. Please wipe or archive them first.`);
        err.status = 409;
        throw err;
      }

      // Map old evaluation ID -> new evaluation ID in case autoincrement shifted
      const evalIdMap = new Map();
      let restoredEvaluations = 0;

      for (const ev of archivePayload.evaluations) {
        const [insertRes] = await connection.execute(
          `INSERT INTO evaluations
            (anonymous_student_ref, faculty_id, rating, comment, strengths, weaknesses, sentiment, sentiment_score, academic_period_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ev.anonymous_student_ref || null,
            ev.faculty_id,
            ev.rating,
            ev.comment || '',
            ev.strengths || null,
            ev.weaknesses || null,
            ev.sentiment || 'neutral',
            ev.sentiment_score || 0,
            targetPeriodId,
            ev.created_at || new Date()
          ]
        );
        evalIdMap.set(ev.id, insertRes.insertId);
        restoredEvaluations++;
      }

      // Restore evaluation_responses
      let restoredResponses = 0;
      if (Array.isArray(archivePayload.evaluation_responses) && archivePayload.evaluation_responses.length > 0) {
        for (const resp of archivePayload.evaluation_responses) {
          const newEvalId = evalIdMap.get(resp.evaluation_id);
          if (newEvalId) {
            await connection.execute(
              `INSERT INTO evaluation_responses
                (evaluation_id, question_id, rating, text_response)
               VALUES (?, ?, ?, ?)`,
              [
                newEvalId,
                resp.question_id,
                resp.rating !== undefined ? resp.rating : null,
                resp.text_response !== undefined ? resp.text_response : null
              ]
            );
            restoredResponses++;
          }
        }
      }

      // Restore evaluation_submissions
      let restoredSubmissions = 0;
      if (Array.isArray(archivePayload.evaluation_submissions) && archivePayload.evaluation_submissions.length > 0) {
        for (const sub of archivePayload.evaluation_submissions) {
          const newEvalId = evalIdMap.get(sub.evaluation_id) || sub.evaluation_id;
          await connection.execute(
            `INSERT INTO evaluation_submissions
              (student_id, faculty_id, academic_period_id, evaluation_id)
             VALUES (?, ?, ?, ?)`,
            [
              sub.student_id,
              sub.faculty_id,
              targetPeriodId,
              newEvalId
            ]
          );
          restoredSubmissions++;
        }
      }

      await connection.commit();

      // Audit log
      await AuditLog.log({
        actor_role: 'admin',
        actor_id: adminId,
        action: 'PERIOD_EVALUATIONS_RESTORED',
        target: `academic_period:${targetPeriodId}`,
        details: {
          academic_year: targetPeriodInfo.academic_year,
          semester: targetPeriodInfo.semester,
          restored_evaluations: restoredEvaluations,
          restored_responses: restoredResponses,
          restored_submissions: restoredSubmissions
        },
        ip_address: ipAddress
      });

      return {
        message: `Successfully restored ${restoredEvaluations} evaluations and ${restoredResponses} question responses.`,
        restored: {
          period_id: targetPeriodId,
          evaluations: restoredEvaluations,
          evaluation_responses: restoredResponses,
          evaluation_submissions: restoredSubmissions
        }
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = DataArchiveService;
