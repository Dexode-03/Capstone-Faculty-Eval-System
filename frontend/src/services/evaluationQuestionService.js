import api from './api';

const evaluationQuestionService = {
  getAllForAdmin: () => api.get('/evaluation-questions/manage'),
  create: (data) => api.post('/evaluation-questions', data),
  update: (id, data) => api.put(`/evaluation-questions/${id}`, data),
  deactivate: (id) => api.put(`/evaluation-questions/${id}/deactivate`),
  reorder: (orders) => api.put('/evaluation-questions/reorder', { orders }),
};

export default evaluationQuestionService;
