import api from './api';

const academicPeriodService = {
  getAll: () => api.get('/academic-periods'),
  getActive: () => api.get('/academic-periods/active'),
  create: (data) => api.post('/academic-periods', data),
  update: (id, data) => api.put(`/academic-periods/${id}`, data),
  activate: (id) => api.put(`/academic-periods/${id}/activate`),
  remove: (id) => api.delete(`/academic-periods/${id}`),
  toggleEvaluation: (open) => api.put('/academic-periods/toggle-evaluation', { open }),
};

export default academicPeriodService;
