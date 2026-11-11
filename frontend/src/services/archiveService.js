import api from './api';

const archiveService = {
  /**
   * Get all academic periods with archive and evaluation status
   * GET /api/archive/periods
   */
  getPeriods: () => api.get('/archive/periods'),

  /**
   * Export snapshot JSON for a period
   * GET /api/archive/export/:periodId
   */
  exportPeriod: (periodId) =>
    api.get(`/archive/export/${periodId}`, {
      responseType: 'json',
    }),

  /**
   * Wipe evaluations for a historical closed period
   * DELETE /api/archive/wipe/:periodId
   */
  wipePeriod: (periodId, payload) =>
    api.delete(`/archive/wipe/${periodId}`, {
      data: payload,
    }),

  /**
   * Restore an archived snapshot into the database
   * POST /api/archive/restore
   */
  restoreArchive: (payload) =>
    api.post('/archive/restore', payload),
};

export default archiveService;
