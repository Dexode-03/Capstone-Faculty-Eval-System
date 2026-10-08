import api from './api';

const recommendationRuleService = {
  getAll: () => api.get('/recommendation-rules'),
  create: (data) => api.post('/recommendation-rules', data),
  update: (id, data) => api.put(`/recommendation-rules/${id}`, data),
  delete: (id) => api.delete(`/recommendation-rules/${id}`),
};

export default recommendationRuleService;
