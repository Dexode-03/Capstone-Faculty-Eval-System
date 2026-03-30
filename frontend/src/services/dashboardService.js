import api from './api';

const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getFacultyDashboard: () => api.get('/dashboard/faculty'),
};

export default dashboardService;
